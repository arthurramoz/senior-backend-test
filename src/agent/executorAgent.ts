import Anthropic from "@anthropic-ai/sdk";
import { MessageParam, ToolUseBlock } from "@anthropic-ai/sdk/resources/messages.mjs";
import { AGENT_TOOLS, TOOL_POLICIES } from "../tools/definitions.js";
import { AdPlatformMockExecutor } from "../tools/executor.js";
import { globalApprovalStore } from "../approval/store.js";
import { PendingAction, AgentRunState } from "../approval/types.js";
import dotenv from "dotenv";

dotenv.config();

export class ExecutorAgent {
  private anthropic: Anthropic;
  private model: string = "claude-3-5-sonnet-20241022";

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not configured in .env");
    }
    this.anthropic = new Anthropic({ apiKey });
  }

  /**
   * Initializes or continues an agent run.
   */
  public async startRun(params: {
    runId: string;
    campaignId: string;
    userPrompt: string;
  }): Promise<{ status: "COMPLETED" | "AWAITING_APPROVAL" | "FAILED"; run: AgentRunState; pendingAction?: PendingAction }> {
    const run = globalApprovalStore.getOrCreateRun(params.runId, params.campaignId);
    
    // Add initial user prompt if starting fresh
    if (run.messages.length === 0) {
      run.messages.push({
        role: "user",
        content: params.userPrompt
      });
      run.logs.push(`[${new Date().toISOString()}] Agent run started. Prompt: "${params.userPrompt}"`);
    }

    return this.runAgentLoop(run);
  }

  /**
   * Core Autonomous Agent Loop with Tool Interception Gate
   */
  private async runAgentLoop(
    run: AgentRunState
  ): Promise<{ status: "COMPLETED" | "AWAITING_APPROVAL" | "FAILED"; run: AgentRunState; pendingAction?: PendingAction }> {
    const maxIterations = 8;
    let iteration = 0;

    const systemPrompt = `You are Foxtly's Autonomous Ad Optimization Agent.
You monitor Meta and Google Ads campaigns, diagnose anomalies, and execute corrective actions.
You have access to tools for querying metrics and making modifications.
Be concise and data-driven in your reasoning.
Always explain why you take each action.`;

    while (iteration < maxIterations) {
      iteration++;
      run.logs.push(`[${new Date().toISOString()}] [Iteration ${iteration}] Calling Claude API...`);

      let response;
      try {
        response = await this.anthropic.messages.create({
          model: this.model,
          max_tokens: 1024,
          system: systemPrompt,
          messages: run.messages,
          tools: AGENT_TOOLS
        });
      } catch (err: any) {
        run.status = "FAILED";
        const errMsg = `Claude API Error: ${err.message}`;
        run.logs.push(`[${new Date().toISOString()}] ERROR: ${errMsg}`);
        globalApprovalStore.updateRun(run.runId, { status: "FAILED", logs: run.logs });
        return { status: "FAILED", run };
      }

      // Add assistant response to history
      run.messages.push({
        role: "assistant",
        content: response.content
      });

      // Extract text thoughts for logging
      const textBlocks = response.content.filter((c) => c.type === "text");
      for (const text of textBlocks) {
        if ("text" in text) {
          run.logs.push(`[${new Date().toISOString()}] [Claude Thought]: ${text.text}`);
        }
      }

      // Check if Claude requested any tool calls
      const toolUseBlocks = response.content.filter((c) => c.type === "tool_use") as ToolUseBlock[];

      if (toolUseBlocks.length === 0 || response.stop_reason === "end_turn") {
        run.status = "COMPLETED";
        run.logs.push(`[${new Date().toISOString()}] Agent completed optimization successfully.`);
        globalApprovalStore.updateRun(run.runId, { status: "COMPLETED", messages: run.messages, logs: run.logs });
        return { status: "COMPLETED", run };
      }

      // Process tool calls
      const toolResultContents: any[] = [];

      for (const toolUse of toolUseBlocks) {
        const toolName = toolUse.name;
        const toolArgs = toolUse.input as Record<string, any>;
        const policy = TOOL_POLICIES[toolName] || { riskLevel: "HIGH_IMPACT", requiresApproval: true };

        run.logs.push(`[${new Date().toISOString()}] Evaluating tool: "${toolName}" (Risk: ${policy.riskLevel})`);

        // Check if tool is HIGH_IMPACT and requires approval
        if (policy.requiresApproval) {
          run.logs.push(`[${new Date().toISOString()}] ⚠️ HIGH-IMPACT ACTION DETECTED. Intercepting via Approval Gate...`);
          
          // Create pending approval
          const pendingAction = globalApprovalStore.createPendingApproval({
            runId: run.runId,
            toolUseId: toolUse.id,
            toolName: toolName,
            toolArgs: toolArgs,
            conversationSnapshot: JSON.parse(JSON.stringify(run.messages))
          });

          run.status = "AWAITING_APPROVAL";
          run.pendingApprovalId = pendingAction.id;
          run.logs.push(`[${new Date().toISOString()}] Approval created [ID: ${pendingAction.id}]. Suspending agent loop until human review.`);

          globalApprovalStore.updateRun(run.runId, {
            status: "AWAITING_APPROVAL",
            pendingApprovalId: pendingAction.id,
            messages: run.messages,
            logs: run.logs
          });

          return {
            status: "AWAITING_APPROVAL",
            run,
            pendingAction
          };
        }

        // LOW_IMPACT tool: Execute immediately
        run.logs.push(`[${new Date().toISOString()}] Auto-executing safe tool: "${toolName}"...`);
        try {
          const execResult = await AdPlatformMockExecutor.execute(toolName, toolArgs);
          toolResultContents.push({
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: JSON.stringify(execResult)
          });
          run.logs.push(`[${new Date().toISOString()}] Tool "${toolName}" executed successfully.`);
        } catch (execErr: any) {
          toolResultContents.push({
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: `Tool Execution Failed: ${execErr.message}`,
            is_error: true
          });
          run.logs.push(`[${new Date().toISOString()}] Tool "${toolName}" failed: ${execErr.message}`);
        }
      }

      // Append all tool results to message history and continue loop
      run.messages.push({
        role: "user",
        content: toolResultContents
      });
    }

    run.status = "COMPLETED";
    globalApprovalStore.updateRun(run.runId, { status: "COMPLETED", messages: run.messages, logs: run.logs });
    return { status: "COMPLETED", run };
  }

  /**
   * Resumes an agent loop after a human approves or rejects a pending action.
   */
  public async resumeAfterApproval(
    approvalId: string,
    decision: "APPROVE" | "REJECT",
    reviewerNotes?: string
  ): Promise<{ status: "COMPLETED" | "AWAITING_APPROVAL" | "FAILED"; run: AgentRunState; pendingAction: PendingAction }> {
    const action = globalApprovalStore.getApproval(approvalId);
    if (!action) throw new Error(`Approval ${approvalId} not found`);

    const run = globalApprovalStore.getRun(action.runId);
    if (!run) throw new Error(`Run for approval ${approvalId} not found`);

    let toolResultBlock: any;

    if (decision === "APPROVE") {
      // 1. Move to APPROVED -> EXECUTING
      globalApprovalStore.transitionStatus(approvalId, "APPROVED", "Human approved action", { reviewerNotes });
      globalApprovalStore.transitionStatus(approvalId, "EXECUTING", "Executing mutation against ad platform");

      run.logs.push(`[${new Date().toISOString()}] Action ${approvalId} APPROVED by human. Executing "${action.toolName}"...`);

      try {
        // Execute the mock mutation
        const execResult = await AdPlatformMockExecutor.execute(action.toolName, action.toolArgs);
        
        globalApprovalStore.transitionStatus(approvalId, "EXECUTED", "Mutation executed successfully", {
          executionResult: execResult
        });

        toolResultBlock = {
          type: "tool_result",
          tool_use_id: action.toolUseId,
          content: JSON.stringify(execResult)
        };
        run.logs.push(`[${new Date().toISOString()}] Mutation executed successfully.`);
      } catch (err: any) {
        globalApprovalStore.transitionStatus(approvalId, "FAILED", `Execution error: ${err.message}`);
        toolResultBlock = {
          type: "tool_result",
          tool_use_id: action.toolUseId,
          content: `Execution error on ad platform: ${err.message}`,
          is_error: true
        };
      }
    } else {
      // REJECTED
      globalApprovalStore.transitionStatus(approvalId, "REJECTED", "Human rejected action", { reviewerNotes });
      run.logs.push(`[${new Date().toISOString()}] Action ${approvalId} REJECTED by human. Reason: ${reviewerNotes || "No reason provided"}`);

      toolResultBlock = {
        type: "tool_result",
        tool_use_id: action.toolUseId,
        content: `Action rejected by human reviewer. Feedback: "${reviewerNotes || "Proposed action was rejected. Please formulate an alternate optimization strategy."}"`,
        is_error: true
      };
    }

    // Append human decision result into conversation history
    run.messages.push({
      role: "user",
      content: [toolResultBlock]
    });

    run.status = "RUNNING";
    run.pendingApprovalId = undefined;
    globalApprovalStore.updateRun(run.runId, { status: "RUNNING", pendingApprovalId: undefined, messages: run.messages, logs: run.logs });

    // Resume the agent loop with the updated history
    const loopResult = await this.runAgentLoop(run);
    return {
      ...loopResult,
      pendingAction: globalApprovalStore.getApproval(approvalId)!
    };
  }
}

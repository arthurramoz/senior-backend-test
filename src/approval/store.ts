import { ApprovalStatus, PendingAction, AgentRunState } from "./types.js";
import { v4 as uuidv4 } from "uuid";
import { MessageParam } from "@anthropic-ai/sdk/resources/messages.mjs";

/**
 * State store managing pending approvals and agent execution states.
 * Enforces strict state machine transition invariants.
 */
export class ApprovalStore {
  private approvals: Map<string, PendingAction> = new Map();
  private runs: Map<string, AgentRunState> = new Map();

  // Allowed state machine transitions
  private static readonly VALID_TRANSITIONS: Record<ApprovalStatus, ApprovalStatus[]> = {
    PENDING: ["APPROVED", "REJECTED", "EXPIRED"],
    APPROVED: ["EXECUTING", "FAILED"],
    EXECUTING: ["EXECUTED", "FAILED"],
    REJECTED: [],
    EXECUTED: [],
    FAILED: [],
    EXPIRED: []
  };

  /**
   * Creates a new pending approval record.
   */
  public createPendingApproval(params: {
    runId: string;
    toolUseId: string;
    toolName: string;
    toolArgs: Record<string, any>;
    conversationSnapshot: MessageParam[];
  }): PendingAction {
    const now = new Date().toISOString();
    const action: PendingAction = {
      id: `appr_${uuidv4().slice(0, 8)}`,
      runId: params.runId,
      toolUseId: params.toolUseId,
      toolName: params.toolName,
      toolArgs: params.toolArgs,
      riskLevel: "HIGH_IMPACT",
      createdAt: now,
      updatedAt: now,
      status: "PENDING",
      statusHistory: [{ status: "PENDING", timestamp: now, note: "Action intercepted by Approval Gate" }],
      conversationSnapshot: params.conversationSnapshot
    };

    this.approvals.set(action.id, action);
    return action;
  }

  /**
   * Retrieves an approval by its ID.
   */
  public getApproval(id: string): PendingAction | undefined {
    return this.approvals.get(id);
  }

  /**
   * Lists all approvals, optionally filtered by status.
   */
  public listApprovals(statusFilter?: ApprovalStatus): PendingAction[] {
    const list = Array.from(this.approvals.values());
    if (statusFilter) {
      return list.filter((a) => a.status === statusFilter);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Transitions approval status with strict verification.
   */
  public transitionStatus(
    id: string,
    nextStatus: ApprovalStatus,
    note?: string,
    metadata?: { reviewerNotes?: string; executionResult?: any }
  ): PendingAction {
    const action = this.approvals.get(id);
    if (!action) {
      throw new Error(`Approval record ${id} not found`);
    }

    const allowed = ApprovalStore.VALID_TRANSITIONS[action.status];
    if (!allowed.includes(nextStatus)) {
      throw new Error(
        `Invalid state transition: Cannot move approval ${id} from ${action.status} to ${nextStatus}. Allowed: [${allowed.join(", ")}]`
      );
    }

    const now = new Date().toISOString();
    action.status = nextStatus;
    action.updatedAt = now;
    action.statusHistory.push({ status: nextStatus, timestamp: now, note });

    if (metadata?.reviewerNotes) action.reviewerNotes = metadata.reviewerNotes;
    if (metadata?.executionResult) action.executionResult = metadata.executionResult;

    this.approvals.set(id, action);
    return action;
  }

  // --- Run Management ---

  public getOrCreateRun(runId: string, campaignId: string): AgentRunState {
    let run = this.runs.get(runId);
    if (!run) {
      const now = new Date().toISOString();
      run = {
        runId,
        campaignId,
        status: "RUNNING",
        messages: [],
        logs: [],
        createdAt: now,
        updatedAt: now
      };
      this.runs.set(runId, run);
    }
    return run;
  }

  public getRun(runId: string): AgentRunState | undefined {
    return this.runs.get(runId);
  }

  public updateRun(runId: string, updates: Partial<AgentRunState>): AgentRunState {
    const run = this.runs.get(runId);
    if (!run) throw new Error(`Run ${runId} not found`);
    Object.assign(run, updates, { updatedAt: new Date().toISOString() });
    this.runs.set(runId, run);
    return run;
  }
}

export const globalApprovalStore = new ApprovalStore();

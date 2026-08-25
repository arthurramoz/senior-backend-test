import { ExecutorAgent } from "../agent/executorAgent.js";
import { globalApprovalStore } from "../approval/store.js";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function runCliDemo() {
  console.log("\n=======================================================");
  console.log("🦊 Foxtly Agent Human-in-the-Loop (HITL) CLI Demo");
  console.log("=======================================================\n");

  const agent = new ExecutorAgent();
  const runId = `run_${Date.now()}`;
  const campaignId = "meta_campaign_scale_q4";

  console.log(`🤖 Starting Agent Run for Campaign: ${campaignId}`);
  console.log(`🎯 Prompt: "Campaign ${campaignId} is experiencing a sudden CPA spike. Investigate performance metrics and take corrective action."\n`);

  // 1. Start the agent run
  const result = await agent.startRun({
    runId,
    campaignId,
    userPrompt: `Campaign ${campaignId} has an alert for high CPA. Please inspect metrics, diagnose the problem, and take appropriate action to optimize or scale down.`
  });

  console.log("\n-------------------------------------------------------");
  console.log(`📍 Run Status: ${result.status}`);

  if (result.status === "AWAITING_APPROVAL" && result.pendingAction) {
    const action = result.pendingAction;
    console.log(`\n🚨 APPROVAL GATE INTERCEPTED HIGH-IMPACT TOOL CALL:`);
    console.log(`   - Approval ID : ${action.id}`);
    console.log(`   - Tool Name   : ${action.toolName}`);
    console.log(`   - Risk Level  : ${action.riskLevel}`);
    console.log(`   - Arguments   :`, JSON.stringify(action.toolArgs, null, 2));

    console.log("\n👤 HUMAN INTERVENTION REQUIRED:");
    const decision = await ask("   Type [A] to Approve, [R] to Reject: ");
    const isApprove = decision.trim().toUpperCase() === "A";

    let note = "";
    if (!isApprove) {
      note = await ask("   Enter rejection reason for the agent: ");
    }

    console.log(`\n⏳ Processing ${isApprove ? "APPROVAL" : "REJECTION"} and resuming agent loop...`);

    const resumeResult = await agent.resumeAfterApproval(
      action.id,
      isApprove ? "APPROVE" : "REJECT",
      note || (isApprove ? "Approved via CLI" : "Rejected via CLI")
    );

    console.log("\n=======================================================");
    console.log(`🏁 Final Agent Run Status: ${resumeResult.status}`);
    console.log("=======================================================\n");
    console.log("📜 Complete Execution Logs:\n");
    for (const log of resumeResult.run.logs) {
      console.log(`  ${log}`);
    }
  } else {
    console.log("\n📜 Execution Logs:\n");
    for (const log of result.run.logs) {
      console.log(`  ${log}`);
    }
  }

  rl.close();
}

runCliDemo().catch((err) => {
  console.error("Fatal Demo Error:", err);
  rl.close();
});

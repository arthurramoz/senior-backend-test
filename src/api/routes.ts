import { Router } from "express";
import { ExecutorAgent } from "../agent/executorAgent.js";
import { globalApprovalStore } from "../approval/store.js";
import { v4 as uuidv4 } from "uuid";

const router = Router();
const agent = new ExecutorAgent();

router.post("/agent/trigger", async (req, res) => {
  try {
    const { campaignId, prompt } = req.body;
    const runId = `run_${uuidv4().slice(0, 8)}`;
    const effectivePrompt =
      prompt ||
      `Campaign ${campaignId || "camp_meta_summer_01"} has an alert for High CPA. Inspect metrics and status, then take corrective budget or adset action.`;

    const result = await agent.startRun({
      runId,
      campaignId: campaignId || "camp_meta_summer_01",
      userPrompt: effectivePrompt
    });

    res.status(200).json({
      success: true,
      runId,
      status: result.status,
      pendingAction: result.pendingAction,
      logs: result.run.logs
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/approvals", (req, res) => {
  const statusFilter = req.query.status as any;
  const approvals = globalApprovalStore.listApprovals(statusFilter);
  res.status(200).json({ success: true, count: approvals.length, approvals });
});

router.get("/approvals/:id", (req, res) => {
  const approval = globalApprovalStore.getApproval(req.params.id);
  if (!approval) {
    return res.status(404).json({ success: false, error: "Approval not found" });
  }
  res.status(200).json({ success: true, approval });
});

router.post("/approvals/:id/approve", async (req, res) => {
  try {
    const { reviewerNotes } = req.body;
    const result = await agent.resumeAfterApproval(req.params.id, "APPROVE", reviewerNotes);

    res.status(200).json({
      success: true,
      approvalId: req.params.id,
      status: result.status,
      approval: result.pendingAction,
      logs: result.run.logs
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post("/approvals/:id/reject", async (req, res) => {
  try {
    const { reviewerNotes } = req.body;
    const result = await agent.resumeAfterApproval(
      req.params.id,
      "REJECT",
      reviewerNotes || "Budget reallocation rejected by administrator."
    );

    res.status(200).json({
      success: true,
      approvalId: req.params.id,
      status: result.status,
      approval: result.pendingAction,
      logs: result.run.logs
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get("/runs/:id", (req, res) => {
  const run = globalApprovalStore.getRun(req.params.id);
  if (!run) {
    return res.status(404).json({ success: false, error: "Run not found" });
  }
  res.status(200).json({ success: true, run });
});

export default router;

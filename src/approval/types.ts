import { MessageParam } from "@anthropic-ai/sdk/resources/messages.mjs";

export type ApprovalStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "EXECUTING"
  | "EXECUTED"
  | "FAILED"
  | "EXPIRED";

export interface PendingAction {
  id: string;
  runId: string;
  toolUseId: string;
  toolName: string;
  toolArgs: Record<string, any>;
  riskLevel: "HIGH_IMPACT";
  createdAt: string;
  updatedAt: string;
  status: ApprovalStatus;
  statusHistory: Array<{ status: ApprovalStatus; timestamp: string; note?: string }>;
  reviewerNotes?: string;
  executionResult?: any;
  conversationSnapshot: MessageParam[];
}

export interface AgentRunState {
  runId: string;
  campaignId: string;
  status: "IDLE" | "RUNNING" | "AWAITING_APPROVAL" | "COMPLETED" | "FAILED";
  pendingApprovalId?: string;
  messages: MessageParam[];
  logs: string[];
  createdAt: string;
  updatedAt: string;
}

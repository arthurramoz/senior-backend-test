import { useState, useEffect } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  TrendingDown,
  AlertTriangle,
  History,
  Layers,
  Zap,
  Info,
  Clock
} from "lucide-react";

interface PendingAction {
  id: string;
  runId: string;
  toolUseId: string;
  toolName: string;
  toolArgs: Record<string, any>;
  riskLevel: "HIGH_IMPACT";
  createdAt: string;
  updatedAt?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXECUTING" | "EXECUTED" | "FAILED";
  reviewerNotes?: string;
  executionResult?: any;
}

const API_BASE = "http://localhost:3001/api";

export default function App() {
  const [approvals, setApprovals] = useState<PendingAction[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [selectedScenario, setSelectedScenario] = useState("cpa_spike");
  const [rejectReasonMap, setRejectReasonMap] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const scenarios = [
    {
      id: "cpa_spike",
      title: "Meta Ads — CPA Spike Alert",
      campaign: "meta_scale_retargeting_q4",
      desc: "CPA surged to $40.04 (Target: $25.00). Propose budget restriction to curb ad spend bleed.",
      budgetBefore: 500,
      budgetAfter: 250
    },
    {
      id: "underperforming_adset",
      title: "Google Ads — Bleeding Keyword Ad Set",
      campaign: "gads_search_high_intent",
      desc: "Ad set has zero conversions in 48 hours. Propose pausing ad set immediately.",
      budgetBefore: 300,
      budgetAfter: 0
    }
  ];

  const fetchApprovals = async () => {
    try {
      const res = await fetch(`${API_BASE}/approvals`);
      const data = await res.json();
      if (data.success) {
        setApprovals(data.approvals);
      }
    } catch (err) {
      console.error("Failed to fetch approvals:", err);
    }
  };

  useEffect(() => {
    fetchApprovals();
    const interval = setInterval(fetchApprovals, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleTriggerAgent = async () => {
    setIsLoading(true);
    const scenario = scenarios.find((s) => s.id === selectedScenario) || scenarios[0];
    try {
      const res = await fetch(`${API_BASE}/agent/trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: scenario.campaign,
          prompt: scenario.desc
        })
      });
      const data = await res.json();
      if (data.logs) {
        setLogs(data.logs);
      }
      await fetchApprovals();
      setActiveTab("pending");
    } catch (err: any) {
      alert(`Trigger error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecision = async (id: string, decision: "approve" | "reject") => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const reason = rejectReasonMap[id];
      const res = await fetch(`${API_BASE}/approvals/${id}/${decision}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewerNotes: reason })
      });
      const data = await res.json();
      if (data.logs) {
        setLogs(data.logs);
      }
      await fetchApprovals();
    } catch (err: any) {
      alert(`Decision error: ${err.message}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const pendingList = approvals.filter((a) => a.status === "PENDING");
  const historyList = approvals.filter((a) => a.status !== "PENDING");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-app)", color: "var(--text-main)" }}>
      <nav style={{ borderBottom: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-surface)", padding: "16px 32px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)", width: "38px", height: "38px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
              <Zap size={20} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "17px", fontWeight: "700", letterSpacing: "-0.3px" }}>Foxtly Guard</span>
                <span style={{ fontSize: "11px", fontWeight: "600", backgroundColor: "rgba(59, 130, 246, 0.15)", color: "#60a5fa", padding: "2px 8px", borderRadius: "20px" }}>Human-in-the-Loop</span>
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Campaign Safety & High-Impact Mutation Gatekeeper</p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.25)", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", color: "#34d399" }}>
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#10b981", display: "inline-block" }} />
              Active Protection Engine
            </div>
            <button
              onClick={fetchApprovals}
              style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)", color: "var(--text-muted)", padding: "7px 14px", borderRadius: "8px", fontSize: "12px", cursor: "pointer", fontWeight: "500" }}
            >
              <RotateCcw size={14} /> Refresh
            </button>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "28px 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "28px" }}>
          <div style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "12px", padding: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Awaiting Decision</span>
              <AlertTriangle size={18} color="#f59e0b" />
            </div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: pendingList.length > 0 ? "#f59e0b" : "var(--text-main)" }}>
              {pendingList.length}
            </div>
            <span style={{ fontSize: "11px", color: "var(--text-subtle)" }}>High-impact actions on hold</span>
          </div>

          <div style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "12px", padding: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Approved & Applied</span>
              <CheckCircle2 size={18} color="#10b981" />
            </div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#10b981" }}>
              {historyList.filter((h) => h.status === "EXECUTED" || h.status === "APPROVED").length}
            </div>
            <span style={{ fontSize: "11px", color: "var(--text-subtle)" }}>Safely executed mutations</span>
          </div>

          <div style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "12px", padding: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Rejected / Discarded</span>
              <XCircle size={18} color="#ef4444" />
            </div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#ef4444" }}>
              {historyList.filter((h) => h.status === "REJECTED").length}
            </div>
            <span style={{ fontSize: "11px", color: "var(--text-subtle)" }}>Prevented risky actions</span>
          </div>

          <div style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "12px", padding: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Protected Platforms</span>
              <Layers size={18} color="#3b82f6" />
            </div>
            <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-main)", marginTop: "8px" }}>
              Meta Ads • Google Ads
            </div>
            <span style={{ fontSize: "11px", color: "var(--text-subtle)" }}>Multi-tenant budget policies active</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: "28px" }}>
          <div>
            <div style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "12px", padding: "20px", marginBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <Sparkles size={18} color="#3b82f6" />
                <h2 style={{ fontSize: "15px", fontWeight: "700" }}>Run Autonomous Agent Simulation</h2>
              </div>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>
                Select an anomaly scenario. The autonomous agent will analyze metrics and trigger the Approval Gate when proposing a budget mutation.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
                {scenarios.map((sc) => (
                  <button
                    key={sc.id}
                    onClick={() => setSelectedScenario(sc.id)}
                    style={{
                      textAlign: "left",
                      padding: "12px 14px",
                      borderRadius: "8px",
                      border: selectedScenario === sc.id ? "2px solid #3b82f6" : "1px solid var(--border-subtle)",
                      backgroundColor: selectedScenario === sc.id ? "rgba(59, 130, 246, 0.1)" : "var(--bg-card)",
                      color: "var(--text-main)",
                      cursor: "pointer"
                    }}
                  >
                    <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "4px" }}>{sc.title}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Target: {sc.campaign}</div>
                  </button>
                ))}
              </div>

              <button
                onClick={handleTriggerAgent}
                disabled={isLoading}
                style={{
                  width: "100%",
                  backgroundColor: isLoading ? "#475569" : "#2563eb",
                  color: "#fff",
                  border: "none",
                  padding: "12px",
                  borderRadius: "8px",
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
              >
                {isLoading ? <Clock size={16} className="animate-spin" /> : <Play size={16} />}
                {isLoading ? "Agent is analyzing campaign..." : "Trigger AI Agent Optimization"}
              </button>
            </div>

            <div style={{ display: "flex", gap: "12px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "10px", marginBottom: "20px" }}>
              <button
                onClick={() => setActiveTab("pending")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "none",
                  border: "none",
                  color: activeTab === "pending" ? "#fff" : "var(--text-muted)",
                  fontWeight: activeTab === "pending" ? "700" : "500",
                  fontSize: "14px",
                  cursor: "pointer",
                  padding: "6px 12px",
                  borderBottom: activeTab === "pending" ? "2px solid #3b82f6" : "none"
                }}
              >
                <ShieldAlert size={16} color={pendingList.length > 0 ? "#f59e0b" : "currentColor"} />
                Pending Authorizations ({pendingList.length})
              </button>

              <button
                onClick={() => setActiveTab("history")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "none",
                  border: "none",
                  color: activeTab === "history" ? "#fff" : "var(--text-muted)",
                  fontWeight: activeTab === "history" ? "700" : "500",
                  fontSize: "14px",
                  cursor: "pointer",
                  padding: "6px 12px",
                  borderBottom: activeTab === "history" ? "2px solid #3b82f6" : "none"
                }}
              >
                <History size={16} />
                Audit History ({historyList.length})
              </button>
            </div>

            {activeTab === "pending" ? (
              pendingList.length === 0 ? (
                <div style={{ backgroundColor: "var(--bg-surface)", border: "1px dashed var(--border-subtle)", borderRadius: "12px", padding: "48px 24px", textAlign: "center" }}>
                  <CheckCircle2 size={36} color="#10b981" style={{ margin: "0 auto 12px", opacity: 0.8 }} />
                  <h3 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "6px" }}>All Clear — No Pending Approvals</h3>
                  <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                    The AI agent is currently monitoring campaigns. Trigger a simulation above to test a high-impact budget interception.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {pendingList.map((appr) => (
                    <div
                      key={appr.id}
                      style={{
                        backgroundColor: "var(--bg-surface)",
                        border: "1px solid rgba(245, 158, 11, 0.4)",
                        borderRadius: "12px",
                        padding: "20px",
                        boxShadow: "0 8px 24px -4px rgba(245, 158, 11, 0.08)"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                            <span style={{ fontSize: "15px", fontWeight: "800", color: "#fff" }}>
                              {appr.toolName === "update_campaign_budget" ? "Budget Modification Request" : appr.toolName}
                            </span>
                            <span style={{ fontSize: "10px", fontWeight: "700", backgroundColor: "rgba(245, 158, 11, 0.2)", color: "#f59e0b", padding: "3px 8px", borderRadius: "4px" }}>
                              REQUIRES APPROVAL
                            </span>
                          </div>
                          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                            Platform: <strong style={{ color: "#fff" }}>{appr.toolArgs.platform?.toUpperCase() || "META"}</strong> • Campaign: <code style={{ color: "#60a5fa" }}>{appr.toolArgs.campaign_id}</code>
                          </div>
                        </div>
                        <span style={{ fontSize: "11px", color: "var(--text-subtle)" }}>
                          {new Date(appr.createdAt).toLocaleTimeString()}
                        </span>
                      </div>

                      {appr.toolArgs.current_daily_budget_usd !== undefined && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", backgroundColor: "var(--bg-card)", padding: "14px 18px", borderRadius: "8px", marginBottom: "16px", gap: "16px" }}>
                          <div>
                            <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Current Daily Budget</span>
                            <span style={{ fontSize: "18px", fontWeight: "700", color: "#cbd5e1" }}>${appr.toolArgs.current_daily_budget_usd}/day</span>
                          </div>
                          <ArrowRight size={20} color="#64748b" />
                          <div>
                            <span style={{ fontSize: "11px", color: "#f59e0b", fontWeight: "600", display: "block" }}>Proposed New Budget</span>
                            <span style={{ fontSize: "20px", fontWeight: "800", color: "#34d399" }}>${appr.toolArgs.new_daily_budget_usd}/day</span>
                          </div>
                        </div>
                      )}

                      <div style={{ backgroundColor: "rgba(0, 0, 0, 0.2)", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "12px 14px", marginBottom: "18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#94a3b8", marginBottom: "4px", fontWeight: "600" }}>
                          <Info size={13} /> AGENT JUSTIFICATION
                        </div>
                        <p style={{ fontSize: "12px", color: "#f1f5f9", lineHeight: "1.5" }}>
                          {appr.toolArgs.reason || "CPA exceeded threshold. Reducing daily spend limit to curb burn rate."}
                        </p>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <input
                          type="text"
                          placeholder="Optional reviewer notes or rejection instruction..."
                          value={rejectReasonMap[appr.id] || ""}
                          onChange={(e) => setRejectReasonMap({ ...rejectReasonMap, [appr.id]: e.target.value })}
                          style={{ width: "100%", padding: "10px 12px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "6px", color: "#fff", fontSize: "12px" }}
                        />

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                          <button
                            onClick={() => handleDecision(appr.id, "approve")}
                            disabled={actionLoading[appr.id]}
                            style={{
                              backgroundColor: "#10b981",
                              color: "#fff",
                              border: "none",
                              padding: "11px",
                              borderRadius: "6px",
                              fontWeight: "700",
                              fontSize: "13px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "8px"
                            }}
                          >
                            <CheckCircle2 size={16} /> Authorize & Apply Mutation
                          </button>
                          <button
                            onClick={() => handleDecision(appr.id, "reject")}
                            disabled={actionLoading[appr.id]}
                            style={{
                              backgroundColor: "#ef4444",
                              color: "#fff",
                              border: "none",
                              padding: "11px",
                              borderRadius: "6px",
                              fontWeight: "700",
                              fontSize: "13px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "8px"
                            }}
                          >
                            <XCircle size={16} /> Reject & Pivot Strategy
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {historyList.length === 0 ? (
                  <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>No resolved actions in this session.</div>
                ) : (
                  historyList.map((appr) => {
                    const isExecuted = appr.status === "EXECUTED" || appr.status === "APPROVED";
                    return (
                      <div
                        key={appr.id}
                        style={{
                          backgroundColor: "var(--bg-surface)",
                          border: "1px solid var(--border-subtle)",
                          borderRadius: "10px",
                          padding: "16px"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontWeight: "700", fontSize: "13px" }}>{appr.toolName}</span>
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: "700",
                                padding: "2px 8px",
                                borderRadius: "4px",
                                backgroundColor: isExecuted ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                                color: isExecuted ? "#10b981" : "#ef4444"
                              }}
                            >
                              {appr.status}
                            </span>
                          </div>
                          <span style={{ fontSize: "11px", color: "var(--text-subtle)" }}>{new Date(appr.updatedAt || appr.createdAt).toLocaleTimeString()}</span>
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                          Campaign: <code style={{ color: "#60a5fa" }}>{appr.toolArgs.campaign_id}</code> • Note: {appr.reviewerNotes || "Resolved."}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <div style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", height: "fit-content", minHeight: "560px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "12px" }}>
              <TrendingDown size={18} color="#8b5cf6" />
              <h2 style={{ fontSize: "15px", fontWeight: "700" }}>Live Execution Timeline & Reasoning</h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1, overflowY: "auto" }}>
              {logs.length === 0 ? (
                <div style={{ textAlign: "center", color: "var(--text-subtle)", margin: "auto 0", padding: "40px 0" }}>
                  <Clock size={32} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
                  <p style={{ fontSize: "13px" }}>No active agent pipeline running.</p>
                  <p style={{ fontSize: "11px", opacity: 0.7 }}>Click "Trigger AI Agent Optimization" to view real-time multi-step actions.</p>
                </div>
              ) : (
                logs.map((log, i) => {
                  const isThought = log.includes("[Claude Thought]");
                  const isIntercept = log.includes("HIGH-IMPACT");
                  const isSuccess = log.includes("successfully") || log.includes("APPROVED");
                  const isReject = log.includes("REJECTED");

                  return (
                    <div
                      key={i}
                      style={{
                        backgroundColor: isIntercept
                          ? "rgba(245, 158, 11, 0.08)"
                          : isThought
                          ? "rgba(59, 130, 246, 0.06)"
                          : "var(--bg-card)",
                        borderLeft: isIntercept
                          ? "3px solid #f59e0b"
                          : isThought
                          ? "3px solid #3b82f6"
                          : isSuccess
                          ? "3px solid #10b981"
                          : isReject
                          ? "3px solid #ef4444"
                          : "3px solid var(--border-subtle)",
                        padding: "10px 14px",
                        borderRadius: "4px 8px 8px 4px",
                        fontSize: "12px",
                        lineHeight: "1.5"
                      }}
                    >
                      <div style={{ color: isIntercept ? "#f59e0b" : isThought ? "#60a5fa" : isSuccess ? "#34d399" : isReject ? "#f87171" : "var(--text-muted)" }}>
                        {log}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

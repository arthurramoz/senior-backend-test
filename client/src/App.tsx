import { useState, useEffect } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Terminal,
  Activity,
  Cpu,
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
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXECUTING" | "EXECUTED" | "FAILED";
  reviewerNotes?: string;
  executionResult?: any;
}

const API_BASE = "http://localhost:3001/api";

export default function App() {
  const [approvals, setApprovals] = useState<PendingAction[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState("meta_scale_retargeting_q4");
  const [customPrompt, setCustomPrompt] = useState(
    "CPA spiked by 75% today reaching $40.04 (target is $25.00). Diagnose and execute corrective actions on the budget or adset."
  );
  const [rejectReasonMap, setRejectReasonMap] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

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
    try {
      const res = await fetch(`${API_BASE}/agent/trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: selectedCampaign,
          prompt: customPrompt
        })
      });
      const data = await res.json();
      if (data.logs) {
        setLogs(data.logs);
      }
      await fetchApprovals();
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

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)", padding: "28px" }}>
      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", borderBottom: "1px solid var(--border)", paddingBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", padding: "10px", borderRadius: "12px", display: "flex" }}>
            <Cpu size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: "700", letterSpacing: "-0.5px" }}>Foxtly Agent Approval Gate</h1>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Human-in-the-Loop Interception for Autonomous Claude Ad Agents</p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-secondary)", padding: "8px 14px", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "12px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }} />
            <span>Anthropic Claude 3.5 Sonnet Connected</span>
          </div>
          <button
            onClick={fetchApprovals}
            style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-secondary)", padding: "8px 14px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <RotateCcw size={14} /> Refresh
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "28px" }}>
        {/* Left Column: Trigger Simulation & Approvals Queue */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Agent Simulation Trigger Card */}
          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "14px", padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <Play size={18} color="var(--accent-blue)" />
              <h2 style={{ fontSize: "15px", fontWeight: "600" }}>Simulate Anomaly & Trigger Agent Loop</h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "6px" }}>Campaign Identifier</label>
                <input
                  type="text"
                  value={selectedCampaign}
                  onChange={(e) => setSelectedCampaign(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", color: "#fff", fontSize: "13px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "6px" }}>Trigger Directive / Prompt</label>
                <textarea
                  rows={3}
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", color: "#fff", fontSize: "13px", resize: "none" }}
                />
              </div>

              <button
                onClick={handleTriggerAgent}
                disabled={isLoading}
                style={{
                  background: isLoading ? "#475569" : "linear-gradient(135deg, #2563eb, #3b82f6)",
                  color: "#fff",
                  border: "none",
                  padding: "12px 18px",
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
                {isLoading ? <Activity size={16} className="animate-spin" /> : <Play size={16} />}
                {isLoading ? "Claude is analyzing campaign..." : "Trigger Autonomous Optimization"}
              </button>
            </div>
          </div>

          {/* Pending Approvals List */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldAlert size={18} color="var(--accent-yellow)" />
                <h2 style={{ fontSize: "16px", fontWeight: "600" }}>Approval Gate Interceptions</h2>
              </div>
              <span style={{ fontSize: "12px", background: "var(--bg-card)", padding: "4px 10px", borderRadius: "12px", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                {approvals.filter((a) => a.status === "PENDING").length} Pending
              </span>
            </div>

            {approvals.length === 0 ? (
              <div style={{ background: "var(--bg-secondary)", border: "1px dashed var(--border)", borderRadius: "12px", padding: "40px 20px", textAlign: "center", color: "var(--text-secondary)" }}>
                <Clock size={32} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
                <p style={{ fontSize: "14px" }}>No intercepted actions yet.</p>
                <p style={{ fontSize: "12px", opacity: 0.7 }}>Trigger the agent above to intercept a high-impact mutation.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {approvals.map((appr) => {
                  const isPending = appr.status === "PENDING";
                  return (
                    <div
                      key={appr.id}
                      style={{
                        background: "var(--bg-secondary)",
                        border: isPending ? "1px solid rgba(245, 158, 11, 0.4)" : "1px solid var(--border)",
                        borderRadius: "12px",
                        padding: "18px",
                        boxShadow: isPending ? "0 4px 20px -2px rgba(245, 158, 11, 0.08)" : "none"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                            <span style={{ fontSize: "14px", fontWeight: "700", color: "#fff" }}>{appr.toolName}</span>
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: "700",
                                padding: "2px 8px",
                                borderRadius: "4px",
                                background: isPending ? "rgba(245, 158, 11, 0.15)" : appr.status === "EXECUTED" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                                color: isPending ? "#f59e0b" : appr.status === "EXECUTED" ? "#10b981" : "#ef4444"
                              }}
                            >
                              {appr.status}
                            </span>
                          </div>
                          <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontFamily: "monospace" }}>ID: {appr.id} • Run: {appr.runId}</span>
                        </div>
                        <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                          {new Date(appr.createdAt).toLocaleTimeString()}
                        </span>
                      </div>

                      {/* Tool Arguments View */}
                      <div style={{ background: "var(--bg-card)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border)", marginBottom: "14px" }}>
                        <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Intercepted Parameters:</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px", fontSize: "12px" }}>
                          {Object.entries(appr.toolArgs).map(([key, val]) => (
                            <div key={key} style={{ background: "rgba(0,0,0,0.2)", padding: "6px 8px", borderRadius: "4px" }}>
                              <span style={{ color: "var(--text-secondary)", display: "block", fontSize: "10px" }}>{key}</span>
                              <span style={{ fontWeight: "600", wordBreak: "break-all" }}>{String(val)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action Decision Controls (if PENDING) */}
                      {isPending ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          <input
                            type="text"
                            placeholder="Optional feedback / rejection reason for Claude..."
                            value={rejectReasonMap[appr.id] || ""}
                            onChange={(e) => setRejectReasonMap({ ...rejectReasonMap, [appr.id]: e.target.value })}
                            style={{ width: "100%", padding: "8px 10px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "6px", color: "#fff", fontSize: "12px" }}
                          />
                          <div style={{ display: "flex", gap: "10px" }}>
                            <button
                              onClick={() => handleDecision(appr.id, "approve")}
                              disabled={actionLoading[appr.id]}
                              style={{
                                flex: 1,
                                background: "#10b981",
                                color: "#fff",
                                border: "none",
                                padding: "10px",
                                borderRadius: "6px",
                                fontWeight: "600",
                                fontSize: "12px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "6px"
                              }}
                            >
                              <CheckCircle2 size={14} /> Authorize & Apply
                            </button>
                            <button
                              onClick={() => handleDecision(appr.id, "reject")}
                              disabled={actionLoading[appr.id]}
                              style={{
                                flex: 1,
                                background: "#ef4444",
                                color: "#fff",
                                border: "none",
                                padding: "10px",
                                borderRadius: "6px",
                                fontWeight: "600",
                                fontSize: "12px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "6px"
                              }}
                            >
                              <XCircle size={14} /> Reject Action
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: "12px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
                          <span>Resolution note: {appr.reviewerNotes || "Action completed."}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Terminal & Agent Reasoning Telemetry */}
        <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <Terminal size={18} color="var(--accent-purple)" />
            <h2 style={{ fontSize: "16px", fontWeight: "600" }}>Live Agent Transcript & Execution Logs</h2>
          </div>

          <div
            style={{
              flex: 1,
              background: "#080c14",
              border: "1px solid var(--border)",
              borderRadius: "14px",
              padding: "16px",
              overflowY: "auto",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "12px",
              lineHeight: "1.6"
            }}
          >
            {logs.length === 0 ? (
              <div style={{ color: "var(--text-secondary)", textAlign: "center", marginTop: "40px" }}>
                <p>Waiting for agent telemetry...</p>
                <p style={{ fontSize: "11px", opacity: 0.6 }}>Click "Trigger Autonomous Optimization" to start.</p>
              </div>
            ) : (
              logs.map((log, i) => {
                const isHighlight = log.includes("HIGH-IMPACT") || log.includes("Approval created");
                const isClaude = log.includes("[Claude Thought]");
                const isSuccess = log.includes("successfully") || log.includes("APPROVED");
                const isReject = log.includes("REJECTED");

                return (
                  <div
                    key={i}
                    style={{
                      marginBottom: "6px",
                      color: isHighlight
                        ? "#f59e0b"
                        : isClaude
                        ? "#60a5fa"
                        : isSuccess
                        ? "#34d399"
                        : isReject
                        ? "#f87171"
                        : "#cbd5e1",
                      borderLeft: isClaude ? "2px solid #3b82f6" : "none",
                      paddingLeft: isClaude ? "8px" : "0"
                    }}
                  >
                    {log}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

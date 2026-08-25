# Foxtly — Human-in-the-Loop (HITL) Agent Approval Gate

**Senior Developer Assessment Prototype**  
**Author:** Arthur Ramos  
**Tech Stack:** Node.js, TypeScript, Anthropic Claude 3.5 Sonnet Tool-Use API, Express, React 18, Vite.

---

## 🎯 What Was Built

An autonomous AI agent pipeline designed for Meta and Google Ads campaign management that intercepts high-impact mutations (budget adjustments, campaign pause, fund reallocations) before they touch live ad APIs.

### Key Architecture Components:
1. **Agent Tool-Use Loop:** Direct integration with the `@anthropic-ai/sdk` using Claude 3.5 Sonnet.
2. **Policy Gatekeeper:** Automatic categorization of tools into `LOW_IMPACT` (auto-executed read tools) vs `HIGH_IMPACT` (intercepted financial mutations).
3. **Deterministic State Machine:** Manages approval lifecycle (`PENDING` ➔ `APPROVED`/`REJECTED` ➔ `EXECUTING` ➔ `EXECUTED`/`FAILED`), preventing double execution and race conditions.
4. **State Preservation & Resumption:** Freezes context and serialized conversation turns during `PENDING` without busy-waiting, and resumes the loop upon human authorization.
5. **REST API & CLI:** Endpoints to trigger agent runs, inspect approvals, and execute decisions.
6. **Interactive Dashboard UI:** Modern React single-page dashboard with real-time logs, parameter inspection, and approval/rejection controls.

---

## 🚀 How to Run

### Prerequisites
- Node.js >= 18.0.0
- Valid Anthropic API Key (configured in `.env`)

### 1. Backend Server Setup
```bash
# In project root:
npm install

# Compile TypeScript
npm run build

# Start the REST API server (Port 3001)
npm start
# or development watch mode:
npm run dev
```

### 2. Interactive CLI Demo (Terminal)
To experience the tool interception and live prompt feedback loop via terminal:
```bash
npm run test:cli
```

### 3. Frontend Dashboard (Optional UI)
```bash
# In the client/ directory:
cd client
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 📋 Architectural Specifications (`SPEC.md`)
For in-depth analysis of state transitions, loop suspension mechanics, concurrency locks, and production edge cases, please review the complete [SPEC.md](SPEC.md).

---

## ⚖️ Intentional Trade-offs & What Was Deliberately Skipped

To deliver a focused, clean prototype within the 3–4 hour timeframe, the following trade-offs were made:

| Component | Prototype Implementation | Production Architecture | Rationale |
| :--- | :--- | :--- | :--- |
| **State Storage** | In-memory `Map` store with state transition guards | **PostgreSQL (Supabase) with RLS** | Zero external dependencies for local reviewer testing while maintaining strict type safety. |
| **Workflow Engine** | Async Promise resumption | **Inngest / Temporal Durable Steps** | Eliminates server-restart risk if an approval sits pending for days. |
| **Ad Platform APIs** | Realistic mock latency and structured responses | **Official Meta Marketing & Google Ads APIs** | Client requested mocks rather than requiring live ad credentials. |
| **Authentication** | Open local endpoints | **JWT / Supabase Auth + Workspace Scopes** | Focused on AI/Agentic core loop rather than boilerplate login. |

---

## 🔮 What I Would Do Differently With More Time

1. **Durable Step Functions (Inngest / Temporal):** Replace in-memory state with durable distributed orchestration so agent state survives deployment cycles.
2. **Context Window Drift Mitigation:** If an approval is pending for > 6 hours, automatically inject a fresh telemetry check before resuming to ensure the recommendation is still valid.
3. **Idempotency Fingerprinting:** Generate deterministic hashes of mutation arguments so repeated webhooks cannot execute duplicate budget changes.
4. **Multi-Agent Chain Validation:** Introduce a secondary *Auditor Agent* that independently checks Claude's mathematical justification before notifying the human manager.

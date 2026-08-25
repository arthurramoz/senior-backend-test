# Foxtly — Technical Test Task
**Role:** Mid/Senior Full-Stack Developer (AI & Agentic Systems)
**Expected time:** 3–4 hours

---

## Context

Foxtly is an AI-powered ad management platform. Autonomous agents monitor client campaigns on Meta and Google Ads, detect problems, and take corrective actions — always with a human approval gate for anything significant.

The core agent pipeline looks like this:

```
Analyst agent
  ├── minor problem → Executor agent (auto-fix via tool-use loop with Claude)
  └── critical problem → Manager agent (notify client)

Executor agent
  └── Claude tool-use loop → Meta / Google Ads API actions
        └── some actions require human approval before executing
```

The piece that's missing — and what this task is about — is the **approval gate**: the mechanism that intercepts a high-impact tool call, holds it as pending, and resumes execution only after a human approves or rejects it.

---

## Your Task

Build a working prototype of the approval gate, plus a short written spec explaining your design decisions.

### Part 1 — Written Spec (do this first)

Before writing any code, produce a short spec (can be a markdown file or inline comments — your choice). It should cover:

- How the approval gate fits into the agent loop — where exactly does it intercept, and what happens to the loop while an action is pending?
- The state machine for an approval: what states exist, what triggers each transition, and what happens on approve vs. reject
- What happens if the agent tries to take another action while a previous one is still pending?
- What you'd need to know or clarify before building this in production

This doesn't need to be long. Clear thinking matters more than word count.

### Part 2 — Working Prototype

Implement the approval gate. At minimum it should:

- Intercept a defined set of high-impact tool calls before execution (e.g. budget changes, pausing all campaigns)
- Save the intercepted action as a pending approval (in-memory, a database, or a file — your choice, but explain why)
- Expose a way to approve or reject a pending action (an API endpoint, a CLI command, anything functional)
- Re-execute the action after approval, or discard it on rejection
- Continue the agent loop correctly after an action is blocked — the agent should receive a clear signal that the action is pending, not silently fail

**Meta and Google Ads APIs:** Mock these — return realistic-looking fake responses. We don't expect real ad account access.

**Claude API:** Use the real Anthropic API. We'll provide a key separately once you confirm you're starting. This means your agent loop should use actual `tool_use` / `tool_result` message blocks — the approval gate needs to intercept a real tool call mid-loop, not a simulated one. This is the closest thing to what you'd actually build.


**Stack:** Use whatever you're most comfortable with. We work in Node.js + TypeScript on the backend, but we care more about the decisions you make than the language you use.

### Part 3 — Frontend (optional)

If you have time left and want to show it, add a minimal single-page UI that:

- Lists pending approvals with action details
- Lets you approve or reject each one

This is not required — a clean backend with a solid spec beats a rushed UI. But if you do add it, it should talk to your actual backend, not be a static mockup.

---

## What We're Looking For

We're not evaluating whether the code is production-ready. We're evaluating:

- **Do you spec before you build?** The written spec is as important as the code.
- **How do you handle the state machine?** The `pending → approved → re-executed` flow has subtle failure cases — do you see them?
- **What do you cut and why?** A focused prototype with clear trade-off notes beats a bloated one with no reasoning.
- **How you think about failure.** What breaks at scale? What did you intentionally leave out?

---

## Deliverable

A GitHub repo (public or shared with us directly) containing:

1. `SPEC.md` — your written spec from Part 1
2. The prototype code
3. A `README.md` with: how to run it, what you built, what you deliberately skipped, and what you'd do differently with more time

---

## Questions

If anything is unclear, ask before you start — not after. We'd rather answer a question upfront than have you build in the wrong direction for three hours.

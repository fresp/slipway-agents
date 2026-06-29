# Slash Commands

slipway-agents registers three slash commands in OpenCode. These are convenience wrappers — they invoke the `slipway` orchestrator with a pre-filled intent, so you never need to remember the exact trigger phrase.

---

## `/slipway-init`

**What it does:** Starts a new pipeline run from scratch.

Equivalent to typing `@slipway I want to build [idea]` or `@slipway bootstrap from .ai/docs/01-prd.md`.

**When to use:** Starting a new project, or bootstrapping docs from an existing PRD.

**Behavior:**
- If no `.ai/docs/01-prd.md` exists, routes to `drafting-table` (bootstrap-from-prompt mode).
- If `.ai/docs/01-prd.md` exists but engineering docs are missing, routes to `hullwright` (bootstrap-from-prd mode).
- If docs already exist, warns the user and asks whether to rebuild or extend.

---

## `/slipway-status`

**What it does:** Reports the current pipeline state without running any step.

Equivalent to asking `@slipway where are we?` or `@slipway show me the current pipeline state`.

**When to use:** Resuming a session after a break, checking what step ran last, or seeing the current health score and gate results.

**Output format:**

```
Pipeline status — [mode]

Last completed step: [step name]
Inspector: [health score]/100 — [last run timestamp]
Security audit: [PASS | CONDITIONAL | BLOCK | never]
Groomer: [Ready to Plan | Conditional | Blocked | never]
Estimator: [completed | never]
Optimize cycles: [N]/2

Next step: [step name and what it does]
Resume? (yes / no)
```

---

## `/slipway-resume`

**What it does:** Resumes the pipeline from the last completed step.

Equivalent to typing `@slipway resume` or `@slipway continue from where we left off`.

**When to use:** Resuming after a session restart, or after resolving a blocking finding.

**Behavior:**
- Reads `.ai/docs/.pipeline-state.md` to determine the last completed step.
- Invokes the next step directly — no re-routing through mode detection.
- If the state file is missing or corrupted, falls back to mode detection and tells the user.
- If implementation is in progress (`.ai/implementation-state.md` exists with `Status: in-progress`), surfaces the current phase and last completed task before offering to resume.

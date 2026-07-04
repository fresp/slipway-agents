# Slash Commands

slipway-agents registers four slash commands in OpenCode. These are convenience wrappers — they invoke the `slipway` orchestrator with a pre-filled intent, so you never need to remember the exact trigger phrase.

---

## `/slipway-init`

**What it does:** Starts a new pipeline run from scratch.

Equivalent to typing `@slipway I want to build [idea]` or `@slipway bootstrap from .ai/docs/01-prd.md`.

**When to use:** Starting a new project, or bootstrapping docs from an existing PRD.

**Behavior:**
- If no `.ai/docs/01-prd.md` exists, routes to `chartmaker` (bootstrap-from-prompt mode).
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
Bosun: [health score]/100 — [last run timestamp]
Security audit (gunner): [PASS | CONDITIONAL | BLOCK | never]
Coxswain: [Ready to Plan | Conditional | Blocked | never]
Purser: [completed | never]
Optimize cycles: [N]/[ralph_loop.max_iterations]

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

---

## `/slipway-doctor`

**What it does:** Runs a read-only pre-flight diagnostic without executing any pipeline step.

Equivalent to asking `@slipway run doctor` or `@slipway run pipeline diagnostics`.

**When to use:** Before a pipeline run, after a failed run, before resuming, or standalone when checking whether Slipway config, docs, state, agent files, and declarative-only settings are healthy.

**Behavior:**
- Does not invoke any subagent.
- Does not create, edit, delete, regenerate, or normalize files.
- Runs these checks in order:
  1. Config resolution — active `slipway.json`, schema validation, resolved per-agent model/category/ralph-loop/permission summary.
  2. Manifest health — `.ai/docs/.manifest.md` statuses, missing listed docs, and unlisted docs on disk.
  3. Pipeline state — last completed step, optimize counter, and blocked-state detection when Critical findings remain at the configured loop limit.
  4. Agent file integrity — expected `subagents/<name>.md` files and README-referenced skill files.
  5. Declarative-only features summary — current declarative-only notes read from `CLAUDE.md`.

**Output symbols:**
- `✓` healthy
- `⚠` warning or non-blocking issue
- `✗` error or blocking issue

**Output format:**

```
Slipway doctor

## 1. Config resolution
✓ Using config: [path]
...

## 2. Manifest health
⚠ no manifest found — legacy project or pre-bootstrap state.
...

## 3. Pipeline state
✓ Last completed step: [step]
...

## 4. Agent file integrity
✓ subagents/slipway.md
...

## 5. Declarative-only features summary
⚠ permission is declarative-only: [source note]
...

N issues found (X errors, Y warnings)
```

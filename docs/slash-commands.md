# Slash Commands

slipway-agents injects nine slash commands into OpenCode at runtime through the plugin's `config` hook. These are convenience wrappers — they invoke the `slipway` orchestrator with a pre-filled intent, so you never need to remember the exact trigger phrase. No `.opencode/commands/*.md` files are required; the commands are registered automatically when the plugin loads.

---

## `/slipway:init`

**What it does:** Starts a new pipeline run from scratch.

Equivalent to typing `@slipway I want to build [idea]` or `@slipway bootstrap from .ai/docs/01-prd.md`.

**When to use:** Starting a new project, or bootstrapping docs from an existing PRD.

**Behavior:**
- If no `.ai/docs/01-prd.md` exists, routes to `chartmaker` (bootstrap-from-prompt mode).
- If `.ai/docs/01-prd.md` exists but engineering docs are missing, routes to `hullwright` (bootstrap-from-prd mode).
- If docs already exist, warns the user and asks whether to rebuild or extend.

---

## `/slipway:status`

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
Optimize cycles: [N]/[ralph_loop.max_iterations]

Next step: [step name and what it does]
Resume? (yes / no)
```

---

## `/slipway:resume`

**What it does:** Resumes the pipeline from the last completed step.

Equivalent to typing `@slipway resume` or `@slipway continue from where we left off`.

**When to use:** Resuming after a session restart, or after resolving a blocking finding.

**Behavior:**
- Reads `.ai/docs/.pipeline-state.md` to determine the last completed step.
- Invokes the next step directly — no re-routing through mode detection.
- If the state file is missing or corrupted, falls back to mode detection and tells the user.
- If implementation is in progress (`.ai/implementation-state.md` exists and Status is not complete), warns the user before offering to resume.

---

## `/slipway:doctor`

**What it does:** Runs a read-only pre-flight diagnostic without executing any pipeline step.

Equivalent to asking `@slipway run doctor` or `@slipway run pipeline diagnostics`.

**When to use:** Before a pipeline run, after a failed run, before resuming, or standalone when checking whether Slipway config, docs, state, agent files, and runtime-wired settings are healthy.

**Behavior:**
- Does not invoke any subagent.
- Does not create, edit, delete, regenerate, or normalize files.
- Runs these checks in order:
  1. Config resolution — active `slipway.json`, schema validation, resolved per-agent model/category/ralph-loop/permission summary.
  2. Manifest health — `.ai/docs/.manifest.md` statuses, missing listed docs, and unlisted docs on disk.
  3. Pipeline state — last completed step, optimize counter, and blocked-state detection when Critical findings remain at the configured loop limit.
  4. Agent runtime integrity — Slipway agents registered by the plugin; package-local `subagents/<name>.md` files are checked only when running from the plugin repository.
  5. Runtime-wired features summary — confirm which config features are passed through to OpenCode at runtime (per-agent `permission` blocks are wired as of Batch 6).
  6. Session reconciliation health — active vs resolved session counts, stale active sessions older than 3 days, and reconciliation history presence.

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
✓ Slipway agents registered by plugin
...

## 5. Runtime-wired features summary
✓ permission is runtime-wired via OpenCode `AgentConfig.permission` passthrough
...

## 6. Session reconciliation health
✓ active sessions: [N], resolved sessions: [N]
⚠ no reconciliation history
...

N issues found (X errors, Y warnings)
```
---

## `/slipway:agent-refresh`

**What it does:** Regenerates only `AGENTS.md` from the current on-disk `.ai/docs/02-10` docs and the latest AGENTS.md contract.

Equivalent to typing `@slipway regenerate AGENTS.md` or `@slipway update agent contract`.

**When to use:** When the AGENTS.md contract has changed (e.g. new Working Loop steps, new Execution Protocol sections) and an already-bootstrapped project needs to adopt the new contract without a full rebuild.

**Behavior:**
- Refuses if `.ai/docs/01-prd.md` or the `02-10` doc suite does not exist.
- Does not re-derive the Requirement Model or regenerate any doc `02` through `10`.
- Migrates projects that still have only the legacy singular agent contract by writing `AGENTS.md`, removing the legacy file, and reporting the migration; if `AGENTS.md` already exists, reports `No migration needed.`
- Bumps `AGENTS.md`'s own minor version only; leaves all other versions untouched.

---

## `/slipway:review`

**What it does:** Runs a consistency review on the existing docs.

Equivalent to typing `@slipway review` or `@slipway check consistency`.

**When to use:** Before planning or after editing docs manually, to get Bosun's health score and findings.

---

## `/slipway:groom`

**What it does:** Runs multi-lens grooming on existing docs and reports readiness to plan.

Equivalent to typing `@slipway groom this` or `@slipway is this ready to build?`.

**When to use:** Before committing to a build plan, to surface architecture, QA, DevOps, and complexity risks.

---

## `/slipway:sync`

**What it does:** Syncs docs with implementation reality after a build.

Equivalent to typing `@slipway sync docs` or `@slipway update docs after build`.

**When to use:** After implementation is complete and docs may have drifted from the actual code.
---

## `/slipway:learnings-review`

**What it does:** Reviews pending learnings entries and presents approve/reject/defer options for promotion candidates.

Equivalent to typing `@slipway learnings review` or `@slipway show patterns`.

**When to use:** Periodically to triage accumulated learnings, promote verified patterns to the source docs, and archive stale or rejected entries.

**Inputs:**
- `$ARGUMENTS` optional — a Pattern-Key substring (e.g. `security.auth`) or priority filter (e.g. `high`); empty means "all `status: pending` entries."

**Behavior:**
- Reads `.ai/learnings/memory.md` and filters to `status: pending` entries.
- Groups entries by Pattern-Key, showing Recurrence-Count, First-Seen, Last-Seen, Source, and Summary per entry.
- For each entry, asks exactly `(approve / reject / defer)`.
- **approve** → tells the user the specific existing mechanism to use (e.g. "run `shipwright` to add this as an `11-*.md` extension" or "include in next `hullwright` partial regen of `07-engineering-standards.md`"), sets `status: promoted` in `memory.md`, and appends a row to `.ai/learnings/promoted.md` recording the entry ID, target, and timestamp.
- **reject** → sets `status: wont_fix` in `memory.md`; the next `learnings-capture` write moves it to `archive.md`.
- **defer** → no change.
- Never invokes `bosun`, `gunner`, or `hullwright` — read+annotate only, on `.ai/learnings/` exclusively.

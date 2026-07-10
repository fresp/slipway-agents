Follow the reporting contract and context-discipline rules defined in subagents/slipway.md's Core Principles — do not duplicate them here.

## Pipeline — extend run (`extend`)

Triggered when core docs already exist and the user describes a new feature.

### STEP E0 — Baseline Reconciliation Gate

Runs before STEP E1 on every extend invocation. Ensures the existing doc suite is in a consistent, validated state before extension work begins.

**Gate logic:**

1. **Check `.ai/docs/.pipeline-state.md`** for a `Bosun last run` field and a `Bosun health score` field.
2. **Skip condition:** If `Bosun last run` is not `"never"` AND `Bosun health score` ≥ 60, proceed directly to STEP E1 — the baseline docs are already validated.
3. **Block condition:** If `Bosun last run` is `"never"` OR `Bosun health score` < 60 OR the pipeline-state file does not exist, STOP and report:

```
⚠ Baseline docs have not been validated by Bosun.
Extension work cannot begin on inconsistent docs.
→ Run `bosun` (STEP 3) first, then retry the extend request.
```

**Never bypass this gate.** Extension on unvalidated baseline docs produces unreliable downstream results — this is the lesson from `hullwright`'s Execution Protocol failing due to lack of a validation step.

---

### STEP E1 — Extend

Call `shipwright` directly. Brainstorm is not re-run from scratch — `shipwright` owns its own scoped Q&A for the new feature only.

**Input:** New feature description (raw prompt or short PRD addendum) + all existing `.ai/docs/*.md` and `AGENTS.md`.

**Output:** Updated `.ai/docs/01-prd.md` (new feature appended, not a rewrite) + list of impacted downstream docs.

### STEP E2 — Targeted Rebuild

Call `hullwright` in **partial regeneration** mode, passing only the impacted doc list from E1.

### STEP E3 — Review

Call `bosun`, scoped to impacted docs plus any doc that references them.

### STEP E3.5 — Grooming (extend scope)

Call `coxswain` with scope hint: "extend — feature: [feature name], impacted docs: [list from E1]". Coxswain focuses only on the new feature's additions — it does not re-review the entire existing architecture.

### STEP E4 — Security Audit (extend scope)

Call `gunner` scoped to the impacted docs. Focuses on security implications of the new feature only.

### STEP E5 — Optimize Decision


Same contract as STEP 4 in the full pipeline. Loop limit still applies, counter resets per extend run.

### STEP E6 — Planning Update

Call `rigger` in **incremental mode** — append new phases/tasks for the extended feature rather than regenerating the whole plan, unless the user explicitly asks for a full re-plan.

---

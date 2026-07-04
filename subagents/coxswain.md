---
name: coxswain
description: Coxswain. Applies four specialist lenses (Lead Dev, QA, DevOps, Complexity Audit) to the validated doc suite, then runs mandatory cross-lens synthesis. Returns one unified readiness report and a combined gate signal (Ready to Plan / Conditional / Blocked).
---

# coxswain

Reviews the validated doc suite through four specialist lenses and produces a single unified grooming report. The four lenses run independently, then a mandatory synthesis step collapses them into one output before anything is returned to the orchestrator.

The orchestrator never sees four separate reports. It always sees one.

---

## Inputs required

- `.ai/docs/01-prd.md` through `.ai/docs/10-planning-rules.md` (and any `11-*.md` docs)
- `AGENT.md`
- Bosun's findings list from the current pipeline run (so coxswain knows which issues are already identified vs. newly surfaced)

---

## Process

### Step 1 — Lens review (run all four in parallel)

Dispatch all four lenses simultaneously against the same input doc set: Lead Dev, QA, DevOps, and Complexity Audit. Each lens reads independently and produces its structured output. Lens A, B, and C each return an internal findings list plus a lens-level readiness signal; Lens D returns only its flag list. These internal outputs are used only in Step 2 — they are not included in the final output as separate reports.

If the runtime does not support parallel task dispatch, fall back automatically to sequential execution in this exact order: Lens A → Lens B → Lens C → Lens D → Step 2 synthesis. This fallback changes only latency, not semantics.

Lens isolation rule: no lens may read or depend on another lens's output. Any comparison, reference, deduplication, conflict detection, or priority reconciliation across lenses belongs exclusively in Step 2 synthesis.

#### Lens A: Lead Dev

Focus: implementation feasibility, architectural risk, tech debt, and task clarity.

Check:
- Are there implementation paths that are technically underspecified? (e.g. an endpoint documented without specifying auth mechanism, a background job without specifying retry strategy)
- Are there architectural decisions in `08` that create implementation complexity that downstream docs do not account for?
- Does `10-planning-rules.md` contain constraints that contradict common implementation patterns for the stated stack?
- Are there features in the PRD that have no clear home in the service boundary or data model docs?
- Does `AGENT.md` contain instructions that are ambiguous or contradictory?
- Are there dependencies on external systems (third-party APIs, external services) that have no fallback or error handling specified?

Lens A readiness signal: **Ready** / **Conditional** / **Blocked**
- Ready: no implementation blockers, at most minor ambiguities
- Conditional: implementation can proceed but specific clarifications needed mid-sprint
- Blocked: critical underspecification that will cause Sisyphus to make load-bearing guesses

#### Lens B: QA

Focus: testability, acceptance criteria gaps, edge cases, and observability.

Check:
- Do operational flows in `06` describe failure cases, not just happy paths?
- Are acceptance criteria implied by the PRD measurable and testable (not just "the system should be fast")?
- Are there data model fields that could cause edge case failures if not validated? (e.g. nullable fields used in business logic, unbounded string fields used in comparisons)
- Does `05-api-specifications.md` specify error response shapes, or only success responses?
- Are there integration points between services where test boundaries are unclear?
- Does `AGENT.md` specify any testing approach or does it leave it entirely to Sisyphus's judgment?
- Are there user flows in the PRD that have no corresponding operational flow in `06`?

Lens B readiness signal: **Ready** / **Conditional** / **Blocked**

#### Lens C: DevOps

Focus: deployment readiness, infrastructure, observability, and operational constraints.

Check:
- Does the architecture in `02` include observability (logging, metrics, tracing) or is it assumed?
- Are environment-specific configurations (dev/staging/prod) addressed in any doc?
- Does the service topology in `09` imply infrastructure requirements (managed DBs, queues, CDN) that are not reflected in operational or planning docs?
- Are there scaling assumptions (expected RPS, data volume) that imply specific infrastructure choices not yet documented?
- Is there a deployment strategy implied by the architecture? (blue/green, rolling, canary — or nothing specified)
- Are secrets and environment variable management described anywhere?
- Does the operational flow for any service assume zero-downtime deployment without specifying how that is achieved?

Lens C readiness signal: **Ready** / **Conditional** / **Blocked**

#### Lens D: Complexity Audit

Run the `[KEYWORD_REDACTED]-complexity-audit` skill against the same input docs. This lens returns a flag list only — no readiness signal. Flags feed into Step 2 synthesis directly.

Do not duplicate the check areas here. The skill file is the authoritative definition.

Lens D does not produce a separate readiness signal — its flags feed directly into Step 2 synthesis.

---

### Step 2 — Synthesis (mandatory)

This step runs after all four lenses complete. It is not optional and may not be skipped.

**2a. Deduplicate**

Identify findings that appear in two or more lenses (same root issue, different perspective). Merge these into a single finding in the output. Mark merged findings with the lenses that identified them.

Example: Lead Dev flags "no error handling specified for payment gateway calls" and QA flags "no error response documented for payment endpoint" — these are the same gap. Merge into one finding: "Payment gateway error handling unspecified — no retry strategy (Lead Dev), no error response shape (QA)."

**2b. Detect conflicts**

Identify findings where two lenses disagree on priority or approach. Flag these explicitly for the user to resolve.

Example: Lead Dev recommends deferring observability to Phase 2; DevOps flags missing observability as a Blocked finding. These cannot be automatically merged — present both positions.

**2c. Rank by impact**

Sort the deduplicated, conflict-flagged finding list by impact on the build:
1. Blocked findings (any lens)
2. Conditional findings that affect the critical path
3. Conditional findings that affect non-critical tasks
4. Notes

**2d. Incorporate Lens D (Complexity Audit) findings**

Flagged tasks from Lens D must be resolved before the unified output is final:
- `[OVERSCOPED]` and `[OVERENGINEERED]` flags are treated as **Conditional** findings — they carry forward into planning as caveats the implementer must honor.
- `[VERIFY_WEAK]` flags are treated as **Conditional** findings — rigger must revise the affected task's `Verify:` field or flag it to the orchestrator before planning is committed.
- `[SIZING_RISK]` and `[SPLIT_RECOMMENDED]` flags are treated as **Conditional** findings — rigger must re-size the affected task or split the affected phase (or flag it to the orchestrator) before planning is committed.
- `[HIDDEN_COUPLING]` flags are treated as **Conditional** findings — rigger must add the missing dependency edge (or mark the affected tasks `parallel: false`) before planning is committed.
- If any Lens D flag affects a task or phase that is on the critical path, escalate it to **Blocked** status.

Never let any Lens D flag (`[OVERSCOPED]`, `[OVERENGINEERED]`, `[VERIFY_WEAK]`, `[SIZING_RISK]`, `[HIDDEN_COUPLING]`, `[SPLIT_RECOMMENDED]`) pass silently into the unified output without an explicit disposition (merged into a Conditional finding, or escalated to Blocked).

**2e. Determine combined gate signal**

- **Blocked** if any lens (A, B, or C) returns Blocked, or if any Lens D flag affects a critical-path task.
- **Conditional** if no lens is Blocked but one or more lenses return Conditional, or if Lens D raised any flags on non-critical tasks.
- **Ready to Plan** only if all three lenses (A, B, C) return Ready and Lens D raised no flags.

---

## Output contract

Produce a single structured report to stdout. The orchestrator presents this to the user.

```
Grooming Report
──────────────────────────────────────────────────────────────
Lenses: Lead Dev [signal] | QA [signal] | DevOps [signal] | Complexity Audit [flags: N | none]
Combined gate signal: [Ready to Plan | Conditional | Blocked]
──────────────────────────────────────────────────────────────

## Findings (unified)

### Blocked  [N]
[B1] [Short title]
     Lenses: [Lead Dev | QA | DevOps — which flagged this]
     Issue: [what is blocking]
     Location: [doc name, section]
     Resolution required: [specific action needed before planning can proceed]

### Conditional  [N]
[C1] [Short title]
     Lenses: [which flagged this]
     Issue: [what needs clarification or carries forward as a caveat]
     Location: [doc name, section]
     Recommendation: [action or caveat to embed in planning tasks]

### Notes  [N]
[N1] [Short title]
     Lenses: [which flagged this]
     Observation: [what was noticed]

──────────────────────────────────────────────────────────────

## Inter-lens conflicts  [N | none]
[CONFLICT-1] [Short title]
  Lead Dev position: [...]
  DevOps position: [...]
  User decision required: [specific question to resolve the conflict]

──────────────────────────────────────────────────────────────

## Dynamic doc recommendations  [N | none]
[List of additional docs beyond 02–10 that the grooming pass implies are needed]
  - [doc name].md — trigger: [which signal in the docs prompted this]
  - ...

──────────────────────────────────────────────────────────────

## Summary
[2–3 sentences. State the overall readiness posture, the most important blocker or
caveat, and what the orchestrator should do next.]
```

---

## Gate signal behavior (for orchestrator)

The orchestrator acts on the combined gate signal as follows:

- **Ready to Plan** → proceed to rigger. Tell user: `✓ Grooming passed — ready for planning.`
- **Conditional** → proceed to rigger. Present Conditional findings alongside bosun results so user has full picture. Rigger embeds Conditional findings as acceptance criteria caveats in affected tasks.
- **Blocked** → do not proceed to rigger. Present Blocked findings. Route back to `hullwright` (doc gaps) or `chartmaker` (PRD gaps) to resolve. After resolution, re-run bosun and then coxswain before continuing.

---

## Dynamic doc recommendations

If grooming surfaces a need for additional documentation beyond the standard `02`–`10` suite, list it in the "Dynamic doc recommendations" section. Common triggers:

| Signal in docs | Recommended doc |
|---|---|
| "design system", "Figma", "UI", "dashboard" | `11-design-spec.md` |
| Complex third-party integration (payments, messaging) | `11-integration-spec.md` |
| "existing system", "migration", "legacy" | `11-migration-plan.md` |
| Multi-environment (staging, prod, sandbox per tenant) | `11-environment-config.md` |
| Domain with many specialized business terms | `11-glossary.md` |

---

## Forbidden behaviors

- Never return four separate lens reports — only the unified synthesis output.
- Never skip Step 2 synthesis, even if all lenses agree on everything.
- Never mark combined signal as Ready to Plan if any lens returned Blocked or if Lens D raised any flags on critical-path tasks.
- Never let any Lens D flag (`[OVERSCOPED]`, `[OVERENGINEERED]`, `[VERIFY_WEAK]`, `[SIZING_RISK]`, `[HIDDEN_COUPLING]`, `[SPLIT_RECOMMENDED]`) pass silently into the output without an explicit Conditional or Blocked disposition.
- Never omit the Inter-lens conflicts section — write "No conflicts" explicitly if none.
- Never omit the Dynamic doc recommendations section — write "No additional docs recommended" if none.
- Never produce a summary that contradicts the gate signal (e.g. summary that sounds optimistic when gate is Blocked).
- Never run against docs that have not passed bosun in the current pipeline history.

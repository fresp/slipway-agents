# [Project Name] Planning Rules

Version: 1.0
Status: [frozen/draft/omitted]
<!-- GENERATION RULE: Status value comes from the STEP 2.5 doc suite decision recorded in
.ai/docs/.manifest.md. An omitted doc is never generated, so real output carries frozen
(after STEP 5 validation passes) or draft (mid-generation/regeneration). Content-stability
rules for frozen docs are unchanged: versioned edits only, no silent rewrites. -->

---

# 1. Purpose

This document defines how AI coding agents and engineers must behave during planning and implementation.

The architecture has already been decided.

The agent acts as:
- Planner
- Task Decomposer
- Implementer

The agent is not the system architect.

---

# 2. Source Of Truth

Read these documents before planning. Priority order (higher wins on conflict):

<!--
GENERATION RULE: Derive this list from .ai/docs/.manifest.md — include only docs whose
manifest status is not "omitted". The default priority order below is correct for most
projects; drop any line whose doc is omitted (e.g. remove the 09 line for a project that
omitted topology diagrams).
Insert any supplementary PRDs between the main PRD and this document.
EXTENSION INSERTION RULE: extension docs (manifest Extensions table — agent-owned reports
like a future 11-security-audit.md) are appended AFTER this document, at the lowest
priority, ordered by doc number. Only extension docs whose manifest status is "frozen"
are listed — draft extension reports are not source of truth. Rationale: extensions are
derived reports; on conflict, the source docs they were derived from must win. Apply this
rule identically in AGENTS.md's Source Of Truth section — the two lists must stay identical.
Do not include docs that don't exist.
-->

1. `.ai/docs/08-architecture-decisions.md`
2. `.ai/docs/09-topology-and-architecture-diagrams.md`
3. `.ai/docs/02-technical-architecture.md`
4. `.ai/docs/03-service-boundaries.md`
5. `.ai/docs/06-operational-flows.md`
6. `.ai/docs/05-api-specifications.md`
7. `.ai/docs/04-data-models.md`
8. `.ai/docs/07-engineering-standards.md`
9. `.ai/docs/01-prd.md`

<!--
If supplementary PRDs exist, add them here:
[N]. `.ai/docs/11-[name]-prd.md`
-->

Never invent a new architecture. Never merge conflicting documents. Use the higher priority document.

---

# 3. Planning Objectives

Every plan must be:
- Deterministic
- Dependency-driven
- Composed of small independently deliverable increments
- Completable per task within a few hours

---

# 4. Planning Responsibilities

The agent may:
- Create implementation phases
- Create task lists and backlogs
- Define execution order
- Write API and database implementation plans
- Define acceptance criteria

The agent must not:
- Redesign architecture
- Add services, databases, queues, or workers
- Change service ownership
- Introduce shared packages or internal frameworks

---

# 5. Task Structure

Every task must include:
- **Scope**: what is being built
- **Owner**: which service is involved
- **Dependencies**: what must exist first
- **Acceptance Criteria**: binary pass/fail conditions
- **Out of Scope**: explicit boundary
- **Risks**: only if they materially affect execution

---

# 6. Implementation Order

<!--
GENERATION RULE: Use this default order. Adjust only if the operational flows
in 06-operational-flows.md imply a different dependency chain.
For example: if the system has no UI, remove "Dashboard / UI".
If there is no async processing, remove "Hardening" retry section.
-->

Default order for larger plans:

1. Foundation (project structure, config, startup)
2. Security (auth, tokens, credentials)
3. Persistence (schemas, migrations, indexes)
4. Runtime flows (core business logic)
5. Dashboard / UI
6. Visibility (logging, audit)
7. Hardening (edge cases, retries, error handling)

Do not start from UI when the backend dependency is not ready.
Do not start from optimization.
Do not start from observability as a primary feature.

---

# 7. Increment Rules

- Each increment must be independently deliverable
- Each increment must have binary acceptance criteria
- Do not bundle unrelated concerns into one change
- Do not move to the next scope without explicit instruction
- Stop when the requested scope is complete

<!--
VALIDATION RULES:
- Source-of-truth priority order must exactly match AGENTS.md Source Of Truth section
- Source-of-truth list must only include docs that were actually generated
- Forbidden behaviors must not contradict any ADR in 08-architecture-decisions.md
- Implementation order must be consistent with dependencies in 06-operational-flows.md
-->

# Mission

[One paragraph. State: what system this repo implements, what the agent's job is (implement, not redesign), and what the agent is explicitly not (not an architect, not a product manager).]

<!--
GENERATION RULE: Derive from 01-prd.md Product Overview + Goals.
The mission must make clear: (1) what the system is, (2) that the architecture is frozen,
(3) what role the agent plays. Do not add strategy or vision.
-->

# Source Of Truth

When you need guidance, use the minimum number of documents required and resolve conflicts by this order:

<!--
GENERATION RULE:
- Derive this list from .ai/docs/.manifest.md — include only docs whose manifest status
  is not "omitted". Drop any line whose doc is omitted (e.g. remove the 09 line for a
  project that omitted topology diagrams). Do not hardcode the 10-file default set.
- Default order below is correct for most projects — adjust only if the PRD implies
  a different authority hierarchy (e.g. a supplementary PRD that overrides the main PRD)
- Insert supplementary PRDs (.ai/docs/11-*-prd.md etc.) between .ai/docs/01-prd.md and .ai/docs/10-planning-rules.md
- EXTENSION INSERTION RULE: extension docs (manifest Extensions table — agent-owned
  reports like a future 11-security-audit.md) are appended AFTER .ai/docs/10-planning-rules.md,
  at the lowest priority, ordered by doc number. Rationale: extensions are derived reports;
  on conflict, the source docs they were derived from must win. Only extension docs whose
  manifest status is "frozen" are listed — draft extension reports are not source of truth.
- This list must be identical to the Source Of Truth list in .ai/docs/10-planning-rules.md
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
10. `.ai/docs/10-planning-rules.md`

Higher priority wins. Do not merge conflicting ideas. Do not average them. Do not invent a third interpretation.

If the docs do not say to change architecture, then architecture does not change.

# Operating Principles

<!--
GENERATION RULE:
- One numbered principle per ADR in 08-architecture-decisions.md
- Each principle is one sentence maximum
- Derived directly from the ADR — do not paraphrase loosely
- No principles without an ADR source
-->

1. [Principle derived from ADR-001]
2. [Principle derived from ADR-002]
3. [...]

You are acting as a [Principal Engineer / Staff Engineer / Systems Engineer]. You are not acting as a Product Manager, Architect, Startup Founder, or Visionary.

# Context Loading Strategy

Do not read the whole repository by default. Load only the context required for the current task.

Use this mapping first:

<!--
GENERATION RULE:
- Derive task categories from the flow names in 06-operational-flows.md
- For each category, list the minimum docs required — never list all docs for every category
- "General architecture" category is always present and always points to 08-architecture-decisions.md
- Categories should match the actual flows: if there is no webhook flow, do not add a webhook category
-->

- [Task Category — e.g. Authentication]
  - `.ai/docs/01-prd.md`
  - `.ai/docs/03-service-boundaries.md`
  - `.ai/docs/05-api-specifications.md`

- [Task Category — e.g. Data persistence]
  - `.ai/docs/04-data-models.md`

- [Task Category — add one per major flow in 06-operational-flows.md]
  - `.ai/docs/[relevant doc]`

- General architecture
  - `.ai/docs/08-architecture-decisions.md`

When uncertain, read the minimum set that can answer the question. Context discipline is mandatory.

# Working Loop

Use this loop for every non-trivial task:

1. Identify the exact request.
2. Load only the relevant source documents.
3. Locate the owning service.
4. Confirm the change stays inside the existing boundaries.
5. Define acceptance criteria before implementation.
6. Implement the smallest useful increment.
7. Verify only the affected surface using the task's provided verification command or artifact check.
8. Record the verification outcome using the Test Results Format below before marking the increment complete.
9. Stop only when the requested scope is complete and the verification gate is passed, blocked, or explicitly marked `[manual review required]`.

Rules for execution:

- Prefer incremental changes over broad rewrites.
- Prefer local changes over cross-service edits.
- Prefer explicit code over reusable internal frameworks.
- If a task touches multiple concerns, split it into ordered increments.
- Every increment must be independently deliverable.

## Test Results Format

For every implementation increment, report verification in this format:

```markdown
Test Results:
- Verify command: [exact command from the task, or "artifact/manual review"]
- Attempt 1: [passed | failed | not run] — [brief evidence]
- Retry: [not needed | passed | failed | not run] — [brief evidence]
- Gate result: [passed | blocked | manual review required]
- Notes: [only blockers, manual-review evidence, or relevant caveats]
```

Verification gate rules:

- If the task has an executable verify command, run it before marking the task complete.
- If the first verify attempt fails, address the concrete failure and retry once automatically.
- If the retry fails with a consistent non-flaky failure, halt and follow the Escalation Protocol; do not retry more than once without user input.
- If the task is explicitly tagged `[manual review required]`, do not invent an automated command. Mark `Gate result: manual review required`, record the artifact or reviewer evidence needed, and stop at that manual-review handoff.
- If no verify command is provided and the task is not tagged `[manual review required]`, use the smallest relevant artifact check that proves the increment exists; if no meaningful check exists, halt through the Escalation Protocol instead of claiming completion.

# Architecture Guardrails

These are non-negotiable.

## Frozen service landscape

<!--
GENERATION RULE:
- List the exact service names from 02-technical-architecture.md — no additions, no omissions
- Forbidden patterns come from: PRD Out of Scope + ADRs in 08-architecture-decisions.md
- "Do not add" list below is universal — keep it; add project-specific lines after
-->

The platform contains exactly [N] services:

- `[service-name]`
- `[service-name]`

Do not add services.
Do not add databases.
Do not add queues.
Do not add workers.

Specifically forbidden patterns include:

- [pattern from Out of Scope or ADR — e.g. "gateway", "orchestrator", "admin-api"]
- [pattern from Out of Scope or ADR]

## Frozen topology

<!--
GENERATION RULE:
- Include this section only if 02-technical-architecture.md defines a
  meaningful architectural separation (e.g. control plane / data plane).
- If no such separation exists, remove this section entirely.
-->

[Describe the separation and which services belong to each side.]
Do not move responsibilities across the boundary.

## Frozen technology stack

<!--
GENERATION RULE: Mirror exactly from 07-engineering-standards.md Technology Stack section.
-->

- Backend: [...]
- Frontend: [...] (or remove if no frontend)
- Data layer / infrastructure: [...]

Do not introduce alternate stacks without explicit approval.

## Frozen API style

<!--
GENERATION RULE: Derive from 07-engineering-standards.md API Rules section and relevant ADRs.
-->

Use [REST / GraphQL / gRPC] only.
Do not introduce [explicitly forbidden alternatives from ADRs].

# Service Ownership Rules

<!--
GENERATION RULE:
- Mirror directly from 03-service-boundaries.md — one subsection per service
- Preserve "Owns" and "Must never own" content exactly as written in 03
- Do not add or remove items here — 03 is the source of truth
-->

Always start by identifying the owner. If a change crosses ownership boundaries, it is probably wrong.

## `[service-name]`

Owns:
- [responsibility]

Must never own:
- [forbidden responsibility]

## Cross-service rules

- No cross-service database access.
- No duplicated ownership.
- No hidden coupling.
- Communication happens through [protocols from 02-technical-architecture.md] only.

# Development Strategy

Work in small, deterministic, independently shippable increments.

Default strategy:

1. Choose the owning service.
2. Make the minimum change that satisfies the request.
3. Keep behavior explicit.
4. Avoid introducing reusable internal systems unless already present and required.
5. Stop after the requested slice is complete.

Prefer:

- Simple over complex
- Explicit over abstract
- Stable over clever
- Duplication over shared packages
- Local reasoning over broad refactors

Do not create:

<!--
GENERATION RULE:
- Derive from 07-engineering-standards.md Shared Package Policy + Forbidden Rules sections
- And from any ADR that prohibits specific abstraction patterns
- Do not add items not present in the generated docs
-->

- [forbidden abstraction — e.g. internal frameworks]
- [forbidden abstraction — e.g. shared packages, common/, libs/]

Avoid speculative extensibility. Build for the current documented need.

# Planning Rules

Before implementation, define binary acceptance criteria.

Every plan or execution slice must include:

- implementation order
- dependencies
- acceptance criteria
- out-of-scope boundary
- risks when relevant

Planning rules:

- Plan from dependencies.
- Keep tasks small.
- Each task should produce a working artifact or a meaningful partial capability.
- Do not bundle unrelated concerns into one change.
- Do not move to the next scope without explicit instruction.

Preferred implementation order when creating larger plans:

<!--
GENERATION RULE:
- Use this default order unless flow dependencies in 06-operational-flows.md
  imply a different sequence
- Remove steps that don't apply (e.g. remove "Dashboard / UI" if no frontend exists)
-->

1. Foundation
2. Security
3. Persistence
4. Runtime flows
5. Dashboard / UI
6. Visibility
7. Hardening

Do not start from UI when the backend dependency is not ready.
Do not start from optimization.
Do not start from observability as a primary feature.

# Coding Rules

<!--
GENERATION RULE: Every rule below must derive from 07-engineering-standards.md.
Do not add rules not present in that document.
Replace placeholders with exact values from 07.
-->

- Backend uses [language + framework + module system].
- Frontend uses [framework + build tool]. (remove if no frontend)
- Every service owns its own dependencies, configuration, and startup.
- Environment variables must use the `[PREFIX]_` prefix.
- Use structured logs.
- Never log [sensitive field list from 07 Logging Rules].

Persistence rules:

- [What to persist — from 07 Data Rules]
- [What never to persist — from 07 Data Rules]

Security rules:

- [Auth method and token handling — from 07 Authentication Rules]
- [Encryption requirement — from 07 Security Rules]
- [Signing rule if applicable — from 07 Security Rules]

# Decision Tree

Use this before changing code.

<!--
GENERATION RULE:
- Items 1–4 are universal — keep them as-is
- Item 5 is project-specific: derive from the most critical ADR (typically
  the one about external system compatibility or service boundary violations)
- Items 6–8 are universal — keep them as-is
-->

1. Is the request explicitly asked for?
   - If no, do not do it.

2. Which service owns this behavior?
   - If ownership is unclear, read `.ai/docs/03-service-boundaries.md` and stop guessing.

3. Does the change preserve the frozen architecture?
   - If no, do not implement it.

4. Does the change add a service, database, queue, worker, framework, or shared package?
   - If yes, reject that design and choose an in-bound implementation.

5. [Project-specific check derived from the most critical ADR — e.g.:
   "Does the change affect [external system] runtime behavior? If yes, [service-name] owns it and compatibility must remain exact."]

6. Can the task be split into a smaller independently deliverable increment?
   - If yes, split it.

7. Are acceptance criteria explicit?
   - If no, write them before implementation.

8. Is the requested slice complete?
   - If yes, stop. Do not continue into adjacent scope.

# Forbidden Behaviors

<!--
GENERATION RULE: Derive from four sources:
1. ADRs in 08-architecture-decisions.md (what they prohibit)
2. "Must never own" lists in 03-service-boundaries.md
3. Forbidden Patterns from 07-engineering-standards.md
4. Out of Scope from 01-prd.md
Items below marked "universal" are always present.
Add project-specific items after them.
-->

Never do the following:

- redesign architecture [universal]
- add services [universal]
- add databases [universal]
- add queues [universal]
- add workers [universal]
- add new business domains [universal]
- add internal frameworks [universal]
- invent missing requirements [universal]
- continue into extra scope without explicit instruction [universal]
- build abstractions that the current scope does not need [universal]
- [project-specific forbidden — from ADRs / 03 must-never-own / Out of Scope]
- [project-specific forbidden]

# Definition Of Done

A task is done only when all of the following are true:

<!--
GENERATION RULE:
- Items 1–5 and 7–8 are universal — keep them as-is
- Item 6 is project-specific: derive from the most critical compatibility or
  correctness constraint in the ADRs (e.g. external system compatibility,
  data integrity rule, security invariant)
-->

1. The requested scope is implemented and nothing extra is included.
2. The change stays inside the frozen architecture.
3. Ownership remains correct.
4. Acceptance criteria are satisfied.
5. The increment is independently deliverable.
6. [Project-specific DoD item — e.g. "External system compatibility remains intact where applicable."]
7. No forbidden abstraction or new platform surface was introduced.
8. The work stops at the requested boundary.

# Output Contract

When reporting work:

- State what changed.
- State where it changed.
- State how it was verified.
- State any explicit blocker or remaining instruction needed.

When planning work:

- include implementation order
- include dependencies
- include acceptance criteria
- include out-of-scope
- include risks if they materially affect execution

When uncertain:

- do not invent
- do not redesign
- load the minimum additional source document
- then proceed with the simplest valid interpretation

# Golden Rules

<!--
GENERATION RULE:
- 10 to 15 numbered one-liners maximum
- Every rule must trace to a specific ADR or engineering standard
- Items 1–2 are universal — keep them
- Items 3+ are project-specific: derive one per critical ADR
- Final 3 items (increment, criteria, stop) are universal — keep them
- Do not add rules not traceable to generated docs
-->

1. Architecture is frozen.
2. The implementer is not the architect.
3. [Rule from ADR — e.g. "[External system] is source of truth."]
4. [Rule from ADR — e.g. "[Service] stays [its core constraint]."]
5. [Rule from ADR — e.g. "No new services, databases, queues, or workers."]
6. [Rule from ADR — e.g. "No shared packages."]
7. Prefer duplication over abstraction.
8. Every implementation is incremental.
9. Every implementation is independently deliverable.
10. Every implementation has acceptance criteria.
11. Finish the requested slice, then stop.

# Prompt Contract

Unless explicitly overridden:

- Assume AGENT.md is the only source of execution rules.
- Do not require repeating architecture constraints.
- Do not require repeating source-of-truth priorities.
- Do not require repeating service ownership rules.
- Every user prompt should be interpreted as an incremental task request.
- Execute only the requested scope and stop.

<!--
VALIDATION RULES:
- Every section must be present and fully populated — no placeholder text in final output
- Every rule must trace to a generated doc — add inline source comments for non-obvious rules
- Source-of-truth list must be identical to .ai/docs/10-planning-rules.md Source Of Truth section
- Service list in Architecture Guardrails must match 02-technical-architecture.md exactly
- "Frozen topology" section must be removed if 02 defines no plane separation
- Forbidden Behaviors must cover all "must never own" items from 03-service-boundaries.md
- Golden Rules: minimum 10, maximum 15; all traceable to ADRs or engineering standards
- Decision Tree item 5 must be project-specific — not a generic placeholder
- Definition Of Done item 6 must be project-specific — not a generic placeholder
-->

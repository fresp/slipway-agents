# [Project Name] Operational Flows

Version: 1.0
Status: [frozen/draft/omitted]
<!-- GENERATION RULE: Status value comes from the STEP 2.5 doc suite decision recorded in
.ai/docs/.manifest.md. An omitted doc is never generated, so real output carries frozen
(after STEP 5 validation passes) or draft (mid-generation/regeneration). Content-stability
rules for frozen docs are unchanged: versioned edits only, no silent rewrites. -->

---

# 1. Purpose

This document defines operational contracts.

It describes:
- Triggers
- Ownership
- Outcomes
- Runtime constraints

Visual diagrams are defined in:
09-topology-and-architecture-diagrams.md

---

# 2. [Flow Name]

Purpose: [one sentence describing what this flow accomplishes]
Owner: [service-name]
Trigger: [what initiates this flow]
Outcome:
- [result 1]
- [result 2]

Steps:
1. [actor/service] [action]
2. [actor/service] [action]
3. [actor/service] [action]

Flow Graph:
| Step | From | To | Call Type | Contract | Failure Mode |
|---|---|---|---|---|---|
| 1 | [service or actor] | [service] | sync-http \| async-event \| async-queue \| external-api | [method] [path] or event name | [what happens on timeout/error: retry / circuit-break / dead-letter / propagate error / manual intervention] |
| 2 | [service] | [service] | ... | ... | ... |

<!--
GENERATION RULE:
- One row per inter-service or external-system call within this flow, in the
  same order as the Steps list above — Flow Graph rows and Steps numbering
  must correspond 1:1 where a step involves a call; steps that are pure
  in-process logic (no call to another service) are omitted from Flow Graph.
- "From"/"To" must use exact service names from 02-technical-architecture.md
  and 03-service-boundaries.md — never invented names.
- Call Type must be one of the four listed values. If the PRD/ADRs describe a
  different pattern, use the closest match and note the deviation in
  Constraints below, don't invent a fifth category ad hoc.
- Contract: for sync-http, use [method] [path] matching an entry in
  05-api-specifications.md exactly. For async-event/queue, use the event or
  routing key name as it will appear in 07-engineering-standards.md's queue
  architecture section if one exists, or a descriptive name otherwise.
- Failure Mode must be concrete, not "handle errors" — state the actual
  mechanism (retry with backoff, circuit breaker, dead-letter queue, propagate
  4xx/5xx to caller, page on-call, etc.) per what 08-architecture-decisions.md
  or 07-engineering-standards.md already establishes. If no failure handling
  is decided yet, write "Not yet decided — flag for ADR" rather than
  inventing one.
-->

Constraints:
- [rule or limitation]
- [rule or limitation]

---

# 3. [Flow Name]

Purpose: [...]
Owner: [...]
Trigger: [...]
Outcome:
- [...]

Steps:
1. [...]

Flow Graph:
| Step | From | To | Call Type | Contract | Failure Mode |
|---|---|---|---|---|---|
| 1 | [...] | [...] | ... | ... | ... |

Constraints:
- [...]

<!-- Repeat for every major operational flow in the system -->

<!--
VALIDATION RULES:
- Every flow must have exactly one owning service
- Owner must match 03-service-boundaries.md
- Every step must reference a service or actor defined in 02-technical-architecture.md
- Flows must be consistent with 09-topology-and-architecture-diagrams.md
- No flow may assign a responsibility to a service that "must never own" it (per 03-service-boundaries.md)
- Every Flow Graph row's From/To must exist as a service in
  02-technical-architecture.md or be explicitly marked as an external actor
  from 01-prd.md's Actors section
- Every sync-http Contract must match an existing [method] [path] entry in
  05-api-specifications.md — no orphaned references
- Flow Graph step numbers must be a subset of the Steps list numbering above
  it, in the same relative order
-->

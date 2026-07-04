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
-->

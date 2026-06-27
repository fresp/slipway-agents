# [Project Name] Engineering Standards

Version: 1.0
Status: Frozen

---

# 1. Purpose

This document defines implementation constraints.

Its objective is to ensure all engineers and AI agents build the platform consistently.

When conflicts occur:
Architecture Decisions > Technical Architecture > Engineering Standards

---

# 2. Technology Stack

<!--
GENERATION RULE: Derive from the Dependencies column in the Requirement Model
and any technology ADRs in 08-architecture-decisions.md.
List only what is explicitly required — do not add technologies not mentioned in the PRD or ADRs.
-->

Backend: [language, framework, module system]
Frontend: [framework, build tool — or "N/A" if no frontend in PRD]
Infrastructure Components: [database, cache, queue — list only what appears in the model]
Do not introduce alternative technologies without approval.

---

# 3. Service Independence

<!--
GENERATION RULE: List the exact service names from 02-technical-architecture.md.
-->

The platform consists of [N] independent services:

[service names, one per line]

Each service:
- Owns its own dependencies
- Owns its own configuration
- Owns its own startup
- May not access another service's database

---

# 4. Shared Package Policy

<!--
GENERATION RULE: Include this section only if an ADR prohibits shared packages.
If the PRD or ADRs do not address this, omit this section entirely.
-->

Do not create: [list forbidden directory patterns — e.g. packages/, shared/, common/, libs/, core/]
Do not centralize business logic. Prefer small duplication over shared abstractions.

---

# 5. Environment Variables

<!--
GENERATION RULE: Derive the prefix from the PRD product name or a naming convention
stated in NFRs/constraints. If no prefix is stated, use [PRODUCTNAME]_ in uppercase.
-->

Prefix: `[PREFIX]_`
All environment variables must use this prefix.
Never hardcode credentials, secrets, or external URLs.

---

# 6. API Rules

<!--
GENERATION RULE: Derive from the API style ADR and 05-api-specifications.md.
List only what is explicit — do not prohibit protocols not mentioned in the PRD.
-->

Use [REST / GraphQL / gRPC] only.
[list what is explicitly forbidden, if stated in ADRs]
[service-name] owns [domain] APIs.
[service-name] owns [domain] APIs.

---

# 7. Authentication Rules

<!--
GENERATION RULE: Derive from the Security column in the Requirement Model.
One subsection per distinct auth method. Include only methods actually used.
-->

[Auth method 1 — e.g. Portal authentication]: [description]
[Auth method 2 — e.g. Machine authentication]: [description]
[Token rules — e.g. expiration, regeneration, disable]: [description]
Never store raw tokens.

---

# 8. Data Rules

<!--
GENERATION RULE: Derive from the Persistence column in the Requirement Model.
"Persist only" lists what IS allowed. "Never persist" lists what is explicitly forbidden
per ADRs or PRD constraints. Do not add forbidden items not mentioned in the PRD.
-->

[External system, if any] is source of truth for [what kind of state].
Persist [what is allowed] only.
Never persist: [explicit list from PRD/ADRs]

---

# 9. Queue Rules

<!--
GENERATION RULE: Include this section only if the system uses a message broker
(i.e. async/event flows appear in the Requirement Model Runtime column).
Derive exchange and queue names from 02-technical-architecture.md queue architecture.
If no queue is in the model, omit this section entirely.
-->

[Queue technology] is an event transport mechanism.
Allowed exchanges: [list from architecture]
Do not create additional exchanges without approval.

---

# 10. Logging Rules

<!--
GENERATION RULE: Derive required log fields from NFRs or observability constraints.
Derive "never log" list from the Security column in the Requirement Model.
-->

Use structured logs.
Every log must contain: [required fields — e.g. timestamp, service, level, message]
Never log: [sensitive field list from Security column]

---

# 11. Security Rules

<!--
GENERATION RULE: Derive from the Security column in the Requirement Model and security ADRs.
Include only what is explicitly required. Do not invent security rules not in the PRD.
-->

[Credential storage rule — e.g. encryption algorithm and key management]
[Signing rule if applicable — e.g. webhook signing header and algorithm]
Never store secrets in plain text.

---

# 12. Testing Standards

<!--
GENERATION RULE: Include this section only if the PRD NFRs or constraints
explicitly mention testing requirements (e.g. coverage targets, test types required).
If testing is not mentioned in the PRD, write:
  "N/A — testing requirements not specified in PRD."
and leave the section at that. Do not invent requirements.
-->

[Unit test requirement — if stated in PRD]
[Integration test requirement — if stated in PRD]
[Coverage expectation — if stated in PRD]

---

# 13. Development Philosophy

<!--
GENERATION RULE: Derive from ADRs and any explicitly stated engineering constraints.
The preferences below are universal defaults — keep them unless an ADR overrides.
-->

Prefer: Simple > Complex, Explicit > Abstract, Duplicate > Shared, Stable > Clever.
Avoid over-engineering.

---

# 14. Frozen Rules

<!--
GENERATION RULE: Summarize the most critical prohibitions as a quick reference.
Every item must trace to an ADR or to the Forbidden Patterns list in the Requirement Model.
Use ❌ prefix for visibility.
-->

The following are architecture violations:

❌ [Forbidden pattern from ADR]
❌ [Forbidden pattern from ADR]
❌ Cross-service database access
❌ [Forbidden pattern from model]

Engineering standards are frozen.

<!--
VALIDATION RULES:
- Technology stack must match 02-technical-architecture.md exactly
- Security rules must match the Security column in the Requirement Model
- Forbidden patterns must not contradict any ADR in 08-architecture-decisions.md
- Queue Rules section must be present if and only if async flows exist in the model
- Testing Standards must say "N/A" if PRD does not mention testing — never invent requirements
- Every rule must be actionable and binary (do / do not)
-->

# [Project Name] Technical Architecture

Version: 1.0
Status: Frozen

---

# 1. Architecture Overview

[2–4 sentences: what the system is, its primary purpose, and its core design philosophy.]

The architecture consists of [N] services.

[list service names, one per line]

No additional services may be introduced without explicit approval.

---

# 2. Architecture Principles

## AP-001 [Principle Name]

[One paragraph: the principle, what it implies for implementation, what it forbids.]

## AP-002 [Principle Name]

[...]

<!--
GENERATION RULE: Derive each principle directly from an ADR in 08-architecture-decisions.md.
Do not write principles not traceable to an ADR.
-->

---

# 3. Architectural Separation

<!--
GENERATION RULE: Use this section only if the PRD or ADRs define a meaningful
separation of concerns across service groups (e.g. control plane / data plane,
read path / write path, sync / async). Rename the section to match the actual
separation. Remove this section entirely for single-plane or single-service systems.
-->

## [Plane / Group A — e.g. Control Plane]

Services: [list]
Responsibilities: [list]

## [Plane / Group B — e.g. Data Plane]

Services: [list]
Responsibilities: [list]

---

# 4. High Level Architecture

<!--
GENERATION RULE: List each major flow as a simple chain of services and external systems.
Derive flows from 06-operational-flows.md.
-->

## [Flow Name — e.g. Dashboard Flow]
[Service A] → [Service B] → [Database / External System]

## [Flow Name]
[...]

---

# 5. Service Responsibilities

<!--
GENERATION RULE: One subsection per service. Purpose is one sentence.
Responsibilities are comma-separated or listed. Constraint ("must never") is mandatory.
-->

## [service-name]
Purpose: [one sentence]
Responsibilities: [list]
[service-name] must never [forbidden responsibility].

---

# 6. Service Communication

| Source | Destination | Protocol |
|---|---|---|
| [service] | [service] | HTTPS / AMQP / gRPC / etc. |

<!--
GENERATION RULE: Cover all inter-service connections.
This table must be consistent with 06-operational-flows.md steps.
-->

---

# 7. [Optional Architecture Sections]

<!--
GENERATION RULE: Include additional sections only if the PRD requires them.
Common optional sections:

- Proxy Architecture (if a service acts as a transparent proxy to an external system)
- Queue Architecture (if async event processing is required — list exchanges, routing keys, queues)
- Retry Architecture (if retry/dead-letter patterns are required — list schedule)
- Cache Architecture (if caching is required)

Remove unused sections entirely. Do not include placeholder sections.
-->

---

# 8. Security Architecture

[Authentication method and where it applies]
[Authorization method and where it applies]
[Signing / encryption requirements]

<!--
GENERATION RULE: Derive from PRD Non-Functional Requirements and security constraints.
Must match 07-engineering-standards.md security rules.
-->

---

# 9. Environment Strategy

Supported environments: [list — e.g. development, staging, production]

---

# 10. Scalability Strategy

[List which services must support horizontal scaling. State any statelessness requirements.]

---

# 11. Architecture Constraints

<!--
GENERATION RULE: Derive from PRD Out of Scope + ADRs.
List every pattern, service type, or abstraction that is explicitly forbidden.
-->

Do not create: [explicit forbidden list].
Architecture is frozen.

<!--
VALIDATION RULES:
- Service list must match 03-service-boundaries.md exactly
- Service communication table must be consistent with 06-operational-flows.md
- Security architecture must match 07-engineering-standards.md
- Every architecture principle must trace to an ADR in 08-architecture-decisions.md
- Architecture constraints must cover every Out of Scope item from the PRD
-->

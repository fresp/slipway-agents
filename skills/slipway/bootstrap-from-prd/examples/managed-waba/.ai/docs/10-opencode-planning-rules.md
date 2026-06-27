# 10-opencode-planning-rules.md

# Managed WABA Platform Opencode Planning Rules

Version: 1.1

Status: Frozen

---

# 1. Purpose

This document defines how Opencode must behave during planning and implementation.

The architecture has already been decided.

Opencode must not redesign the system.

Opencode acts as:
- Planner
- Task Decomposer
- Implementer

Opencode is not the system architect.

---

# 2. Source Of Truth

The following documents are authoritative.

Read them before planning.

Priority order:

1. 08-architecture-decisions.md
2. 09-topology-and-architecture-diagrams.md
3. 02-technical-architecture.md
4. 03-service-boundaries.md
5. 06-operational-flows.md
6. 05-api-specifications.md
7. 04-data-models.md
8. 07-engineering-standards.md
9. 11-portal-dashboard-prd.md
10. 01-prd.md

When conflicts occur:

Use the higher priority document.

Never invent a new architecture.

---

# 3. Planning Objectives

Opencode must create implementation plans.

Plans must be:
- Deterministic
- Dependency driven
- Small incremental steps
- Independently deliverable

Avoid giant tasks.

Every task should be completable in a few hours.

---

# 4. Responsibilities

Opencode may:
- Create implementation phases
- Create implementation tasks
- Create development backlogs
- Create execution order
- Create API implementation plans
- Create database implementation plans

Opencode may not:
- Redesign architecture
- Add services
- Introduce new technologies
- Introduce new business domains

---

# 5. Architecture Guardrails

The following are frozen.

Services:
```text
portal

platform-api

meta-api

webhook-worker

retry-worker
```

Do not introduce:
```text
gateway

bff

orchestrator

scheduler

worker-manager

admin-api

internal-api

notification-service

monitoring-service
```

---

# 6. Scope Guardrails

Do not introduce:
- CRM
- Omnichannel
- Chatbot
- Campaign Management
- Workspace Management
- Multi User Management
- Billing / Payment UI

Do not expand product scope.

---

# 7. Meta Guardrails

Meta is source of truth.

Never:
- Transform payloads
- Wrap responses
- Modify Meta behavior

meta-api must remain transparent.

---

# 8. Service Ownership Guardrails

portal
- UI only

platform-api
- Dashboard backend
- Embedded Signup
- Synchronization

meta-api
- Runtime Meta traffic

webhook-worker
- Webhook delivery

retry-worker
- Retry processing

Do not move responsibilities between services.

---

# 9. Shared Package Guardrails

Do not create:
```text
packages/

shared/

common/

libs/

core/
```

Prefer duplication over abstraction.

---

# 10. Planning Methodology

Always plan from dependencies.

Preferred order:
1. Foundation
2. Security
3. Persistence
4. Runtime Flows
5. Dashboard
6. Visibility
7. Hardening

Do not start from UI.
Do not start from observability.
Do not start from optimization.

---

# 11. Planning Deliverables

Every planning output must contain:

Implementation Phase
Implementation Order
Dependencies
Acceptance Criteria
Out Of Scope
Risks
Open Questions

---

# 12. Task Granularity

Bad:
```text
Build meta-api
```

Good:
```text
Implement access token validation

Implement transparent request forwarding

Implement metadata persistence

Implement webhook intake endpoint
```

Tasks must be small.

---

# 13. Phase Rules

Every phase must be independently executable.

Each phase must produce a working artifact.

Avoid phases that require all phases to finish before anything works.

---

# 14. Engineering Philosophy

Prefer:
```text
Simple > Complex

Explicit > Abstract

Duplicate > Shared

Stable > Clever
```

Avoid over engineering.

---

# 15. Forbidden Behaviors

Do not:
- Re-architect services
- Introduce additional databases
- Introduce additional workers
- Introduce additional queues
- Create internal frameworks
- Create utility ecosystems

Do not invent missing requirements.

Ask questions instead.

---

# 16. Planning Completion Criteria

Planning is complete when:
- Dependencies are clear
- Tasks are ordered
- Acceptance criteria exist
- Risks are identified
- Scope is preserved

Planning is not complete when:
- New architecture is introduced
- New domains are invented
- Assumptions are made without approval

---

# 17. Frozen Rule

Architecture is already solved.

The mission is execution, not invention.
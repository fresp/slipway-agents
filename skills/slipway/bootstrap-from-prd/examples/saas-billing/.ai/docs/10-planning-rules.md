# SaaS Billing Planning Rules

Version: 1.0
Status: frozen

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

1. `.ai/docs/08-architecture-decisions.md`
2. `.ai/docs/02-technical-architecture.md`
3. `.ai/docs/03-service-boundaries.md`
4. `.ai/docs/06-operational-flows.md`
5. `.ai/docs/05-api-specifications.md`
6. `.ai/docs/04-data-models.md`
7. `.ai/docs/07-engineering-standards.md`
8. `.ai/docs/01-prd.md`
9. `.ai/docs/10-planning-rules.md`

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

Default order for larger plans:

1. Foundation (project structure, config, startup)
2. Security (auth, tokens, credentials)
3. Persistence (schemas, migrations, indexes)
4. Runtime flows (core business logic)
5. Visibility (logging, audit)
6. Hardening (edge cases, retries, error handling)

Do not start from optimization.
Do not start from observability as a primary feature.

---

# 7. Increment Rules

- Each increment must be independently deliverable
- Each increment must have binary acceptance criteria
- Do not bundle unrelated concerns into one change
- Do not move to the next scope without explicit instruction
- Stop when the requested scope is complete

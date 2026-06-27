# Mission

Operate this repository as a production implementation engine for a Managed WABA Platform built on top of Meta WhatsApp Business Platform. Execute only within the frozen architecture. Optimize for deterministic delivery, minimal context usage, small safe increments, maintainability, and production readiness.

This repository is not a place to invent product strategy or redesign systems. The job is to implement what the documents already decided.

# Source Of Truth

When you need guidance, use the minimum number of documents required and resolve conflicts by this order:

1. `.ai/docs/08-architecture-decisions.md`
2. `.ai/docs/09-topology-and-architecture-diagrams.md`
3. `.ai/docs/02-technical-architecture.md`
4. `.ai/docs/03-service-boundaries.md`
5. `.ai/docs/11-portal-dashboard-prd.md`
6. `.ai/docs/06-operational-flows.md`
7. `.ai/docs/05-api-specifications.md`
8. `.ai/docs/04-data-models.md`
9. `.ai/docs/07-engineering-standards.md`
10. `.ai/docs/01-prd.md`
11. `.ai/docs/10-opencode-planning-rules.md`

Higher priority wins. Do not merge conflicting ideas. Do not average them. Do not invent a third interpretation.

If the docs do not say to change architecture, then architecture does not change.

# Operating Principles

1. Architecture is frozen.
2. Meta is the source of truth.
3. `meta-api` must remain a transparent proxy.
4. `portal` is UI only.
5. Workers are stateless.
6. Prefer duplication over abstraction.
7. Build the smallest independently deliverable increment.
8. Do not continue into the next scope without explicit instruction.
9. Simplicity beats cleverness.
10. Execution beats invention.

You are acting as a Principal Engineer, Staff Engineer, Systems Engineer, and Production Engineer. You are not acting as a Product Manager, Architect, Startup Founder, or Visionary.

# Context Loading Strategy

Do not read the whole repository by default. Load only the context required for the current task.

Use this mapping first:

- Authentication
  - `.ai/docs/01-prd.md`
  - `.ai/docs/03-service-boundaries.md`
  - `.ai/docs/05-api-specifications.md`

- Portal UI
  - `.ai/docs/11-portal-dashboard-prd.md`
  - `.ai/docs/03-service-boundaries.md`

- Meta runtime
  - `.ai/docs/08-architecture-decisions.md`
  - `.ai/docs/02-technical-architecture.md`
  - `.ai/docs/05-api-specifications.md`

- Webhook flow
  - `.ai/docs/06-operational-flows.md`
  - `.ai/docs/09-topology-and-architecture-diagrams.md`

- Database and persistence
  - `.ai/docs/04-data-models.md`

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
7. Verify only the affected surface.
8. Stop when the requested scope is complete.

Rules for execution:

- Prefer incremental changes over broad rewrites.
- Prefer local changes over cross-service edits.
- Prefer explicit code over reusable internal frameworks.
- If a task touches multiple concerns, split it into ordered increments.
- Every increment must be independently deliverable.

# Architecture Guardrails

These are non-negotiable.

## Frozen service landscape

The platform contains exactly five services:

- `portal`
- `platform-api`
- `meta-api`
- `webhook-worker`
- `retry-worker`

Do not add services.
Do not add databases.
Do not add queues.
Do not add workers.

Specifically forbidden patterns include:

- gateway
- bff
- orchestrator
- scheduler
- worker-manager
- admin-api
- internal-api
- notification-service
- monitoring-service

## Frozen topology

Keep control plane and data plane separate.

- Control plane: `portal`, `platform-api`
- Data plane: `meta-api`, `webhook-worker`, `retry-worker`

Do not move responsibilities across the plane boundary.

## Frozen technology stack

- Backend: NodeJS, ExpressJS, CommonJS
- Frontend: React, Vite
- Data layer / infrastructure components: MongoDB, Redis, RabbitMQ

Do not introduce alternate stacks without explicit approval.

## Frozen API style

Use REST only.
Do not introduce GraphQL.
Do not introduce gRPC.
Do not introduce BFF APIs.

# Service Ownership Rules

Always start by identifying the owner. If a change crosses ownership boundaries, it is probably wrong.

## `portal`

Owns presentation only:

- Authentication UI
- Overview UI
- Embedded Signup UI
- WABA UI
- Security UI
- Settings UI

`portal` must never own:

- business logic
- authentication logic
- database access
- Meta integrations
- queue processing
- retry processing

## `platform-api`

Owns the operational control plane:

- authentication
- session management
- Embedded Signup
- WABA synchronization
- phone number synchronization
- access token management
- webhook configuration
- audit logs
- settings
- dashboard aggregations

`platform-api` must never own:

- runtime Meta traffic
- send message execution
- webhook delivery
- retry processing

## `meta-api`

Owns runtime Meta traffic only:

- transparent proxying
- webhook intake
- metadata persistence

`meta-api` must never own:

- portal authentication
- Embedded Signup
- audit logs
- settings
- dashboard logic

All runtime traffic to Meta goes through `meta-api`. No exceptions.

## `webhook-worker`

Owns:

- webhook forwarding
- payload signing
- delivery tracking

Must remain stateless.

Must never own:

- webhook configuration
- retry scheduling
- authentication
- Meta proxy behavior
- WABA state updates

## `retry-worker`

Owns:

- retry scheduling
- retry processing
- dead-letter handling

Must remain stateless.

Must never own:

- authentication
- Meta access
- webhook configuration
- WABA state updates

## Cross-service rules

- No cross-service database access.
- No duplicated ownership.
- No hidden coupling.
- Communication happens through HTTPS or RabbitMQ only.

# Meta Compatibility Rules

Meta is the business source of truth. This is a hard constraint, not a preference.

Never create platform-owned business state for:

- quality rating
- messaging limits
- verification status
- template status

`meta-api` must preserve Meta compatibility:

- preserve payloads
- preserve headers
- preserve query parameters
- preserve responses
- preserve path structure
- return Meta errors as-is

Never:

- transform Meta payloads
- wrap Meta responses
- inject helper fields into Meta traffic
- modify Meta behavior

The correct client migration model is base-URL replacement, not API redesign.

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

- internal frameworks
- utility ecosystems
- shared package trees
- common libraries
- generic core modules intended for future reuse

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

1. Foundation
2. Security
3. Persistence
4. Runtime flows
5. Dashboard
6. Visibility
7. Hardening

Do not start from UI when the backend dependency is not ready.
Do not start from optimization.
Do not start from observability as a primary feature.

# Dashboard Rules

`portal` is a client-facing operational application, not a CRM or analytics product.

The dashboard must remain utilitarian:

- clean
- operational
- low-click
- simple

Allowed primary modules:

- Overview
- WABA Management
- Security
- Settings

Dashboard constraints:

- UI only, no business-state ownership
- format validation is allowed
- business validation belongs to `platform-api`
- all portal data and authentication flow through `platform-api`

Portal out-of-scope constraints:

- no billing UI
- no top-up UI
- no inbox or chat UI
- no multi-user or role system
- no CRM behavior

Billing remains outside the system and is handled directly in Meta / FBM.

# Coding Rules

Follow the existing stack and keep code obvious.

Rules:

- Backend uses NodeJS + ExpressJS + CommonJS.
- Frontend uses React + Vite.
- Portal styling follows TailwindCSS when working in portal UI.
- State management in portal should remain lightweight.
- Every service owns its own dependencies, configuration, and startup.
- Environment variables must use the `CLOUDWA_` prefix.
- Use structured logs.
- Never log passwords, access tokens, secrets, or Meta credentials.

Persistence rules:

- Persist metadata only.
- Never persist message bodies.
- Never persist media.
- Never persist contacts, attachments, locations, or interactive content.
- Raw inbound payloads belong only in `webhook_events`.

Security rules:

- Portal auth uses JWT + refresh token.
- Machine auth uses `Authorization: Bearer {access_token}`.
- Access tokens are opaque.
- One phone number maps to exactly one access token.
- One phone number maps to exactly one webhook target.
- Never store raw tokens.
- Credentials must remain encrypted.
- Webhook signing header is `X-CLOUDWA-SIGNATURE`.

# Decision Tree

Use this before changing code.

1. Is the request explicitly asked for?
   - If no, do not do it.

2. Which service owns this behavior?
   - If ownership is unclear, read `.ai/docs/03-service-boundaries.md` and stop guessing.

3. Does the change preserve the frozen architecture?
   - If no, do not implement it.

4. Does the change add a service, database, queue, worker, framework, or shared package?
   - If yes, reject that design and choose an in-bound implementation.

5. Does the change affect Meta runtime behavior?
   - If yes, `meta-api` owns it and compatibility must remain exact.

6. Does the change belong in the portal?
   - If yes, keep it UI-only.

7. Can the task be split into a smaller independently deliverable increment?
   - If yes, split it.

8. Are acceptance criteria explicit?
   - If no, write them before implementation.

9. Is the requested slice complete?
   - If yes, stop. Do not continue into adjacent scope.

# Forbidden Behaviors

Never do the following:

- redesign architecture
- add services
- add databases
- add queues
- add workers
- add new business domains
- add internal frameworks
- add utility ecosystems
- create `packages/`, `shared/`, `common/`, `libs/`, or `core/`
- centralize logic for the sake of reuse
- move responsibilities across services
- let `portal` own backend logic
- let `platform-api` handle runtime Meta traffic
- let `meta-api` become an operational dashboard backend
- let workers become stateful
- access another service's database directly
- transform Meta payloads
- wrap Meta responses
- modify Meta behavior
- persist message content or media
- invent missing requirements
- continue into extra scope without explicit instruction
- build “future-proof” abstractions that the current scope does not need

# Definition Of Done

A task is done only when all of the following are true:

1. The requested scope is implemented and nothing extra is included.
2. The change stays inside the frozen architecture.
3. Ownership remains correct.
4. Acceptance criteria are satisfied.
5. The increment is independently deliverable.
6. Meta compatibility remains intact where applicable.
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

1. Architecture is frozen.
2. The implementer is not the architect.
3. Meta is source of truth.
4. `meta-api` stays transparent.
5. `portal` stays UI only.
6. Workers stay stateless.
7. No new services, databases, queues, or workers.
8. No shared packages.
9. Prefer duplication over abstraction.
10. Every implementation is incremental.
11. Every implementation is independently deliverable.
12. Every implementation has acceptance criteria.
13. Finish the requested slice, then stop.

# Prompt Contract

Unless explicitly overridden:

- Assume AGENT.md is the only source of execution rules.
- Do not require repeating architecture constraints.
- Do not require repeating source-of-truth priorities.
- Do not require repeating service ownership rules.
- Every user prompt should be interpreted as an incremental task request.
- Execute only the requested scope and stop.


# Library & Framework Docs

**Always resolve current docs via Context7 before implementing with any library or framework.**

Never rely on training knowledge for library APIs — versions drift, APIs change.

Before using any library:
- Fetch current docs via Context7 MCP.
- If Context7 has no coverage, state that explicitly before proceeding.
- If the doc contradicts your assumption, the doc wins.

This applies to: any npm package, framework, or external API used in implementation.
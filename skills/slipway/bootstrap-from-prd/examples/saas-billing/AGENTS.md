# Mission

Operate this repository as a production implementation engine for SaaS Billing — a minimal billing backend for a single SaaS product. Execute only within the frozen architecture. Optimize for deterministic delivery, minimal context usage, small safe increments, maintainability, and production readiness.

This repository is not a place to invent product strategy or redesign systems. The job is to implement what the documents already decided.

# Source Of Truth

When you need guidance, use the minimum number of documents required and resolve conflicts by this order:

1. `.ai/docs/08-architecture-decisions.md`
2. `.ai/docs/02-technical-architecture.md`
3. `.ai/docs/03-service-boundaries.md`
4. `.ai/docs/06-operational-flows.md`
5. `.ai/docs/05-api-specifications.md`
6. `.ai/docs/04-data-models.md`
7. `.ai/docs/07-engineering-standards.md`
8. `.ai/docs/01-prd.md`
9. `.ai/docs/10-planning-rules.md`

Higher priority wins. Do not merge conflicting ideas. Do not average them. Do not invent a third interpretation.

If the docs do not say to change architecture, then architecture does not change.

# Operating Principles

1. The system runs as one service: `billing-api`. (ADR-001)
2. Payment collection is synchronous only. No async payment flows. (ADR-002)
3. All billing state lives in one PostgreSQL database. (ADR-003)
4. No queues, brokers, caches, workers, or background jobs. (ADR-004)
5. Store only the payment method token reference, never raw card data. (ADR-005)
6. Payment tokens are encrypted at rest using AES-256-GCM. (ADR-006)
7. Billing cycle and dunning runs are idempotent. (ADR-007)
8. Use structured logs; never log sensitive payment data. (ADR-008)
9. Record an audit trail for every state-changing billing action. (ADR-009)
10. One external dependency: Northstar Pay. No other external systems. (ADR-010)
11. One currency, one SaaS product. (ADR-011)
12. Out of scope items are permanently forbidden. (ADR-012)

You are acting as a Principal Engineer. You are not acting as a Product Manager, Architect, Startup Founder, or Visionary.

# Context Loading Strategy

Do not read the whole repository by default. Load only the context required for the current task.

Use this mapping first:

- Billing cycle run
  - `.ai/docs/06-operational-flows.md`
  - `.ai/docs/04-data-models.md`
  - `.ai/docs/05-api-specifications.md`

- Dunning retry
  - `.ai/docs/06-operational-flows.md`
  - `.ai/docs/04-data-models.md`

- Payment collection
  - `.ai/docs/06-operational-flows.md`
  - `.ai/docs/05-api-specifications.md`

- Subscription lifecycle
  - `.ai/docs/01-prd.md`
  - `.ai/docs/03-service-boundaries.md`
  - `.ai/docs/05-api-specifications.md`

- Invoice and usage
  - `.ai/docs/04-data-models.md`
  - `.ai/docs/05-api-specifications.md`

- General architecture
  - `.ai/docs/08-architecture-decisions.md`

When uncertain, read the minimum set that can answer the question. Context discipline is mandatory.

# Working Loop

Use this loop for every non-trivial task:

1. Check for `.ai/implementation-state.md`. If it exists and `Status` is not `complete`, resume from `Last completed task` — do not re-run completed work. If it is absent or `Status: complete`, proceed to step 2.
2. Identify the exact request.
3. Load only the relevant source documents.
4. Locate the owning service (billing-api).
5. Confirm the change stays inside the existing boundaries.
6. Define acceptance criteria before implementation.
7. Implement the smallest useful increment.
8. Verify only the affected surface using the task's provided verification command or artifact check.
9. Record the verification outcome using the Test Results Format below before marking the increment complete.
10. Stop only when the requested scope is complete and the verification gate is passed, verify-blocked, or explicitly marked `[manual review required]`.

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
- Gate result: [passed | verify-blocked | manual review required]
- Notes: [only blockers, manual-review evidence, or relevant caveats]
```

Verification gate rules:

- If the task has an executable verify command, run it before marking the task complete.
- If the first verify attempt fails, address the concrete failure and retry once automatically.
- If the retry fails with a consistent non-flaky failure, this is an unconditional hard stop: mark `Gate result: verify-blocked`, halt, and follow the Escalation Protocol; do not continue or retry more than once without user input.
- If the task is explicitly tagged `[manual review required]`, do not invent an automated command. Mark `Gate result: manual review required`, record the artifact or reviewer evidence needed, and stop at that manual-review handoff.
- If no verify command is provided and the task is not tagged `[manual review required]`, use the smallest relevant artifact check that proves the increment exists; if no meaningful check exists, halt through the Escalation Protocol instead of claiming completion.

# Architecture Guardrails

These are non-negotiable.

## Frozen service landscape

The platform contains exactly one service:

- `billing-api`

Do not add services.
Do not add databases.
Do not add queues.
Do not add workers.

Specifically forbidden patterns include:

- additional-api
- worker
- scheduler
- notification-service
- analytics-service
- admin-api
- gateway
- orchestrator

## Frozen technology stack

- Backend: NodeJS, ExpressJS, CommonJS
- Frontend: N/A
- Data layer / infrastructure: PostgreSQL

Do not introduce alternate stacks without explicit approval.

## Frozen API style

Use REST only.
Do not introduce GraphQL.
Do not introduce gRPC.
Do not introduce webhook-based payment flows.

# Service Ownership Rules

Always start by identifying the owner. If a change crosses ownership boundaries, it is probably wrong.

## `billing-api`

Owns:
- Plan catalog management
- Subscription lifecycle management
- Usage metering
- Invoice generation
- Invoice retrieval
- Payment collection via Northstar Pay
- Billing cycle run orchestration
- Dunning state tracking and retry runs
- Payment method token management
- Billing audit trail

Must never own:
- Raw card data storage
- Customer-facing UI or dashboard
- Multi-product billing logic
- Multi-currency conversion
- Notification delivery
- Tax calculation beyond a fixed percentage
- Refund processing
- Chargeback or dispute handling
- Revenue recognition
- Analytics or reporting pipelines
- Queue or background job processing
- Second service orchestration

## Cross-service rules

- Not applicable (single-service system).
- Communication with Northstar Pay happens through HTTPS synchronous calls only.

# Development Strategy

Work in small, deterministic, independently shippable increments.

Default strategy:

1. Choose the owning service (billing-api).
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
5. Visibility
6. Hardening

Do not start from optimization.
Do not start from observability as a primary feature.

# Coding Rules

- Backend uses NodeJS + ExpressJS + CommonJS.
- Every service owns its own dependencies, configuration, and startup.
- Environment variables must use the `BILLING_` prefix.
- Use structured logs.
- Never log payment method tokens, provider references, raw card data, or Northstar Pay credentials.

Persistence rules:

- Persist: plans, subscriptions, usage events, invoices, invoice line items, payment attempts, audit logs.
- Never persist: raw card numbers, CVV values, bank account credentials, raw Northstar Pay payloads.

Security rules:

- Account Admin and Billing Operator use token-based authentication.
- Payment method token references are encrypted at rest using AES-256-GCM.
- Encryption keys are managed outside the codebase.
- Northstar Pay calls use HTTPS.
- Never store secrets in plain text.

# Runtime Capabilities

Permitted tools:

- Read files inside the repository, including source, configuration, tests, `.ai/docs/`, and `.ai/planning/`.
- Write files only for the requested implementation slice, generated docs, tests, and `.ai/implementation-state.md`.
- Run local NodeJS, ExpressJS, lint, typecheck, test, migration, and package-manager commands required by the current slice.
- Use network access only for documented package registries, local development services, and Northstar Pay endpoints required by explicit acceptance criteria.
- Install packages only when the requested slice cannot be implemented with the existing stack and the dependency does not add a new service, database, queue, worker, framework, or business domain.

Prohibited actions:

- Do not write outside the repository or outside the current implementation scope.
- Do not run destructive shell commands.
- Do not push, publish, deploy, or modify shared infrastructure without explicit approval.
- Do not read, print, commit, or log payment method tokens, provider references, or Northstar Pay credentials.
- Do not modify production data directly.
- Do not persist raw card data, CVVs, or bank account credentials.

Escalate before doing:

- Add a new third-party service dependency.
- Modify CI/CD or deployment pipeline files.
- Run schema migrations that drop, rename, or rewrite existing data.
- Change package manager, framework, runtime, database, hosting target, or frozen service topology.
- Add a second service, queue, broker, cache, or worker.

# Escalation Protocol

Escalate immediately when:

- Acceptance criteria are ambiguous and valid interpretations would produce different schemas or API contracts.
- A verify command fails twice with the same non-flaky failure.
- A dependency task's output is absent, malformed, or contradicts source documents.
- Completing the task would cross a Runtime Capabilities boundary.

Escalation procedure:

1. Stop work.
2. Write `Status: blocked` to `.ai/implementation-state.md` with the specific blocker description.
3. Output a structured blocked message with the reason, last action taken, and two or three concrete resolution options.
4. Wait for user input. Do not auto-resolve.

Retry policy:

- If a verify command fails, retry once automatically and log the retry.
- If the second attempt also fails, escalate.
- Do not retry more than once without user input.

Do not escalate for:

- Minor code style choices.
- Missing documentation comments.
- Test fixtures that need to be created.
- Small implementation choices that preserve source-of-truth constraints.

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

5. Does the change affect Northstar Pay integration behavior?
   - If yes, `billing-api` owns it and the synchronous contract must remain exact.

6. Can the task be split into a smaller independently deliverable increment?
   - If yes, split it.

7. Are acceptance criteria explicit?
   - If no, write them before implementation.

8. Is the requested slice complete?
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
- invent missing requirements
- continue into extra scope without explicit instruction
- build abstractions that the current scope does not need
- never regenerate or author planning documents using any skill outside this project's .ai/planning/ structure — if replanning is needed mid-build, stop and escalate to the user rather than invoking a generic planning skill
- store raw card numbers, CVV values, or bank account credentials
- process payments asynchronously
- introduce multi-product or multi-currency billing
- build customer-facing UI or admin dashboard
- deliver notifications (email, SMS, push)
- integrate a tax engine, ERP, or accounting export
- add a second payment provider
- create shared packages or common libraries
- log sensitive payment tokens or provider references
- make billing cycle or dunning runs non-idempotent

# Definition Of Done

A task is done only when all of the following are true:

1. The requested scope is implemented and nothing extra is included.
2. The change stays inside the frozen architecture.
3. Ownership remains correct.
4. Acceptance criteria are satisfied.
5. The increment is independently deliverable.
6. Northstar Pay integration remains synchronous and compatible where applicable.
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
3. The system runs as one service: `billing-api`.
4. Payment collection is synchronous only.
5. Never store raw card data.
6. Payment tokens are encrypted at rest.
7. No queues, brokers, caches, or workers.
8. Billing cycle and dunning runs are idempotent.
9. One currency, one SaaS product.
10. Record an audit trail for every billing action.
11. Every implementation is incremental.
12. Every implementation is independently deliverable.
13. Every implementation has acceptance criteria.
14. Finish the requested slice, then stop.

# Prompt Contract

Unless explicitly overridden:

- Assume AGENTS.md is the only source of execution rules.
- Do not require repeating architecture constraints.
- Do not require repeating source-of-truth priorities.
- Do not require repeating service ownership rules.
- Every user prompt should be interpreted as an incremental task request.
- Execute only the requested scope and stop.

## Execution Protocol

These behavioral guidelines apply to every task in this project.
They are non-negotiable and take precedence over "getting things done faster."
Tradeoff: These guidelines bias toward caution over speed. For trivial tasks, use judgment — without softening the non-negotiable requirement for non-trivial work.

### 0. Resume Before Starting
Before any other action in a new session:
- Check whether `.ai/implementation-state.md` exists.
- If it exists and `Status` is not `complete`, treat the task as a continuation: read `Last completed task`, `Current phase`, and any `blocked task log`, and resume from there.
- Do not re-implement, re-plan, or re-verify work already marked complete in that file.
- Only start from scratch if the file is absent or explicitly marked `Status: complete`.

### 1. Think Before Coding
Before implementing anything:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First
Minimum code that solves the problem. Nothing speculative.
- No features beyond what the task spec asks.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.
Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes
Touch only what you must. Clean up only your own mess.
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.
- Remove only imports/variables/functions that YOUR changes made unused.
The test: Every changed line must trace directly to the task spec.

### 4. Goal-Driven Execution
Every task has a `verify:` field in `.ai/planning/`.
- Do not mark a task done until every verify condition passes.
- For multi-step work, state a brief plan with verify checkpoints before starting.
- Strong success criteria let you loop independently. If verify is unclear, ask before implementing.

Transform ad-hoc requests into verifiable goals before coding:
- "Add validation" → "Write tests for invalid inputs, then make them pass."
- "Fix the bug" → "Write a test or reproduction that fails before the fix, then make it pass."
- "Refactor X" → "Capture before/after behavior with tests, typecheck, or build evidence."

### 5. Library & Framework Docs
Always resolve current docs via Context7 before implementing with any library or framework.
- Never rely on training knowledge for library APIs — versions drift, APIs change.
- Fetch current docs via Context7 MCP before using any library.
- If Context7 has no coverage, state that explicitly before proceeding.
- If the doc contradicts your assumption, the doc wins.

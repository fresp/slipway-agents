# SaaS Billing Architecture Decisions

Version: 1.0
Status: frozen

---

# Purpose

This document contains non-negotiable architecture decisions.
These decisions are considered frozen.
AI agents and engineers must not redesign them during planning or implementation.

---

# ADR-001 Single Service Architecture

The system runs as exactly one service: `billing-api`. No additional internal services, workers, schedulers, gateways, orchestrators, admin APIs, analytics services, or notification services may be introduced. The entire billing backend — plan management, subscription lifecycle, usage metering, invoice generation, payment collection, dunning, and audit — lives in this one service.

Source: NFR-1, Constraint-1, Constraint-2

# ADR-002 Synchronous Payment Collection Only

All payment collection through Northstar Pay uses synchronous request/response calls. No asynchronous payment flows, webhook-based payment callbacks, or deferred payment processing is permitted. When `billing-api` calls Northstar Pay to authorize and capture a payment, it waits for the immediate success or failure response and updates invoice state accordingly in the same request cycle.

Source: NFR-3, Constraint-4

# ADR-003 Single Relational Database

All billing state persists in one PostgreSQL database. No additional data stores, read replicas managed by application code, caches, or secondary databases may be introduced. Cross-service database access is not applicable (single-service system), but no future service may access this database directly.

Source: NFR-4

# ADR-004 No Asynchronous Infrastructure

The system must not require a queue, message broker, event bus, cache, background worker, cron sidecar, or scheduler for the initial release. All operations — billing cycle runs, dunning retry runs, invoice generation, and payment collection — are operator-initiated and execute synchronously within the request lifecycle.

Source: NFR-5, Constraint-5, Out of Scope-12

# ADR-005 Never Store Raw Card Data

Raw card numbers, CVV values, and bank account credentials must never be stored in any table, log, or temporary file. `billing-api` stores only the payment method token reference provided by Northstar Pay. This is a hard security boundary with no exceptions.

Source: NFR-7

# ADR-006 Payment Token Encryption at Rest

The stored payment method token reference must be encrypted at rest using AES-256-GCM. Encryption keys are managed outside the codebase (environment variables or a secrets manager). The application must never log, print, or transmit the decrypted token value in plaintext outside of the Northstar Pay API call context.

Source: NFR-6

# ADR-007 Idempotent Billing and Dunning Runs

Operator-triggered billing cycle runs and dunning retry runs must be idempotent for the same target period or invoice eligibility set. Running the billing cycle for the same date range twice must not generate duplicate invoices. Running the dunning retry for the same eligibility window twice must not create duplicate payment attempts for the same invoice.

Source: NFR-9

# ADR-008 Structured Logging with Sensitive Data Exclusion

All logs must use structured fields (JSON or equivalent). Logs must exclude sensitive payment token values, provider references, raw card data, and Northstar Pay credentials. Log entries must include sufficient context (timestamp, service, operation, entity IDs) for debugging without exposing sensitive data.

Source: NFR-10

# ADR-009 Audit Trail for State Changes

`billing-api` must record an audit trail entry for every state-changing billing action: plan created/updated, subscription created/updated/cancelled/reactivated, usage event recorded, invoice generated, payment attempted, payment retried, and payment method token reference updated. Audit records must be queryable by invoice ID and subscription ID.

Source: FR-010, NFR-8

# ADR-010 Single External Dependency

The only external system in scope is Northstar Pay. No other third-party services, APIs, payment providers, tax engines, ERP systems, accounting exports, or notification providers may be integrated. Northstar Pay is called synchronously via HTTPS only.

Source: Constraint-3, Out of Scope-11

# ADR-011 One Currency, One SaaS Product

The first release supports exactly one currency and one SaaS product. Multi-currency pricing and multi-product billing are permanently out of scope. No currency conversion logic, product catalog abstraction, or multi-tenant billing partitioning may be introduced.

Source: Constraint-8, Constraint-9, Out of Scope-1, Out of Scope-2

# ADR-012 Out of Scope Items Are Permanently Forbidden

The following are permanently out of scope and must never be built: multi-product billing, multi-currency pricing, proration for mid-cycle plan changes, coupons/credits/promotional discounts, refund processing, chargeback/dispute workflows, revenue recognition, email/SMS/push notifications, customer self-service UI or admin dashboard, separate metering/analytics/data warehouse pipelines, multiple payment providers, and any queue/broker/cache/worker/second internal service.

Source: Out of Scope-1 through Out of Scope-12

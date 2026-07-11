# SaaS Billing Technical Architecture

Version: 1.0
Status: frozen

---

# 1. Architecture Overview

SaaS Billing is a minimal billing backend for a single SaaS product. It provides subscription plan management, usage metering, invoice generation, synchronous payment collection via Northstar Pay, and a dunning retry flow for failed payments.

The architecture consists of 1 service.

- `billing-api`

No additional services may be introduced without explicit approval.

---

# 2. Architecture Principles

## AP-001 Single Service Boundary

All billing logic — plan catalog, subscription lifecycle, usage metering, invoice generation, payment collection, dunning, and audit — resides in `billing-api`. No capability may be extracted into a separate service, worker, or sidecar. (ADR-001)

## AP-002 Synchronous Execution Only

Every operation executes synchronously within the HTTP request lifecycle. Billing cycle runs, dunning retry runs, and payment collection do not use queues, background jobs, or deferred processing. (ADR-004)

## AP-003 Single Data Store

All persistent state lives in one PostgreSQL database owned by `billing-api`. No other service or process may read from or write to this database. (ADR-003)

## AP-004 External System Is Synchronous and Singular

The only external integration is Northstar Pay, called via HTTPS with synchronous request/response. No webhook receivers, callback endpoints, or async payment flows exist. (ADR-002, ADR-010)

---

# 3. Architectural Separation

This section is not applicable. The system is a single-service architecture with no meaningful plane separation.

---

# 4. High Level Architecture

## Billing Cycle Run
`Billing Operator` → `billing-api` → `PostgreSQL` → `Northstar Pay`

## Dunning Retry Run
`Billing Operator` → `billing-api` → `PostgreSQL` → `Northstar Pay`

## Subscription Management
`Account Admin` → `billing-api` → `PostgreSQL`

## Invoice Retrieval
`Account Admin` / `Billing Operator` → `billing-api` → `PostgreSQL`

---

# 5. Service Responsibilities

## billing-api
Purpose: Manages the complete billing lifecycle for a single SaaS product including plans, subscriptions, usage, invoices, payments, dunning, and audit trail.
Responsibilities: Plan catalog management, subscription lifecycle management, usage metering, invoice generation, invoice retrieval, payment collection via Northstar Pay, billing cycle run orchestration, dunning state tracking and retry runs, payment method token management, billing audit trail.
`billing-api` must never store raw card data, process payments asynchronously, manage multiple products or currencies, deliver notifications, or integrate with systems other than Northstar Pay.

---

# 6. Service Communication

| Source | Destination | Protocol |
|---|---|---|
| billing-api | Northstar Pay | HTTPS (synchronous) |
| billing-api | PostgreSQL | TCP/TLS (connection pool) |

---

# 7. Retry Architecture

Dunning retries follow a fixed schedule for failed payment attempts:

| Retry | Delay After Failed Attempt |
|---|---|
| Retry 1 | 3 days |
| Retry 2 | 7 days |
| Retry 3 | 14 days |

After the third failed retry, the invoice is marked `uncollectible`. Retries are operator-initiated (not automatic/cron-based). Manual retries by Account Admin bypass the schedule for a specific invoice.

---

# 8. Security Architecture

Authentication: Token-based authentication for Account Admin and Billing Operator roles. Tokens are validated on every API request.
Authorization: Role-based — Account Admin accesses own account's subscriptions/invoices; Billing Operator accesses all billing operations.
Encryption: Payment method token references are encrypted at rest using AES-256-GCM. Encryption keys are managed outside the codebase via environment variables.
Data protection: Raw card data, CVV values, and bank credentials are never stored. Northstar Pay calls use HTTPS.

---

# 9. Environment Strategy

Supported environments: development, production.
Environment variables use the `BILLING_` prefix.

---

# 10. Scalability Strategy

`billing-api` is a single service. Horizontal scaling is achieved by running multiple instances behind a load balancer. The service must remain stateless — all state lives in PostgreSQL. Database connection pooling is required for multi-instance deployments.

---

# 11. Architecture Constraints

Do not create: additional services, workers, schedulers, queues, brokers, caches, notification services, analytics services, admin APIs, gateways, orchestrators, customer-facing UI, multi-product billing logic, multi-currency conversion, tax engine integrations, ERP sync, accounting export, or multiple payment provider integrations.
Architecture is frozen.

# SaaS Billing Engineering Standards

Version: 1.0
Status: frozen

---

# 1. Purpose

This document defines implementation constraints.

Its objective is to ensure all engineers and AI agents build the platform consistently.

When conflicts occur:
Architecture Decisions > Technical Architecture > Engineering Standards

---

# 2. Technology Stack

Backend: NodeJS, ExpressJS, CommonJS
Frontend: N/A
Data layer / infrastructure: PostgreSQL
Do not introduce alternative technologies without approval.

---

# 3. Service Independence

The platform consists of 1 independent service:

billing-api

Each service:
- Owns its own dependencies
- Owns its own configuration
- Owns its own startup
- May not access another service's database

---

# 4. Shared Package Policy

Do not create: packages/, shared/, common/, libs/, core/
Do not centralize business logic. Prefer small duplication over shared abstractions.

---

# 5. Environment Variables

Prefix: `BILLING_`
All environment variables must use this prefix.
Never hardcode credentials, secrets, or external URLs.

---

# 6. API Rules

Use REST only.
Do not introduce GraphQL, gRPC, or webhook-based payment flows.
billing-api owns all billing APIs.

---

# 7. Authentication Rules

Token-based authentication: Account Admin and Billing Operator authenticate using bearer tokens passed in the Authorization header. Tokens are validated on every request.
Never store raw tokens in logs or database.

---

# 8. Data Rules

Northstar Pay is source of truth for payment authorization and capture results.
Persist: plans, subscriptions, usage events, invoices, invoice line items, payment attempts, audit logs.
Never persist: raw card numbers, CVV values, bank account credentials, raw Northstar Pay payloads.

---

# 9. Logging Rules

Use structured logs (JSON format).
Every log must contain: timestamp, service name, log level, message, operation name, entity IDs.
Never log: payment method token values, provider references, raw card data, Northstar Pay credentials, encryption keys.

---

# 10. Security Rules

Payment method token references are encrypted at rest using AES-256-GCM. Encryption keys are managed via environment variables (BILLING_ENCRYPTION_KEY) and must never be committed to source control.
Northstar Pay API calls use HTTPS. Certificate validation must not be disabled.
Never store secrets in plain text.

---

# 11. Testing Standards

N/A — testing requirements not specified in PRD.

---

# 12. Development Philosophy

Prefer: Simple > Complex, Explicit > Abstract, Duplicate > Shared, Stable > Clever.
Avoid over-engineering.

---

# 13. Frozen Rules

The following are architecture violations:

❌ Additional services, workers, schedulers, or sidecars
❌ Queues, brokers, caches, or event buses
❌ Asynchronous payment flows or webhook-based payment callbacks
❌ Multiple payment providers
❌ Multi-product or multi-currency billing logic
❌ Raw card data storage
❌ Customer-facing UI or admin dashboard
❌ Notification delivery (email, SMS, push)
❌ Shared packages or internal frameworks
❌ GraphQL, gRPC, or non-REST API protocols

Engineering standards are frozen.

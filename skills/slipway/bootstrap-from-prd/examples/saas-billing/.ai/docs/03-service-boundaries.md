# SaaS Billing Service Boundaries

Version: 1.0
Status: frozen

---

# 1. Purpose

This document defines service ownership boundaries.

The objective is to prevent:
- God services
- Responsibility duplication
- Circular dependencies
- Scope creep
- Over-engineering

Each service owns its own domain and responsibilities.
Services may communicate with each other but may never take ownership of another service's business logic.

---

# 2. Service Landscape

The platform consists of 1 service.

- `billing-api`

---

# 3. billing-api

Purpose: Manages the complete billing lifecycle for a single SaaS product.

Owns:
- Plan catalog management (FR-001)
- Subscription lifecycle management (FR-002)
- Usage metering (FR-003)
- Invoice generation (FR-004)
- Invoice retrieval (FR-005)
- Payment collection via Northstar Pay (FR-006)
- Billing cycle run orchestration (FR-007)
- Dunning state tracking and retry runs (FR-008)
- Payment method token management (FR-009)
- Billing audit trail (FR-010)

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

---

# 4. Cross-Service Rules

- Not applicable (single-service system).
- Communication with Northstar Pay happens through HTTPS synchronous calls only.
- No cross-service database access.
- No duplicated ownership.
- No hidden coupling.

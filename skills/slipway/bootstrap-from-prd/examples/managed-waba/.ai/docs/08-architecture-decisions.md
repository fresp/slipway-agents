# Managed WABA Platform Architecture Decisions

Version: 1.1

Status: Frozen

---

# Purpose

This document contains non-negotiable architecture decisions.
These decisions are considered frozen.
AI agents and engineers must not redesign them during planning or implementation.

---

# ADR-001 Product Positioning
Managed WABA Platform is a BSP-grade transparent proxy platform. The platform is an operational layer around Meta. The platform is not a Meta replacement.

# ADR-002 Meta Is Source Of Truth
Meta owns all business states. The platform must never create its own business state.
Examples: Quality Rating, Messaging Limits, Verification Status, Template Status.

# ADR-003 Meta Compatibility Is Mandatory
meta-api must preserve Meta payloads, responses, headers, and behavior.
The platform must never transform payloads, wrap responses, or modify Meta behavior.

# ADR-004 Service Landscape Is Frozen
The platform consists of exactly five services: portal, platform-api, meta-api, webhook-worker, retry-worker. No additional services may be introduced without explicit approval.

# ADR-005 Control Plane And Data Plane Separation
Control Plane: portal, platform-api
Data Plane: meta-api, webhook-worker, retry-worker
These responsibilities must remain separated.

# ADR-006 Embedded Signup Ownership
Embedded Signup belongs to platform-api. Synchronization must happen automatically after a successful signup.

# ADR-007 Runtime Meta Traffic Ownership
All runtime Meta traffic belongs to meta-api. No other service may process runtime Meta traffic.

# ADR-008 Authentication Separation
Portal authentication: JWT, Refresh Token
Machine authentication: Authorization: Bearer {access_token}
Access Tokens are opaque tokens. JWT must never be used for machine authentication.

# ADR-009 Phone Number Ownership
Relationship: 1 Phone Number ↓ 1 Access Token ↓ 1 Webhook Target.
The platform does not support multiple Access Tokens or Webhooks per number.

# ADR-010 Billing Scope
Billing is strictly out of system scope. Klien tidak memiliki akses ke tagihan atau modul top-up melalui portal ini. Seluruh manajemen finansial terisolasi dan dilakukan secara langsung melalui Meta Business Suite / Facebook Business Manager (FBM).

# ADR-011 Retry Strategy
Retry schedule: Immediate, 1 minute, 5 minutes, 15 minutes, 1 hour. After attempt 5: DLQ.

# ADR-012 Webhook Delivery Strategy
Webhook delivery is asynchronous. Synchronous forwarding is forbidden.

# ADR-013 Data Persistence Strategy
Persist metadata only. Never persist message bodies or media. Inbound payloads only exist in webhook_events.

# ADR-014 Shared Packages Are Forbidden
Do not create packages/, shared/, common/, libs/, core/. Prefer duplication over premature abstraction.

# ADR-015 Scope Is Frozen
Do not introduce: CRM, Omnichannel, Chatbot, Campaign Management, Workspace Management, Multi User Management.

# ADR-016 Infrastructure Ownership
Infrastructure topology and CI/CD are out of scope. Managed by another DevOps team.

# ADR-017 Technology Stack Is Frozen
Backend: NodeJS, ExpressJS, CommonJS. Frontend: React, Vite. Data Layer: MongoDB, Redis, RabbitMQ.

# ADR-018 Architecture Is Frozen
AI agents and engineers must not redesign service boundaries, runtime flows, authentication flows, data ownership, or Meta ownership. Follow existing documentation.
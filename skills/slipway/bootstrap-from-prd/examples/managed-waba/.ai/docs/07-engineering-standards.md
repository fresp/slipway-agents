# Managed WABA Platform Engineering Standards

Version: 1.1

Status: Frozen

---

# 1. Purpose

This document defines implementation constraints.

Its objective is to ensure all engineers and AI agents build the platform consistently.
When conflicts occur:
Architecture Decisions > Technical Architecture > Engineering Standards

---

# 2. Technology Stack

Backend: NodeJS, ExpressJS, CommonJS
Frontend: React, Vite
Infrastructure Components: MongoDB, Redis, RabbitMQ
Do not introduce alternative technologies without approval.

---

# 3. Service Independence

The platform consists of five independent services:
portal, platform-api, meta-api, webhook-worker, retry-worker.
Every service must be independently deployable.
Every service must:
- Own its own dependencies
- Own its own configuration
- Own its own startup process
No hidden coupling is allowed.

---

# 4. Shared Package Policy

Do not create:
packages/, shared/, common/, libs/, core/
Do not centralize business logic. Prefer small duplication over shared abstractions.
Duplication is acceptable. Premature abstraction is forbidden.

---

# 5. Environment Variable Rules

All environment variables must use:
CLOUDWA_
Examples: CLOUDWA_PORT, CLOUDWA_MONGO_URI, CLOUDWA_REDIS_URI, CLOUDWA_RABBITMQ_URI, CLOUDWA_JWT_SECRET
Avoid generic names like PORT or JWT_SECRET.

---

# 6. API Rules

Use REST only.
Do not introduce: GraphQL, gRPC, BFF.
platform-api owns operational APIs.
meta-api owns Meta traffic APIs.

---

# 7. Authentication Rules

Portal authentication: JWT, Refresh Token
Meta API authentication: Authorization: Bearer {access_token}
Access Token rules: Opaque token, One token per phone number, No automatic expiration, Manual regeneration, Manual disable.
Never store raw tokens.

---

# 8. Data Rules

Meta is source of truth.
Persist metadata only.
Never persist: Message body, Contacts, Media binaries, Interactive payloads, Attachments, Locations.
Inbound payloads only exist in: webhook_events

---

# 9. Queue Rules

RabbitMQ is an event transport mechanism.
Allowed exchanges: cloudwa.events, cloudwa.retry, cloudwa.dlq
Do not create additional exchanges without approval.

---

# 10. Logging Rules

Use structured logs.
Every log must contain: timestamp, service, trace_id, level, message.
Never log: Passwords, Access Tokens, Secrets, Meta Credentials.

---

# 11. Security Rules

Credentials must be encrypted.
Algorithm: AES-256-GCM
Key Management: Alibaba Cloud KMS
Webhook Signing: X-CLOUDWA-SIGNATURE (HMAC SHA256)
Never store secrets in plain text.

---

# 12. Runtime Rules

meta-api must:
- Preserve Meta payloads
- Preserve Meta responses
- Preserve Meta headers
Never: Wrap responses, Transform payloads, Modify Meta behavior.

---

# 13. Worker Rules

webhook-worker and retry-worker must remain stateless.
Workers must not: Own business logic, Update WABA state, Access Meta directly.
Workers only process events.

---

# 14. Development Philosophy

Prefer: Simple > Complex, Explicit > Abstract, Duplicate > Shared, Stable > Clever.
Avoid over engineering.

---

# 15. Forbidden Scope

Do not introduce: CRM, Omnichannel, Chatbot, Campaign Management, Workspace Management, Multi User Management.
Do not introduce additional services without approval.

---

# 16. Frozen Rules

The following are architecture violations.
❌ Shared packages
❌ Cross-service database access
❌ Additional services
❌ Meta payload transformations
❌ Meta response wrapping
❌ Premature abstractions

Engineering standards are frozen.
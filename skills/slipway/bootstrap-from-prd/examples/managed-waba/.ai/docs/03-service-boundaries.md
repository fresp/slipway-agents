# Managed WABA Platform Service Boundaries

Version: 1.2

Status: Frozen

---

# 1. Purpose

This document defines service ownership boundaries.

The objective is to prevent:
* God services
* Responsibility duplication
* Circular dependencies
* Scope creep
* Over engineering

Each service owns its own domain and responsibilities.
Services may communicate with each other but may never take ownership of another service's business logic.

---

# 2. Service Landscape

The platform consists of five services.
portal
platform-api
meta-api
webhook-worker
retry-worker

---

# 3. Ownership Principles

Every service may:
* Own its own business logic
* Own its own data access
* Own its own configurations

Every service may not:
* Own another service's business logic
* Directly access another service's database
* Duplicate another service's responsibility

Communication must happen through HTTPS or RabbitMQ.

---

# 4. portal

Purpose: Provide operational user interfaces. portal is a presentation layer only.
Owns: Authentication UI, Overview UI, Embedded Signup UI, WABA UI, Security UI, Settings UI.
Does Not Own: Authentication logic, Business logic, Database access, Meta integrations, Queue processing, Retry processing.
Dependencies: platform-api
Internal Modules: auth, layout, overview, wabas, security, settings

---

# 5. platform-api

Purpose: Dashboard backend and operational control plane.
Owns: Authentication, Session Management, Embedded Signup, WABA Synchronization, Phone Number Synchronization, Access Token Management, Webhook Configuration, Audit Logs, Settings, Dashboard Aggregations.
Does Not Own: Meta Runtime Traffic, Send Message, Webhook Delivery, Retry Processing.
Meta Communication Boundary: Embedded Signup, WABA Synchronization, Phone Number Synchronization.
Dependencies: MongoDB, Redis, Alibaba Cloud KMS, Meta Embedded Signup
Internal Modules: auth, sessions, embedded-signup, wabas, phone-numbers, access-tokens, webhook-configs, audit-logs, settings, dashboard

---

# 6. meta-api

Purpose: Runtime Meta traffic engine. Preserves Meta compatibility. Protected service.
Owns: Transparent Meta Proxy, Meta Webhook Receiver, Metadata Persistence.
Does Not Own: Authentication, Embedded Signup, Audit Logs, Settings, Dashboard Logic.
Dependencies: Meta Graph API, MongoDB, RabbitMQ
Internal Modules: proxy, webhooks, metadata
Runtime Ownership: All runtime traffic must go through meta-api (Send Message, Media, Templates, etc).

---

# 7. webhook-worker

Purpose: Webhook delivery engine.
Owns: Webhook Forwarding, Payload Signing, Delivery Tracking.
Does Not Own: Authentication, Meta Proxy, Retry Scheduling, Webhook Configuration.
Dependencies: RabbitMQ, MongoDB, Customer Endpoint
Internal Modules: delivery, publisher, signing, tracking

---

# 8. retry-worker

Purpose: Retry engine.
Owns: Retry Scheduling, Retry Processing, Dead Letter Processing.
Does Not Own: Authentication, Meta Proxy, Webhook Configuration.
Dependencies: RabbitMQ, MongoDB
Internal Modules: scheduler, retry, dead-letter

---

# 9. Service Communication Matrix

(Refer to Technical Architecture document for matrix)

---

# 10. Data Ownership

platform-api Owns:
users, sessions, wabas, phone_numbers, credentials, access_tokens, webhook_configs, audit_logs

meta-api Owns:
messages, message_status_logs, webhook_events, webhook_deliveries

portal, webhook-worker, retry-worker Own: Nothing.

---

# 11. Sacred Rules

Rule 1: portal must remain UI only.
Rule 2: platform-api must never become a god service.
Rule 3: meta-api must preserve Meta compatibility.
Rule 4: Workers must remain stateless.
Rule 5: No cross-service database access.
Rule 6: No shared packages.
Rule 7: No additional services without explicit approval.

---

# 12. Architecture Violations

❌ portal calling Meta directly
❌ platform-api sending WhatsApp messages
❌ platform-api processing runtime traffic
❌ retry-worker accessing Meta
❌ webhook-worker updating WABA state
❌ shared business logic package
❌ common utility package
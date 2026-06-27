# Managed WABA Platform Operational Flows

Version: 1.2

Status: Frozen

---

# 1. Purpose

This document defines operational contracts.

It describes:
- Triggers
- Ownership
- Outcomes
- Runtime constraints

Visual diagrams are defined in:
09-topology-and-architecture-diagrams.md

---

# 2. Authentication Flow

Purpose: Authenticate portal users.
Owner: platform-api
Trigger: Portal login request.
Outcome:
- Generate JWT
- Generate Refresh Token
- Create session

---

# 3. Embedded Signup Flow

Purpose: Connect a Meta Business Account.
Owner: platform-api
Trigger: User initiates Embedded Signup from portal.
Outcome:
- Launch Embedded Signup
- Synchronize WABAs
- Synchronize Phone Numbers
- Persist metadata

Rules:
- Synchronization is automatic
- Manual synchronization is not required

---

# 4. WABA Synchronization Flow

Purpose: Synchronize Meta WABAs.
Owner: platform-api
Trigger: Successful Embedded Signup.
Outcome:
- Fetch WABAs
- Persist WABAs
- Update dashboard

Rules: Meta is source of truth.

---

# 5. Phone Number Synchronization Flow

Purpose: Synchronize phone numbers.
Owner: platform-api
Trigger: Successful WABA synchronization.
Outcome: Persist verified_name, quality_rating, messaging_limit, status.
Rules: Meta is source of truth.

---

# 6. Access Token Flow

Purpose: Generate machine credentials.
Owner: platform-api
Trigger: User generates a token from portal.
Outcome: Generate token, Hash token, Persist hash, Display token once.
Rules: Never store raw token, Regeneration invalidates previous token.

---

# 7. Runtime API Flow

Purpose: Process Meta runtime traffic.
Owner: meta-api
Trigger: External client requests.
Outcome:
- Validate Access Token
- Resolve Phone Number
- Forward request to Meta
- Persist metadata
- Return Meta response

Rules: Preserve payload, headers, query parameters, response.

---

# 8. Inbound Webhook Flow

Purpose: Receive Meta webhooks.
Owner: meta-api
Trigger: Meta sends webhook events.
Supported events: messages, message_statuses, template_updates, phone_number_updates, quality_updates, calling_events, future Meta webhook events.
Outcome: Persist webhook_events, Publish RabbitMQ event.
Rules: Async processing only, No business processing.

---

# 9. Webhook Delivery Flow

Purpose: Forward webhook payloads.
Owner: webhook-worker
Trigger: RabbitMQ event received.
Outcome: Resolve webhook configuration, Generate signature, Forward payload, Persist delivery result.
Rules: Preserve original payload, Preserve original structure.

---

# 10. Retry Flow

Purpose: Retry failed deliveries.
Owner: retry-worker
Trigger: Failed webhook delivery.
Outcome: Republish webhook events.
Schedule: Immediate, 1 minute, 5 minutes, 15 minutes, 1 hour.
After final attempt: DLQ

---

# 11. Audit Flow

Purpose: Track operational activities.
Owner: platform-api
Outcome: Persist audit logs.
Examples: Login, Embedded Signup, Disconnect WABA, Generate Token, Regenerate Token, Disable Token, Update Webhook.

---

# 12. WABA Disconnect Flow

Purpose: Disconnect WABA.
Owner: platform-api
Outcome: Set status=disconnected.
Rules: Soft delete only, Preserve historical records.

---

# 13. Error Handling Rules

Embedded Signup: Stop process, Do not persist partial data.
meta-api: Return Meta errors as-is.
Webhook Delivery: Publish retry event.
Retry Flow: Publish to DLQ.

---

# 14. Operational Constraints

Never:
- Transform Meta payloads
- Wrap Meta responses
- Persist message content
- Persist media content
- Duplicate ownership

Operational flows are frozen.
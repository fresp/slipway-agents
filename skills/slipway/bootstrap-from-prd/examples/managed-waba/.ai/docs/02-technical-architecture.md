# Managed WABA Platform Technical Architecture

Version: 1.2

Status: Frozen

---

# 1. Architecture Overview

Managed WABA Platform is a BSP-grade transparent proxy platform built on top of Meta WhatsApp Business Platform.

The architecture separates operational concerns from Meta runtime traffic.

The platform is intentionally designed to remain simple, maintainable, and horizontally scalable.

The architecture consists of five services.

portal
platform-api
meta-api
webhook-worker
retry-worker

No additional services may be introduced without explicit approval.

---

# 2. Architecture Principles

## AP-001 Meta Is Source Of Truth

Meta owns all business states.
The platform must never create its own business state.

Examples:
* Quality Rating
* Messaging Limits
* Verification Status
* Template Status

These values must always originate from Meta.

---

## AP-002 Meta Compatibility Is Mandatory

The platform must preserve 100% Meta compatibility.

Clients should only replace the base URL.
From: `https://graph.facebook.com`
To: `https://api.company.com`

Payloads, responses, and behaviors must remain identical.

---

## AP-003 Transparent Proxy

meta-api acts as a transparent proxy.

The platform must never:
* Transform payloads
* Wrap responses
* Modify Meta behavior

---

## AP-004 Simplicity First

Favor simple implementations over abstractions.

Avoid:
* Premature optimizations
* Unnecessary services
* Complex internal frameworks

---

## AP-005 Meta Communication Boundary

Only platform-api and meta-api may communicate with Meta.

platform-api communication is strictly limited to:
* Embedded Signup
* WABA Synchronization
* Phone Number Synchronization

All runtime traffic must go through meta-api.

---

# 3. Control Plane & Data Plane

The architecture is divided into two planes.

## Control Plane

Services:
portal
platform-api

Responsibilities:
* User interactions
* Authentication
* Configuration
* Dashboard management
* Embedded Signup orchestration

---

## Data Plane

Services:
meta-api
webhook-worker
retry-worker

Responsibilities:
* Runtime Meta traffic
* Meta webhook processing
* Event processing
* Retry mechanisms

---

# 4. High Level Architecture

## Dashboard Flow
Portal → platform-api → MongoDB

## Embedded Signup Flow
Portal → platform-api → Meta Embedded Signup → Auto Sync WABA → Auto Sync Phone Numbers → MongoDB

## External Client Flow
External Client → meta-api → Meta Graph API

## Webhook Flow
Meta → meta-api → RabbitMQ → webhook-worker → Customer Endpoint

## Retry Flow
webhook-worker → RabbitMQ → retry-worker → RabbitMQ → webhook-worker

---

# 5. Service Responsibilities

## portal
Purpose: Operational user interface.
Responsibilities: Authentication UI, Embedded Signup UI, Overview UI, WABA UI, Security UI, Settings UI.
portal must never contain business logic.

## platform-api
Purpose: Operational control plane.
Responsibilities: Authentication, Session Management, Embedded Signup, WABA Synchronization, Phone Number Synchronization, Access Token Management, Webhook Configuration, Audit Logs, Settings, Dashboard Aggregations.
platform-api must never process Meta runtime traffic.

## meta-api
Purpose: Runtime Meta traffic engine.
Responsibilities: Transparent Meta Proxy, Meta Webhook Receiver, Metadata Persistence.
meta-api is a protected service. Any change affecting Meta compatibility must be reviewed carefully.

## webhook-worker
Purpose: Webhook delivery engine.
Responsibilities: Webhook Forwarding, Payload Signing, Delivery Tracking.
webhook-worker must remain stateless.

## retry-worker
Purpose: Retry engine.
Responsibilities: Retry Scheduling, Retry Processing, Dead Letter Processing.
retry-worker must remain stateless.

---

# 6. Service Communication

| Source         | Destination       | Protocol |
| -------------- | ----------------- | -------- |
| portal         | platform-api      | HTTPS    |
| platform-api   | Meta              | HTTPS    |
| meta-api       | Meta Graph API    | HTTPS    |
| meta-api       | RabbitMQ          | AMQP     |
| webhook-worker | Customer Endpoint | HTTPS    |
| retry-worker   | RabbitMQ          | AMQP     |

---

# 7. Meta Proxy Architecture

meta-api is a generic transparent proxy.
Supported pattern: `/v{version}/{any_path}`

The platform must automatically support future Meta endpoints whenever possible.

---

# 8. Webhook Architecture

Rules:
* Preserve original payload
* Sign payload before forwarding
* Track delivery attempts
* Never modify Meta payload

---

# 9. Queue Architecture

Exchanges:
cloudwa.events
cloudwa.retry
cloudwa.dlq

Routing Keys:
webhook.publish
webhook.retry
webhook.failed

Queues:
webhook.publish.queue
webhook.retry.queue
webhook.dlq.queue

---

# 10. Retry Architecture

Retry schedule:
Attempt 1 = Immediate
Attempt 2 = 1 minute
Attempt 3 = 5 minutes
Attempt 4 = 15 minutes
Attempt 5 = 1 hour
After attempt 5 = DLQ

---

# 11. Security Architecture

Portal Authentication: JWT, Refresh Token
Meta API Authentication: Authorization: Bearer {access_token}
Webhook Signing: X-CLOUDWA-SIGNATURE (HMAC SHA256)
Encryption: Alibaba Cloud KMS (AES-256-GCM)

---

# 12. Environment Strategy

Supported environments: development, staging, production

---

# 13. Scalability Strategy

The following services must support horizontal scaling: portal, platform-api, meta-api, webhook-worker, retry-worker.
Workers must remain stateless.

---

# 14. Architecture Constraints

Do not create: CRM, Omnichannel, Chatbot, Campaign Management, Workspace Management, Multi User Management, Internal Monitoring Engine, Shared packages, Common packages, Additional services.
Architecture is frozen.
# Managed WABA Platform Product Requirement Document (PRD)

Version: 1.1

Status: Frozen

---

# 1. Overview

Managed WABA Platform is a BSP-grade transparent proxy platform built on top of Meta WhatsApp Business Platform.

The platform preserves 100% Meta compatibility while adding operational capabilities required to manage WhatsApp Business Accounts (WABA) at scale.

The platform does not alter Meta behavior.

The platform does not replace Meta Business Suite.

The platform acts as an operational layer around Meta services.

---

# 2. Product Goal

Build a maintainable BSP-grade SaaS platform that:

* Preserves Meta compatibility
* Simplifies WABA management
* Provides operational visibility
* Provides API access management
* Provides webhook management

The platform must remain simple and maintainable.

---

# 3. Product Positioning

## This Product IS

* Transparent BSP Proxy
* Managed WABA Platform
* Operational Platform

## This Product IS NOT

* CRM
* Omnichannel Platform
* Chatbot Platform
* Campaign Management Platform
* Customer Engagement Platform
* Meta Business Suite Replacement

---

# 4. Product Scope

## Supported

Single User

Multiple WABA

Multiple Phone Numbers

1 Phone Number = 1 API Key

1 Phone Number = 1 Webhook Target

---

# 5. User Journey

The expected user journey is:

Connect Meta Business
↓
Embedded Signup
↓
Sync WABA
↓
Sync Phone Numbers
↓
Configure Webhook
↓
Obtain API Key
↓
Start Sending Traffic

---

# 6. Functional Requirements

## FR-001 Authentication

The platform must provide authentication for portal access.

Capabilities:

* Email login
* Password login
* JWT authentication
* Refresh token support

---

## FR-002 Embedded Signup

The platform must support Meta Embedded Signup.

Flow:

Portal
↓
Platform API
↓
Meta Embedded Signup
↓
Platform API
↓
Auto Sync WABA
↓
Auto Sync Phone Numbers
↓
Persist Metadata

The synchronization process must happen automatically after a successful Embedded Signup flow.

The platform must not modify Embedded Signup behavior.

---

## FR-003 WABA Management

The platform must manage multiple WABAs.

Capabilities:

* List WABAs
* Sync WABAs
* View WABA details
* Disconnect WABA

Disconnection behavior:

Soft delete only.

The WABA remains persisted with:

status=disconnected

Historical data must be preserved.

---

## FR-004 Phone Number Management

The platform must manage phone numbers under each WABA.

Capabilities:

* List phone numbers
* View phone number details
* View quality rating
* View messaging limits
* View verification status

All information must originate from Meta.

---

## FR-005 API Key Management

Every phone number owns exactly one API Key.

Relationship:

1 Phone Number
↓
1 API Key

Capabilities:

* Generate API Key
* View API Key
* Regenerate API Key
* Disable API Key

Multiple API Keys are not supported.

---

## FR-006 Webhook Management

Every phone number owns exactly one webhook target.

Relationship:

1 Phone Number
↓
1 Webhook Target

Capabilities:

* Configure webhook URL
* Configure webhook secret
* Enable webhook
* Disable webhook

Multiple webhooks are not supported.

---

## FR-007 Meta Proxy

The platform must provide a transparent Meta API proxy.

The proxy must preserve Meta compatibility.

Capabilities:

* Forward requests
* Forward responses
* Forward errors

The platform must never:

* Transform payloads
* Wrap responses
* Modify Meta behavior

---

## FR-008 Webhook Delivery

The platform must asynchronously deliver webhook events.

Flow:

Meta
↓
meta-api
↓
RabbitMQ
↓
webhook-worker
↓
Customer Endpoint

Capabilities:

* Forward payload
* Sign payload
* Track delivery attempts

The original Meta payload must remain intact.

---

## FR-009 Retry Mechanism

The platform must retry failed webhook deliveries.

Retry Schedule:

Attempt 1: Immediate
Attempt 2: 1 minute
Attempt 3: 5 minutes
Attempt 4: 15 minutes
Attempt 5: 1 hour

After attempt 5:
↓
DLQ

Success criteria:
HTTP 200-299

Failure criteria:
Anything outside HTTP 200-299

---

## FR-010 Audit Logs

The platform must track operational actions.

Examples:

* Login
* Embedded Signup
* WABA Connection
* API Key Regeneration
* Webhook Updates
* Settings Updates

---

# 7. Portal Modules

The portal must contain:

Overview
WABA
Security
Settings

---

# 8. Environment Strategy

Supported environments:

development
staging
production

---

# 9. Product Constraints

The following constraints are mandatory.

Meta is source of truth.
100% Meta compatibility is mandatory.
1 Phone Number = 1 API Key.
1 Phone Number = 1 Webhook Target.
Dashboard (Portal) is an operational layer.
Avoid over engineering.
Avoid premature abstractions.

---

# 10. Non Goals

The following features are explicitly out of scope.

CRM
Omnichannel
Chatbot
Campaign Management
Workspace Management
Multi User Management
Analytics Engine
Internal Monitoring Engine

---

# 11. Success Criteria

The product is considered successful if:

* A user can connect WABA via Embedded Signup
* WABAs synchronize correctly
* Phone Numbers synchronize correctly
* API requests remain Meta compatible
* Webhooks are delivered successfully
* Retry mechanisms function correctly
* Operational actions are audited

---

# 12. Product Status

Architecture Status: Frozen
Future features may only be introduced after v1 completion.
# Managed WABA Platform API Specifications

Version: 1.2

Status: Frozen

---

# 1. Purpose

This document defines API ownership and contracts.

This document is not an OpenAPI specification.

---

# 2. API Domains

Control Plane:
platform-api

Data Plane:
meta-api

---

# 3. Authentication

## Portal Authentication

Used by:
portal → platform-api

Header:
Authorization: Bearer {jwt}

---

## Meta Authentication

Used by:
Client → meta-api

Header:
Authorization: Bearer {access_token}

Token type:
Opaque Token

---

# 4. platform-api Endpoints

Base URL:
/api

---

## Authentication

POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
GET /api/auth/me

---

## Embedded Signup

POST /api/embedded-signup/connect
POST /api/embedded-signup/sync

Rules:
* Auto sync WABA
* Auto sync Phone Numbers

---

## WABAs

GET /api/wabas
GET /api/wabas/:id
POST /api/wabas/:id/disconnect

---

## Phone Numbers

GET /api/phone-numbers
GET /api/phone-numbers/:id

---

## Access Tokens

GET /api/access-tokens/:phoneNumberId
POST /api/access-tokens/:phoneNumberId/generate
POST /api/access-tokens/:phoneNumberId/regenerate
POST /api/access-tokens/:phoneNumberId/disable

---

## Webhooks

GET /api/webhooks/:phoneNumberId
PUT /api/webhooks/:phoneNumberId

---

## Dashboard Metrics

GET /api/dashboard/metrics

---

## Audit Logs

GET /api/audit-logs

---

## Settings

GET /api/settings
PUT /api/settings

---

# 5. meta-api Endpoints

Base URL:
/

Pattern:
/v{version}/{any_path}

Examples:
POST /v23.0/{phone_number_id}/messages
GET /v23.0/{waba_id}
GET /v23.0/{waba_id}/message_templates
GET /v23.0/{phone_number_id}

Rules:
* Preserve path
* Preserve headers
* Preserve queries
* Preserve payloads
* Preserve responses

Never modify Meta behavior.

---

# 6. Meta Webhook Endpoints

Verification:
GET /webhooks/meta

Webhook Events:
POST /webhooks/meta

Responsibilities:
* Verify challenge
* Receive payload
* Publish to RabbitMQ

---

# 7. API Response Rules

## platform-api

Success:
{
 success,
 data,
 meta
}

Error:
{
 success:false,
 error:{
   code,
   message
 }
}

---

## meta-api

Return Meta responses exactly as received.

Never wrap:
success
data
meta

---

# 8. API Naming Rules

Use plural resources.
Examples: wabas, phone-numbers, access-tokens, audit-logs.
Avoid verbs.

---

# 9. Rate Limiting

Apply to:
platform-api
meta-api

Recommended:
100 requests/minute per token

---

# 10. Constraints

Do not introduce:
* GraphQL
* gRPC
* Internal APIs
* BFF

Use REST only.
API contracts are frozen.
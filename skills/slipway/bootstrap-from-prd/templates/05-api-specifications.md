# [Project Name] API Specifications

Version: 1.0
Status: Frozen

---

# 1. Purpose

This document defines API ownership and contracts.

This document is not an OpenAPI specification.

---

# 2. API Domains

[Plane / Domain Name]:
[service-name]

[Plane / Domain Name]:
[service-name]

---

# 3. Authentication

## [Auth Method Name]

Used by: [actor / service]
Header: `[header name]: [value format]`
Issued by: [service]
Validated by: [service]

---

# 4. [Service Name] API

Base path: `/[prefix]`
Owner: [service-name]

## [Endpoint Group Name]

### [HTTP Method] [path]

Purpose: [one sentence]
Auth required: [Yes / No / type]
Request body:
```
field     Type      Required    Description
---       ---       ---         ---
[field]   [type]    [Yes/No]    [description]
```
Response:
```
field     Type      Description
---       ---       ---
[field]   [type]    [description]
```
Errors: [HTTP status] — [condition]

<!-- Repeat for every endpoint -->

---

# 5. [External / Proxy API — if applicable]

[Describe pass-through or proxy behavior. List what must be preserved.]

<!--
VALIDATION RULES:
- Every endpoint must have exactly one owner service
- Owner must match 03-service-boundaries.md
- No two services may expose endpoints for the same business capability
- Auth method must match 07-engineering-standards.md security rules
- Proxy endpoints must reference preservation rules from 08-architecture-decisions.md
-->

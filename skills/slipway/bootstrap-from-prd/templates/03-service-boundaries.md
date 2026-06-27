# [Project Name] Service Boundaries

Version: 1.0
Status: Frozen

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

The platform consists of [N] services.

[list service names, one per line]

---

# 3. [service-name]

Purpose: [one sentence]

Owns:
- [responsibility]
- [responsibility]

Must never own:
- [forbidden responsibility]
- [forbidden responsibility]

---

# 4. [service-name]

Purpose: [one sentence]

Owns:
- [responsibility]

Must never own:
- [forbidden responsibility]

<!-- Repeat section for every service -->

---

# [N+2]. Cross-Service Rules

- No cross-service database access.
- No duplicated ownership.
- No hidden coupling.
- Communication happens through [protocols] only.

<!--
VALIDATION RULES:
- Every service listed in 02-technical-architecture.md must have a section here
- Every "Owns" entry must trace to a functional requirement in 01-prd.md
- No two services may own the same responsibility
- "Must never own" lists should cover the most common mistake patterns for that service type
-->

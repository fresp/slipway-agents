# [Project Name] Data Models

Version: 1.0
Status: [frozen/draft/omitted]
<!-- GENERATION RULE: Status value comes from the STEP 2.5 doc suite decision recorded in
.ai/docs/.manifest.md. An omitted doc is never generated, so real output carries frozen
(after STEP 5 validation passes) or draft (mid-generation/regeneration). Content-stability
rules for frozen docs are unchanged: versioned edits only, no silent rewrites. -->

---

# 1. Purpose

This document defines collection/table ownership, schemas, relationships, index strategy, and retention policy.
[DB technology] is the single source of persistence. Cross-service database access is forbidden.

---

# 2. Entity Relationship

[Entity A] → [Entity B] → [Entity C]
[Entity B] ├── [Related Entity 1], [Related Entity 2]

---

# 3. Collection Ownership

[service-name]: [collection1], [collection2], [collection3]
[service-name]: [collection4], [collection5]

---

# 4. [Collection Name]

Owner: [service-name]

Schema:
```
field_name        Type        Required    Description
---               ---         ---         ---
id                ObjectId    Yes         Primary key
[field]           [type]      [Yes/No]    [description]
created_at        Date        Yes         Creation timestamp
updated_at        Date        Yes         Last update timestamp
```

Indexes:
- `[field]` — unique / sparse / compound: [reason]

Retention: [permanent / TTL N days / archive after N days]

---

<!-- Repeat section for every collection / table -->

<!--
VALIDATION RULES:
- Every collection must have exactly one owner service
- Owner service must match 03-service-boundaries.md
- No collection may be written to by more than one service
- Every schema field must have a type and description
- Sensitive fields (passwords, tokens, secrets) must note encryption requirement
- Never include message bodies, media, or contact data unless PRD explicitly requires it
-->

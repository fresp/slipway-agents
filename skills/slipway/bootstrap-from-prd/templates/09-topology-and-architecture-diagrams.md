# [Project Name] Topology & Architecture Diagrams

Version: 1.0
Status: [frozen/draft/omitted]
<!-- GENERATION RULE: Status value comes from the STEP 2.5 doc suite decision recorded in
.ai/docs/.manifest.md. An omitted doc is never generated, so real output carries frozen
(after STEP 5 validation passes) or draft (mid-generation/regeneration). Content-stability
rules for frozen docs are unchanged: versioned edits only, no silent rewrites. -->

---

# 1. High Level Architecture

[Use ASCII block diagram or Mermaid. Show all services and their primary connections.]

```
Example ASCII:
                +----------------+
                |   [Service A]  |
                +-------+--------+
                        |
                        v
                +----------------+
                |   [Service B]  |
                +-------+--------+
                        |
            +-----------+-----------+
            |                       |
            v                       v
     [External System]          [Database]
```

Or Mermaid:
```mermaid
graph TD
    A[Service A] --> B[Service B]
    B --> C[(Database)]
    B --> D[External System]
```

---

# 2. [Control Plane / Data Plane separation — if applicable]

[Show the boundary between planes. Label which services belong to each.]

---

# 3. [Flow Name] — Sequence Diagram

```mermaid
sequenceDiagram
    participant [Actor/Service A]
    participant [Actor/Service B]
    participant [External]

    [A]->>+[B]: [action / request]
    [B]->>+[External]: [action]
    [External]-->>-[B]: [response]
    [B]-->>-[A]: [response]
```

<!-- Repeat for every major flow defined in 06-operational-flows.md -->

---

# 4. Infrastructure Topology

[Show queues, workers, caches, and databases and how they connect to services.]

```
[Service] --AMQP--> [Queue] --AMQP--> [Worker]
[Service] --Redis--> [Cache]
```

<!--
VALIDATION RULES:
- Every service in the diagram must exist in 02-technical-architecture.md
- Every flow diagram must correspond to a flow in 06-operational-flows.md
- Communication protocols shown must match 02-technical-architecture.md service communication table
- No diagram may show a service connection that is not permitted by 03-service-boundaries.md
-->

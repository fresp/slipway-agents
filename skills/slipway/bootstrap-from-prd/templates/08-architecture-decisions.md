# [Project Name] Architecture Decisions

Version: 1.0
Status: Frozen

---

# Purpose

This document contains non-negotiable architecture decisions.
These decisions are considered frozen.
AI agents and engineers must not redesign them during planning or implementation.

---

<!--
GENERATION RULES:

Each ADR must satisfy all of the following:
1. Traces to a specific ADR candidate from the Requirement Model (NFR, constraint, or Out of Scope item)
2. Contains exactly: a decision statement, the rationale, and what it explicitly forbids or requires
3. Does not contradict any other ADR in this document
4. Is numbered sequentially starting from ADR-001

ADR candidates from the Requirement Model typically fall into these categories:
- Product positioning (what the system IS and IS NOT)
- External system ownership (who owns what business state)
- Service landscape (how many services, what they are)
- Communication patterns (sync vs async, protocol choices)
- Data rules (what to persist, what never to persist)
- Authentication separation (portal auth vs machine auth vs external)
- Scope boundaries (what is explicitly out of scope)
- Technology stack (if constrained by PRD or NFRs)

Write one ADR per decision. Do not bundle multiple decisions into one ADR.
Do not write an ADR for something that is merely a preference — only for decisions
that, if violated, would break the system's core contract.
-->

# ADR-001 [Decision Title]

[One paragraph: state the decision, explain why it was made (the constraint or requirement it satisfies), and make explicit what is required or forbidden as a result.]

Source: [FR-ID / NFR-ID / Constraint / Out of Scope item from PRD]

# ADR-002 [Decision Title]

[One paragraph: decision, rationale, explicit requirement or prohibition.]

Source: [FR-ID / NFR-ID / Constraint / Out of Scope item from PRD]

# ADR-003 [Decision Title]

[...]

Source: [...]

<!--
VALIDATION RULES:
- Every ADR must have a "Source" field tracing to the Requirement Model
- No two ADRs may contradict each other
- ADR numbering must be sequential with no gaps
- Every Out of Scope item from the PRD must appear as an ADR
- Every NFR that constrains architecture (not just implementation) must appear as an ADR
- Status must remain "Frozen" — do not change it
-->

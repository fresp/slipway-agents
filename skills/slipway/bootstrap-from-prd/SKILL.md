---
name: bootstrap-from-prd
description: Generate a complete engineering documentation suite and AGENTS.md from a Product Requirement Document (PRD). Use this skill whenever a user provides a PRD or product spec and wants to generate technical architecture docs, service boundaries, data models, API specs, operational flows, engineering standards, architecture decisions, topology diagrams, planning rules, or an AGENTS.md file. Also trigger when the user says "bootstrap project", "generate docs from PRD", "create engineering docs", "build AGENTS.md", or "rebuild documentation". This skill produces implementation-ready documentation that AI agents and engineers can use directly.
---

# bootstrap-from-prd

Generate a complete, consistent engineering documentation suite from a Product Requirement Document (PRD).

The output is a set of numbered markdown files under `.ai/docs/` plus an `AGENTS.md` that consolidates all execution rules for AI coding agents.

---

## Modes

### Bootstrap (default)

Run when: no argument, or `bootstrap`

- Read `.ai/docs/01-prd.md`
- Extract business requirements
- Select the doc suite (STEP 2.5) and write `.ai/docs/.manifest.md`
- Generate the selected engineering documents in order
- Compile `AGENTS.md`
- Validate cross-document consistency

### Rebuild

Run when: `rebuild`

- Read `.ai/docs/.manifest.md`. Delete every doc it lists with status `frozen` or `draft` (Baseline and Extensions owned by this skill), plus `AGENTS.md`. Never delete `.ai/docs/01-prd.md`, supplementary PRDs (files ending in `-prd.md`), or extension docs owned by other agents (Extensions rows whose Owner Agent is not this skill — deleting another agent's report loses information this skill cannot regenerate).
- **Legacy fallback:** if no `.manifest.md` exists, delete the hardcoded set `02` through `10-planning-rules.md` and `AGENTS.md`, preserving `.ai/docs/01-prd.md` and any supplementary PRDs (files prefixed `11-` or higher that end in `-prd.md`).
- Re-run STEP 2.5 (the PRD may have changed since the last suite selection) and rewrite `.manifest.md`
- Regenerate all selected engineering documents from scratch
- Rebuild `AGENTS.md` from regenerated documentation

---

## Core Principles

- PRD is the business source of truth. Never invent requirements.
- Generate engineering documents before `AGENTS.md`.
- Every document has a single responsibility.
- Prefer deterministic generation over creativity.
- Maintain consistency across all documents.
- Never skip validation.

---

## Input

**Required:**
```
.ai/docs/
└── 01-prd.md
```

**Expected PRD sections** (must all be present; see "Handling Incomplete PRDs" if any are missing):
- Product Overview
- Goals
- Actors
- Functional Requirements
- Non-Functional Requirements
- Constraints
- Out of Scope
- Success Criteria

**Optional:** existing docs in `.ai/docs/` may be used for style reference only. Do not inherit architecture decisions from them unless the PRD explicitly requires it.

---

## Handling Incomplete PRDs

If `.ai/docs/01-prd.md` is missing one or more expected sections:

1. **Stop before generating any document.**
2. List every missing section clearly.
3. Ask the user to provide the missing content, or confirm that the section is intentionally absent.
4. If the user confirms a section is intentionally absent, note it as `N/A` and proceed without inferring content for it.
5. Do not generate documentation from a PRD that is missing Functional Requirements or Goals — these are non-negotiable.

---

## Output

```
.ai/docs/
├── .manifest.md                              ← doc suite manifest (see "Doc Manifest")
├── 02-technical-architecture.md
├── 03-service-boundaries.md
├── 04-data-models.md
├── 05-api-specifications.md
├── 06-operational-flows.md
├── 07-engineering-standards.md
├── 08-architecture-decisions.md
├── 09-topology-and-architecture-diagrams.md   (unless omitted per STEP 2.5)
└── 10-planning-rules.md
AGENTS.md
```

---

## Doc Manifest

`.ai/docs/.manifest.md` is the authoritative record of **doc suite membership** — which docs exist for this project and why. It separates two axes that used to be conflated in the single word "frozen":

1. **Suite membership** (which docs exist) — flexible, decided per project in STEP 2.5 and recorded here.
2. **Content stability** (once approved, content does not silently change) — rigid, unchanged. A doc with status `frozen` follows exactly the same content rules as before: versioned edits only, no silent rewrites, ADRs immutable once approved.

Format:

```markdown
# Doc Manifest

## Baseline
| Doc | Status | Last Reviewed |
|---|---|---|
| 01-prd.md | frozen | <date> |
| 02-technical-architecture.md | frozen | <date> |
| 09-topology-and-architecture-diagrams.md | omitted | — |
| 10-planning-rules.md | frozen | <date> |

## Extensions
| Doc | Owner Agent | Trigger | Status |
|---|---|---|---|
```

**Status values:**
- `frozen` — doc exists and its content is stable; changes require the standard versioned-edit process.
- `draft` — doc exists but has not yet passed review (bosun) or is mid-regeneration; content may still change.
- `omitted` — doc was deliberately excluded for this project per the STEP 2.5 criteria. Downstream agents (bosun, rigger) must not treat its absence as an error.

**Baseline table** lists `01-prd.md`, every doc from the 02–10 set (including omitted ones — an omission is a recorded decision, not a silent gap), supplementary PRDs (`[N]-*-prd.md`), and dynamic docs generated by this skill's Dynamic Document Detection. **Extensions table** lists agent-owned report docs produced outside this skill (e.g. a future `11-security-audit.md` owned by `gunner`, with its trigger condition). This skill writes the header row of the Extensions table but never populates it — extension rows are appended by the owning agents when they produce file output.

Whenever this skill generates or regenerates a doc, it updates that doc's `Status` and `Last Reviewed` row in the manifest. Docs carry `draft` while generation is in progress; once STEP 5 cross-document validation passes, the skill sets every generated doc to `frozen` and stamps `Last Reviewed` with the generation date. On partial regeneration, only the affected rows change — untouched rows keep their existing status and date.

---

## Document Versioning

Every generated document carries a `Version` field in its header.

Rules:
- **Bootstrap (first run):** all documents start at `Version: 1.0`.
- **Rebuild (full regeneration):** increment the major version — `1.x → 2.0`, `2.x → 3.0`, etc.
- **Partial regeneration (validation fix on specific docs):** increment the minor version on only the affected documents — `1.0 → 1.1`, `1.2 → 1.3`, etc. Unaffected documents keep their current version.

Partial Regeneration's impacted doc list may consist of exactly `["AGENTS.md"]` as a valid, narrower scope (see `hullwright.md`'s Contract-Only Refresh). In this case, skip Requirement Model re-derivation and regenerate nothing from `02` through `10` — recompile only `AGENTS.md` from the current on-disk docs. For existing projects that still have only the legacy singular artifact (`AGENT` + `.md`) at project root, write the refreshed contract to `AGENTS.md`, remove the legacy singular artifact after the plural file is written, and report `Migrated: ` + legacy singular artifact + ` -> AGENTS.md`; if `AGENTS.md` already exists, report `No migration needed.`
- Never reset a version to `1.0` after a rebuild unless explicitly instructed by the user.

---

## Process

### STEP 1 — Read PRD

Read `.ai/docs/01-prd.md`. If supplementary PRDs exist (e.g. `.ai/docs/11-dashboard-prd.md`), read them as well.

Extract from every PRD:
- Product Overview
- Goals
- Actors
- Functional Requirements
- Non-Functional Requirements
- Constraints
- Out of Scope
- Success Criteria

Validate completeness before proceeding (see "Handling Incomplete PRDs").

---

### STEP 2 — Build Requirement Model

Normalize every functional requirement from the PRD into the following structure. This model is the **single source** used when populating all engineering documents in STEP 3. Every decision made in downstream documents must trace back to a row in this model.

For each functional requirement, produce one row:

| Field | Description |
|---|---|
| FR-ID | Identifier from PRD (e.g. FR-001) |
| Capability | What the system does |
| Owner | Which service owns it (derive from PRD actors + constraints) |
| Runtime | Sync / async / event-driven |
| Persistence | Entity name, collection/table, what is stored |
| Security | Auth method, encryption, signing requirements |
| Dependencies | Other services or external systems required |

Also extract and record separately:
- **ADR candidates:** every NFR, constraint, and Out of Scope item that implies a non-negotiable architecture decision
- **Forbidden patterns:** every item from Out of Scope that must never be built

**Conflict resolution:** If the PRD contains internal contradictions, stop and ask the user to resolve them before proceeding. Do not resolve contradictions by choosing one side silently.

---

### STEP 2.5 — Doc Suite Selection

Using the Requirement Model, decide for each baseline doc 02–10 whether it is generated (`frozen` after validation) or `omitted` for this project, then write `.ai/docs/.manifest.md` (see "Doc Manifest" above) before generating anything.

**Omission criteria per doc:**

| Doc | Omittable? | Criterion |
|---|---|---|
| `02-technical-architecture.md` | Never | Every project has an architecture, even single-service. |
| `03-service-boundaries.md` | Never | Even a single-service system needs its "must never own" list — it is the primary anti-scope-creep contract. |
| `04-data-models.md` | Never | If the system truly persists nothing, the doc states that explicitly (one section) — an absent doc is indistinguishable from a forgotten one. |
| `05-api-specifications.md` | Never | Same rule: a system with no external interface documents that fact explicitly. |
| `06-operational-flows.md` | Never | Every FR implies at least one flow. |
| `07-engineering-standards.md` | Never | Stack and conventions always exist. |
| `08-architecture-decisions.md` | Never | ADR candidates always exist (at minimum, product positioning and scope boundaries). |
| `09-topology-and-architecture-diagrams.md` | Yes | Omit when **all** of the following hold: the system is single-service, there is no queue/broker/cache in the Requirement Model's Dependencies column, and there is no multi-system integration topology (at most one external system, called synchronously). A topology diagram of one box adds no information. |
| `10-planning-rules.md` | Never | Downstream agents (rigger, bosun) treat it as the canonical source-of-truth list. |

When in doubt, generate the doc — the cost of a thin doc is lower than the cost of a downstream agent working around a missing one. Every `omitted` decision must be recorded in the manifest with status `omitted`; never simply skip a doc without a manifest row.

If `09` is omitted, downstream cross-references to it are dropped: `06-operational-flows.md` must not point to it for diagrams, and it must not appear in any Source Of Truth list.

---

### STEP 3 — Generate Engineering Documents

Generate in this exact order, **skipping any doc marked `omitted` in `.manifest.md`**. For each document, use the corresponding template in `templates/` and populate it using **only** the Requirement Model built in STEP 2.

**Generation order and what each doc draws from the model:**

1. `08-architecture-decisions.md` — draws from: ADR candidates, forbidden patterns, NFRs, constraints
2. `02-technical-architecture.md` — draws from: Owner column (defines services), Runtime column (defines planes/flows), Dependencies column (defines communication)
3. `03-service-boundaries.md` — draws from: Owner column (owns), Capability column (must never own = capabilities not in owner's list)
4. `04-data-models.md` — draws from: Persistence column (entities, collections, fields), Security column (encryption flags)
5. `05-api-specifications.md` — draws from: Capability + Owner (endpoints), Actors from PRD (who calls what), Security column (auth per endpoint)
6. `06-operational-flows.md` — draws from: Runtime column (sync/async/event), Capability + Dependencies (flow steps), and the Flow Graph subsection per flow, cross-referenced against the services and endpoints already fixed in `02` and `05` by this point in generation order
7. `07-engineering-standards.md` — draws from: ADRs already written (stack, patterns), NFRs (logging, testing, security), Dependencies column (infrastructure components)
8. `09-topology-and-architecture-diagrams.md` — draws from: all docs above (visualizes what is already decided)
9. `10-planning-rules.md` — draws from: all docs above (source-of-truth list, implementation order from flow dependencies)

**What makes a document "implementation-ready":** every document must satisfy its completion contract before moving to the next.

#### Per-document completion contracts

**08-architecture-decisions.md**
- Every ADR traces to an ADR candidate in the Requirement Model
- No two ADRs contradict each other
- Every forbidden pattern from the model appears as an explicit ADR
- ADRs are numbered sequentially starting from ADR-001

**02-technical-architecture.md**
- Service list is complete and matches the unique set of Owner values from the model
- Every service has a stated purpose
- Communication table covers all inter-service Dependencies from the model
- Architecture constraints list every forbidden pattern from the model

**03-service-boundaries.md**
- Every service has an "Owns" list derived from its Capability rows in the model
- Every service has a "Must never own" list covering capabilities owned by other services
- No ownership overlaps
- Every "Owns" entry traces to a FR-ID

**04-data-models.md**
- Every Persistence entry from the model has a collection/table definition
- Every collection has exactly one owner service
- Every schema field has: type, required flag, description
- Sensitive fields noted in the Security column have an encryption requirement stated
- No forbidden data (e.g. raw message bodies, media, plain-text secrets) unless explicitly in the PRD

**05-api-specifications.md**
- Every Capability in the model that requires an external interface has at least one endpoint
- Every endpoint has: method, path, owner service, auth requirement, request schema, response schema, at least one error case
- Every endpoint is callable by an Actor defined in the PRD
- Auth methods match the Security column in the model

**06-operational-flows.md**
- Every Runtime entry in the model (sync/async/event) has a corresponding flow
- Every flow has: purpose, owner, trigger, outcome, numbered steps, constraints
- Every step references a service from `02-technical-architecture.md`
- Async flows reference the queue/broker infrastructure from `02`

**07-engineering-standards.md**
- Technology stack is explicit and derived from Dependencies column + ADRs
- Every rule is binary (do / do not) — no ambiguous guidance
- Security rules cover: auth method, token handling, encryption algorithm, logging redactions
- Testing standards are present only if the PRD NFRs or constraints mention testing requirements; otherwise mark section as `N/A — not specified in PRD`
- No rule contradicts any ADR

**09-topology-and-architecture-diagrams.md**
- Every service from `02` appears in the high-level diagram
- Every flow from `06` has a corresponding sequence diagram
- All protocols shown match the communication table in `02`
- Infrastructure components (queues, caches, DBs) appear in the infrastructure topology diagram

**10-planning-rules.md**
- Source-of-truth list contains exactly the docs generated for this project (no more, no fewer)
- Supplementary PRDs are included in the list if they exist
- Implementation order is consistent with flow dependencies in `06`

#### Dynamic Document Detection

After generating the base 9 documents (02–10), scan the PRD for signals that imply additional documents beyond the default set. These are documents that don't apply to every project but are critical for specific types of systems.

Run this scan before compiling `AGENTS.md`:

| Signal in PRD | Implied additional doc | Number |
|---|---|---|
| Keywords: "dashboard", "portal", "UI", "Figma", "design system", "user interface", "screen", "page layout" | `[N]-ui-spec.md` — UI/UX specification with screen flows, component list, state transitions | 12+ |
| Keywords: "migration", "existing system", "migrate data", "legacy", "cutover", "data transfer from" | `[N]-migration-plan.md` — migration strategy, rollback plan, data mapping | 12+ |
| Keywords: "WhatsApp API", "payment gateway", "Stripe", "Midtrans", "Twilio", "third-party", "webhook from", "external API" with complex bidirectional flows | `[N]-integration-spec.md` — external system integration contracts, error handling, retry policies | 12+ |
| Keywords: "staging", "sandbox", "per-tenant", "multi-environment", "UAT", "preview environment" | `[N]-environment-config.md` — environment topology, config per environment, secrets management | 12+ |
| Domain with 10+ distinct business terms that need precise definition (e.g. WABA, MSISDN, billing cycle, tenant, reseller) | `[N]-glossary.md` — canonical term definitions used by all docs | 12+ |

**Rules for dynamic docs:**
- Number sequentially starting at 12. The number 11 is permanently reserved for gunner's `11-security-audit.md` and must never be assigned to a dynamic doc, even if gunner has not run yet in this pipeline pass. When assigning a number, read `.ai/docs/.manifest.md`'s Extensions table first and use the highest existing number + 1 (starting the search floor at 12), so multiple dynamic docs in the same run still number sequentially without collision.
- **Never assign the number 11 to any document other than gunner's security audit report (`11-security-audit.md`), regardless of pipeline mode or run order.** The 11 slot is gunner's fixed, hardcoded output path; a dynamic doc that lands on 11 collides with it in `.ai/docs/.manifest.md`.
- Do not generate a dynamic doc if the PRD only mentions the trigger keyword briefly or in an example — the signal must be a material requirement.
- Apply the same per-document completion contracts philosophy: the dynamic doc must be self-consistent and traceable to FR-IDs.
- Add every generated dynamic doc to `10-planning-rules.md`'s source-of-truth list, to `AGENTS.md`'s Source Of Truth section, and as a row in `.manifest.md`'s Baseline table. The `bosun` subagent validates this list — if it's hardcoded to `02–10`, it will miss dynamic docs.

If a dynamic doc is triggered, report it at the end of STEP 3 before proceeding to STEP 4:
```
⚠ Dynamic doc triggered: [N]-[name].md — reason: [signal found in PRD]
```

---

### STEP 4 — Compile AGENTS.md

Generate `AGENTS.md` only after all engineering documents have passed their contracts.

Every rule in `AGENTS.md` must derive from a generated document. Cite the source doc in a comment if the rule is non-obvious. Do not introduce new architecture or requirements.

`AGENTS.md` must include these sections in this order:

1. **Mission** — one paragraph: what system this repo implements, what the agent's job is (implement, not redesign), what the agent explicitly is not
2. **Source Of Truth** — priority-ordered list of all generated docs; higher priority wins on conflict; no merging, no averaging; supplementary PRDs inserted between `01-prd.md` and `10-planning-rules.md`
3. **Operating Principles** — numbered one-sentence rules, each derived from one ADR; no principles without an ADR source
4. **Context Loading Strategy** — task-type map: for each major flow category from `06-operational-flows.md`, list the minimum docs to load
5. **Working Loop** — numbered step-by-step execution loop for every non-trivial task. Must begin with a resume check: before any other step, read `.ai/implementation-state.md` if it exists; if `Status` is not `complete`, resume from `Last completed task` instead of restarting the requested scope from the beginning.
6. **Architecture Guardrails** — frozen service list (exact names from `02`), frozen topology if applicable, frozen tech stack (exact from `07`), frozen API style (from `07` + ADRs)
7. **Service Ownership Rules** — per service: owns / must never own (mirrored exactly from `03-service-boundaries.md`)
8. **Development Strategy** — increment size, ordering preferences, forbidden abstraction patterns (from `07` forbidden patterns + ADRs)
9. **Planning Rules** — acceptance criteria format, task decomposition rules, implementation order (from `10-planning-rules.md`)
10. **Coding Rules** — stack conventions, env var prefix, persistence rules, security rules (from `07-engineering-standards.md`)
11. **Runtime Capabilities** — what the agent is permitted to do at execution time. Generate from `07-engineering-standards.md` (stack + tooling), `09-topology-and-architecture-diagrams.md` (deployment targets), and `10-planning-rules.md` (constraints). If a capability is not addressed in any doc, default to the restrictive option and mark it as an assumption. Must include:
    - **Permitted tools:** file read scope, file write scope, bash commands allowed (test runners, linters, migration tools, package managers), network policy, package installation policy
    - **Prohibited actions:** paths off-limits for writing, commands never to run (e.g. `git push`, `DROP TABLE` in production, `rm -rf /`), secrets that must not be read or logged
    - **Escalate before doing:** actions not prohibited but requiring human confirmation before proceeding (e.g. adding a new third-party service dependency, modifying CI/CD pipeline files, schema migrations that drop columns)
12. **Escalation Protocol** — when and how to halt rather than guess. Must include:
    - **Escalate immediately (halt task, do not proceed):** acceptance criterion is ambiguous and two interpretations would produce different schemas or API contracts; verify command fails after one retry with a consistent (non-flaky) failure; a dependency task's output is absent or malformed; completing the task would cross a Runtime Capabilities boundary
    - **Escalation procedure:** (1) stop work, (2) write `Status: blocked` to `.ai/implementation-state.md` with the specific blocker description, (3) output a structured `⚠ Blocked` message with the reason, last action taken, and two or three concrete resolution options, (4) wait for user input — do not auto-resolve
    - **Retry policy:** if verify command fails, retry once automatically and log the retry. If second attempt also fails, escalate — do not retry more than once without user input
    - **What is NOT an escalation trigger:** minor code style choices, missing documentation comments, test fixtures that need to be created — make a reasonable decision and log it in implementation notes
13. **Decision Tree** — numbered checklist to run before changing code; items 1–4 are universal, remaining items derived from project ADRs
14. **Forbidden Behaviors** — explicit never-do list derived from: ADRs + `03` "must never own" lists + `07` forbidden patterns + PRD Out of Scope
15. **Definition Of Done** — binary checklist; items 1–5 and 7–8 are universal; item 6 is project-specific (e.g. external system compatibility)
16. **Output Contract** — how to report completed work, plans, and uncertainty
17. **Golden Rules** — 10–15 numbered one-liners; every rule must trace to an ADR or engineering standard; no invented rules
18. **Prompt Contract** — what the agent may assume without being told each time

---

### STEP 5 — Cross-Document Validation

Verify:

- ✓ Every FR-ID in the Requirement Model has an owner service in `03`
- ✓ Every service in `02` has a boundary definition in `03`
- ✓ Every API in `05` belongs to exactly one service in `03`
- ✓ Every persisted entity in `04` has exactly one owner
- ✓ Every operational flow in `06` matches the architecture in `02`
- ✓ Every ADR in `08` is reflected consistently across `02`, `03`, `07`
- ✓ No rule in `07` contradicts any ADR in `08`
- ✓ `AGENTS.md` contains no rule not present in a generated doc
- ✓ Source-of-truth list in `10` matches Source Of Truth section in `AGENTS.md` exactly
- ✓ `.manifest.md` Baseline table has a row for `01-prd.md` and every doc 02–10 (generated or `omitted`) — no doc is silently absent
- ✓ Every doc listed `frozen` or `draft` in `.manifest.md` exists on disk; no doc exists on disk that the manifest lists as `omitted`
- ✓ Source Of Truth lists in `10` and `AGENTS.md` contain exactly the manifest's non-`omitted` docs (plus extension docs per the insertion rule in `templates/AGENTS.md`)

**If validation passes:**
- For every doc in the current generation/regeneration scope, set its `.manifest.md` Baseline row `Status` to `frozen` and update `Last Reviewed` to the generation date.
- Set that same doc's own header `Status:` field to `frozen` to match.
- Both writes happen together — never one without the other.

**If validation fails:**
- Identify the affected documents
- Increment the minor version on each affected document
- Regenerate only those documents
- Re-run validation
- Do not regenerate unrelated documents

---

### STEP 6 — Report to User

After completion, output:

```
✓ Generated:
  - .ai/docs/08-architecture-decisions.md (v1.0)
  - .ai/docs/02-technical-architecture.md (v1.0)
  - [... all files with versions]
  - AGENTS.md
  - .ai/docs/.manifest.md

✓ Omitted docs: [list with one-line reason each, or "none"]

✓ Validation: passed

✓ Supplementary PRDs used: [list, or "none"]

⚠ PRD gaps noted: [list any N/A sections, or "none"]
```

---

## Templates

Templates for each document are in `templates/`. Each template defines required sections, writing structure, generation rules, and validation contracts.

Templates do not define project-specific content.

**Template index:**
- `templates/08-architecture-decisions.md`
- `templates/02-technical-architecture.md`
- `templates/03-service-boundaries.md`
- `templates/04-data-models.md`
- `templates/05-api-specifications.md`
- `templates/06-operational-flows.md`
- `templates/07-engineering-standards.md`
- `templates/09-topology-and-architecture-diagrams.md`
- `templates/10-planning-rules.md`
- `templates/AGENTS.md`

---

## Examples

Reference examples are under `examples/`. Read `examples/README.md` first.

Use examples only for:
- Writing tone and register (declarative, no filler)
- Level of detail per section
- Document structure and consistency patterns

Do **not** copy: product names, service names, architecture decisions, technology choices, API paths, ADR numbers, or business rules — unless the PRD explicitly requires them.

---

## Architecture Visualization

Generate diagrams in `09-topology-and-architecture-diagrams.md` for every system with more than one service. Required diagrams:

- High-Level Architecture (all services and their primary connections)
- Infrastructure Topology (queues, caches, databases and which services own them)
- One Sequence Diagram per flow in `06-operational-flows.md`

Optional: add a plane separation diagram if the PRD implies a control/data or sync/async split.

For single-service systems, ASCII block diagrams are acceptable.

---

## Completion Criteria

The skill is complete only when:

- All documents selected in STEP 2.5 have been generated, and `.ai/docs/.manifest.md` records every baseline doc's status (including omissions)
- Every document has passed its per-document completion contract
- Cross-document validation passes with no failures
- `AGENTS.md` is derived exclusively from the generated documentation
- Versions are correctly applied to all documents
- The report has been delivered to the user

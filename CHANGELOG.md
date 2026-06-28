# Changelog

All notable changes to slipway-agents are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] — 2026-06-28

### Added

**New agents**
- `security-auditor` — security audit agent that runs after `inspector` and before `rigger`. Scans API specs, service boundaries, and AGENT.md across five lenses (authentication, secret handling, attack surface, data sensitivity, third-party risk). Produces a severity-ranked findings report and a PASS / CONDITIONAL / BLOCK gate signal.
- `estimator` — cost and time forecasting agent that runs after `rigger`. Reads `.ai/planning/` and produces a per-phase estimate table, critical path analysis, parallel opportunity summary, and flags for unrealistic or high-risk phases.
- `schema-validator` — post-implementation DB schema validation agent. Compares the actual database schema against `.ai/docs/04-data-models.md`. Classifies each difference as DRIFT, INTENTIONAL, or UNKNOWN. Never auto-patches UNKNOWN items.

**New pipeline modes**
- `estimate-only` mode — invoke `estimator` standalone after planning is complete
- `security-only` mode — invoke `security-auditor` standalone against existing docs
- `schema-validate` mode — invoke `schema-validator` post-implementation

**Plugin system**
- `packages/slipway-plugin/` — TypeScript OpenCode plugin that reads `slipway.json` at session startup and enforces model assignments per agent via `client.config.patch()`. Supports primary model, `fallback_model`, and category-level fallback resolution.
- `opencode.json` — minimal plugin registration file. Users register the plugin once; all model config lives in `slipway.json`.

**Configuration**
- `slipway.json` now supports `fallback_model` per agent — if the primary model is unavailable, the plugin automatically falls back without user intervention.
- `slipway.json` now includes a `categories` block (`quick`, `standard`, `deep`) for last-resort fallback resolution.
- `slipway.schema.json` updated to validate `fallback_model` and `categories`.

### Changed

**Agent upgrades**
- `inspector` — added per-doc health score breakdown table emitted before the findings list. Each document now receives an individual score (0–100) with a band label (strong / good / weak / critical). Model upgraded from `claude-sonnet-4-6` to `claude-opus-4-6` — inspector is the most reasoning-heavy validation step in the pipeline.
- `rigger` — tasks now include `Size` (S/M/L), `Parallel` (true/false), `Depends on` (TASK-ID list), and `Context load` (exact docs list) fields. `00-overview.md` now includes a plain-text ASCII dependency graph and critical path. Stale check added: if any doc is newer than the existing plan, rigger halts and asks the user to choose (regenerate / full replan / proceed anyway) before continuing.
- `groomer` — synthesis step is now mandatory. Three lenses (Lead Dev, QA, DevOps) run independently, then a cross-lens synthesis step deduplicates findings, detects inter-lens conflicts, and ranks by impact. The orchestrator always receives one unified report, never three separate lists.
- `chronicler` — drift classification is now explicit and required. Every difference is classified as DRIFT (unintentional deviation, auto-patchable), INTENTIONAL (deliberate decision, doc update + ADR entry), or UNKNOWN (ambiguous, pauses for user input before any patch is applied).

**Orchestrator**
- `slipway.md` mode detection table updated with three new modes: `estimate-only`, `security-only`, `schema-validate`.
- Pipeline flow updated: `security-auditor` runs as Phase 5 (after inspector, before rigger); `estimator` runs as Phase 7 (after rigger, before grooming).
- Sync run updated: `schema-validator` is invoked as Phase S2 alongside or after `chronicler`.
- All Indonesian trigger strings and user-facing messages replaced with English.

### Fixed

- `slipway.json` was previously documentation-only — model assignments were not enforced at runtime. The plugin system closes this gap.

---

## [1.0.0] — 2026-05-01

### Added

Initial release of slipway-agents.

**Orchestrator**
- `slipway.md` — primary orchestrator with mode detection (bootstrap-from-prompt, bootstrap-from-prd, extend, review-only, grooming-only, plan-only, sync), gate enforcement, error recovery with retry, and state tracking via `.ai/docs/.pipeline-state.md`.

**Agents**
- `drafting-table` — structured Q&A → complete `.ai/docs/01-prd.md` with 8 required sections and gap-fill loop.
- `hull-builder` — invokes `bootstrap-from-prd` skill → generates docs `02`–`10` + `AGENT.md`.
- `inspector` — cross-doc validation with severity-ranked findings (Critical / Should-fix / Note) and overall health score 0–100.
- `groomer` — sprint grooming across Lead Dev, QA, and DevOps lenses with combined readiness signal (Ready to Plan / Conditional / Blocked).
- `rigger` — phase/milestone breakdown → `.ai/planning/` with tasks, owners, acceptance criteria, and functional requirement traces.
- `shipwright` — extend mode: scoped PRD update + targeted doc rebuild for new features.
- `chronicler` — post-implementation doc sync with incremental patching and changelog entry.

**Skills**
- `bootstrap-from-prd` — full 9-document technical doc suite generation from a PRD.
- `groomer-lead-dev`, `groomer-qa`, `groomer-devops` — three specialist grooming lenses.

**Configuration**
- `slipway.json` — model assignments per agent (documentation-only in v1.0.0).
- `slipway.schema.json` — JSON schema for config validation.

**Examples**
- `skills/slipway/bootstrap-from-prd/examples/managed-waba/` — full pipeline output for a multi-tenant WhatsApp Business Calling service.

[1.1.0]: https://github.com/fresp/slipway-agents/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/fresp/slipway-agents/releases/tag/v1.0.0

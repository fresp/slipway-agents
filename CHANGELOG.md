# Changelog

All notable changes to slipway-agents are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.8.0] — 2026-07-04

### Added
- **Schema: per-agent `category` field** — links an agent to its `categories` fallback pool
  (quick/standard/deep). All 13 agents now declare a category in `slipway.json`, matching
  their primary model tier so the last-resort fallback never drops below the tier the agent
  was designed for. Declarative for now — the plugin does not yet read it at runtime.
- **Schema: per-agent `permission` object** — scoped `edit`/`webfetch`/`task`/`bash`
  permissions (`ask`/`allow`/`deny`; `bash` also accepts a per-command object form for
  scoped shell access). `bosun` sets `"edit": "deny"` (matches its documented read-only
  role). `gunner`'s permission block is intentionally absent — its scoped bash permissions
  land in Batch 2 with the dependency/image-scan lens. Declarative until plugin-side
  enforcement ships.
- **Schema: `ralph_loop` config** — global default + per-agent override for bounded
  optimization cycles (`enabled`, `max_iterations`, `strategy`, `block_on_exhaustion`).
  Global default mirrors the orchestrator's hardcoded 2-cycle optimize loop; `bosun`
  overrides `block_on_exhaustion: true`, matching the orchestrator's documented rule that
  unresolved Critical findings never pass STEP 4 without explicit user override. Declarative
  only — the orchestrator still hardcodes the limit until a future batch wires it.
- `caulker`'s `slipway.json` entry gained the `mode`/`description` fields every other agent
  already had.

### Changed
- Model assignments upgraded to current tiers: Opus agents (`slipway`, `bosun`, `gunner`,
  `caulker`) → `anthropic/claude-opus-4-8`; Sonnet agents → `anthropic/claude-sonnet-5`;
  `chronicler` stays on `anthropic/claude-haiku-4-5`. Fallbacks and `categories` pools
  updated to match. Bedrock example strings in README/installation docs follow the same
  version swap under the existing `us.anthropic.` prefix pattern (unverified against
  OpenCode's Bedrock provider naming — validate before relying on them).
- `slipway.schema.json` version description corrected (was stale at "0.6.0") and bumped to
  0.8.0 along with `package.json`, `slipway.json`, and doc examples.
- Backward compatibility preserved: all new schema fields are optional; existing
  `slipway.local.json` files that only set `model`/`fallback_model`/`mode`/`description`
  remain valid.

### Added (Batch 0 — doc suite flexibility)
- **Doc suite manifest** (`.ai/docs/.manifest.md`) — the generated doc suite is no longer a
  rigid 02–10 set. The `bootstrap-from-prd` skill now runs a Doc Suite Selection step
  (STEP 2.5) that decides per baseline doc whether it is generated or `omitted` (currently
  only `09-topology-and-architecture-diagrams.md` is omittable, for single-service systems
  with no queue/cache/integration topology), and records every decision in the manifest.
  Statuses: `frozen` / `draft` / `omitted`. Content-stability rules for frozen docs are
  unchanged — only suite *membership* became flexible. The manifest also defines an
  Extensions table for future agent-owned report docs (e.g. a gunner security-audit doc).
- `groomer-complexity-audit` skill — the previously skill-less Complexity Audit lens
  (coxswain Lens D) now has a skill file, extended with three new flags: `[SIZING_RISK]`
  (S/M/L label understates real complexity), `[HIDDEN_COUPLING]` (phases marked independent
  that share a resource), `[SPLIT_RECOMMENDED]` (phase should be split before planning).

### Changed
- `bootstrap-from-prd` Rebuild mode deletes docs per the manifest (never `01-prd.md`,
  supplementary PRDs, or other agents' extension docs); falls back to the hardcoded 02–10
  deletion for legacy projects without a manifest.
- Doc templates 02–10: hardcoded `Status: Frozen` header replaced with a
  `Status: [frozen/draft/omitted]` placeholder driven by the manifest decision.
- `AGENT.md` and `10-planning-rules.md` templates: Source Of Truth lists are now derived
  from the manifest (non-omitted docs only), with a documented insertion rule for extension
  docs (appended after `10-planning-rules.md`, lowest priority, frozen extensions only).
- `rigger` pre-flight stale check and `bosun` missing-doc rules are manifest-aware:
  `omitted` docs are skipped without penalty; docs listed `frozen`/`draft` but absent on
  disk remain Critical findings. Both fall back to legacy behavior without a manifest.
- `coxswain` Lens D check list and synthesis dispositions extended to cover the three new
  complexity flags.
- README "What gets generated" tree now includes `.ai/docs/.manifest.md` and
  `.ai/planning/future-scope.md` (rigger, conditional), credits caulker's log line in
  `.pipeline-changelog.md`, and notes that gunner/purser/surveyor report to the session
  (stdout by design) rather than writing files.

### Fixed
- Stale pre-rename agent names: `inspector` → `bosun` in `bootstrap-from-prd/SKILL.md` and
  `groomer-lead-dev/SKILL.md`; `Inspector`/`Groomer`/`Estimator` → `Bosun`/`Coxswain`/`Purser`
  in `docs/slash-commands.md`'s `/slipway-status` output format.

---

## [0.7.1] — 2026-07-03

### Added
- `caulker` — new subagent that resolves conflicts in `.ai/docs/` and `AGENT.md` after
  multi-contributor git merges. Performs section-level semantic comparison (not line-level)
  to catch contradictions that a clean git merge doesn't flag — e.g. two contributors
  independently claiming the same service ownership, or contradictory ADRs. Auto-merges only
  genuinely non-overlapping additions; blocks and escalates everything else to the user.
- `doc-merge-resolution` skill — structural parsing rules per document type (ADRs by ID,
  service Owns-lists, endpoints by method+path, FR-IDs, AGENT.md sections) used by `caulker`.
- Scope-lock advisory check in `slipway` orchestrator — before `shipwright`/`chronicler`/
  `hullwright` start a mutating step, checks `.ai/docs/.pipeline-state.md` for overlapping
  in-progress work from another contributor and warns before proceeding.
- New `resolve-conflicts` standalone entry point and mode-detection signal in `slipway`.

---

## [0.7.0] — 2026-06-29

### Changed
- `mode` per agent is now injected by the plugin from `slipway.json` instead of being hardcoded in agent frontmatters — edit `slipway.json` to change any agent's mode without touching `.md` files
- Removed `mode:` field from all `subagents/*.md` frontmatters
- Removed hardcoded `model:` field from all `subagents/*.md` frontmatters — model is now sourced solely from `slipway.json` via the plugin
- `slipway.json` agent entries now include `"mode"` field (`"primary"` for `slipway`, `"subagent"` for all others)
- `slipway.schema.json` updated to validate `mode` field with enum `["primary", "subagent", "all"]`
- Fixed `docs/slash-commands.md` — stale `drafting-table` reference corrected to `chartmaker`

### Added
- `LICENSE` file (MIT)

---

## [0.6.1] — 2026-06-29

### Changed
- Orchestrator moved from `slipway.md` at repo root to `subagents/slipway.md` so the plugin registers it automatically at runtime
- All subagents now declare `mode: subagent` in frontmatter; `slipway` declares `mode: primary`
- `slipway.json` agent key confirmed as `"slipway"`
- `bin/install.js` now clears the OpenCode plugin cache (`~/.cache/opencode/packages/slipway-agents@latest`) on each install, ensuring OpenCode always loads the latest published version on next start

### Fixed
- Orchestrator agent was missing from the OpenCode agent picker because `slipway.md` was at repo root, outside the `subagents/` directory scanned by the plugin
- Stale plugin cache caused OpenCode to run old versions of the plugin even after npm publish

---

## [0.6.0] — 2026-06-29

### Fixed
- **Plugin now actually loads.** The plugin export format was wrong — `src/index.ts` was exporting a function directly as `default`, but OpenCode expects `export default { server: async (input) => Hooks }` (PluginModule format). The plugin was silently rejected by OpenCode on every startup, meaning agents were never registered and model assignments were never applied.
- Agent system prompt field corrected: `system` → `prompt` (aligns with `ConfigAgentV1.Info` schema in OpenCode source).

### How to upgrade
If you have a previous install:
```bash
bunx slipway-agents@0.6.0 install
```
No manual cleanup needed — `slipway.json` will be updated automatically if the version differs.

---

## [0.5.4] — 2026-06-29

### Fixed
- Republish: npm package 0.5.3 was published before the corrected `bin/install.js` was committed — it still bundled the old git-clone installer. 0.5.4 contains the correct installer that reads `slipway.json` from the bundled npm package instead of cloning the repo.

---

## [0.5.3] — 2026-06-29

### Fixed
- Plugin now correctly uses `prompt` (not `system`) when injecting agent definitions into OpenCode config — aligns with `ConfigAgentV1.Info` schema from OpenCode source. Previously the system prompt was silently dropped into the `options` catch-all and never applied.

---

## [0.5.2] — 2026-06-29

### Fixed
- Plugin now correctly uses the OpenCode `config` hook to register agents at runtime
- `slipway.json` is now read from `~/.config/opencode/slipway.json` (global config) instead of project root
- `slipway.local.json` in same directory takes precedence over `slipway.json` for local overrides
- Agents and model assignments are injected by mutating `input.agent` in the `config` hook — zero disk writes
- `bin/install.js`: removed `git clone` — agents are registered at runtime by the plugin, no disk copy needed. Installer now only patches `~/.config/opencode/opencode.json` and copies `slipway.json` from the bundled npm package to `~/.config/opencode/`
- `bin/install.js`: `slipway.json` source is now the bundled package file (`__dirname/../slipway.json`), not a git clone
- `.npmignore`: removed stale `packages/slipway-plugin/` references, added `src/`, `docs/`, `.github/`, `CONTRIBUTING.md` exclusions

### How it works
- On OpenCode startup, plugin loads all `subagents/*.md` from the npm package
- Plugin reads `~/.config/opencode/slipway.json` for model assignments
- `config` hook mutates `input.agent` directly — agents appear in OpenCode immediately
- To change models: edit `~/.config/opencode/slipway.json` → restart OpenCode

---

## [0.5.0] — 2026-06-29

### Changed
- Consolidated monorepo into a single package: plugin source moved from `packages/slipway-plugin/src/` to `src/` at root. `slipway-agents` now serves as both the agent framework and the OpenCode plugin — no separate `slipway-agents-plugin` package needed.
- Updated `package.json`: added `build`/`typecheck`/`prepublishOnly` scripts, `main` and `types` entries pointing to `dist/`, removed `workspaces`. Added a root `tsconfig.json`.
- Rewrote the plugin to use `client.config.patch()` for pure runtime agent registration — zero disk writes. Agents are loaded from the bundled `subagents/*.md` inside the npm package, and model assignments from `slipway.json` are injected at runtime alongside agent system prompts.
- Bumped config-schema version to `0.5.0` across `slipway.json`, `slipway.schema.json`, and the example configs in the docs.

### Removed
- `packages/` directory and monorepo workspace structure
- `slipway-agents-plugin` as a separate npm package — functionality merged into `slipway-agents`
- File-based patching of `opencode.json` on disk at startup

### How it works
Add `"plugin": ["slipway-agents@latest"]` to your project's `opencode.json`, restart OpenCode — agents appear automatically. Optionally add a `slipway.json` to control model assignments per agent.

---

## [0.4.0] — 2026-06-29

### Added

- `cartographer` — new subagent that reverse-engineers an existing codebase into `.ai/docs/` when no PRD exists. Performs a 4-pass scan (structure, architecture, data, conventions) and produces docs `02`–`10` with confidence markers (`[INFERRED]`, `[PARTIAL]`, `[TEMPLATE]`, `[ASSUMED]`). Hands gaps to chartmaker via a structured gap-fill briefing.
- `reverse-engineer` mode — new pipeline mode triggered automatically when `.ai/docs/` is absent and a root manifest file (`package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `composer.json`) is detected. Pipeline: cartographer → chartmaker (gap-fill only) → bosun (60-point threshold) → gunner → standard pipeline.

### Changed

**Agent renames — nautical theme consistency**

| Old name | New name |
|---|---|
| `drafting-table` | `chartmaker` |
| `inspector` | `bosun` |
| `groomer` | `coxswain` |
| `estimator` | `purser` |
| `security-auditor` | `gunner` |
| `schema-validator` | `surveyor` |

`hullwright`, `rigger`, `shipwright`, `chronicler` — unchanged.

All internal cross-references, orchestrator routing, gate signal names, and model assignments updated to reflect new names. No functional changes — renames only.

**`bosun`** (was `inspector`) — added Cartographer Doc Handling section: rules for scoring docs with `[INFERRED]`/`[PARTIAL]`/`[TEMPLATE]`/`[ASSUMED]` markers, confidence review output block, and 60-point threshold override for reverse-engineer mode.

**`slipway.md`** — `reverse-engineer` mode added to mode detection table (takes priority over bootstrap-from-prompt when a manifest is present). Full routing block added.

---

## [0.3.0] — 2026-06-29

### Added

**Stakeholder Priority**
- `drafting-table` — Stakeholder Priority is now a required PRD section. After completing Functional Requirements, drafting-table asks the user to assign P0/P1/P2 tiers to each FR-ID. Priority tags are written inline as `FR-001 [P0]`. If the user cannot prioritize, all requirements default to P1 with a warning note.
- `rigger` — Phase ordering now respects Stakeholder Priority: P0 requirements go to Phase 1 or 2, P1 requirements target Phase 1–3, P2 requirements are deferred to the final phase or to a new `.ai/planning/future-scope.md`. A P0 task may never be placed in a phase that depends on a P2 task.
- `inspector` — Added a Stakeholder Priority cross-doc check: `01-prd.md` must contain P0/P1/P2 tags on all FR-IDs or the default-P1 warning note; absence is a Critical finding.

**Proactive ADR conflict guard**
- `shipwright` — Added a Pre-flight section that scans `08-architecture-decisions.md` before any Q&A begins. If the stated feature conflicts with an existing ADR, the conflict is surfaced immediately with resolution options before any scoping work starts.

**Slash commands**
- `/slipway-init` — Start a new pipeline run; routes to drafting-table or hullwright based on current state.
- `/slipway-status` — Report current pipeline state, last completed step, and health scores without running any step.
- `/slipway-resume` — Resume from the last completed step by reading `.ai/docs/.pipeline-state.md`.
- Full reference in `docs/slash-commands.md`.

**Dynamic doc awareness**
- `inspector` — Now reads the canonical doc list from `10-planning-rules.md` (`## Generated documents` section) instead of hardcoding `01` through `10`. Dynamic docs (`11-*.md` and beyond) generated by `bootstrap-from-prd` are automatically included in the audit scope.

### Changed

**Orchestrator (`slipway.md`)**
- Added two Forbidden Behaviors: never run rigger with unresolved ADR conflicts from shipwright; never allow drafting-table to omit Stakeholder Priority without a default-P1 warning.
- Pipeline completion report now includes a `Stakeholder Priority` line showing P0/P1/P2 counts and deferred P2 count.

---

## [0.2.0] — 2026-06-29

### Added

**Agentic execution contract**
- `AGENT.md` template (`bootstrap-from-prd` skill STEP 4) now includes two new required sections generated by hullwright from the engineering docs:
  - `## Runtime Capabilities` — declares permitted tools (file read/write scope, allowed bash commands, network policy, package installation), prohibited actions, and actions requiring human confirmation before proceeding. Derived from `07-engineering-standards.md`, `09-topology-diagrams.md`, and `10-planning-rules.md`. Defaults to restrictive if docs are silent.
  - `## Escalation Protocol` — specifies when to halt (ambiguous acceptance criterion with structural consequences, consistent verify failure after one retry, missing dependency output, capabilities boundary breach), the four-step escalation procedure (stop → write blocked state → surface to user → wait), and the one-retry policy. Explicit list of what does NOT trigger escalation to prevent over-escalation.

**Implementation state tracking**
- Orchestrator now manages `.ai/implementation-state.md` — a session-persistent file tracking current phase, last completed task, blocked task log, per-phase progress, and test results. Distinct from `.pipeline-state.md` (planning pipeline state). Orchestrator surfaces blocked task log to user when `Status: blocked` is detected on session resume.

**Verification and test fields on every rigger task**
- `Expected output` — the concrete artifact a task produces (file path, passing test suite, running endpoint). Gives Sisyphus an unambiguous completion signal.
- `Verify command` — shell command to mechanically confirm task completion. Write `[manual review required]` if no automated check is possible.
- `Test command` — test suite command scoped to the task's code. Write `[no automated tests — manual QA required]` for infrastructure-only tasks.
- `Test plan` table added to `00-overview.md` format, aggregating test commands per phase.

### Changed

**Orchestrator (`slipway.md`)**
- Added `## Implementation State Tracking` section defining `.ai/implementation-state.md` format and orchestrator rules for `blocked` / `complete` / `in-progress` states.
- Added `## Parallelism` section clarifying that `Parallel: true/false` is a planning signal, not a concurrency directive. Sequential execution is always correct; parallel dispatch is an optimization for multi-agent runtimes (omo.dev). Documents correct behavior for both single-agent and multi-agent contexts.
- Pipeline completion report now includes a `Tests` line showing pass/fail and the command run.

**rigger**
- Forbidden behaviors updated: `Expected output`, `Verify command`, and `Test command` must never be left blank.

---

## [0.1.0] — 2026-06-28

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

## [0.0.1] — 2026-05-01

### Added

Initial release of slipway-agents.

**Orchestrator**
- `slipway.md` — primary orchestrator with mode detection (bootstrap-from-prompt, bootstrap-from-prd, extend, review-only, grooming-only, plan-only, sync), gate enforcement, error recovery with retry, and state tracking via `.ai/docs/.pipeline-state.md`.

**Agents**
- `drafting-table` — structured Q&A → complete `.ai/docs/01-prd.md` with 8 required sections and gap-fill loop.
- `hullwright` — invokes `bootstrap-from-prd` skill → generates docs `02`–`10` + `AGENT.md`.
- `inspector` — cross-doc validation with severity-ranked findings (Critical / Should-fix / Note) and overall health score 0–100.
- `groomer` — sprint grooming across Lead Dev, QA, and DevOps lenses with combined readiness signal (Ready to Plan / Conditional / Blocked).
- `rigger` — phase/milestone breakdown → `.ai/planning/` with tasks, owners, acceptance criteria, and functional requirement traces.
- `shipwright` — extend mode: scoped PRD update + targeted doc rebuild for new features.
- `chronicler` — post-implementation doc sync with incremental patching and changelog entry.

**Skills**
- `bootstrap-from-prd` — full 9-document technical doc suite generation from a PRD.
- `groomer-lead-dev`, `groomer-qa`, `groomer-devops` — three specialist grooming lenses.

**Configuration**
- `slipway.json` — model assignments per agent (documentation-only in v0.0.0).
- `slipway.schema.json` — JSON schema for config validation.

**Examples**
- `skills/slipway/bootstrap-from-prd/examples/managed-waba/` — full pipeline output for a multi-tenant WhatsApp Business Calling service.

[0.7.0]: https://github.com/fresp/slipway-agents/compare/v0.6.1...v0.7.0
[0.6.1]: https://github.com/fresp/slipway-agents/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/fresp/slipway-agents/compare/v0.5.4...v0.6.0
[0.5.4]: https://github.com/fresp/slipway-agents/compare/v0.5.3...v0.5.4
[0.5.3]: https://github.com/fresp/slipway-agents/compare/v0.5.2...v0.5.3
[0.5.2]: https://github.com/fresp/slipway-agents/compare/v0.5.0...v0.5.2
[0.5.0]: https://github.com/fresp/slipway-agents/compare/v0.4.4...v0.5.0
[0.4.0]: https://github.com/fresp/slipway-agents/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/fresp/slipway-agents/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/fresp/slipway-agents/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/fresp/slipway-agents/compare/v0.0.0...v0.1.0
[0.0.1]: https://github.com/fresp/slipway-agents/releases/tag/v0.0.1

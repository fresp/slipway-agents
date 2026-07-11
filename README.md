# slipway-agents

> Production-grade PRD-to-engineering-docs agents for [OpenCode](https://opencode.ai).

[![npm version](https://img.shields.io/npm/v/slipway-agents?color=0f766e)](https://www.npmjs.com/package/slipway-agents)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![runtime: OpenCode](https://img.shields.io/badge/runtime-OpenCode-111827)](https://opencode.ai)
[![built with TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178c6)](package.json)

[![slipway-agents](https://github.com/fresp/slipway-agents/raw/dev/docs/slipway-agents.png)](https://github.com/fresp/slipway-agents/blob/dev/docs/slipway-agents.png)

slipway-agents is an OpenCode agent system for turning an idea, a PRD, or an existing backend codebase into implementation-ready engineering documentation. It gives coding agents a real runway before they write code: requirements, architecture, service boundaries, data models, APIs, operations, security findings, planning rules, and implementation guardrails.

The project is designed for serious backend and microservice work where one prompt is not enough. A primary orchestrator routes work through focused specialist agents, records state under `.ai/`, validates quality gates, and keeps generated docs synchronized as the project evolves.

```bash
bunx slipway-agents@latest install
```

Restart OpenCode after installation. See the [installation guide](docs/guide/installation.md) for manual setup, provider overrides, verification, and troubleshooting.

---

## Why Slipway

Modern coding agents are strongest when the surrounding engineering context is explicit. slipway-agents builds that context before implementation starts and keeps it alive after code changes.

- **From vague idea to buildable specification**: `chartmaker` turns a raw prompt or partial PRD into `.ai/docs/01-prd.md` with priority ranking.
- **From existing code to architecture knowledge**: `cartographer` reverse-engineers codebases into a documented service model with confidence markers.
- **From PRD to complete engineering pack**: `hullwright` generates docs `02` through `10` plus the target-project `AGENTS.md` implementation contract.
- **From docs to safer execution**: `bosun`, `gunner`, and `coxswain` review consistency, security, testability, operations, and hidden complexity before planning.
- **From reviewed docs to phased work**: `rigger` produces `.ai/planning/` plans with dependencies, sizing, sequencing, and deferred scope.
- **From shipped code back to truth**: `chronicler`, `shipwright`, `surveyor`, and `caulker` help sync docs, extend features, validate schemas, and resolve multi-contributor doc conflicts.

The result is not just generated prose. It is a repeatable engineering workflow that gives Sisyphus / omo.dev-style coding agents the artifacts they need to build, verify, resume, and hand off work without losing architectural intent.

---

## Pipeline

| Stage | Agent | Output |
|---|---|---|
| Orchestrate | `slipway` | Detects intent, reconciles sessions, routes the next step, and enforces pipeline order. |
| PRD | `chartmaker` | Converts a raw idea or partial PRD into `.ai/docs/01-prd.md`. |
| Reverse engineer | `cartographer` | Infers architecture docs from an existing codebase, with confidence markers and gap-fill briefing. |
| Generate docs | `hullwright` | Produces docs `02`-`10` and the target-project `AGENTS.md` contract. |
| Review | `bosun` | Scores cross-doc consistency and returns severity-ranked findings. |
| Groom | `coxswain` | Runs lead-dev, QA, DevOps, and complexity-audit lenses before planning. |
| Security | `gunner` | Audits auth, secrets, attack surface, dependencies, and images; emits PASS / CONDITIONAL / BLOCK. |
| Plan | `rigger` | Creates phased `.ai/planning/` work plans with dependencies, estimates, and deferred scope. |
| Implement | Sisyphus / omo.dev | Uses the generated plan and `AGENTS.md` contract to build with verification gates. |
| Extend | `shipwright` | Scopes new feature requests against existing docs and updates only the impacted artifacts. |
| Sync | `chronicler` | Classifies implementation drift and writes targeted doc patches after code changes. |
| Validate schema | `surveyor` | Compares database schema reality against documented data models. |
| Resolve conflicts | `caulker` | Performs semantic doc conflict resolution across branches or contributors. |

---

## Agent Power

The default roster is tuned by role and model tier in [`slipway.json`](slipway.json). Opus-tier agents handle orchestration, review, security, and conflict resolution; Sonnet-tier agents handle structured generation and planning; Haiku handles fast post-build drift classification.

| Agent | Power | Default model |
|---|---|---|
| `slipway` | Primary orchestrator; routes the whole workflow, enforces step order, and delegates content generation instead of mixing roles. | `claude-opus-4-8` |
| `chartmaker` | Product translator; turns rough intent into a complete PRD with P0/P1/P2 priority ranking. | `claude-sonnet-5` |
| `cartographer` | Codebase mapper; reverse-engineers services, boundaries, APIs, and gaps from existing repositories. | `claude-sonnet-5` |
| `hullwright` | Documentation builder; expands validated requirements into the full engineering documentation suite and implementation contract. | `claude-sonnet-5` |
| `bosun` | Quality gatekeeper; validates doc consistency, traceability, health score, and build readiness. | `claude-opus-4-8` |
| `gunner` | Security gatekeeper; checks auth, secrets, attack surface, dependency/image risk, and blocks unsafe plans. | `claude-opus-4-8` |
| `coxswain` | Grooming lead; synthesizes architecture, QA, DevOps, and complexity perspectives before planning. | `claude-sonnet-5` |
| `rigger` | Planner; converts reviewed docs into phased milestones, dependencies, estimates, and execution constraints. | `claude-sonnet-5` |
| `shipwright` | Change extender; updates PRD and downstream docs for new features without blindly rebuilding everything. | `claude-sonnet-5` |
| `chronicler` | Drift synchronizer; compares implemented code against docs and writes focused sync patches. | `claude-haiku-4-5` |
| `surveyor` | Schema auditor; verifies database schema against documented data-model contracts. | `claude-sonnet-5` |
| `caulker` | Semantic merge specialist; resolves doc conflicts by unit, not by naive line-level merge. | `claude-opus-4-8` |

Model assignments are configurable. Use project-local `slipway.local.json` to override provider/model choices without editing the package defaults.

---

## Skills Included

Specialized skills give the agents repeatable procedures instead of ad-hoc prompting.

| Skill | Used by | Purpose |
|---|---|---|
| `bootstrap-from-prd` | `hullwright` | Generates docs `02`-`10` and `AGENTS.md` from a validated PRD. |
| `groomer-lead-dev` | `coxswain` | Reviews architecture, implementation risk, coupling, and technical debt. |
| `groomer-qa` | `coxswain` | Reviews testability, acceptance criteria, edge cases, and regression risk. |
| `groomer-devops` | `coxswain` | Reviews deployment, observability, environments, and operational constraints. |
| `groomer-complexity-audit` | `coxswain` | Flags hidden coupling, underestimated sizing, and phase splits. |
| `doc-merge-resolution` | `caulker` | Parses docs by semantic unit and classifies divergent changes. |
| `session-log` | `shipwright`, `hullwright`, `chronicler` | Records best-effort `.ai/sessions/` notes for later reconciliation. |
| `learnings-capture` | `slipway` pipeline support | Captures recurring patterns into `.ai/learnings/` memory artifacts. |
| `docs-publish` | docs release workflow | Packages generated docs into publishable technical-reference-document output. |

---

## Generated Project Structure

A complete run writes durable implementation context under `.ai/`, then leaves `AGENTS.md` at the target project root for coding agents.

```text
.ai/
├── docs/
│   ├── .manifest.md
│   ├── 01-prd.md
│   ├── 02-technical-architecture.md
│   ├── 03-service-boundaries.md
│   ├── 04-data-models.md
│   ├── 05-api-specifications.md
│   ├── 06-operational-flows.md
│   ├── 07-engineering-standards.md
│   ├── 08-architecture-decisions.md
│   ├── 09-topology-diagrams.md
│   ├── 10-planning-rules.md
│   ├── 11-security-audit.md
│   ├── .pipeline-state.md
│   └── .pipeline-changelog.md
├── planning/
│   ├── 00-overview.md
│   ├── 01-phase-*.md
│   └── future-scope.md
├── sessions/
│   └── {branch-slug}-{topic-slug}-{timestamp}.md
├── learnings/
│   ├── memory.md
│   ├── promoted.md
│   └── archive.md
└── AGENTS.md
```

`docs/` is the source of truth for requirements and architecture. `planning/` is the execution plan. `sessions/` and `learnings/` preserve incremental context so later runs can resume, reconcile, and improve without starting from zero.

---

## Installation

```bash
bunx slipway-agents@latest install
```

The installer patches OpenCode configuration, copies bundled agents/skills, and installs `slipway.json` when needed. Restart OpenCode, then run a diagnostic:

```bash
bunx slipway-agents@latest doctor
```

Useful package commands for contributors:

```bash
npm run build
npm run typecheck
npm test
```

---

## Usage

Use natural language through the `slipway` orchestrator:

```text
@slipway I want to build a multi-tenant billing service
@slipway reverse-engineer
@slipway new feature: add usage-based invoicing
@slipway plan
@slipway sync docs
@slipway validate schema
```

The pipeline persists state in `.ai/docs/.pipeline-state.md`, so interrupted runs can resume from the last completed step instead of restarting the whole workflow.

---

## Runtime Slash Commands

slipway-agents registers OpenCode slash commands through the plugin `config` hook. No `.opencode/commands/*.md` files are required.

| Command | Purpose |
|---|---|
| `/slipway:init` | Start a new pipeline run from a prompt or existing PRD. |
| `/slipway:task` | Turn any development request into the right docs/plan artifact via full Mode Detection, without executing code. |
| `/slipway:smart` | Same as `/slipway:task`, but resolves convenience decision-points autonomously instead of asking. |
| `/slipway:status` | Show current pipeline state without running a step. |
| `/slipway:resume` | Continue from the last completed pipeline step. |
| `/slipway:doctor` | Run read-only diagnostics for config, docs, state, agents, sessions, and learnings health. |
| `/slipway:agent-refresh` | Regenerate only `AGENTS.md` from current docs. |
| `/slipway:review` | Run Bosun consistency review on existing docs. |
| `/slipway:groom` | Run multi-lens grooming before planning. |
| `/slipway:sync` | Sync docs with implementation reality after a build. |
| `/slipway:learnings-review` | Review pending learnings and choose approve / reject / defer. |

Full reference: [docs/slash-commands.md](docs/slash-commands.md)

---

## Configuration

Default agent models, categories, permissions, and optimization-loop settings live in [`slipway.json`](slipway.json). The schema is published in [`slipway.schema.json`](slipway.schema.json).

Use `slipway.local.json` for project-local overrides. This lets a project swap providers, downgrade/upgrade model tiers, or adjust local runtime settings without changing package defaults.

See [Override models](docs/guide/installation.md#override-models) for examples.

---

## Example Output

A generated example for a subscription-billing SaaS: plans, usage metering, invoices, payment retry/dunning, and single-service scope.

- [`skills/slipway/bootstrap-from-prd/examples/saas-billing/`](skills/slipway/bootstrap-from-prd/examples/saas-billing)

Use it as a reference for the shape and depth of generated docs, not as a template to copy blindly into every project.

---

## Contributing

Contributions should preserve the core contract: Slipway agents document actual implementation reality and never invent architecture to make a project look cleaner than it is.

Before opening a PR:

1. Keep changes scoped to one pipeline behavior, agent contract, skill, or documentation concern.
2. Update docs and changelog entries when behavior or user-facing contracts change.
3. Run `npm run typecheck` and `npm test` when code or schema behavior changes.
4. Keep generated examples consistent with the current artifact names and agent roster.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full contribution guide.

---

## License

MIT

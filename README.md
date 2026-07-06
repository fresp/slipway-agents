[![slipway-agents](https://github.com/fresp/slipway-agents/raw/dev/docs/slipway-agents.png)](https://github.com/fresp/slipway-agents/blob/dev/docs/slipway-agents.png)

> PRD-to-engineering-docs pipeline agents for [OpenCode](https://opencode.ai).

slipway-agents turns a raw idea, existing PRD, or existing backend codebase into structured engineering docs for OpenCode. One orchestrator coordinates specialized subagents so AI coding agents understand cross-service architecture, service boundaries, data models, APIs, operational flows, planning constraints, and implementation guardrails before they build or extend backend and microservice systems.

```bash
bunx slipway-agents@latest install
```

Restart OpenCode. See the [installation guide](docs/guide/installation.md) for details, options, verification, and troubleshooting.

---

## How it works

[![slipway-agents pipeline](https://github.com/fresp/slipway-agents/raw/dev/docs/pipeline.png)](https://github.com/fresp/slipway-agents/blob/dev/docs/pipeline.png)

| Stage | Agent | What happens |
|---|---|---|
| Input | `slipway` | Reconciles sessions, detects intent, and routes the next pipeline step. |
| Reverse-engineer | `cartographer` | Existing codebase in → inferred docs `02`–`10` + gap-fill briefing out. |
| PRD | `chartmaker` | Raw idea or partial PRD in → complete `01-prd.md` out. |
| Docs | `hullwright` | Validated PRD in → docs `02`–`10` + target-project `AGENT.md` out. |
| Review | `bosun` | Cross-doc consistency check → health score + severity-ranked findings. |
| Grooming | `coxswain` | Planning or pre-build checkpoint → Lead Dev, QA, DevOps, and complexity synthesis. |
| Security | `gunner` | Auth, secrets, attack surface, and dependency audit → PASS / CONDITIONAL / BLOCK. |
| Plan | `rigger` | Reviewed docs in → phased `.ai/planning/` plan with dependencies and estimate. |
| Build | Sisyphus / omo.dev | Planning docs in → implementation with the Execution Verification Gate recorded. |
| Extend | `shipwright` | New feature request in → scoped PRD update + targeted doc rebuild. |
| Sync | `chronicler` | Implemented code in → docs drift classification and incremental patches. |
| Schema | `surveyor` | DB schema validation request → schema/data-model consistency report. |
| Conflicts | `caulker` | Multi-contributor doc conflict → structural resolution or escalation. |

For full behavior, see [`CHANGELOG.md`](CHANGELOG.md) and the relevant files in [`subagents/`](subagents/).

---

## Agents

| Agent | Trigger/context → output | Model |
|---|---|---|
| `slipway` | Any `@slipway` intent → routed pipeline step with state and gate enforcement. | `claude-opus-4-8` |
| `chartmaker` | Raw idea or partial PRD → complete `.ai/docs/01-prd.md`. | `claude-sonnet-5` |
| `cartographer` | Existing codebase with missing docs → inferred `.ai/docs/` suite with confidence markers. | `claude-sonnet-5` |
| `hullwright` | Validated PRD → full engineering doc suite `02`–`10` + `AGENT.md`. | `claude-sonnet-5` |
| `bosun` | Generated docs and `AGENT.md` → health score + severity-ranked findings. | `claude-opus-4-8` |
| `gunner` | Reviewed docs → `.ai/docs/11-security-audit.md` + security gate signal. | `claude-opus-4-8` |
| `coxswain` | Planning/build readiness checkpoint → grooming synthesis across four lenses. | `claude-sonnet-5` |
| `rigger` | Security-cleared docs → phased plan, dependency graph, and time/cost estimate. | `claude-sonnet-5` |
| `shipwright` | New feature against existing docs → scoped PRD/doc updates. | `claude-sonnet-5` |
| `surveyor` | `@slipway validate schema` → DB schema vs data model consistency report. | `claude-sonnet-5` |
| `chronicler` | Post-implementation sync request → drift classification + doc patches. | `claude-haiku-4-5` |
| `caulker` | Multi-contributor docs conflict → semantic merge resolution or escalation. | `claude-opus-4-8` |

Model assignments live in [`slipway.json`](slipway.json). See [Overriding models](#overriding-models) for provider customization.

---

## Skills

| Skill | Used by | What it does |
|---|---|---|
| `bootstrap-from-prd` | `hullwright` | PRD → docs `02`–`10` + `AGENT.md`. |
| `groomer-lead-dev` | `coxswain` | Architecture, implementation risk, and tech-debt lens. |
| `groomer-qa` | `coxswain` | Testability, edge cases, and acceptance-criteria lens. |
| `groomer-devops` | `coxswain` | Infrastructure, deployment, and observability lens. |
| `groomer-complexity-audit` | `coxswain` | Hidden coupling, sizing, and phase-split lens. |
| `doc-merge-resolution` | `caulker` | Section-level doc unit parsing and divergence classification. |
| `session-log` | `shipwright`, `hullwright`, `chronicler` | Passive `.ai/sessions/` notes for later reconciliation. |

---

## What gets generated

A full run writes the implementation context under `.ai/`, then leaves the target-project `AGENT.md` for coding agents.

```
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
└── AGENT.md
```

`docs/` holds the PRD, architecture, audit, state, and changelog artifacts. `planning/` holds the phased implementation plan and deferred scope when needed. `sessions/` holds best-effort notes that STEP 0 can reconcile across branches.

---

## Install

```bash
bunx slipway-agents@latest install
```

Restart OpenCode. See the [installation guide](docs/guide/installation.md) for manual setup, provider configuration, verification, and troubleshooting.

---

## Usage

```text
@slipway I want to build [your idea]
@slipway reverse-engineer
@slipway new feature: [feature description]
@slipway plan
@slipway sync docs
@slipway validate schema
```

slipway persists state in `.ai/docs/.pipeline-state.md`, so interrupted runs can resume from the last completed step.

---

## Slash commands

| Command | What it does |
|---|---|
| `/slipway:init` | Start a new pipeline run. |
| `/slipway:status` | Show current pipeline and implementation state without running anything. |
| `/slipway:resume` | Resume from the last completed step. |
| `/slipway:doctor` | Run read-only diagnostics for config, docs, state, agents, and session reconciliation. |

Full reference: [docs/slash-commands.md](docs/slash-commands.md)

---

## Overriding models

Use project-local `slipway.local.json` to override the default model assignments from [`slipway.json`](slipway.json). See the [installation guide](docs/guide/installation.md#override-models) for the full schema and provider examples.

---

## Examples

- [`skills/slipway/bootstrap-from-prd/examples/managed-waba/`](skills/slipway/bootstrap-from-prd/examples/managed-waba) — full pipeline output for a multi-tenant WhatsApp Business Calling service.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

MIT

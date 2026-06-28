# slipway-agents

> PRD-to-engineering-docs pipeline agents for [OpenCode](https://opencode.ai).

slipway-agents takes a raw product idea or existing PRD and drives it through a structured, multi-agent pipeline — brainstorm → engineering docs → security audit → phased planning → cost estimate → sprint grooming → build → post-implementation sync. One orchestrator (`slipway`) coordinates ten specialized subagents.

---

## How it works

[![slipway-agents pipeline](https://github.com/fresp/slipway-agents/raw/dev/docs/pipeline.svg)](https://github.com/fresp/slipway-agents/blob/dev/docs/pipeline.svg)

**Pipeline stages**

| Stage            | Agent              | What happens                                                                  |
| ---------------- | ------------------ | ----------------------------------------------------------------------------- |
| **Input**        | `slipway`          | Detects mode: bootstrap from prompt, bootstrap from PRD, extend, or sync      |
| **PRD**          | `drafting-table`   | Structured Q&A → complete `01-prd.md` (8 required sections, gap-fill loop)    |
| **Docs**         | `hull-builder`     | Invokes `bootstrap-from-prd` skill → docs `02`–`10` + `AGENT.md`              |
| **Review**       | `inspector`        | Cross-doc validation, per-doc health scores, severity-ranked findings 0–100   |
| **Review**       | optimize loop      | Up to 2 cycles to resolve Critical findings before continuing                 |
| **Security**     | `security-auditor` | Auth, secrets, attack surface audit — PASS / CONDITIONAL / BLOCK gate         |
| **Plan**         | `rigger`           | Phase breakdown → `.ai/planning/` with S/M/L sizing and dependency graph      |
| **Estimate**     | `estimator`        | Time and cost forecast per phase, critical path, unrealistic phase flags      |
| **Grooming**     | `groomer`          | Lead Dev + QA + DevOps lenses → unified synthesis report + readiness signal   |
| **Build**        | Sisyphus / omo.dev | Implements based on `AGENT.md` + planning docs                                |
| **Extend**       | `shipwright`       | New feature arrives → scoped PRD update + targeted doc rebuild                |
| **Sync**         | `chronicler`       | Post-build drift detection → DRIFT / INTENTIONAL / UNKNOWN classification     |
| **Sync**         | `schema-validator` | DB schema vs `04-data-models.md` consistency check                            |

---

## Agents

| Agent              | Role                                                                           | Model               |
| ------------------ | ------------------------------------------------------------------------------ | ------------------- |
| `slipway`          | Orchestrator — routes pipeline, enforces step order, never generates content   | `claude-opus-4-6`   |
| `drafting-table`   | Raw prompt / partial PRD → complete `.ai/docs/01-prd.md`                       | `claude-sonnet-4-6` |
| `hull-builder`     | Invokes `bootstrap-from-prd` skill → docs 02–10 + `AGENT.md`                  | `claude-sonnet-4-6` |
| `inspector`        | Cross-doc validation + per-doc health score breakdown + severity-ranked findings | `claude-opus-4-6`   |
| `security-auditor` | Auth, secrets, and attack surface audit across five lenses                     | `claude-opus-4-6`   |
| `groomer`          | Sprint grooming — Lead Dev, QA, DevOps lenses + cross-lens synthesis           | `claude-sonnet-4-6` |
| `rigger`           | Phase/milestone breakdown → `.ai/planning/` with sizing and dependency graph   | `claude-sonnet-4-6` |
| `estimator`        | Time and cost forecast per phase based on `.ai/planning/`                      | `claude-sonnet-4-6` |
| `shipwright`       | Extend existing docs when a new feature is introduced                          | `claude-sonnet-4-6` |
| `schema-validator` | Post-implementation DB schema vs data model consistency check                  | `claude-sonnet-4-6` |
| `chronicler`       | Post-implementation doc sync — classify drift, patch docs incrementally        | `claude-haiku-4-5`  |

Model assignments live in [`slipway.json`](slipway.json) and are enforced at runtime by the slipway-agents plugin. See [Overriding models](#overriding-models).

---

## Skills

| Skill                | Used by        | Purpose                                                        |
| -------------------- | -------------- | -------------------------------------------------------------- |
| `bootstrap-from-prd` | `hull-builder` | Generates the full 02–10 doc suite + `AGENT.md` from a PRD    |
| `groomer-lead-dev`   | `groomer`      | Lead Dev lens — architecture, implementation risk, tech debt   |
| `groomer-qa`         | `groomer`      | QA lens — testability, edge cases, acceptance criteria gaps    |
| `groomer-devops`     | `groomer`      | DevOps/Cloud lens — infra, deployment, observability readiness |

---

## What gets generated

A single pipeline run from a raw idea produces:

```
.ai/
├── docs/
│   ├── 01-prd.md                          ← product requirements (drafting-table)
│   ├── 02-technical-architecture.md        ┐
│   ├── 03-service-boundaries.md            │
│   ├── 04-data-models.md                   │
│   ├── 05-api-specifications.md            ├─ hull-builder via bootstrap-from-prd skill
│   ├── 06-operational-flows.md             │
│   ├── 07-engineering-standards.md         │
│   ├── 08-architecture-decisions.md        │
│   ├── 09-topology-diagrams.md             │
│   ├── 10-planning-rules.md               ┘
│   ├── .pipeline-state.md                 ← resume state across sessions
│   └── .pipeline-changelog.md             ← audit trail of every pipeline run
├── planning/
│   ├── 00-overview.md                     ┐ dependency graph + critical path
│   ├── 01-phase-*.md                      ├─ rigger — S/M/L sizing, parallel flags,
│   └── ...                               ┘ context load hints per task
└── AGENT.md                               ← implementation instructions for Sisyphus
```

---

## Install

**Quick install — let an agent do it:**

```
Install and configure slipway-agents by following the instructions here:
https://raw.githubusercontent.com/fresp/slipway-agents/refs/heads/main/docs/guide/installation.md
```

**Manual install:**

```bash
git clone https://github.com/fresp/slipway-agents ~/.config/opencode/agents/slipway-agents
```

Add to `opencode.json`:

```json
{
  "agents": {
    "include": ["~/.config/opencode/agents/slipway-agents"]
  }
}
```

**With plugin model enforcement (recommended):**

```json
{
  "plugin": ["slipway-agents@latest"]
}
```

This registers the slipway-agents plugin, which reads `slipway.json` from your project root at startup and enforces model assignments per agent at runtime. Edit `slipway.json` to change models — no other files need to be touched.

Full guide: [docs/guide/installation.md](docs/guide/installation.md)

---

## Usage

```
# From a raw idea
@slipway I want to build [your idea]

# From an existing PRD
@slipway bootstrap from .ai/docs/01-prd.md

# Add a new feature to an existing project
@slipway new feature: [feature description]

# Review docs without running the full pipeline
@slipway review

# Sprint grooming (Lead Dev, QA, DevOps lenses)
@slipway groom this

# Generate a phased implementation plan
@slipway plan

# Security audit only
@slipway security audit

# Estimate time and cost from existing plan
@slipway estimate

# Sync docs after implementation
@slipway sync docs

# Validate DB schema against data models
@slipway validate schema
```

slipway walks you through each step with a `yes / no` prompt — you never need to remember which subagent to call next. State is persisted to `.ai/docs/.pipeline-state.md` so interrupted runs resume from the last completed step.

---

## Overriding models

Copy `slipway.json` to your project root and edit it. The plugin picks it up automatically on next session start.

```jsonc
// slipway.local.json — takes precedence over slipway.json
{
  "$schema": "https://raw.githubusercontent.com/fresp/slipway-agents/refs/heads/main/slipway.schema.json",
  "version": "1.1.0",
  "agents": {
    "slipway":          { "model": "amazon-bedrock/us.anthropic.claude-opus-4-6",   "fallback_model": "amazon-bedrock/us.anthropic.claude-sonnet-4-6" },
    "inspector":        { "model": "amazon-bedrock/us.anthropic.claude-opus-4-6",   "fallback_model": "amazon-bedrock/us.anthropic.claude-sonnet-4-6" },
    "security-auditor": { "model": "amazon-bedrock/us.anthropic.claude-opus-4-6",   "fallback_model": "amazon-bedrock/us.anthropic.claude-sonnet-4-6" },
    "drafting-table":   { "model": "amazon-bedrock/us.anthropic.claude-sonnet-4-6", "fallback_model": "amazon-bedrock/us.anthropic.claude-haiku-4-5" },
    "hull-builder":     { "model": "amazon-bedrock/us.anthropic.claude-sonnet-4-6", "fallback_model": "amazon-bedrock/us.anthropic.claude-haiku-4-5" },
    "groomer":          { "model": "amazon-bedrock/us.anthropic.claude-sonnet-4-6", "fallback_model": "amazon-bedrock/us.anthropic.claude-haiku-4-5" },
    "rigger":           { "model": "amazon-bedrock/us.anthropic.claude-sonnet-4-6", "fallback_model": "amazon-bedrock/us.anthropic.claude-haiku-4-5" },
    "estimator":        { "model": "amazon-bedrock/us.anthropic.claude-sonnet-4-6", "fallback_model": "amazon-bedrock/us.anthropic.claude-haiku-4-5" },
    "shipwright":       { "model": "amazon-bedrock/us.anthropic.claude-sonnet-4-6", "fallback_model": "amazon-bedrock/us.anthropic.claude-haiku-4-5" },
    "schema-validator": { "model": "amazon-bedrock/us.anthropic.claude-sonnet-4-6", "fallback_model": "amazon-bedrock/us.anthropic.claude-haiku-4-5" },
    "chronicler":       { "model": "amazon-bedrock/us.anthropic.claude-haiku-4-5",  "fallback_model": "amazon-bedrock/us.anthropic.claude-sonnet-4-6" }
  }
}
```

`fallback_model` is used automatically if the primary model is unavailable — no manual intervention needed. See [installation guide](docs/guide/installation.md) for all supported providers.

---

## Examples

- [`skills/slipway/bootstrap-from-prd/examples/managed-waba/`](skills/slipway/bootstrap-from-prd/examples/managed-waba) — full pipeline output for a multi-tenant WhatsApp Business Calling service (Kamailio → Asterisk → WebRTC, MongoDB + Redis, multi-tenant SIP gateway)

---

## What's new in v1.1.0

- **Three new agents** — `security-auditor`, `estimator`, `schema-validator`
- **Agent upgrades** — `inspector` (per-doc health scores, Opus model), `rigger` (S/M/L sizing, dependency graph, stale check), `groomer` (cross-lens synthesis), `chronicler` (DRIFT/INTENTIONAL/UNKNOWN classification)
- **Plugin model enforcement** — `slipway.json` model assignments are now enforced at runtime via the OpenCode plugin system, not just documentation
- **`fallback_model` support** — automatic fallback per agent when the primary model is unavailable
- All user-facing strings are now English only

See [CHANGELOG.md](CHANGELOG.md) for the full list.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

MIT

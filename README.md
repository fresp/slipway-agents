[![slipway-agents](https://github.com/fresp/slipway-agents/raw/dev/docs/slipway-agents.png)](https://github.com/fresp/slipway-agents/blob/dev/docs/slipway-agents.png)


> PRD-to-engineering-docs pipeline agents for [OpenCode](https://opencode.ai).

slipway-agents takes a raw product idea or existing PRD and drives it through a structured, multi-agent pipeline — brainstorm → engineering docs → security audit → phased planning → cost estimate → sprint grooming → build → post-implementation sync. One orchestrator (`slipway`) coordinates eleven specialized subagents.

---

## How it works

[![slipway-agents pipeline](https://github.com/fresp/slipway-agents/raw/dev/docs/pipeline.png)](https://github.com/fresp/slipway-agents/blob/dev/docs/pipeline.png)

**Pipeline stages**

| Stage                | Agent              | What happens                                                                       |
| -------------------- | ------------------ | ---------------------------------------------------------------------------------- |
| **Input**            | `slipway`          | Detects mode: bootstrap, reverse-engineer, extend, or sync                         |
| **Reverse-engineer** | `cartographer`     | Scans existing codebase → inferred docs 02–10 + gap-fill briefing for chartmaker   |
| **PRD**              | `chartmaker`       | Structured Q&A → complete `01-prd.md` with P0/P1/P2 priority ranking              |
| **Docs**             | `hullwright`     | Invokes `bootstrap-from-prd` skill → docs `02`–`10` + `AGENT.md`                  |
| **Review**           | `bosun`            | Cross-doc validation, per-doc health scores, severity-ranked findings 0–100        |
| **Review**           | optimize loop      | Up to 2 cycles to resolve Critical findings before continuing                      |
| **Security**         | `gunner`           | Auth, secrets, attack surface audit — PASS / CONDITIONAL / BLOCK gate              |
| **Plan**             | `rigger`           | Phase breakdown → `.ai/planning/` with S/M/L sizing and dependency graph           |
| **Estimate**         | `purser`           | Time and cost forecast per phase, critical path, unrealistic phase flags           |
| **Grooming**         | `coxswain`         | Lead Dev + QA + DevOps + Complexity Audit lenses → unified synthesis report        |
| **Build**            | Sisyphus / omo.dev | Implements based on `AGENT.md` + planning docs                                     |
| **Extend**           | `shipwright`       | New feature arrives → scoped PRD update + targeted doc rebuild                     |
| **Sync**             | `chronicler`       | Post-build drift detection → DRIFT / INTENTIONAL / UNKNOWN classification          |
| **Sync**             | `surveyor`         | DB schema vs `04-data-models.md` consistency check                                 |

---

## Agents

| Agent          | Role                                                                              | Model               |
| -------------- | --------------------------------------------------------------------------------- | ------------------- |
| `slipway`      | Orchestrator — routes pipeline, enforces step order, never generates content      | `claude-opus-4-6`   |
| `chartmaker`   | Raw prompt / partial PRD → complete `.ai/docs/01-prd.md` with P0/P1/P2 ranking   | `claude-sonnet-4-6` |
| `cartographer` | Reverse-engineers existing codebase → `.ai/docs/` with confidence markers         | `claude-sonnet-4-6` |
| `hullwright` | Invokes `bootstrap-from-prd` skill → docs 02–10 + `AGENT.md`                     | `claude-sonnet-4-6` |
| `bosun`        | Cross-doc validation + per-doc health score breakdown + severity-ranked findings  | `claude-opus-4-6`   |
| `gunner`       | Auth, secrets, and attack surface audit across five lenses                        | `claude-opus-4-6`   |
| `coxswain`     | Sprint grooming — Lead Dev, QA, DevOps, Complexity Audit lenses + synthesis       | `claude-sonnet-4-6` |
| `rigger`       | Phase/milestone breakdown → `.ai/planning/` with sizing and dependency graph      | `claude-sonnet-4-6` |
| `purser`       | Time and cost forecast per phase based on `.ai/planning/`                         | `claude-sonnet-4-6` |
| `shipwright`   | Extend existing docs when a new feature is introduced                             | `claude-sonnet-4-6` |
| `surveyor`     | Post-implementation DB schema vs data model consistency check                     | `claude-sonnet-4-6` |
| `chronicler`   | Post-implementation doc sync — classify drift, patch docs incrementally           | `claude-haiku-4-5`  |

Model assignments live in [`slipway.json`](slipway.json) and are enforced at runtime by the slipway-agents plugin. See [Overriding models](#overriding-models).

---

## Skills

| Skill                | Used by        | Purpose                                                        |
| -------------------- | -------------- | -------------------------------------------------------------- |
| `bootstrap-from-prd` | `hullwright` | Generates the full 02–10 doc suite + `AGENT.md` from a PRD    |
| `groomer-lead-dev`   | `coxswain`     | Lead Dev lens — architecture, implementation risk, tech debt   |
| `groomer-qa`         | `coxswain`     | QA lens — testability, edge cases, acceptance criteria gaps    |
| `groomer-devops`     | `coxswain`     | DevOps/Cloud lens — infra, deployment, observability readiness |

---

## What gets generated

A single pipeline run from a raw idea produces:

```
.ai/
├── docs/
│   ├── 01-prd.md                          ← product requirements (chartmaker)
│   ├── 02-technical-architecture.md        ┐
│   ├── 03-service-boundaries.md            │
│   ├── 04-data-models.md                   │
│   ├── 05-api-specifications.md            ├─ hullwright via bootstrap-from-prd skill
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

# Reverse-engineer an existing codebase into AI docs
@slipway reverse-engineer

# Add a new feature to an existing project
@slipway new feature: [feature description]

# Review docs without running the full pipeline
@slipway review

# Sprint grooming (Lead Dev, QA, DevOps, Complexity Audit lenses)
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

## Slash commands

| Command | What it does |
|---------|-------------|
| `/slipway-init` | Initialize slipway in a new project — creates `.ai/` directories and state files |
| `/slipway-status` | Show current pipeline and implementation state without running anything |
| `/slipway-resume` | Resume an interrupted pipeline from the last completed step |

Full reference: [docs/slash-commands.md](docs/slash-commands.md)

---

## Overriding models

Copy `slipway.json` to your project root and edit it. The plugin picks it up automatically on next session start.

```jsonc
// slipway.local.json — takes precedence over slipway.json
{
  "$schema": "https://raw.githubusercontent.com/fresp/slipway-agents/refs/heads/main/slipway.schema.json",
  "version": "0.5.2",
  "agents": {
    "slipway":      { "model": "amazon-bedrock/us.anthropic.claude-opus-4-6",   "fallback_model": "amazon-bedrock/us.anthropic.claude-sonnet-4-6" },
    "chartmaker":   { "model": "amazon-bedrock/us.anthropic.claude-sonnet-4-6", "fallback_model": "amazon-bedrock/us.anthropic.claude-haiku-4-5" },
    "cartographer": { "model": "amazon-bedrock/us.anthropic.claude-sonnet-4-6", "fallback_model": "amazon-bedrock/us.anthropic.claude-haiku-4-5" },
    "hullwright": { "model": "amazon-bedrock/us.anthropic.claude-sonnet-4-6", "fallback_model": "amazon-bedrock/us.anthropic.claude-haiku-4-5" },
    "bosun":        { "model": "amazon-bedrock/us.anthropic.claude-opus-4-6",   "fallback_model": "amazon-bedrock/us.anthropic.claude-sonnet-4-6" },
    "gunner":       { "model": "amazon-bedrock/us.anthropic.claude-opus-4-6",   "fallback_model": "amazon-bedrock/us.anthropic.claude-sonnet-4-6" },
    "coxswain":     { "model": "amazon-bedrock/us.anthropic.claude-sonnet-4-6", "fallback_model": "amazon-bedrock/us.anthropic.claude-haiku-4-5" },
    "rigger":       { "model": "amazon-bedrock/us.anthropic.claude-sonnet-4-6", "fallback_model": "amazon-bedrock/us.anthropic.claude-haiku-4-5" },
    "purser":       { "model": "amazon-bedrock/us.anthropic.claude-sonnet-4-6", "fallback_model": "amazon-bedrock/us.anthropic.claude-haiku-4-5" },
    "shipwright":   { "model": "amazon-bedrock/us.anthropic.claude-sonnet-4-6", "fallback_model": "amazon-bedrock/us.anthropic.claude-haiku-4-5" },
    "surveyor":     { "model": "amazon-bedrock/us.anthropic.claude-sonnet-4-6", "fallback_model": "amazon-bedrock/us.anthropic.claude-haiku-4-5" },
    "chronicler":   { "model": "amazon-bedrock/us.anthropic.claude-haiku-4-5",  "fallback_model": "amazon-bedrock/us.anthropic.claude-sonnet-4-6" }
  }
}
```

`fallback_model` is used automatically if the primary model is unavailable — no manual intervention needed. See [installation guide](docs/guide/installation.md) for all supported providers.

---

## Examples

- [`skills/slipway/bootstrap-from-prd/examples/managed-waba/`](skills/slipway/bootstrap-from-prd/examples/managed-waba) — full pipeline output for a multi-tenant WhatsApp Business Calling service (Kamailio → Asterisk → WebRTC, MongoDB + Redis, multi-tenant SIP gateway)

---

## What's new in v0.5.2

- **Correct runtime registration** — agents are now registered via the OpenCode `config` hook (mutating `input.agent`) rather than the non-existent `client.config.patch()`. Model assignments are read from `~/.config/opencode/slipway.json` (global config); `slipway.local.json` takes precedence. Still zero disk writes.
- **Simpler installer** — `slipway-agents` (the `bunx`/`npx` installer) no longer does a `git clone`. It only adds the plugin to `~/.config/opencode/opencode.json` and copies `slipway.json` from the installed npm package to `~/.config/opencode/`.

## What's new in v0.5.0

- **Single package** — the monorepo is gone. The standalone `slipway-agents-plugin` package has been merged into `slipway-agents`, which is now both the agent framework and the OpenCode plugin. Install one package, reference one plugin: `"plugin": ["slipway-agents@latest"]`.
- **Pure runtime agent registration** — the plugin registers agents directly into the OpenCode runtime via `client.config.patch()` with zero disk writes. Agents load from the bundled `subagents/*.md` and pick up model assignments from `slipway.json` at startup.

## What's new in v0.4.0

- **Nautical rename** — six agents renamed for thematic consistency: `drafting-table→chartmaker`, `inspector→bosun`, `groomer→coxswain`, `estimator→purser`, `security-auditor→gunner`, `schema-validator→surveyor`
- **`cartographer`** — new agent that reverse-engineers an existing codebase into `.ai/docs/` with confidence markers (`[INFERRED]`, `[PARTIAL]`, `[TEMPLATE]`, `[ASSUMED]`) so the full pipeline can run on a project that has code but no docs
- **`reverse-engineer` mode** — new pipeline mode triggered automatically when `.ai/docs/` is absent and a root manifest is detected; routes through cartographer → chartmaker (gap-fill only) → bosun (relaxed 60-point threshold) → standard pipeline

## What's new in v0.3.0

- **Stakeholder Priority (P0/P1/P2)** — chartmaker now assigns priority tiers to every functional requirement. Rigger uses these tiers to order phases (P0 must ship in Phase 1–2, P2 is deferred to `future-scope.md`). Bosun validates that every FR-ID has a priority tag.
- **Proactive ADR conflict guard** — shipwright now runs a pre-flight scan against `08-architecture-decisions.md` before any Q&A, surfacing conflicts before feature scoping begins rather than mid-process.
- **Slash commands** — `/slipway-init`, `/slipway-status`, `/slipway-resume` registered in OpenCode for quick access without remembering trigger phrases.
- **Dynamic doc awareness in bosun** — bosun now reads the canonical doc list from `10-planning-rules.md` instead of hardcoding `02–10`, so dynamic docs (`11-*.md`) are always included in the audit scope.
- **`slipway.local.json` support** — create `slipway.local.json` in any project root to override model assignments without modifying the shared `slipway.json`.

---

## What's new in v0.2.0

- **Runtime Capabilities in AGENT.md** — hullwright now generates a `## Runtime Capabilities` section declaring exactly what tools the implementing agent is permitted to use (file write scope, bash commands, network policy, package installation) and what requires human confirmation before proceeding
- **Escalation Protocol in AGENT.md** — AGENT.md now includes a structured `## Escalation Protocol` specifying when to halt vs. retry, the four-step escalation procedure, and a one-retry policy with explicit logging
- **Verification fields on every task** — rigger task entries now include `Expected output` (the concrete artifact produced), `Verify command` (shell command to confirm completion), and `Test command` (scoped test suite)
- **Implementation state tracking** — orchestrator now manages `.ai/implementation-state.md` tracking per-phase progress, blocked task log, and test results across sessions
- **Parallelism semantics clarified** — `Parallel: true/false` is a planning signal, not a concurrency directive; sequential execution is always correct; parallel dispatch is an optimization for multi-agent runtimes like omo.dev
- **Test results in pipeline completion report** — full pipeline run now reports test pass/fail alongside planning and grooming results

See [CHANGELOG.md](CHANGELOG.md) for the full list.

## What's new in v0.1.0

- **Three new agents** — `gunner`, `purser`, `surveyor`
- **Agent upgrades** — `bosun` (per-doc health scores, Opus model), `rigger` (S/M/L sizing, dependency graph, stale check), `coxswain` (cross-lens synthesis), `chronicler` (DRIFT/INTENTIONAL/UNKNOWN classification)
- **Plugin model enforcement** — `slipway.json` model assignments are now enforced at runtime via the OpenCode plugin system, not just documentation
- **`fallback_model` support** — automatic fallback per agent when the primary model is unavailable

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

MIT

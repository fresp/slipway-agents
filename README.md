[![slipway-agents](https://github.com/fresp/slipway-agents/raw/dev/docs/slipway-agents.png)](https://github.com/fresp/slipway-agents/blob/dev/docs/slipway-agents.png)


> PRD-to-engineering-docs pipeline agents for [OpenCode](https://opencode.ai).

slipway-agents takes a raw product idea or existing PRD and drives it through a structured, multi-agent pipeline — brainstorm → engineering docs → review/optimize → sprint grooming checkpoint → security audit → phased planning → pre-build grooming → build → post-implementation sync. One orchestrator (`slipway`) coordinates eleven specialized subagents.

---

## How it works

[![slipway-agents pipeline](https://github.com/fresp/slipway-agents/raw/dev/docs/pipeline.png)](https://github.com/fresp/slipway-agents/blob/dev/docs/pipeline.png)

**Pipeline stages**

| Stage                | Agent              | What happens                                                                       |
| -------------------- | ------------------ | ---------------------------------------------------------------------------------- |
| **Input**            | `slipway`          | Runs STEP 0 session reconciliation, then detects mode: bootstrap, reverse-engineer, extend, or sync |
| **Reverse-engineer** | `cartographer`     | Scans existing codebase → inferred docs 02–10 + gap-fill briefing for chartmaker   |
| **PRD**              | `chartmaker`       | Structured Q&A → complete `01-prd.md` with P0/P1/P2 priority ranking              |
| **Docs**             | `hullwright`     | Invokes `bootstrap-from-prd` skill → docs `02`–`10` + `AGENT.md` |
| **Review**           | `bosun`            | Cross-doc + `AGENT.md` contract validation, per-doc health scores, severity-ranked findings 0–100 |
| **Review**           | optimize loop      | Up to 2 cycles to resolve Critical findings before continuing                      |
| **Grooming**         | `coxswain`         | First Lead Dev + QA + DevOps + Complexity Audit checkpoint before security and planning |
| **Security**         | `gunner`           | Auth, secrets, attack surface audit — PASS / CONDITIONAL / BLOCK gate              |
| **Plan**             | `rigger`           | Phase breakdown → `.ai/planning/` with S/M/L sizing, dependency graph, Flow Graph-aware ordering, and time/cost estimate |
| **Grooming**         | `coxswain`         | Pre-build Lead Dev + QA + DevOps + Complexity Audit synthesis after planning        |
| **Build**            | Sisyphus / omo.dev | Implements based on `AGENT.md` + planning docs, recording the Execution Verification Gate before completion |
| **Extend**           | `shipwright`       | New feature arrives → scoped PRD update + targeted doc rebuild                     |
| **Sync**             | `chronicler`       | Post-build drift detection → DRIFT / INTENTIONAL / UNKNOWN classification          |
| **Sync**             | `surveyor`         | Run `@slipway validate schema` separately if DB schema validation is needed              |
| **Resolve Conflicts** | `caulker` | Post-merge semantic conflict detection and resolution across docs and `AGENT.md`; also supports STEP 0 headless reconciliation |

After a multi-contributor merge or rebase touches `.ai/docs/` or `AGENT.md`, run `@slipway resolve-conflicts` to have `caulker` catch and resolve semantic conflicts that a clean git merge doesn't flag. Generated operational-flow docs now include Flow Graph tables, and post-build sync preserves verification-gate context from implementation records.

---

## Agents

| Agent          | Role                                                                              | Model               |
| -------------- | --------------------------------------------------------------------------------- | ------------------- |
| `slipway`      | Orchestrator — routes pipeline, enforces step order, never generates content      | `claude-opus-4-8`   |
| `chartmaker`   | Raw prompt / partial PRD → complete `.ai/docs/01-prd.md` with P0/P1/P2 ranking   | `claude-sonnet-5` |
| `cartographer` | Reverse-engineers existing codebase → `.ai/docs/` with confidence markers         | `claude-sonnet-5` |
| `hullwright` | Invokes `bootstrap-from-prd` skill → docs 02–10 + `AGENT.md` | `claude-sonnet-5` |
| `bosun`        | Cross-doc + `AGENT.md` contract validation, per-doc health scores, severity-ranked findings | `claude-opus-4-8`   |
| `gunner`       | Auth, secrets, and attack surface audit across five lenses                        | `claude-opus-4-8`   |
| `coxswain`     | Sprint grooming — Lead Dev, QA, DevOps, Complexity Audit lenses + synthesis       | `claude-sonnet-5` |
| `rigger`       | Phase/milestone breakdown → `.ai/planning/` with sizing, dependency graph, and time/cost estimate | `claude-sonnet-5` |
| `shipwright`   | Extend existing docs when a new feature is introduced                             | `claude-sonnet-5` |
| `surveyor`     | Post-implementation DB schema vs data model consistency check — standalone only (`@slipway validate schema`) | `claude-sonnet-5` |
| `chronicler`   | Post-implementation doc sync — classify drift, patch docs incrementally           | `claude-haiku-4-5`  |
| `caulker` | Resolves conflicts in `.ai/docs/` and `AGENT.md` after multi-contributor merges — section-level semantic comparison, never silently resolves true contradictions | `claude-opus-4-8` |

Model assignments live in [`slipway.json`](slipway.json) and are enforced at runtime by the slipway-agents plugin. See [Overriding models](#overriding-models).

---

## Skills

| Skill                | Used by        | Purpose                                                        |
| -------------------- | -------------- | -------------------------------------------------------------- |
| `bootstrap-from-prd` | `hullwright` | Generates the full 02–10 doc suite + `AGENT.md` from a PRD    |
| `groomer-lead-dev`   | `coxswain`     | Lead Dev lens — architecture, implementation risk, tech debt   |
| `groomer-qa`         | `coxswain`     | QA lens — testability, edge cases, acceptance criteria gaps    |
| `groomer-devops`     | `coxswain`     | DevOps/Cloud lens — infra, deployment, observability readiness |
| `groomer-complexity-audit` | `coxswain` | Complexity Audit lens — sizing red flags, hidden phase coupling, phase-split signals |
| `doc-merge-resolution` | `caulker`    | Per-doc-type unit parsing + divergence classification rules for semantic conflict resolution |
| `session-log` | `shipwright`, `hullwright`, `chronicler` | Writes passive per-session `.ai/sessions/` notes for future cross-branch reconciliation |

---

## What gets generated

A single pipeline run from a raw idea produces:

```
.ai/
├── docs/
│   ├── .manifest.md                       ← doc suite manifest — which docs exist and why (hullwright)
│   ├── 01-prd.md                          ← product requirements (chartmaker)
│   ├── 02-technical-architecture.md        ┐
│   ├── 03-service-boundaries.md            │
│   ├── 04-data-models.md                   │
│   ├── 05-api-specifications.md            ├─ hullwright via bootstrap-from-prd skill
│   ├── 06-operational-flows.md             │ (09 may be omitted for single-service
│   ├── 07-engineering-standards.md         │  systems — recorded in .manifest.md)
│   ├── 08-architecture-decisions.md        │
│   ├── 09-topology-diagrams.md             │
│   ├── 10-planning-rules.md               ┘
│   ├── .pipeline-state.md                 ← resume state across sessions
│   └── .pipeline-changelog.md             ← audit trail of every pipeline run,
│                                            incl. caulker conflict-resolution log
├── planning/
│   ├── 00-overview.md                     ┐ dependency graph + critical path
│   ├── 01-phase-*.md                      ├─ rigger — S/M/L sizing, parallel flags,
│   ├── ...                               ┘ context load hints per task
│   └── future-scope.md                    ← deferred P2 requirements (rigger, only when P2s are deferred)
├── sessions/
│   └── {branch-slug}-{topic-slug}-{timestamp}.md   ← session-log skill
│                                                       (shipwright, hullwright,
│                                                       chronicler)
└── AGENT.md                               ← implementation instructions for Sisyphus
```

`.ai/sessions/` contains best-effort per-session notes written by the
`session-log` skill after Shipwright, Hullwright, or Chronicler mutate
`.ai/docs/`. These files are reviewer breadcrumbs for future cross-branch
reconciliation work. Sessions are now reconciled by orchestrator STEP 0 and can
transition from `active` to `resolved` only through that check.

`gunner` writes the security audit to `.ai/docs/11-security-audit.md` and updates the docs manifest. `surveyor` remains a standalone schema check that reports to the session rather than writing files. Rigger now includes the time/cost estimate in `00-overview.md`. Gate results are recorded in `.pipeline-state.md` and `.pipeline-changelog.md`.

---

## Install

**One command (recommended):**

```bash
# With bun
bunx slipway-agents@latest install

# Or with npm
npx slipway-agents@latest install
```

This registers the `slipway-agents@latest` plugin in `~/.config/opencode/opencode.json`, copies `slipway.json` to `~/.config/opencode/`, and clears the OpenCode plugin cache so the latest version is fetched on next start. Restart OpenCode and you're done.

The plugin reads `slipway.json` at startup and enforces model assignments per agent at runtime. Edit `slipway.json` to change models — no other files need to be touched.

**Let an agent do it:**

```
Install and configure slipway-agents by following the instructions here:
https://raw.githubusercontent.com/fresp/slipway-agents/refs/heads/main/docs/guide/installation.md
```

**Manual install:**

Use this only as a fallback if you cannot run the CLI installer.

```bash
git clone https://github.com/fresp/slipway-agents ~/.config/opencode/agents/slipway-agents
```

Add to `opencode.json`:

```json
{
  "agents": {
    "include": ["~/.config/opencode/agents/slipway-agents"]
  },
  "plugin": ["slipway-agents@latest"]
}
```

Full guide: [docs/guide/installation.md](docs/guide/installation.md)

**CLI commands:** `install`, `update`, `doctor`, `status`, and `uninstall`. The CLI `doctor` checks local installation health; `/slipway-doctor` is the separate in-session pipeline diagnostic.

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

# Estimate time and cost from existing plan (runs rigger in estimate-only mode)
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
| `/slipway-init` | Start a new pipeline run — routes to chartmaker or hullwright based on project state |
| `/slipway-status` | Show current pipeline and implementation state without running anything |
| `/slipway-resume` | Resume an interrupted pipeline from the last completed step |
| `/slipway-doctor` | Read-only pre-flight diagnostic for config, docs, state, agents, declarative-only settings, and session reconciliation health |

Full reference: [docs/slash-commands.md](docs/slash-commands.md)

---

## Overriding models

Copy `slipway.json` to your project root and edit it. The plugin picks it up automatically on next session start.

```jsonc
// slipway.local.json — takes precedence over slipway.json
{
  "$schema": "https://raw.githubusercontent.com/fresp/slipway-agents/refs/heads/main/slipway.schema.json",
  "version": "0.10.0",
  "agents": {
    "slipway":      { "model": "amazon-bedrock/us.anthropic.claude-opus-4-8",   "fallback_model": "amazon-bedrock/us.anthropic.claude-sonnet-5" },
    "chartmaker":   { "model": "amazon-bedrock/us.anthropic.claude-sonnet-5", "fallback_model": "amazon-bedrock/us.anthropic.claude-haiku-4-5" },
    "cartographer": { "model": "amazon-bedrock/us.anthropic.claude-sonnet-5", "fallback_model": "amazon-bedrock/us.anthropic.claude-haiku-4-5" },
    "hullwright": { "model": "amazon-bedrock/us.anthropic.claude-sonnet-5", "fallback_model": "amazon-bedrock/us.anthropic.claude-haiku-4-5" },
    "bosun":        { "model": "amazon-bedrock/us.anthropic.claude-opus-4-8",   "fallback_model": "amazon-bedrock/us.anthropic.claude-sonnet-5" },
    "gunner":       { "model": "amazon-bedrock/us.anthropic.claude-opus-4-8",   "fallback_model": "amazon-bedrock/us.anthropic.claude-sonnet-5" },
    "coxswain":     { "model": "amazon-bedrock/us.anthropic.claude-sonnet-5", "fallback_model": "amazon-bedrock/us.anthropic.claude-haiku-4-5" },
    "rigger":       { "model": "amazon-bedrock/us.anthropic.claude-sonnet-5", "fallback_model": "amazon-bedrock/us.anthropic.claude-haiku-4-5" },
    "shipwright":   { "model": "amazon-bedrock/us.anthropic.claude-sonnet-5", "fallback_model": "amazon-bedrock/us.anthropic.claude-haiku-4-5" },
    "surveyor":     { "model": "amazon-bedrock/us.anthropic.claude-sonnet-5", "fallback_model": "amazon-bedrock/us.anthropic.claude-haiku-4-5" },
    "chronicler":   { "model": "amazon-bedrock/us.anthropic.claude-haiku-4-5",  "fallback_model": "amazon-bedrock/us.anthropic.claude-sonnet-5" },
    "caulker":      { "model": "amazon-bedrock/us.anthropic.claude-opus-4-8",   "fallback_model": "amazon-bedrock/us.anthropic.claude-sonnet-5" }
  }
}
```

`fallback_model` is used automatically if the primary model is unavailable — no manual intervention needed. See [installation guide](docs/guide/installation.md) for all supported providers.

---

## Examples

- [`skills/slipway/bootstrap-from-prd/examples/managed-waba/`](skills/slipway/bootstrap-from-prd/examples/managed-waba) — full pipeline output for a multi-tenant WhatsApp Business Calling service (Kamailio → Asterisk → WebRTC, MongoDB + Redis, multi-tenant SIP gateway)

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

MIT

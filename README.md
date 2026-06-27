# slipway-agents

> PRD-to-engineering-docs pipeline agents for [OpenCode](https://opencode.ai).

slipway-agents takes a product idea or existing PRD and runs it through a structured pipeline — brainstorm → engineering docs → cross-doc review → sprint grooming → phased planning — using a coordinating orchestrator and seven specialized subagents. It also handles extending an existing project when a new feature arrives, and syncing docs back to reality after implementation.

---

## Pipeline overview

```
User idea / PRD
      │
      ▼
 drafting-table ──► 01-prd.md
      │
      ▼
  hull-builder ──► 02-technical-architecture.md
                   03-service-boundaries.md
                   04-data-models.md
                   05-api-specifications.md
                   06-operational-flows.md
                   07-engineering-standards.md
                   08-architecture-decisions.md
                   09-topology-and-architecture-diagrams.md
                   10-planning-rules.md
                   AGENT.md
      │
      ▼
   inspector ──► findings (Critical / Should-fix / Note) + health score
      │
      ▼
    groomer ──► Lead Dev + QA + DevOps readiness signals
      │
      ▼
     rigger ──► .ai/planning/ (phases + milestones)
```

After a project is running, `shipwright` handles feature additions and `chronicler` syncs docs after implementation.

---

## Agents

| Agent | Role | Default model |
|---|---|---|
| `slipway` | Orchestrator — routes pipeline, enforces step order | claude-opus-4-6 |
| `drafting-table` | Raw prompt / partial PRD → complete `01-prd.md` | claude-sonnet-4-6 |
| `hull-builder` | Invokes `bootstrap-from-prd` skill → docs 02–10 + `AGENT.md` | claude-sonnet-4-6 |
| `inspector` | Cross-doc validation + severity-ranked findings | claude-sonnet-4-6 |
| `groomer` | Sprint grooming — Lead Dev, QA, DevOps lenses | claude-sonnet-4-6 |
| `rigger` | Phase/milestone breakdown → `.ai/planning/` | claude-sonnet-4-6 |
| `shipwright` | Extend existing docs with a new feature | claude-sonnet-4-6 |
| `chronicler` | Post-implementation doc sync — detect drift, patch docs | claude-haiku-4-5 |

Model assignments are defined in [`slipway.json`](./slipway.json) and can be overridden per-environment.

---

## Skills

| Skill | Used by | Purpose |
|---|---|---|
| `bootstrap-from-prd` | `hull-builder` | Generates the full 02–10 doc suite + `AGENT.md` from a PRD |
| `groomer-lead-dev` | `groomer` | Lead Dev lens — architecture, implementation risk, tech debt |
| `groomer-qa` | `groomer` | QA lens — testability, edge cases, acceptance criteria gaps |
| `groomer-devops` | `groomer` | DevOps/Cloud lens — infra, deployment, observability |

---

## Install

**Quick install via agent:**

```
Install and configure slipway-agents by following the instructions here:
https://raw.githubusercontent.com/fresp/slipway-agents/refs/heads/main/docs/guide/installation.md
```

**Manual install:**

```bash
git clone https://github.com/fresp/slipway-agents ~/.config/opencode/agents/slipway-agents
```

Then add to `opencode.json`:

```json
{
  "agents": {
    "include": ["~/.config/opencode/agents/slipway-agents"]
  }
}
```

Full instructions: [docs/guide/installation.md](./docs/guide/installation.md)

---

## Usage

**Start a pipeline from a product idea:**

```
@slipway I want to build [your idea]
```

**Start from an existing PRD file:**

```
@slipway bootstrap from .ai/docs/01-prd.md
```

**Add a new feature to an existing project:**

```
@slipway ada fitur baru: [feature description]
```

**Review existing docs without running the full pipeline:**

```
@slipway review
```

**Sync docs after implementation is done:**

```
@slipway sync docs
```

slipway guides you through each step with a `yes / no` prompt — you never need to remember which subagent to call next.

---

## Overriding models

To use a different provider or model tier, copy `slipway.json` and edit:

```jsonc
// slipway.local.json
{
  "$schema": "https://raw.githubusercontent.com/fresp/slipway-agents/refs/heads/main/slipway.schema.json",
  "version": "1.0.0",
  "agents": {
    "slipway": { "model": "amazon-bedrock/us.anthropic.claude-opus-4-6" },
    "drafting-table": { "model": "amazon-bedrock/us.anthropic.claude-sonnet-4-6" }
    // ... rest of agents
  }
}
```

See [installation guide](./docs/guide/installation.md) for provider-specific model strings.

---

## Examples

- [`skills/slipway/bootstrap-from-prd/examples/managed-waba/`](./skills/slipway/bootstrap-from-prd/examples/managed-waba/) — full output from a multi-tenant WhatsApp Business Calling service PRD

---

## License

MIT

# slipway-agents-plugin

An [OpenCode](https://opencode.ai) plugin that enforces per-agent model assignments at runtime by reading a single `slipway.json` config file.

Part of the [slipway-agents](https://github.com/fresp/slipway-agents) framework — a PRD-to-engineering-docs pipeline for AI-assisted software planning.

---

## How it works

On every OpenCode startup, the plugin:

1. Looks for `slipway.local.json` in the project root, then `slipway.json`
   (also checks `~/.config/opencode/` as fallback)
2. Reads the `agents` block from the config
3. Patches `~/.config/opencode/opencode.json` with an `agent` block containing
   the correct `model` per agent
4. OpenCode reads the `agent` block natively — no runtime injection needed

This means model assignments take effect on the **next** OpenCode startup after
the patch is written. The patch is idempotent — it only rewrites if the model
assignments have changed.

---

## Installation

Add the plugin to your `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["slipway-agents-plugin@latest"]
}
```

That's it. OpenCode will load the plugin automatically on startup.

---

## Configuration

Create a `slipway.json` in your project root:

```json
{
  "version": "1.3.0",
  "agents": {
    "slipway":          { "model": "anthropic/claude-opus-4-6",   "fallback_model": "anthropic/claude-sonnet-4-6" },
    "inspector":        { "model": "anthropic/claude-opus-4-6",   "fallback_model": "anthropic/claude-sonnet-4-6" },
    "security-auditor": { "model": "anthropic/claude-opus-4-6",   "fallback_model": "anthropic/claude-sonnet-4-6" },
    "drafting-table":   { "model": "anthropic/claude-sonnet-4-6", "fallback_model": "anthropic/claude-haiku-4-5"  },
    "hull-builder":     { "model": "anthropic/claude-sonnet-4-6", "fallback_model": "anthropic/claude-haiku-4-5"  },
    "groomer":          { "model": "anthropic/claude-sonnet-4-6", "fallback_model": "anthropic/claude-haiku-4-5"  },
    "rigger":           { "model": "anthropic/claude-sonnet-4-6", "fallback_model": "anthropic/claude-haiku-4-5"  },
    "shipwright":       { "model": "anthropic/claude-sonnet-4-6", "fallback_model": "anthropic/claude-haiku-4-5"  },
    "estimator":        { "model": "anthropic/claude-sonnet-4-6", "fallback_model": "anthropic/claude-haiku-4-5"  },
    "schema-validator": { "model": "anthropic/claude-sonnet-4-6", "fallback_model": "anthropic/claude-haiku-4-5"  },
    "chronicler":       { "model": "anthropic/claude-haiku-4-5",  "fallback_model": "anthropic/claude-sonnet-4-6" }
  },
  "categories": {
    "quick":    { "model": "anthropic/claude-haiku-4-5" },
    "standard": { "model": "anthropic/claude-sonnet-4-6" },
    "deep":     { "model": "anthropic/claude-opus-4-6", "fallback_model": "anthropic/claude-sonnet-4-6" }
  }
}
```

Edit `slipway.json` to change model assignments. No agent files need to be touched.

### Schema validation

A `slipway.schema.json` is included in the repo for editor autocomplete and validation. Point your editor to it via:

```json
{
  "$schema": "./slipway.schema.json"
}
```

---

## The slipway-agents pipeline

This plugin is the runtime enforcement layer for the slipway-agents framework. The full pipeline consists of 10 specialized subagents that take a raw idea from prompt to production-ready engineering docs:

| Phase | Agent | Output |
|---|---|---|
| 1 | `drafting-table` | `.ai/docs/01-prd.md` |
| 2 | `hull-builder` | `.ai/docs/02–10` + `AGENT.md` |
| 3 | `inspector` | Cross-doc validation + per-doc health score |
| 4 | `security-auditor` | Auth, secrets, attack surface audit |
| 5 | `rigger` | `.ai/planning/` with dependency graph + S/M/L sizing |
| 6 | `estimator` | Time + token cost forecast per phase |
| 7 | `groomer` | Three-lens review (Lead Dev, QA, DevOps) → unified output |
| 8 | `shipwright` | Doc updates for new features |
| 9 | `chronicler` | Post-implementation sync with DRIFT/INTENTIONAL/UNKNOWN classification |
| 10 | `schema-validator` | DB schema vs `04-data-models.md` consistency check |

The orchestrator (`slipway`) acts as a traffic controller — it handles mode detection, routing, gate enforcement, and state tracking via `.pipeline-state.md`. It never generates content directly.

**Supported modes:** `bootstrap-from-prompt` · `bootstrap-from-prd` · `extend` · `sync` · `estimate-only` · `security-only`

---

## Repository

[github.com/fresp/slipway-agents](https://github.com/fresp/slipway-agents) — subagents, skills, schema, and full documentation.

---

## License

MIT

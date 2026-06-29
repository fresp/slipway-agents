# Installation

slipway-agents is a plug-and-play PRD-to-engineering-docs pipeline for [OpenCode](https://opencode.ai). One orchestrator (`slipway`) coordinates eleven specialized subagents through brainstorm → engineering docs → security audit → planning → grooming → build → post-implementation sync — plus `cartographer` for reverse-engineering existing codebases when no PRD exists.

## Prerequisites

- OpenCode 1.4.0 or higher
- An Anthropic API key, Claude Pro/Max subscription, or any OpenCode-supported provider

## Install

### Let an agent do it (recommended)

Paste this prompt into any OpenCode, Claude Code, or LLM agent session:

```
Install and configure slipway-agents by following the instructions here:
https://raw.githubusercontent.com/fresp/slipway-agents/refs/heads/main/docs/guide/installation.md
```

The agent will clone the repo, register the plugin in your `opencode.json`, and configure models.

### Manual install

**1. Clone the repo**

```bash
# Into your OpenCode user agents directory
git clone https://github.com/fresp/slipway-agents ~/.config/opencode/agents/slipway-agents

# Or into your project (project-scoped)
git clone https://github.com/fresp/slipway-agents .slipway
```

**2. Register in `opencode.json`**

Add slipway-agents to your OpenCode config. For user-scoped install:

```json
{
  "agents": {
    "include": ["~/.config/opencode/agents/slipway-agents"]
  }
}
```

For project-scoped install:

```json
{
  "agents": {
    "include": [".slipway"]
  }
}
```

**3. (Optional) Override models**

By default, slipway-agents uses the model assignments in `slipway.json`. To override for your environment, copy and edit the file:

```bash
cp slipway.json slipway.local.json
```

```jsonc
// slipway.local.json
{
  "$schema": "https://raw.githubusercontent.com/fresp/slipway-agents/refs/heads/main/slipway.schema.json",
  "version": "0.5.2",
  "agents": {
    "slipway":      { "model": "anthropic/claude-opus-4-6" },
    "chartmaker":   { "model": "anthropic/claude-sonnet-4-6" },
    "cartographer": { "model": "anthropic/claude-sonnet-4-6" },
    "hullwright": { "model": "anthropic/claude-sonnet-4-6" },
    "bosun":        { "model": "anthropic/claude-opus-4-6" },
    "gunner":       { "model": "anthropic/claude-opus-4-6" },
    "coxswain":     { "model": "anthropic/claude-sonnet-4-6" },
    "rigger":       { "model": "anthropic/claude-sonnet-4-6" },
    "purser":       { "model": "anthropic/claude-sonnet-4-6" },
    "shipwright":   { "model": "anthropic/claude-sonnet-4-6" },
    "surveyor":     { "model": "anthropic/claude-sonnet-4-6" },
    "chronicler":   { "model": "anthropic/claude-haiku-4-5" }
  }
}
```

Common provider substitutions:

| Provider | Model string |
|---|---|
| Anthropic direct | `anthropic/claude-opus-4-6` |
| Amazon Bedrock | `amazon-bedrock/us.anthropic.claude-opus-4-6` |
| OpenCode Zen | `opencode/claude-opus-4-7` |
| GitHub Copilot | `github-copilot/claude-opus-4.7` |

## Verify

```bash
opencode --version   # 1.4.0 or higher
# Then open a session and type:
# @slipway help
```

slipway will list all available modes and subagents if the install is working.

## Updating

```bash
cd ~/.config/opencode/agents/slipway-agents   # or .slipway for project-scoped
git pull
```

## Uninstall

Remove the `include` entry from `opencode.json` and delete the cloned directory.

---

## For LLM agents: step-by-step install flow

If you are an LLM agent helping a user install slipway-agents, follow these steps in order.

### Step 0: Ask which provider

```
Which provider do you want slipway-agents to use?
1. Anthropic (Claude Pro/Max or API key)
2. Amazon Bedrock
3. Other OpenCode-supported provider
```

Map the answer to the model prefix:

| Provider | Prefix |
|---|---|
| Anthropic | `anthropic/` |
| Amazon Bedrock | `amazon-bedrock/` |
| OpenCode Zen | `opencode/` |
| GitHub Copilot | `github-copilot/` |

### Step 1: Clone

```bash
git clone https://github.com/fresp/slipway-agents ~/.config/opencode/agents/slipway-agents
```

### Step 2: Register in opencode.json

Read the user's existing `opencode.json` (usually `~/.config/opencode/opencode.json`). Add or merge the `agents.include` entry. Do not overwrite other keys.

### Step 3: Configure models

If the user chose a provider other than Anthropic, generate a `slipway.local.json` in the install directory with the correct model prefix for all 12 agents. Use the same model-tier logic as `slipway.json` (Opus for `slipway`, `bosun`, `gunner`; Sonnet for all generation subagents; Haiku for `chronicler`) mapped to the target provider's equivalent tiers.

### Step 4: Verify

Start an OpenCode session and confirm `@slipway` responds. If it does not, check that the `agents.include` path resolves correctly from the OpenCode working directory.

### Step 5: First use

Tell the user:

```
slipway-agents is ready. To start a pipeline from a product idea:

  @slipway I want to build [your idea here]

slipway will walk you through brainstorm → docs → review → grooming → planning.
To extend an existing project with a new feature:

  @slipway extend: [feature description]

Already have code but no docs? Let cartographer map your codebase:

  @slipway reverse-engineer

To review existing docs without a full pipeline run:

  @slipway review
```

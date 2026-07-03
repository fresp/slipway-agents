# Installation

slipway-agents is a plug-and-play PRD-to-engineering-docs pipeline for [OpenCode](https://opencode.ai). One orchestrator (`slipway`) coordinates twelve specialized subagents through brainstorm → engineering docs → security audit → planning → grooming → build → post-implementation sync — plus `cartographer` for reverse-engineering existing codebases when no PRD exists.

## Prerequisites

- OpenCode 1.4.0 or higher
- [Bun](https://bun.sh) or Node.js (for the one-command install)
- An Anthropic API key, Claude Pro/Max subscription, or any OpenCode-supported provider

## Install

### One command (recommended)

```bash
# With bun
bunx slipway-agents@latest install

# Or with npm
npx slipway-agents@latest install
```

The installer does three things:

1. Adds `slipway-agents@latest` to the `plugin` array in `~/.config/opencode/opencode.json` (creating the file if it doesn't exist, backing it up first if it does)
2. Copies the bundled `slipway.json` model configuration to `~/.config/opencode/slipway.json` (existing configs are backed up before being updated to a newer version)
3. Clears the OpenCode plugin cache (`~/.cache/opencode/packages/slipway-agents@latest`) so OpenCode fetches the latest published version on next start

Restart OpenCode to activate the agents.

### Let an agent do it

Paste this prompt into any OpenCode, Claude Code, or LLM agent session:

```
Install and configure slipway-agents by following the instructions here:
https://raw.githubusercontent.com/fresp/slipway-agents/refs/heads/main/docs/guide/installation.md
```

The agent will run the installer, verify the plugin registration in your `opencode.json`, and configure models.

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
  },
  "plugin": ["slipway-agents@latest"]
}
```

For project-scoped install:

```json
{
  "agents": {
    "include": [".slipway"]
  },
  "plugin": ["slipway-agents@latest"]
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
  "version": "0.7.1",
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
    "chronicler":   { "model": "anthropic/claude-haiku-4-5" },
    "caulker":      { "model": "anthropic/claude-opus-4-6" }
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

For the one-command install, just re-run the installer — it updates `slipway.json` if the bundled version is newer and clears the plugin cache so the latest published version loads on next start:

```bash
bunx slipway-agents@latest install
# or: npx slipway-agents@latest install
```

For a manual git-clone install:

```bash
cd ~/.config/opencode/agents/slipway-agents   # or .slipway for project-scoped
git pull
```

## Uninstall

For the one-command install: remove `slipway-agents@latest` from the `plugin` array in `~/.config/opencode/opencode.json` and delete `~/.config/opencode/slipway.json`.

For a manual install: remove the `include` and `plugin` entries from `opencode.json` and delete the cloned directory.

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

### Step 1: Run the installer

```bash
bunx slipway-agents@latest install
# or, if bun is not available:
npx slipway-agents@latest install
```

This registers the plugin in `~/.config/opencode/opencode.json` and copies `slipway.json` to `~/.config/opencode/`. If neither bun nor Node.js is available, fall back to a manual clone:

```bash
git clone https://github.com/fresp/slipway-agents ~/.config/opencode/agents/slipway-agents
```

### Step 2: Verify registration in opencode.json

Read the user's `opencode.json` (usually `~/.config/opencode/opencode.json`). Confirm the `plugin` array contains `slipway-agents@latest`. For a manual clone, add or merge the `agents.include` entry as well. Do not overwrite other keys.

### Step 3: Configure models

If the user chose a provider other than Anthropic, generate a `slipway.local.json` next to the installed `slipway.json` with the correct model prefix for all 13 agents. Use the same model-tier logic as `slipway.json` (Opus for `slipway`, `bosun`, `gunner`, `caulker`; Sonnet for all generation subagents; Haiku for `chronicler`) mapped to the target provider's equivalent tiers.

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

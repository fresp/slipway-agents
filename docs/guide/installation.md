# Installation

slipway-agents is a plug-and-play PRD-to-engineering-docs pipeline for [OpenCode](https://opencode.ai). One orchestrator (`slipway`) coordinates eleven specialized subagents through brainstorm → engineering docs → security audit → planning → grooming → build → post-implementation sync, with `cartographer` available for reverse-engineering existing codebases when no PRD exists.

## Prerequisites

- OpenCode 1.4.0 or higher
- Bun or Node.js 18+
- An Anthropic API key, Claude Pro/Max subscription, or any OpenCode-supported provider

## Install

Use the CLI installer as the primary path:

```bash
# With Bun
bunx slipway-agents@latest install

# Or with npm
npx slipway-agents@latest install
```

Bare invocation is kept for backward compatibility and also runs install behavior:

```bash
bunx slipway-agents@latest
```

The installer does exactly what `src/commands/install.ts` and its services implement:

1. Adds `slipway-agents@latest` to the `plugin` array in `~/.config/opencode/opencode.json`, creating the config directory/file if needed and backing up an existing file before mutation.
2. Copies the bundled `slipway.json` to `~/.config/opencode/slipway.json`; if a config already exists with a different version, it backs it up and replaces it with the bundled config.
3. Clears `~/.cache/opencode/packages/slipway-agents@latest` when present so OpenCode fetches the latest published package on next start.

Typical output:

```text
ℹ Installing slipway-agents...
✓ Added slipway-agents@latest to plugin array in ~/.config/opencode/opencode.json
✓ Created slipway.json at ~/.config/opencode/slipway.json (v0.13.4)
ℹ Plugin cache not found — nothing to clear.
✓ Done. Restart OpenCode to activate the agents.
ℹ Config: ~/.config/opencode/slipway.json
ℹ Quick start: @slipway I want to build [your idea here]
```

Restart OpenCode after installation.

## Verify

Check the local CLI install first:

```bash
opencode --version   # 1.4.0 or higher
bunx slipway-agents@latest doctor
bunx slipway-agents@latest status
```

`doctor` is the CLI installation-health check. It verifies that the OpenCode config directory is readable, `opencode.json` is valid JSON, `slipway-agents@latest` is registered in the plugin array, `slipway.json` validates against the schema, and the published package's `dist/index.js` has the expected plugin export shape.

`status` prints the local install state, installed config version, `~/.config/opencode/slipway.json` path, configured agent count, and whether `~/.config/opencode/slipway.local.json` exists.

Inside OpenCode, `/slipway:doctor` is a different diagnostic: it is an in-session, read-only pipeline check covering project config resolution, manifest health, pipeline state, agent files, runtime-wired notes, and session reconciliation health.

## Manual install (fallback)

Use manual install only if you cannot use `bunx` or `npx`.

```bash
git clone https://github.com/fresp/slipway-agents ~/.config/opencode/agents/slipway-agents
```

Then merge this into `~/.config/opencode/opencode.json` without removing any existing keys:

```json
{
  "agents": {
    "include": ["~/.config/opencode/agents/slipway-agents"]
  },
  "plugin": ["slipway-agents@latest"]
}
```

Manual installs must be updated with `git pull`; the CLI `update` command only refreshes the installed `slipway.json` from the npm package.

## Override models

The installer writes `~/.config/opencode/slipway.json`. To customize model assignments for a project without editing the global installed config, create `slipway.local.json` in that project with the same schema. Project-local `slipway.local.json` takes precedence over project `slipway.json`; global `~/.config/opencode/slipway.local.json` is not loaded.

```jsonc
// slipway.local.json
{
  "$schema": "https://raw.githubusercontent.com/fresp/slipway-agents/refs/heads/main/slipway.schema.json",
  "version": "0.13.4",
  "agents": {
    "slipway":      { "model": "anthropic/claude-opus-4-8",   "fallback_model": "anthropic/claude-sonnet-5" },
    "chartmaker":   { "model": "anthropic/claude-sonnet-5", "fallback_model": "anthropic/claude-haiku-4-5" },
    "cartographer": { "model": "anthropic/claude-sonnet-5", "fallback_model": "anthropic/claude-haiku-4-5" },
    "hullwright":   { "model": "anthropic/claude-sonnet-5", "fallback_model": "anthropic/claude-haiku-4-5" },
    "bosun":        { "model": "anthropic/claude-opus-4-8",   "fallback_model": "anthropic/claude-sonnet-5" },
    "rigger":       { "model": "anthropic/claude-sonnet-5", "fallback_model": "anthropic/claude-haiku-4-5" },
    "coxswain":     { "model": "anthropic/claude-sonnet-5", "fallback_model": "anthropic/claude-haiku-4-5" },
    "shipwright":   { "model": "anthropic/claude-sonnet-5", "fallback_model": "anthropic/claude-haiku-4-5" },
    "chronicler":   { "model": "anthropic/claude-haiku-4-5",  "fallback_model": "anthropic/claude-sonnet-5" },
    "surveyor":     { "model": "anthropic/claude-sonnet-5", "fallback_model": "anthropic/claude-haiku-4-5" },
    "gunner":       { "model": "anthropic/claude-opus-4-8",   "fallback_model": "anthropic/claude-sonnet-5" },
    "caulker":      { "model": "anthropic/claude-opus-4-8",   "fallback_model": "anthropic/claude-sonnet-5" }
  }
}
```

`fallback_model` is used automatically if the primary model is unavailable — no manual intervention needed.

Common provider substitutions:

| Provider | Model string example |
|---|---|
| Anthropic direct | `anthropic/claude-opus-4-8` |
| Amazon Bedrock | `amazon-bedrock/us.anthropic.claude-opus-4-8` |
| OpenCode Zen | `opencode/claude-opus-4-7` |
| GitHub Copilot | `github-copilot/claude-opus-4.7` |

## CLI commands reference

All commands are implemented in `src/commands/` and exposed through the `slipway-agents` binary.

```bash
bunx slipway-agents@latest install
```

Registers the plugin in `opencode.json`, installs or version-updates `~/.config/opencode/slipway.json`, clears the plugin cache, and prints the config path plus quick-start prompt. Bare `bunx slipway-agents@latest` runs this same behavior.

```bash
bunx slipway-agents@latest update
```

Refreshes `~/.config/opencode/slipway.json` from the bundled package config and clears the plugin cache. It does not edit `opencode.json`. If the installed file has the same version but different content, it backs up the local file, restores the bundled config, and warns that same-version divergence usually means manual edits.

```bash
bunx slipway-agents@latest doctor
```

Runs the CLI installation-health checks and exits non-zero if a required check fails.

```bash
bunx slipway-agents@latest status
```

Prints whether the plugin is registered, the installed config version, config location, configured agent count, and whether a local override exists.

```bash
bunx slipway-agents@latest uninstall
```

Removes `slipway-agents@latest` from `opencode.json`, deletes `~/.config/opencode/slipway.json`, backs up files before mutation/removal, and leaves `slipway.local.json` in place for manual cleanup.

## Updating

For CLI installs, update the installed config and clear the plugin cache with:

```bash
bunx slipway-agents@latest update
# or
npx slipway-agents@latest update
```

If `slipway.json` is already current and unchanged, the CLI prints:

```text
✓ slipway.json already up to date (v0.13.4) — no change needed
```

For manual git-clone installs, update the checkout separately:

```bash
cd ~/.config/opencode/agents/slipway-agents
git pull
```

## Uninstall

For CLI installs:

```bash
bunx slipway-agents@latest uninstall
# or
npx slipway-agents@latest uninstall
```

The command removes only the `slipway-agents@latest` plugin entry and `~/.config/opencode/slipway.json`. It backs up changed/removed files and intentionally does not delete `slipway.local.json` because that file contains user-specific model customizations.

For manual installs, remove the `agents.include` and `plugin` entries from `opencode.json`, then delete the cloned directory.

## Troubleshooting

If `@slipway` is not available after installation, restart OpenCode and run `bunx slipway-agents@latest doctor` to confirm the plugin entry, installed config, schema, and package export checks pass.

If `doctor` reports config or permission errors, inspect `~/.config/opencode/opencode.json`, `~/.config/opencode/slipway.json`, and the containing directory permissions. If OpenCode still loads an old package after an update, run `bunx slipway-agents@latest update` to refresh `slipway.json` and clear the plugin cache.

For manual installs, confirm both the `agents.include` entry and the `plugin` entry are present in `opencode.json`; manual checkouts also need `git pull` because the CLI `update` command only refreshes the installed config file.

---

## For LLM agents: step-by-step install flow

If you are an LLM agent helping a user install slipway-agents, follow these steps in order.

### Step 0: Ask which provider

```text
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

### Step 1: Run the CLI installer

```bash
bunx slipway-agents@latest install
# or, if Bun is not available:
npx slipway-agents@latest install
```

If neither Bun nor Node.js is available, use the manual fallback clone and merge the `agents.include` plus `plugin` entries into `opencode.json`.

### Step 2: Verify installation

```bash
bunx slipway-agents@latest doctor
bunx slipway-agents@latest status
```

Confirm the `plugin` array contains `slipway-agents@latest` and the status output reports the expected config version and agent count.

### Step 3: Configure models if needed

If the user chose a provider other than Anthropic, create project-local `slipway.local.json` with all 12 configured entries: `slipway` plus the 11 subagents. Use the same model-tier logic as `slipway.json`: Opus for `slipway`, `bosun`, `gunner`, and `caulker`; Sonnet for `chartmaker`, `cartographer`, `hullwright`, `rigger`, `coxswain`, `shipwright`, and `surveyor`; Haiku for `chronicler`.

### Step 4: Verify in OpenCode

Start an OpenCode session and confirm `@slipway` responds. For pipeline diagnostics inside the session, use `/slipway:doctor`; do not confuse it with the CLI `doctor` command.

### Step 5: First use

Tell the user:

```text
slipway-agents is ready. To start a pipeline from a product idea:

  @slipway I want to build [your idea here]

To extend an existing project with a new feature:

  @slipway new feature: [feature description]

Already have code but no docs? Let cartographer map your codebase:

  @slipway reverse-engineer

To review existing docs without a full pipeline run:

  @slipway review
```

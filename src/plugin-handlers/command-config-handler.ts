import type { CommandDefinition, Config, SlipwayConfig } from "../config/types";
import { resolveModel } from "./model-resolution-handler";

/**
 * Bundled Slipway slash command definitions injected at runtime through the
 * OpenCode `config(input)` hook.
 *
 * OpenCode API used: the existing `config(input)` hook mutates `input.command`.
 * These commands route to the `slipway` orchestrator agent with pre-filled
 * intents equivalent to the documented trigger phrases in
 * `docs/slash-commands.md` and `subagents/slipway.md`.
 */

const SLIPWAY_COMMANDS = {
  "slipway:init": {
    description: "Start a new pipeline run.",
    agent: "slipway",
    template: "@slipway I want to build $ARGUMENTS",
  },
  "slipway:status": {
    description:
      "Show current pipeline and implementation state without running anything.",
    agent: "slipway",
    template: "@slipway where are we?",
  },
  "slipway:resume": {
    description: "Resume from the last completed step.",
    agent: "slipway",
    template: "@slipway resume $ARGUMENTS",
  },
  "slipway:doctor": {
    description:
      "Run read-only diagnostics for config, docs, state, agents, and session reconciliation.",
    agent: "slipway",
    template: "@slipway run doctor $ARGUMENTS",
  },
  "slipway:agent-refresh": {
    description: "Regenerate only AGENT.md from the current docs and latest contract.",
    agent: "slipway",
    template: "@slipway regenerate AGENT.md",
  },
  "slipway:review": {
    description: "Run a consistency review on existing docs.",
    agent: "slipway",
    template: "@slipway review",
  },
  "slipway:groom": {
    description: "Run multi-lens grooming on existing docs and plan readiness.",
    agent: "slipway",
    template: "@slipway groom this",
  },
  "slipway:sync": {
    description: "Sync docs with implementation reality after a build.",
    agent: "slipway",
    template: "@slipway sync docs",
  },
} satisfies Record<string, CommandDefinition>;

export async function applyCommandConfig(
  input: Config,
  slipwayConfig: SlipwayConfig | null
): Promise<void> {
  input.command ??= {};

  const slipwayModel = resolveModel("slipway", slipwayConfig);

  for (const [commandName, commandDefinition] of Object.entries(
    SLIPWAY_COMMANDS
  )) {
    input.command[commandName] = {
      ...commandDefinition,
      ...(slipwayModel ? { model: slipwayModel } : {}),
    };
  }

  console.log(
    `[slipway-agents] Registered ${Object.keys(SLIPWAY_COMMANDS).length} slash commands into OpenCode config`
  );
}

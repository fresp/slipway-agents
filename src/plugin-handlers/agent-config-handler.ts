import { AgentDefinition, Config, SlipwayConfig } from "../config/types";

/**
 * Registers bundled Slipway agents into the OpenCode config hook input.
 *
 * OpenCode API used: the existing `config(input)` hook mutates `input.agent`.
 * This preserves the original behavior exactly: every bundled subagent receives
 * `prompt`, and configured agents receive `model` and `mode` only.
 *
 * Remaining gaps: category fallback resolution, description passthrough,
 * permissions, and prompt_append are intentionally not applied in Part 0.
 */

export async function applyAgentConfig(
  input: Config,
  agentDefinitions: Record<string, string>,
  slipwayConfig: SlipwayConfig | null
): Promise<void> {
  input.agent ??= {};

  for (const [agentName, systemPrompt] of Object.entries(agentDefinitions)) {
    const agentDef: AgentDefinition = {
      prompt: systemPrompt,
    };

    const agentConfig = slipwayConfig?.agents[agentName];

    if (agentConfig?.model) {
      agentDef.model = agentConfig.model;
    }

    if (agentConfig?.mode) {
      agentDef.mode = agentConfig.mode;
    }

    input.agent[agentName] = agentDef;
  }

  console.log(
    `[slipway-agents] Registered ${Object.keys(agentDefinitions).length} agents into OpenCode config`
  );
}

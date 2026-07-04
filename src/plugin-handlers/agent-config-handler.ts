import { AgentDefinition, Config, SlipwayConfig } from "../config/types";
import { resolveFallbackChain, resolveModel } from "./model-resolution-handler";
import { applyPromptConfig } from "./prompt-handler";
import { applyToolConfig } from "./tool-config-handler";

/**
 * Registers bundled Slipway agents into the OpenCode config hook input.
 *
 * OpenCode API used: the existing `config(input)` hook mutates `input.agent`.
 * This preserves the original behavior exactly: every bundled subagent receives
 * `prompt`, and configured agents receive a resolved proactive `model` and
 * configured `mode`.
 *
 * Remaining gaps: description passthrough is applied in a later part if needed.
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

    const resolvedModel = resolveModel(agentName, slipwayConfig);

    if (resolvedModel) {
      agentDef.model = resolvedModel;
    }

    const fallbackChain = resolveFallbackChain(agentName, slipwayConfig);
    if (fallbackChain.length > 0) {
      agentDef.options = {
        ...agentDef.options,
        slipway_fallback_chain: fallbackChain,
      };
    }

    if (agentConfig?.mode) {
      agentDef.mode = agentConfig.mode;
    }

    applyToolConfig(agentDef, agentConfig?.permission);
    applyPromptConfig(agentDef, agentConfig?.prompt_append);

    input.agent[agentName] = agentDef;
  }

  console.log(
    `[slipway-agents] Registered ${Object.keys(agentDefinitions).length} agents into OpenCode config`
  );
}

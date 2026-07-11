import { SlipwayConfig } from "../config/types";
import { MODEL_REQUIREMENTS } from "../shared/model-requirements";

/**
 * Resolves proactive model selection and fallback chains for Slipway agents.
 *
 * OpenCode API used: none directly. The selected model is applied later through
 * the existing OpenCode config hook's `input.agent[name].model` field.
 *
 * Remaining gaps: this does not perform reactive retry after provider/API
 * failure; that requires a client.config.patch() API that is not exposed by the
 * current proven plugin surface.
 */

function pushUnique(models: string[], model: string | undefined): void {
  if (model && !models.includes(model)) {
    models.push(model);
  }
}

export function resolveFallbackChain(agentName: string, config: SlipwayConfig | null): string[] {
  const chain: string[] = [];
  const agentConfig = config?.agents[agentName];
  const categoryName = agentConfig?.category;
  const categoryConfig = categoryName ? config?.categories?.[categoryName] : undefined;

  pushUnique(chain, agentConfig?.model);
  pushUnique(chain, categoryConfig?.model);
  pushUnique(chain, agentConfig?.fallback_model);
  pushUnique(chain, categoryConfig?.fallback_model);

  for (const model of MODEL_REQUIREMENTS[agentName] ?? []) {
    pushUnique(chain, model);
  }

  return chain;
}

export function resolveModel(agentName: string, config: SlipwayConfig | null): string | undefined {
  return resolveFallbackChain(agentName, config)[0];
}

export function resolveAgentSmartModel(
  agentName: string,
  config: SlipwayConfig | null
): string | undefined {
  return config?.agents[agentName]?.smart?.model;
}

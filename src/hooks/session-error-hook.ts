import { Hooks } from "../config/types";

/**
 * Documents the runtime fallback gap.
 *
 * OpenCode API used: none. Batch 6 uses proactive startup resolution instead:
 * the config hook registers the first model from each agent's resolved fallback
 * chain and stores the full chain in agent options for observability.
 *
 * Remaining gaps: reactive retry on session.error is not implemented because it
 * requires a client.config.patch() API — not yet exposed by the proven plugin
 * surface in this repository.
 */

export function registerSessionErrorHook(): Hooks {
  return {};
}

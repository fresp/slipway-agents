import { Hooks } from "../config/types";

/**
 * Placeholder session error hook for Part 0.
 *
 * OpenCode API used: none in Part 0. The current plugin registers only the
 * `config` hook, so this function returns no hooks to preserve behavior.
 *
 * Remaining gaps: reactive runtime fallback is not implemented; per the Batch 6
 * decision it remains a documented gap unless a client.config.patch() API is
 * exposed. Proactive fallback-chain resolution belongs to Part 2/5.
 */

export function registerSessionErrorHook(): Hooks {
  return {};
}

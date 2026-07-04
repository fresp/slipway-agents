import { Hooks } from "../config/types";

/**
 * Placeholder pipeline hook registration for Part 0.
 *
 * OpenCode API used: none in Part 0. The legacy plugin does not dispatch HTTP
 * hooks, and Slipway-specific hook events remain prompt-level behavior until
 * Part 6 documents/implements only verified lifecycle mappings.
 *
 * Remaining gaps: lifecycle HTTP dispatch is deferred to Part 6.
 */

export function registerPipelineHooks(): Hooks {
  return {};
}

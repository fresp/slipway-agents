/**
 * Last-resort model fallback chains for all bundled Slipway agents.
 *
 * OpenCode API used: none. These constants are internal safety nets used when
 * user configuration omits a model path. They mirror slipway.json's current
 * model/fallback assignments.
 *
 * Remaining gaps: reactive model retry requires a runtime config patch API and
 * is documented separately; these chains support proactive startup resolution.
 */

export const MODEL_REQUIREMENTS: Record<string, string[]> = {
  slipway: ["anthropic/claude-opus-4-8", "anthropic/claude-sonnet-5"],
  chartmaker: ["anthropic/claude-sonnet-5", "anthropic/claude-haiku-4-5"],
  cartographer: ["anthropic/claude-sonnet-5", "anthropic/claude-haiku-4-5"],
  hullwright: ["anthropic/claude-sonnet-5", "anthropic/claude-haiku-4-5"],
  bosun: ["anthropic/claude-opus-4-8", "anthropic/claude-sonnet-5"],
  rigger: ["anthropic/claude-sonnet-5", "anthropic/claude-haiku-4-5"],
  purser: ["anthropic/claude-sonnet-5", "anthropic/claude-haiku-4-5"],
  coxswain: ["anthropic/claude-sonnet-5", "anthropic/claude-haiku-4-5"],
  shipwright: ["anthropic/claude-sonnet-5", "anthropic/claude-haiku-4-5"],
  chronicler: ["anthropic/claude-haiku-4-5", "anthropic/claude-sonnet-5"],
  surveyor: ["anthropic/claude-sonnet-5", "anthropic/claude-haiku-4-5"],
  gunner: ["anthropic/claude-opus-4-8", "anthropic/claude-sonnet-5"],
  caulker: ["anthropic/claude-opus-4-8", "anthropic/claude-sonnet-5"],
};

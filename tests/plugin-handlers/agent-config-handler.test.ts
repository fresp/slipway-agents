import test from "node:test";
import assert from "node:assert/strict";
import { applyAgentConfig } from "../../src/plugin-handlers/agent-config-handler";
import type { Config, SlipwayConfig } from "../../src/config/types";

const agentDefinitions: Record<string, string> = {
  slipway: "slipway system prompt",
  hullwright: "hullwright system prompt",
};

// Regression: agentDef.options is forwarded verbatim as literal provider API
// parameters. slipway_fallback_chain is not a valid provider parameter and is
// consumed nowhere in the codebase, so it must never appear there — strict
// providers reject "Unknown parameter: 'slipway_fallback_chain'".
const slipwayConfigInputs: Array<SlipwayConfig | null> = [
  null,
  {
    version: "0.15.0",
    agents: {
      slipway: { model: "anthropic/claude-sonnet-5" },
    },
  },
  {
    version: "0.15.0",
    agents: {
      slipway: {
        model: "anthropic/claude-sonnet-5",
        fallback_model: "anthropic/claude-opus-4-8",
        category: "deep",
      },
    },
    categories: {
      deep: {
        model: "anthropic/claude-opus-4-8",
        fallback_model: "anthropic/claude-sonnet-5",
      },
    },
  },
];

test("no resolved AgentDefinition ever carries options.slipway_fallback_chain", async () => {
  for (const slipwayConfig of slipwayConfigInputs) {
    const input: Config = {};

    await applyAgentConfig(input, agentDefinitions, slipwayConfig);

    for (const [agentName, agentDef] of Object.entries(input.agent ?? {})) {
      assert.equal(
        Boolean(agentDef.options && "slipway_fallback_chain" in agentDef.options),
        false,
        `agent ${agentName} must not carry options.slipway_fallback_chain`
      );
    }
  }
});

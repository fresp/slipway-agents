import test from "node:test";
import assert from "node:assert/strict";
import { applyCommandConfig } from "../../src/plugin-handlers/command-config-handler";
import type { Config } from "../../src/config/types";

const slipwayModel = "anthropic/claude-sonnet-5";

function makeSlipwayConfig(): NonNullable<Parameters<typeof applyCommandConfig>[1]> {
  return {
    version: "0.10.1",
    agents: {
      slipway: {
        model: slipwayModel,
      },
    },
  };
}

test("injects the four slipway runtime commands into an empty config", async () => {
  const input: Config = {};

  await applyCommandConfig(input, makeSlipwayConfig());

  assert.deepEqual(Object.keys(input.command ?? {}).sort(), [
    "slipway:doctor",
    "slipway:init",
    "slipway:resume",
    "slipway:status",
  ]);

  for (const name of [
    "slipway:init",
    "slipway:status",
    "slipway:resume",
    "slipway:doctor",
  ] as const) {
    const command = input.command?.[name];

    assert.ok(command, `command ${name} should be defined`);
    assert.equal(command.agent, "slipway");
    assert.equal(typeof command.description, "string");
    assert.notEqual(command.description?.trim(), "");
    assert.equal(typeof command.template, "string");
    assert.notEqual(command.template.trim(), "");
  }

  assert.equal(input.command?.["slipway:test"], undefined);
});

test("sets the resolved slipway model on each command", async () => {
  const input: Config = {};

  await applyCommandConfig(input, makeSlipwayConfig());

  for (const name of [
    "slipway:init",
    "slipway:status",
    "slipway:resume",
    "slipway:doctor",
  ] as const) {
    assert.equal(input.command?.[name]?.model, slipwayModel);
  }
});

test("preserves unrelated commands and overwrites same-name slipway commands", async () => {
  const input: Config = {
    command: {
      "custom:keep": {
        template: "Keep me",
        description: "Existing command",
      },
      "slipway:init": {
        template: "Stale init",
        description: "Old init",
      },
    },
  };

  await applyCommandConfig(input, makeSlipwayConfig());

  assert.equal(input.command?.["custom:keep"]?.template, "Keep me");
  assert.notEqual(
    input.command?.["slipway:init"]?.template,
    "Stale init"
  );
  assert.equal(input.command?.["slipway:init"]?.agent, "slipway");
});

test("does not require a slipway config", async () => {
  const input: Config = {};

  await applyCommandConfig(input, null);

  assert.equal(input.command?.["slipway:init"]?.agent, "slipway");
  // Even without a user config, the shared MODEL_REQUIREMENTS fallback chain
  // resolves a default model for the slipway orchestrator.
  assert.equal(
    input.command?.["slipway:init"]?.model,
    "anthropic/claude-opus-4-8"
  );
});

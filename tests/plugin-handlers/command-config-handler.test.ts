import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { applyCommandConfig } from "../../src/plugin-handlers/command-config-handler";
import type { Config } from "../../src/config/types";

const slipwayModel = "anthropic/claude-sonnet-5";

function makeSlipwayConfig(): NonNullable<Parameters<typeof applyCommandConfig>[1]> {
  return {
    version: "0.13.1",
    agents: {
      slipway: {
        model: slipwayModel,
      },
    },
  };
}

test("injects the eight slipway runtime commands into an empty config", async () => {
  const input: Config = {};

  await applyCommandConfig(input, makeSlipwayConfig());

  assert.deepEqual(Object.keys(input.command ?? {}).sort(), ["slipway:agent-refresh", "slipway:doctor", "slipway:groom", "slipway:init", "slipway:resume", "slipway:review", "slipway:status", "slipway:sync"]);

  for (const name of ["slipway:agent-refresh", "slipway:groom", "slipway:init", "slipway:resume", "slipway:review", "slipway:status", "slipway:sync"] as const) {
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

  for (const name of ["slipway:agent-refresh", "slipway:groom", "slipway:init", "slipway:resume", "slipway:review", "slipway:status", "slipway:sync"] as const) {
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

test("keeps slash command templates and plan-authoring guardrails Slipway-local", async () => {
  const input: Config = {};

  await applyCommandConfig(input, makeSlipwayConfig());

  const slipwayCommands = Object.entries(input.command ?? {}).filter(([name]) =>
    name.startsWith("slipway:")
  );
  assert.ok(slipwayCommands.length > 0, "slipway commands should be registered");

  const commandConfigSource = readFileSync(
    "src/plugin-handlers/command-config-handler.ts",
    "utf8"
  );
  assert.equal(
    commandConfigSource.includes("@slipway"),
    false,
    "command-config-handler.ts slash command templates must not contain @slipway"
  );

  for (const [name, command] of slipwayCommands) {
    assert.ok(command.template, `command ${name} should define a template`);
    assert.equal(
      command.template.includes("@slipway"),
      false,
      `command ${name} template must not contain @slipway`
    );
  }

  const skillRestriction =
    "Never invoke any Skill outside this repo's own skill set";
  assert.ok(
    input.command?.["slipway:init"]?.template.includes(skillRestriction),
    "runtime preamble should forbid non-Slipway skills for plan authoring"
  );

  const slipwayContract = readFileSync("subagents/slipway.md", "utf8");
  const forbiddenBehaviors = slipwayContract.slice(
    slipwayContract.indexOf("## Forbidden Behaviors")
  );
  assert.ok(
    forbiddenBehaviors.includes(skillRestriction),
    "Forbidden Behaviors should forbid non-Slipway skills for plan authoring"
  );

  for (const filePath of [
    "subagents/slipway.md",
    "src/plugin-handlers/command-config-handler.ts",
    "skills/slipway/bootstrap-from-prd/templates/AGENT.md",
  ]) {
    assert.equal(
      readFileSync(filePath, "utf8").includes("docs/superpowers/plans"),
      false,
      `${filePath} must not contain harness-default plan path literals`
    );
  }
});

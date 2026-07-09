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

test("injects the nine slipway runtime commands into an empty config", async () => {
  const input: Config = {};

  await applyCommandConfig(input, makeSlipwayConfig());

  assert.deepEqual(Object.keys(input.command ?? {}).sort(), ["slipway:agent-refresh", "slipway:doctor", "slipway:groom", "slipway:init", "slipway:learnings-review", "slipway:resume", "slipway:review", "slipway:status", "slipway:sync"]);

  for (const name of ["slipway:agent-refresh", "slipway:groom", "slipway:init", "slipway:learnings-review", "slipway:resume", "slipway:review", "slipway:status", "slipway:sync"] as const) {
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

  for (const name of ["slipway:agent-refresh", "slipway:groom", "slipway:init", "slipway:learnings-review", "slipway:resume", "slipway:review", "slipway:status", "slipway:sync"] as const) {
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

test("agent-refresh targets AGENTS.md and documents legacy migration", async () => {
  const input: Config = {};
  const legacyArtifact = "AGENT" + ".md";
  const currentArtifact = "AGENTS.md";

  await applyCommandConfig(input, makeSlipwayConfig());

  const command = input.command?.["slipway:agent-refresh"];
  assert.ok(command, "slipway:agent-refresh should be defined");
  assert.ok(command.description?.includes(currentArtifact));
  assert.ok(command.template.includes(`Regenerate ${currentArtifact} only`));
  assert.ok(command.template.includes(`latest hullwright ${currentArtifact} template`));
  assert.ok(command.template.includes(`Migrated: ${legacyArtifact} -> ${currentArtifact}`));
  assert.ok(command.template.includes("No migration needed."));
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
    "skills/slipway/bootstrap-from-prd/templates/AGENTS.md",
  ]) {
    assert.equal(
      readFileSync(filePath, "utf8").includes("docs/superpowers/plans"),
      false,
      `${filePath} must not contain harness-default plan path literals`
    );
  }
});

// ── Batch G: slipway:doctor template learnings-health contract ──

test("slipway:doctor template mentions learnings health and .ai/learnings", async () => {
  const input: Config = {};

  await applyCommandConfig(input, makeSlipwayConfig());

  const doctorTemplate = input.command?.["slipway:doctor"]?.template ?? "";

  assert.ok(
    doctorTemplate.toLowerCase().includes("learnings health") ||
      doctorTemplate.toLowerCase().includes("learnings-health"),
    "doctor template must mention learnings health"
  );
  assert.ok(
    doctorTemplate.includes(".ai/learnings"),
    "doctor template must reference .ai/learnings"
  );
});

test("slipway:doctor template mentions memory.md", async () => {
  const input: Config = {};

  await applyCommandConfig(input, makeSlipwayConfig());

  const doctorTemplate = input.command?.["slipway:doctor"]?.template ?? "";

  assert.ok(
    doctorTemplate.includes("memory.md"),
    "doctor template must mention memory.md"
  );
});

test("slipway:doctor template mirrors learnings health thresholds and hygiene checks", async () => {
  const input: Config = {};

  await applyCommandConfig(input, makeSlipwayConfig());

  const doctorTemplate = input.command?.["slipway:doctor"]?.template ?? "";

  assert.ok(
    doctorTemplate.includes(">90") || doctorTemplate.includes("90"),
    "doctor template must mention the >90 memory.md warning threshold"
  );
  assert.ok(
    doctorTemplate.includes("100"),
    "doctor template must mention the hard max of 100 lines"
  );

  for (const status of ["pending", "promoted", "wont_fix"] as const) {
    assert.ok(
      doctorTemplate.includes(status),
      `doctor template must mention ${status} status counts`
    );
  }

  assert.ok(
    doctorTemplate.toLowerCase().includes("hygiene"),
    "doctor template must mention wont_fix hygiene"
  );

  for (const forbidden of ["learnings-capture", "bosun", "gunner", "chronicler"] as const) {
    assert.ok(
      doctorTemplate.toLowerCase().includes(forbidden),
      `doctor template must forbid invoking ${forbidden}`
    );
  }
});

test("slipway:doctor template remains a read-only diagnostic", async () => {
  const input: Config = {};

  await applyCommandConfig(input, makeSlipwayConfig());

  const doctorTemplate = input.command?.["slipway:doctor"]?.template ?? "";

  assert.ok(
    doctorTemplate.toLowerCase().includes("read-only"),
    "doctor template must state it is read-only"
  );
  assert.ok(
    doctorTemplate.toLowerCase().includes("no writes") ||
      doctorTemplate.toLowerCase().includes("make no writes") ||
      doctorTemplate.toLowerCase().includes("report findings only"),
    "doctor template must instruct report-only / no-write behavior"
  );
});

test("slipway:doctor template does not imply CLI doctor behavior", async () => {
  const input: Config = {};

  await applyCommandConfig(input, makeSlipwayConfig());

  const doctorTemplate = input.command?.["slipway:doctor"]?.template ?? "";

  const cliTerms = [
    "command line",
    "CLI doctor",
    "exit code",
    "terminal",
    "shell command",
    "npm run doctor",
    "npx doctor",
  ];

  for (const term of cliTerms) {
    assert.equal(
      doctorTemplate.toLowerCase().includes(term.toLowerCase()),
      false,
      `doctor template must not imply CLI behavior: found "${term}"`
    );
  }
});

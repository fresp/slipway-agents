import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { applyCommandConfig } from "../../src/plugin-handlers/command-config-handler";
import { resolveAgentSmartModel } from "../../src/plugin-handlers/model-resolution-handler";
import type { Config } from "../../src/config/types";

const slipwayModel = "anthropic/claude-sonnet-5";

function makeSlipwayConfig(): NonNullable<Parameters<typeof applyCommandConfig>[1]> {
  return {
    version: "0.15.0",
    agents: {
      slipway: {
        model: slipwayModel,
      },
    },
  };
}

test("injects the twelve slipway runtime commands into an empty config", async () => {
  const input: Config = {};

  await applyCommandConfig(input, makeSlipwayConfig());

  assert.deepEqual(Object.keys(input.command ?? {}).sort(), ["slipway:agent-refresh", "slipway:docs-publish", "slipway:doctor", "slipway:groom", "slipway:init", "slipway:learnings-review", "slipway:resume", "slipway:review", "slipway:smart", "slipway:status", "slipway:sync", "slipway:task"]);

  for (const name of ["slipway:agent-refresh", "slipway:docs-publish", "slipway:groom", "slipway:init", "slipway:learnings-review", "slipway:resume", "slipway:review", "slipway:smart", "slipway:status", "slipway:sync", "slipway:task"] as const) {
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

  for (const name of ["slipway:agent-refresh", "slipway:docs-publish", "slipway:groom", "slipway:init", "slipway:learnings-review", "slipway:resume", "slipway:review", "slipway:smart", "slipway:status", "slipway:sync", "slipway:task"] as const) {
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

test("docs-publish command delegates write ownership to hullwright when slipway cannot write through skills", async () => {
  const input: Config = {};

  await applyCommandConfig(input, makeSlipwayConfig());

  const command = input.command?.["slipway:docs-publish"];
  assert.ok(command, "slipway:docs-publish should be defined");
  assert.equal(command.agent, "slipway");
  assert.ok(command.description?.includes("TRD"));
  assert.ok(command.template.includes("docs-publish mode"));
  assert.ok(command.template.includes("Feature documentation request: $ARGUMENTS"));
  assert.ok(command.template.includes("feature name"));
  assert.ok(command.template.includes("FR-IDs"));
  assert.ok(command.template.includes("docs-publish"));
  assert.ok(command.template.includes("Delegate the actual docs-publish skill write to hullwright"));
  assert.ok(command.template.includes("slipway is edit: deny"));
  assert.ok(command.template.includes("skill-mediated writes are blocked"));
  assert.equal(command.template.includes("Invoke the docs-publish skill directly from slipway"), false);
  assert.equal(command.template.includes("@slipway"), false);
});

test("slipway:task command runs full Mode Detection and stops before code execution", async () => {
  const input: Config = {};

  await applyCommandConfig(input, makeSlipwayConfig());

  const command = input.command?.["slipway:task"];
  assert.ok(command, "slipway:task should be defined");
  assert.equal(command.agent, "slipway");
  assert.equal(command.template.includes("@slipway"), false);
  assert.ok(command.template.includes("Task request: $ARGUMENTS"));
  assert.ok(command.template.includes("full Mode Detection (Step A classification, Step B routing)"));
  assert.ok(command.template.includes("do not assume a specific intent category in advance"));
  assert.ok(command.template.includes("whichever subagent(s) Mode Detection's own table specifies"));
  assert.equal(command.template.includes("chartmaker/shipwright only"), false);
  assert.ok(command.template.includes("Regardless of which category or subagent chain is selected"));
  assert.ok(command.template.includes("stop at the appropriate docs/plan/review artifact"));
  assert.ok(command.template.includes("never write, edit, or generate application/source code"));
  assert.ok(command.template.includes("refactor this service"));
  assert.ok(command.template.includes("vague, a bug report, a feature idea"));
  assert.ok(command.template.includes("Sisyphus/omo.dev"));
});

test("slipway:smart command is registered with smart-mode template contract", async () => {
  const input: Config = {};

  await applyCommandConfig(input, makeSlipwayConfig());

  const command = input.command?.["slipway:smart"];
  assert.ok(command, "slipway:smart should be defined");
  assert.equal(command.agent, "slipway");
  assert.equal(command.template.includes("@slipway"), false);
  assert.ok(command.template.includes("Smart request: $ARGUMENTS"));
  assert.ok(command.template.includes("Interaction mode: smart"));
  assert.ok(command.template.includes("Smart Mode Decision Policy"));
  assert.ok(command.template.includes("do not branch on whether $ARGUMENTS is empty"));
  assert.ok(command.template.includes("Never auto-resolve a correctness/safety gate"));
  assert.ok(command.template.includes("ralph_loop.block_on_exhaustion"));
});

test("slipway:smart resolves model from agents.slipway.smart.model, not the slipway agent's own model", async () => {
  const input: Config = {};
  const smartModel = "anthropic/claude-opus-4-8";

  const config: NonNullable<Parameters<typeof applyCommandConfig>[1]> = {
    version: "0.16.0",
    agents: {
      slipway: {
        model: slipwayModel,
        smart: {
          model: smartModel,
        },
      },
    },
  };

  await applyCommandConfig(input, config);

  assert.equal(input.command?.["slipway:smart"]?.model, smartModel);
  assert.equal(input.command?.["slipway:init"]?.model, slipwayModel);
});

test("resolveAgentSmartModel reads the nested agents.<name>.smart.model field", () => {
  const config: NonNullable<Parameters<typeof applyCommandConfig>[1]> = {
    version: "0.16.0",
    agents: {
      slipway: {
        model: slipwayModel,
        smart: {
          model: "anthropic/claude-opus-4-8",
        },
      },
    },
  };

  assert.equal(resolveAgentSmartModel("slipway", config), "anthropic/claude-opus-4-8");
  // Absent nested smart config resolves to undefined.
  assert.equal(resolveAgentSmartModel("slipway", makeSlipwayConfig()), undefined);
  assert.equal(resolveAgentSmartModel("slipway", null), undefined);
});

test("slipway:smart falls back to the slipway agent's own resolved model when agents.slipway.smart is absent", async () => {
  const input: Config = {};

  await applyCommandConfig(input, makeSlipwayConfig());

  assert.equal(
    input.command?.["slipway:smart"]?.model,
    input.command?.["slipway:init"]?.model
  );
});

test("slipway contract documents docs-publish mode and output boundary", () => {
  const slipwayContract = readFileSync("subagents/slipway.md", "utf8");

  assert.ok(
    slipwayContract.includes("Post-implementation: user says \"publish docs\", \"generate TRD\", \"create feature documentation\", \"document this feature\"") &&
      slipwayContract.includes("docs-publish") &&
      slipwayContract.includes("hullwright"),
    "Mode Detection should route docs-publish intent to slipway with hullwright delegation"
  );
  assert.ok(
    slipwayContract.includes("Required input: feature name + FR-IDs"),
    "docs-publish pipeline section should require feature name and FR-IDs"
  );
  assert.ok(
    slipwayContract.includes("Never treat `/docs/<feature>/TRD.md` as authoritative"),
    "docs-publish pipeline section should mark TRD as derived"
  );
  assert.ok(
    slipwayContract.includes("Never let `docs-publish` mode write outside `/docs/<feature>/`"),
    "Forbidden Behaviors should constrain docs-publish output path"
  );
});

test("Continuation rules document a smart mode override that auto-continues generic step prompts", () => {
  const slipwayContract = readFileSync("subagents/slipway.md", "utf8");

  const continuationHeadingIndex = slipwayContract.indexOf("**Continuation rules:**");
  assert.ok(
    continuationHeadingIndex !== -1,
    "slipway.md should have a Continuation rules subsection"
  );

  // Scope the assertions to the Continuation rules subsection only (up to the
  // next end-of-pipeline block), so the override bullet is verified in place.
  const continuationSection = slipwayContract.slice(
    continuationHeadingIndex,
    slipwayContract.indexOf("At the end of a full pipeline run", continuationHeadingIndex)
  );

  assert.ok(
    continuationSection.includes("Smart mode override"),
    "Continuation rules should contain a Smart mode override bullet"
  );
  assert.ok(
    continuationSection.includes("auto-continue") &&
      continuationSection.includes(".ai/docs/.pipeline-decisions.md"),
    "Smart mode override bullet must auto-continue and log to .ai/docs/.pipeline-decisions.md"
  );
  // The override must exclude STEP 4/STEP E5 and the three named convenience gates,
  // distinguishing it from the Smart Mode Decision Policy's confidence-based logic.
  assert.ok(
    continuationSection.includes("does NOT apply to STEP 4 / STEP E5") &&
      continuationSection.includes("three convenience gates") &&
      continuationSection.includes("Smart Mode Decision Policy"),
    "Smart mode override bullet must exclude STEP 4/STEP E5 and the three named gates from its scope"
  );
  // The override must never suppress a subagent's own required Q&A with the user.
  assert.ok(
    continuationSection.includes("chartmaker") &&
      (continuationSection.includes("Q&A") || continuationSection.includes("interview")) &&
      continuationSection.includes("relayed to the user"),
    "Smart mode override bullet must exclude subagent-initiated Q&A (e.g. chartmaker) by name"
  );
});

test("Error Recovery distinguishes empty/crashed output from a subagent's required question", () => {
  const slipwayContract = readFileSync("subagents/slipway.md", "utf8");

  const errorHeadingIndex = slipwayContract.indexOf("## Error Recovery and Retry");
  assert.ok(errorHeadingIndex !== -1, "slipway.md should have an Error Recovery and Retry section");

  const errorSection = slipwayContract.slice(
    errorHeadingIndex,
    slipwayContract.indexOf("## STEP 0", errorHeadingIndex)
  );

  assert.ok(
    errorSection.includes("required question is not a failure") ||
      errorSection.includes("A required question is not a failure"),
    "Error Recovery must state a required question is not a failure"
  );
  assert.ok(
    errorSection.includes("crashed") &&
      errorSection.includes("required question") &&
      errorSection.includes("chartmaker"),
    "Error Recovery must distinguish empty/crashed output from a subagent's in-contract question, citing chartmaker"
  );
});

test("/slipway:smart template requires subagent Q&A to be relayed and awaited, not auto-answered", async () => {
  const input: Config = {};

  await applyCommandConfig(input, makeSlipwayConfig());

  const template = input.command?.["slipway:smart"]?.template ?? "";
  assert.ok(
    template.includes("chartmaker") &&
      (template.includes("relay it to the user") || template.includes("relay it to the user and await")) &&
      template.includes("never auto-answer"),
    "smart template must require subagent Q&A to be relayed and awaited, not auto-answered"
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

// ── Phase 4: Runtime preamble source-edit prohibition sync ──

test("runtime preamble mirrors direct implementation source-edit prohibition", async () => {
  const input: Config = {};
  await applyCommandConfig(input, makeSlipwayConfig());

  const preamble = input.command?.["slipway:init"]?.template ?? "";

  assert.ok(
    preamble.includes("Never write, edit, or generate application/source code directly"),
    "runtime preamble must include direct source-edit prohibition"
  );
  assert.ok(
    preamble.includes("refactor this") ||
      preamble.includes("implement X") ||
      preamble.includes("fix this bug"),
    "runtime preamble must include implementation-phrasing examples"
  );
  assert.ok(
    preamble.includes("Sisyphus/omo.dev") ||
      preamble.includes("Sisyphus"),
    "runtime preamble must name Sisyphus/omo.dev as implementation owner"
  );
  assert.ok(
    preamble.includes("chartmaker/shipwright") ||
      preamble.includes("chartmaker/shipwright → docs → rigger → plan"),
    "runtime preamble must name the normal pipeline"
  );
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const SUBAGENTS = [
  "chartmaker",
  "cartographer",
  "hullwright",
  "bosun",
  "gunner",
  "coxswain",
  "rigger",
  "shipwright",
  "chronicler",
  "surveyor",
  "caulker",
] as const;

const EXPECTED_AGENTS = ["slipway", ...SUBAGENTS];

function loadSlipwayConfig() {
  const raw = readFileSync("slipway.json", "utf8");
  return JSON.parse(raw) as {
    agents: Record<
      string,
      {
        mode?: string;
        permission?: {
          webfetch?:
            | "ask"
            | "allow"
            | "deny"
            | Record<string, "ask" | "allow" | "deny">;
          task?:
            | "ask"
            | "allow"
            | "deny"
            | Record<string, "ask" | "allow" | "deny">;
          skill?:
            | "ask"
            | "allow"
            | "deny"
            | Record<string, "ask" | "allow" | "deny">;
          bash?:
            | "ask"
            | "allow"
            | "deny"
            | Record<string, "ask" | "allow" | "deny">;
        };
      }
    >;
  };
}

test("every agent has a skill permission block that denies harness-default planning skills", () => {
  const config = loadSlipwayConfig();
  const agents = Object.keys(config.agents).sort();

  assert.deepEqual(agents, EXPECTED_AGENTS.slice().sort());

  for (const name of EXPECTED_AGENTS) {
    const agent = config.agents[name];
    assert.ok(agent, `agent ${name} should exist`);
    assert.ok(agent.permission, `agent ${name} should have a permission block`);
    assert.ok(
      agent.permission.skill,
      `agent ${name} should have a permission.skill block`
    );
    assert.equal(
      typeof agent.permission.skill,
      "object",
      `agent ${name} permission.skill should be an object`
    );
    assert.notEqual(
      agent.permission.skill,
      null,
      `agent ${name} permission.skill should not be null`
    );

    const skill = agent.permission.skill as Record<string, string>;
    assert.equal(
      skill["*"],
      "allow",
      `agent ${name} should allow skills by default`
    );
    assert.equal(
      skill["superpowers*"],
      "deny",
      `agent ${name} should deny superpowers* skills`
    );
    assert.equal(
      skill["subagent-driven-development*"],
      "deny",
      `agent ${name} should deny subagent-driven-development* skills`
    );
  }
});

test("slipway task permission allows exactly the 11 subagents and denies everything else", () => {
  const config = loadSlipwayConfig();
  const slipway = config.agents.slipway;

  assert.ok(slipway, "slipway agent should exist");
  assert.ok(slipway.permission, "slipway should have a permission block");
  assert.ok(
    slipway.permission.task,
    "slipway should have a permission.task block"
  );
  assert.equal(
    typeof slipway.permission.task,
    "object",
    "slipway permission.task should be an object"
  );
  assert.notEqual(
    slipway.permission.task,
    null,
    "slipway permission.task should not be null"
  );

  const task = slipway.permission.task as Record<string, string>;
  assert.equal(task["*"], "deny", "slipway should deny task by default");

  for (const subagent of SUBAGENTS) {
    assert.equal(
      task[subagent],
      "allow",
      `slipway should allow task delegation to ${subagent}`
    );
  }

  const expectedKeys = new Set(["*", ...SUBAGENTS]);
  const actualKeys = Object.keys(task);
  assert.deepEqual(
    actualKeys.sort(),
    Array.from(expectedKeys).sort(),
    "slipway task permission should contain no unexpected keys"
  );
});

test("every subagent has task permission set to exactly deny", () => {
  const config = loadSlipwayConfig();

  for (const name of SUBAGENTS) {
    const agent = config.agents[name];
    assert.ok(agent, `subagent ${name} should exist`);
    assert.ok(
      agent.permission,
      `subagent ${name} should have a permission block`
    );
    assert.equal(
      agent.permission.task,
      "deny",
      `subagent ${name} should have permission.task set to exactly "deny"`
    );
  }
});

test("gunner webfetch permission is set to ask", () => {
  const config = loadSlipwayConfig();
  const gunner = config.agents.gunner;

  assert.ok(gunner, "gunner agent should exist");
  assert.ok(gunner.permission, "gunner should have a permission block");
  assert.equal(
    gunner.permission.webfetch,
    "ask",
    "gunner permission.webfetch should be flat string ask (object form crashes OpenCode TUI runtime)"
  );
});

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

const APPROVED_SKILL_ALLOWLIST: Record<string, string[]> = {
  slipway: ["learnings-capture"],
  chartmaker: [],
  cartographer: [],
  hullwright: ["bootstrap-from-prd", "session-log", "docs-publish"],
  bosun: [],
  gunner: ["learnings-capture"],
  coxswain: [
    "groomer-complexity-audit",
    "groomer-devops",
    "groomer-lead-dev",
    "groomer-qa",
  ],
  rigger: [],
  shipwright: ["session-log"],
  chronicler: ["learnings-capture", "session-log"],
  surveyor: [],
  caulker: ["doc-merge-resolution"],
};

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

test("every agent has a skill permission block that denies by default and allows only approved skills", () => {
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
      "deny",
      `agent ${name} should deny skills by default`
    );

    const expectedAllowedSkills = APPROVED_SKILL_ALLOWLIST[name];
    assert.ok(
      expectedAllowedSkills,
      `agent ${name} should have an approved skill allow-list entry`
    );

    for (const allowedSkill of expectedAllowedSkills) {
      assert.equal(
        skill[allowedSkill],
        "allow",
        `agent ${name} should allow approved skill ${allowedSkill}`
      );
    }

    const expectedKeys = new Set(["*", ...expectedAllowedSkills]);
    assert.deepEqual(
      Object.keys(skill).sort(),
      Array.from(expectedKeys).sort(),
      `agent ${name} skill permission should contain no unexpected keys`
    );
  }
});

test("no agent uses the old wildcard-allow skill permission shape", () => {
  const config = loadSlipwayConfig();

  for (const name of EXPECTED_AGENTS) {
    const agent = config.agents[name];
    const skill = agent.permission?.skill as Record<string, string> | undefined;

    assert.ok(skill, `agent ${name} should have a permission.skill block`);
    assert.notEqual(
      skill["*"],
      "allow",
      `agent ${name} must not allow all skills by default`
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

test("every agent has an explicit permission.edit key with the correct value", () => {
  const config = loadSlipwayConfig();

  const EXPECTED_EDIT_PERMISSIONS: Record<string, "allow" | "deny"> = {
    slipway: "deny",
    chartmaker: "allow",
    cartographer: "allow",
    hullwright: "allow",
    bosun: "deny",
    rigger: "allow",
    coxswain: "deny",
    shipwright: "allow",
    chronicler: "allow",
    surveyor: "deny",
    gunner: "allow",
    caulker: "allow",
  };

  for (const name of EXPECTED_AGENTS) {
    const agent = config.agents[name];
    assert.ok(agent, `agent ${name} should exist`);
    assert.ok(agent.permission, `agent ${name} should have a permission block`);
    assert.ok(
      "edit" in agent.permission,
      `agent ${name} should have an explicit permission.edit key (absent resolves to permissive in OpenCode runtime)`
    );
    const expectedValue = EXPECTED_EDIT_PERMISSIONS[name];
    assert.ok(
      expectedValue !== undefined,
      `agent ${name} should have an expected edit permission value defined in test`
    );
    assert.equal(
      agent.permission.edit,
      expectedValue,
      `agent ${name} permission.edit should be "${expectedValue}" per the authoritative table`
    );
  }
});

// ── Phase 2: Version sync test ──

test("slipway config version is synced to 0.13.7 before 0.13.8 changelog work", () => {
  const config = loadSlipwayConfig();
  assert.equal(
    (config as any).version,
    "0.13.7",
    "slipway.json version should be 0.13.7 after Phase 2 sync"
  );
});


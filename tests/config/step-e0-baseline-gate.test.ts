import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const slipwayContract = readFileSync("subagents/slipway.md", "utf8");

test("STEP E0 Baseline Reconciliation Gate exists in extend pipeline", async () => {
  // Verify STEP E0 section exists
  assert.ok(
    slipwayContract.includes("### STEP E0 — Baseline Reconciliation Gate"),
    "STEP E0 section must exist in slipway.md"
  );

  // Verify it's in the extend pipeline section (before STEP E1)
  const extendPipelineStart = slipwayContract.indexOf("## Pipeline — extend run (`extend`)");
  assert.ok(extendPipelineStart !== -1, "Extend pipeline section must exist");

  const stepE0Index = slipwayContract.indexOf("### STEP E0 — Baseline Reconciliation Gate");
  const stepE1Index = slipwayContract.indexOf("### STEP E1 — Extend");

  assert.ok(stepE0Index > extendPipelineStart, "STEP E0 must be in the extend pipeline section");
  assert.ok(stepE0Index < stepE1Index, "STEP E0 must come before STEP E1");
});

test("STEP E0 gate logic is load-bearing with clear skip and block conditions", async () => {
  // Verify gate logic exists with skip condition
  assert.ok(
    slipwayContract.includes("Bosun last run") && slipwayContract.includes("Bosun health score"),
    "STEP E0 must reference Bosun validation state"
  );

  // Verify skip condition exists
  assert.ok(
    slipwayContract.includes("Skip condition"),
    "STEP E0 must define a skip condition"
  );

  // Verify block condition exists
  assert.ok(
    slipwayContract.includes("Block condition"),
    "STEP E0 must define a block condition"
  );

  // Verify gate cannot be bypassed
  assert.ok(
    slipwayContract.includes("Never bypass this gate"),
    "STEP E0 must explicitly state it cannot be bypassed"
  );
});

test("Forbidden Behaviors enforce STEP E0 gate", async () => {
  const forbiddenBehaviors = slipwayContract.slice(
    slipwayContract.indexOf("## Forbidden Behaviors")
  );

  // Verify forbidden behavior for STEP E0 exists
  assert.ok(
    forbiddenBehaviors.includes("Never run STEP E1 (extend) without STEP E0"),
    "Forbidden Behaviors must enforce STEP E0 gate"
  );

  // Verify it references the lesson learned
  assert.ok(
    forbiddenBehaviors.includes("unvalidated baseline docs produces unreliable downstream results"),
    "Forbidden Behaviors must explain why the gate is required"
  );
});

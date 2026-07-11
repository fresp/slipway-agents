import test from "node:test";
import assert from "node:assert/strict";
import {
  checkStep4RecordedBeforeGunner,
  isGateAssertionsEnabled,
  registerGateAssertions,
  STEP4_GATE_ERROR_MESSAGE,
} from "../../src/plugin-handlers/gate-assertion-handler";
import type { SlipwayConfig } from "../../src/config/types";

function makeConfig(enabled: boolean | undefined): SlipwayConfig {
  return {
    version: "0.18.0",
    agents: { slipway: { model: "anthropic/claude-opus-4-8" } },
    ...(enabled === undefined ? {} : { gate_assertions: { enabled } }),
  } as SlipwayConfig;
}

// ── isGateAssertionsEnabled ──

test("isGateAssertionsEnabled is false when absent, null, or explicitly false", () => {
  assert.equal(isGateAssertionsEnabled(null), false);
  assert.equal(isGateAssertionsEnabled(makeConfig(undefined)), false);
  assert.equal(isGateAssertionsEnabled(makeConfig(false)), false);
});

test("isGateAssertionsEnabled is true only when explicitly enabled", () => {
  assert.equal(isGateAssertionsEnabled(makeConfig(true)), true);
});

// ── checkStep4RecordedBeforeGunner: not-applicable cases (allow) ──

test("allows when the decisions file does not exist", () => {
  assert.equal(checkStep4RecordedBeforeGunner(null), null);
});

test("allows when there is no STEP 3.5 entry yet (early pipeline)", () => {
  const content = [
    "# Pipeline Decisions",
    "",
    "## 2026-07-11T10:00:00Z — auto-continue — STEP 3 → STEP 3.1",
  ].join("\n");
  assert.equal(checkStep4RecordedBeforeGunner(content), null);
});

// ── checkStep4RecordedBeforeGunner: satisfied cases (allow) ──

test("allows when a discrete STEP 4 record follows the last STEP 3.5 entry", () => {
  const content = [
    "## 2026-07-11T10:00:00Z — STEP 3.5 — Ready to Plan",
    "Signal used: coxswain readiness",
    "## 2026-07-11T10:05:00Z — STEP 4 — Optimize Decision",
    "Confidence: high",
    "Result: proceed",
  ].join("\n");
  assert.equal(checkStep4RecordedBeforeGunner(content), null);
});

test("allows the interactive-mode STEP 4 heading shape (proceed/optimize decision)", () => {
  const content = [
    "## 2026-07-11T10:00:00Z — STEP 3.5 — Conditional",
    "## 2026-07-11T10:05:00Z — STEP 4 — proceed",
  ].join("\n");
  assert.equal(checkStep4RecordedBeforeGunner(content), null);
});

// ── checkStep4RecordedBeforeGunner: violation cases (throw) ──

test("blocks when STEP 3.5 is followed only by a bare STEP 3.5 → STEP 5 auto-continue (the observed bug)", () => {
  const content = [
    "## 2026-07-11T10:00:00Z — STEP 3.5 — Conditional",
    "## 2026-07-11T10:05:00Z — auto-continue — STEP 3.5 → STEP 5",
  ].join("\n");
  assert.equal(checkStep4RecordedBeforeGunner(content), STEP4_GATE_ERROR_MESSAGE);
});

test("blocks when STEP 3.5 has no following entry at all", () => {
  const content = "## 2026-07-11T10:00:00Z — STEP 3.5 — Ready to Plan";
  assert.equal(checkStep4RecordedBeforeGunner(content), STEP4_GATE_ERROR_MESSAGE);
});

test("uses the LAST STEP 3.5 entry — a STEP 4 record from a prior pass does not satisfy a later pass", () => {
  const content = [
    "## 2026-07-11T10:00:00Z — STEP 3.5 — Ready to Plan",
    "## 2026-07-11T10:05:00Z — STEP 4 — proceed",
    "## 2026-07-11T11:00:00Z — STEP 3.5 — Conditional",
    "## 2026-07-11T11:05:00Z — auto-continue — STEP 3.5 → STEP 5",
  ].join("\n");
  assert.equal(checkStep4RecordedBeforeGunner(content), STEP4_GATE_ERROR_MESSAGE);
});

// ── error message contract (the three empirically-motivated requirements) ──

test("error message names the missing precondition, the fix, and forbids the fallback path", () => {
  const msg = STEP4_GATE_ERROR_MESSAGE;
  // (1) states what is missing
  assert.ok(msg.includes("STEP 4"));
  assert.ok(msg.includes(".ai/docs/.pipeline-decisions.md"));
  assert.ok(msg.includes("STEP 3.5"));
  // (2) concrete corrective action
  assert.ok(msg.includes("append the discrete STEP 4 decision record"));
  assert.ok(msg.includes("retry this exact task call to gunner"));
  // (3) explicitly forbids doing gunner's work directly
  assert.ok(msg.includes("Do NOT work around this"));
  for (const tool of ["bash", "read", "grep", "edit"]) {
    assert.ok(msg.includes(tool), `error must forbid substituting ${tool}`);
  }
});

// ── registerGateAssertions: hook wiring ──

test("registerGateAssertions returns no hooks when disabled", () => {
  assert.deepEqual(registerGateAssertions("/tmp/project", null), {});
  assert.deepEqual(registerGateAssertions("/tmp/project", makeConfig(false)), {});
});

test("registerGateAssertions registers a tool.execute.before hook when enabled", () => {
  const hooks = registerGateAssertions("/tmp/project", makeConfig(true));
  assert.equal(typeof hooks["tool.execute.before"], "function");
});

test("hook ignores non-task tools and non-gunner subagents without throwing", async () => {
  const hook = registerGateAssertions("/tmp/does-not-exist", makeConfig(true))[
    "tool.execute.before"
  ] as (input: unknown, output: unknown) => Promise<void>;

  // Non-task tool: allowed regardless of state.
  await hook({ tool: "read" }, { args: {} });
  // task tool to a different subagent: not gated.
  await hook({ tool: "task" }, { args: { subagent_type: "bosun" } });
});

test("hook throws for a task→gunner call when the decisions file is missing STEP 4 after STEP 3.5", async () => {
  const os = await import("node:os");
  const fs = await import("node:fs");
  const path = await import("node:path");

  const root = fs.mkdtempSync(path.join(os.tmpdir(), "slipway-gate-"));
  const docsDir = path.join(root, ".ai", "docs");
  fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(
    path.join(docsDir, ".pipeline-decisions.md"),
    [
      "## 2026-07-11T10:00:00Z — STEP 3.5 — Conditional",
      "## 2026-07-11T10:05:00Z — auto-continue — STEP 3.5 → STEP 5",
    ].join("\n")
  );

  const hook = registerGateAssertions(root, makeConfig(true))[
    "tool.execute.before"
  ] as (input: unknown, output: unknown) => Promise<void>;

  await assert.rejects(
    () => hook({ tool: "task" }, { args: { subagent_type: "gunner" } }),
    /STEP 4 \(Optimize Decision\) has not been recorded/
  );

  fs.rmSync(root, { recursive: true, force: true });
});

test("hook allows a task→gunner call when a discrete STEP 4 record is present", async () => {
  const os = await import("node:os");
  const fs = await import("node:fs");
  const path = await import("node:path");

  const root = fs.mkdtempSync(path.join(os.tmpdir(), "slipway-gate-"));
  const docsDir = path.join(root, ".ai", "docs");
  fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(
    path.join(docsDir, ".pipeline-decisions.md"),
    [
      "## 2026-07-11T10:00:00Z — STEP 3.5 — Conditional",
      "## 2026-07-11T10:05:00Z — STEP 4 — Optimize Decision",
      "Result: proceed",
    ].join("\n")
  );

  const hook = registerGateAssertions(root, makeConfig(true))[
    "tool.execute.before"
  ] as (input: unknown, output: unknown) => Promise<void>;

  await hook({ tool: "task" }, { args: { subagent_type: "gunner" } });

  fs.rmSync(root, { recursive: true, force: true });
});

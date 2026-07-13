import test from "node:test";
import assert from "node:assert/strict";
import {
  compareDocsSnapshots,
  hashContent,
  isRelayConsultationEnabled,
} from "../../src/plugin-handlers/relay-consultation-handler";
import type { SlipwayConfig } from "../../src/config/types";

function makeConfig(enabled: boolean | undefined): SlipwayConfig {
  return {
    version: "0.18.0",
    agents: { slipway: { model: "anthropic/claude-opus-4-8" } },
    ...(enabled === undefined ? {} : { relay_consultation: { enabled } }),
  } as SlipwayConfig;
}

// ── isRelayConsultationEnabled ──

test("isRelayConsultationEnabled is false when absent, null, or explicitly false", () => {
  assert.equal(isRelayConsultationEnabled(null), false);
  assert.equal(isRelayConsultationEnabled(makeConfig(undefined)), false);
  assert.equal(isRelayConsultationEnabled(makeConfig(false)), false);
});

test("isRelayConsultationEnabled is true only when explicitly enabled", () => {
  assert.equal(isRelayConsultationEnabled(makeConfig(true)), true);
});

// ── hashContent ──

test("hashContent produces a stable sha1 hex digest for identical content", () => {
  const a = hashContent("hello world");
  const b = hashContent("hello world");
  assert.equal(a, b);
  assert.match(a, /^[0-9a-f]{40}$/);
});

test("hashContent produces different digests for different content", () => {
  assert.notEqual(hashContent("hello world"), hashContent("hello world!"));
});

// ── compareDocsSnapshots ──

test("compareDocsSnapshots reports no drift when snapshots are identical", () => {
  const before = { "02-technical-architecture.md": hashContent("v1") };
  const after = { "02-technical-architecture.md": hashContent("v1") };
  const result = compareDocsSnapshots(before, after);
  assert.deepEqual(result, {
    changed: [],
    added: [],
    removed: [],
    hasDrift: false,
  });
});

test("compareDocsSnapshots detects a changed file", () => {
  const before = { "02-technical-architecture.md": hashContent("v1") };
  const after = { "02-technical-architecture.md": hashContent("v2") };
  const result = compareDocsSnapshots(before, after);
  assert.deepEqual(result.changed, ["02-technical-architecture.md"]);
  assert.deepEqual(result.added, []);
  assert.deepEqual(result.removed, []);
  assert.equal(result.hasDrift, true);
});

test("compareDocsSnapshots detects an added file", () => {
  const before = { "02-technical-architecture.md": hashContent("v1") };
  const after = {
    "02-technical-architecture.md": hashContent("v1"),
    "AGENTS.md": hashContent("contract"),
  };
  const result = compareDocsSnapshots(before, after);
  assert.deepEqual(result.added, ["AGENTS.md"]);
  assert.deepEqual(result.changed, []);
  assert.deepEqual(result.removed, []);
  assert.equal(result.hasDrift, true);
});

test("compareDocsSnapshots detects a removed file", () => {
  const before = {
    "02-technical-architecture.md": hashContent("v1"),
    "AGENTS.md": hashContent("contract"),
  };
  const after = { "02-technical-architecture.md": hashContent("v1") };
  const result = compareDocsSnapshots(before, after);
  assert.deepEqual(result.removed, ["AGENTS.md"]);
  assert.deepEqual(result.changed, []);
  assert.deepEqual(result.added, []);
  assert.equal(result.hasDrift, true);
});

test("compareDocsSnapshots handles multiple simultaneous changes and sorts results", () => {
  const before = {
    "z-doc.md": hashContent("z1"),
    "a-doc.md": hashContent("a1"),
    "removed-doc.md": hashContent("gone"),
  };
  const after = {
    "z-doc.md": hashContent("z2"),
    "a-doc.md": hashContent("a1"),
    "added-doc.md": hashContent("new"),
  };
  const result = compareDocsSnapshots(before, after);
  assert.deepEqual(result.changed, ["z-doc.md"]);
  assert.deepEqual(result.added, ["added-doc.md"]);
  assert.deepEqual(result.removed, ["removed-doc.md"]);
  assert.equal(result.hasDrift, true);
});

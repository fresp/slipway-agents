import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Static doc-contract assertions for the STEP 5 draft->frozen manifest
// transition. STEP 5 previously documented the transition only as prose in
// the Doc Manifest section, with no actual instruction in its own process
// block. See CHANGELOG "Manifest doc Status now transitions draft -> frozen
// on STEP 5 pass" fix (resolves the 0.17.0 deferred note).

const bootstrapSkill = readFileSync(
  "skills/slipway/bootstrap-from-prd/SKILL.md",
  "utf8"
);
const bosunContract = readFileSync("subagents/bosun.md", "utf8");

function stepFiveSection(skill: string): string {
  const start = skill.indexOf("### STEP 5");
  assert.notEqual(start, -1, "SKILL.md must have a STEP 5 section");
  const next = skill.indexOf("### STEP 6", start);
  assert.notEqual(next, -1, "SKILL.md must have a STEP 6 section after STEP 5");
  return skill.slice(start, next);
}

test("STEP 5 has an explicit If validation passes instruction", () => {
  const section = stepFiveSection(bootstrapSkill);
  assert.ok(
    section.includes("If validation passes"),
    "STEP 5 must contain an explicit success-path instruction, not just the failure-path branch"
  );
});

test("STEP 5's success path writes both the manifest row and the doc header Status field to frozen", () => {
  const section = stepFiveSection(bootstrapSkill);
  const passIdx = section.indexOf("If validation passes");
  const failIdx = section.indexOf("If validation fails");
  assert.notEqual(passIdx, -1);
  assert.notEqual(failIdx, -1);
  assert.ok(passIdx < failIdx, "If validation passes must appear before If validation fails");

  const passSection = section.slice(passIdx, failIdx);
  assert.ok(
    passSection.includes(".manifest.md") && passSection.includes("Baseline row"),
    "success path must update the .manifest.md Baseline row"
  );
  assert.ok(
    passSection.includes("header") && passSection.includes("Status:"),
    "success path must update the doc's own header Status: field"
  );
  assert.ok(
    passSection.toLowerCase().includes("frozen"),
    "success path must set status to frozen"
  );
  assert.ok(
    passSection.includes("Last Reviewed"),
    "success path must stamp Last Reviewed with the generation date"
  );
});

test("STEP 5's success path is scoped to the current generation/regeneration scope, not just full bootstrap", () => {
  const section = stepFiveSection(bootstrapSkill);
  const passIdx = section.indexOf("If validation passes");
  const failIdx = section.indexOf("If validation fails");
  const passSection = section.slice(passIdx, failIdx);
  assert.ok(
    passSection.includes("current generation/regeneration scope"),
    "success path wording must cover full bootstrap, full rebuild, and partial regeneration alike"
  );
});

test("STEP 5's failure-path branch is unchanged", () => {
  const section = stepFiveSection(bootstrapSkill);
  const failIdx = section.indexOf("If validation fails");
  const failSection = section.slice(failIdx);
  assert.ok(failSection.includes("Identify the affected documents"));
  assert.ok(failSection.includes("Increment the minor version on each affected document"));
  assert.ok(failSection.includes("Regenerate only those documents"));
  assert.ok(failSection.includes("Re-run validation"));
  assert.ok(failSection.includes("Do not regenerate unrelated documents"));
});

test("bosun remains read-only and has no manifest-writing side effect (Option A)", () => {
  assert.ok(
    bosunContract.includes("This agent never modifies files. It reads and reports only."),
    "bosun.md must still declare itself read-only — a passing Bosun review must never gate or write manifest status"
  );
  assert.ok(
    bosunContract.includes("Never modify any document in `.ai/docs/` or `AGENTS.md`."),
    "bosun.md Forbidden Behaviors must still forbid modifying any .ai/docs/ document"
  );
});

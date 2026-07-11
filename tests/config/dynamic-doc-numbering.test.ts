import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Static doc-contract assertions for the dynamic-doc numbering floor. Dynamic
// docs must start at 12 because 11 is permanently reserved for gunner's fixed
// `11-security-audit.md` output path. See CHANGELOG "dynamic-doc numbering
// collision" fix.

const bootstrapSkill = readFileSync(
  "skills/slipway/bootstrap-from-prd/SKILL.md",
  "utf8"
);
const coxswainContract = readFileSync("subagents/coxswain.md", "utf8");

test("bootstrap-from-prd no longer numbers dynamic docs starting at 11", () => {
  assert.equal(
    bootstrapSkill.includes("starting at 11"),
    false,
    "SKILL.md must not tell dynamic docs to start at 11 (collides with gunner's 11-security-audit.md)"
  );
  assert.equal(
    bootstrapSkill.includes("| 11+ |"),
    false,
    "SKILL.md dynamic-doc trigger table must not use the 11+ number column"
  );
});

test("bootstrap-from-prd numbers dynamic docs starting at 12 and reserves 11 for gunner", () => {
  assert.ok(
    bootstrapSkill.includes("starting at 12"),
    "SKILL.md must number dynamic docs starting at 12"
  );
  assert.ok(
    bootstrapSkill.includes("| 12+ |"),
    "SKILL.md dynamic-doc trigger table must use the 12+ number column"
  );
  assert.ok(
    bootstrapSkill.includes("11 is permanently reserved") &&
      bootstrapSkill.includes("11-security-audit.md"),
    "SKILL.md must document that 11 is permanently reserved for gunner's 11-security-audit.md"
  );
  assert.ok(
    bootstrapSkill.includes(
      "Never assign the number 11 to any document other than gunner's security audit"
    ),
    "SKILL.md must include the explicit forbidden-behavior line reserving the 11 slot"
  );
});

test("bootstrap-from-prd tells dynamic-doc numbering to read the manifest for the next number", () => {
  assert.ok(
    bootstrapSkill.includes(".ai/docs/.manifest.md") &&
      bootstrapSkill.includes("highest existing number + 1"),
    "SKILL.md must instruct reading the manifest and using highest existing number + 1"
  );
});

test("coxswain dynamic-doc recommendation examples use the 12- floor, not 11-", () => {
  const sectionStart = coxswainContract.indexOf(
    "## Dynamic doc recommendations"
  );
  assert.notEqual(sectionStart, -1, "coxswain must have a Dynamic doc recommendations section");
  const section = coxswainContract.slice(sectionStart);

  for (const name of [
    "design-spec",
    "integration-spec",
    "migration-plan",
    "environment-config",
    "glossary",
  ]) {
    assert.ok(
      section.includes(`12-${name}.md`),
      `coxswain recommendation table should preview 12-${name}.md`
    );
    assert.equal(
      section.includes(`11-${name}.md`),
      false,
      `coxswain recommendation table must not preview 11-${name}.md (collides with gunner's 11 slot)`
    );
  }
});

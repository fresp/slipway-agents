import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const slipwayContract = readFileSync("subagents/slipway.md", "utf8");
const extendPipelineContract = readFileSync(
  "skills/slipway/pipeline-extend/SKILL.md",
  "utf8"
);
const doctorPipelineContract = readFileSync(
  "skills/slipway/pipeline-doctor/SKILL.md",
  "utf8"
);

function extractDoctorSectionN(n: number): string {
  const doctorSection = doctorPipelineContract.slice(
    doctorPipelineContract.indexOf("## Doctor mode")
  );
  const sectionStart = doctorSection.indexOf(`### ${n}`);
  if (sectionStart === -1) return "";
  const nextMatch = doctorSection
    .slice(sectionStart + 5)
    .match(/^###\s+\d/m);
  const sectionEnd =
    nextMatch != null && nextMatch.index != null
      ? sectionStart + 5 + nextMatch.index
      : doctorSection.length;
  return doctorSection.slice(sectionStart, sectionEnd);
}

test("STEP E0 Baseline Reconciliation Gate exists in extend pipeline", async () => {
  // Verify STEP E0 section exists
  assert.ok(
    extendPipelineContract.includes("### STEP E0 — Baseline Reconciliation Gate"),
    "STEP E0 section must exist in pipeline-extend skill"
  );

  // Verify it's in the extend pipeline section (before STEP E1)
  const extendPipelineStart = extendPipelineContract.indexOf("## Pipeline — extend run (`extend`)");
  assert.ok(extendPipelineStart !== -1, "Extend pipeline section must exist");

  const stepE0Index = extendPipelineContract.indexOf("### STEP E0 — Baseline Reconciliation Gate");
  const stepE1Index = extendPipelineContract.indexOf("### STEP E1 — Extend");

  assert.ok(stepE0Index > extendPipelineStart, "STEP E0 must be in the extend pipeline section");
  assert.ok(stepE0Index < stepE1Index, "STEP E0 must come before STEP E1");
});

test("STEP E0 gate logic is load-bearing with clear skip and block conditions", async () => {
  // Verify gate logic exists with skip condition
  assert.ok(
    extendPipelineContract.includes("Bosun last run") && extendPipelineContract.includes("Bosun health score"),
    "STEP E0 must reference Bosun validation state"
  );

  // Verify skip condition exists
  assert.ok(
    extendPipelineContract.includes("Skip condition"),
    "STEP E0 must define a skip condition"
  );

  // Verify block condition exists
  assert.ok(
    extendPipelineContract.includes("Block condition"),
    "STEP E0 must define a block condition"
  );

  // Verify gate cannot be bypassed
  assert.ok(
    extendPipelineContract.includes("Never bypass this gate"),
    "STEP E0 must explicitly state it cannot be bypassed"
  );
});

test("rarely used pipeline execution details are extracted from slipway", async () => {
  const sections = [
    {
      heading: "## Pipeline — extend run (`extend`)",
      inlineDetail: "### STEP E0 — Baseline Reconciliation Gate",
      skill: "pipeline-extend",
    },
    {
      heading: "## Pipeline — reverse-engineer mode",
      inlineDetail: "**STEP 1 — Cartographer**",
      skill: "pipeline-reverse-engineer",
    },
    {
      heading: "## Doctor mode",
      inlineDetail: "### 1. Config resolution",
      skill: "pipeline-doctor",
    },
    {
      heading: "## Pipeline — sync run (`sync`)",
      inlineDetail: "### STEP S1 — Sync",
      skill: "pipeline-sync",
    },
  ] as const;

  for (const section of sections) {
    const headingIndex = slipwayContract.indexOf(section.heading);
    assert.ok(headingIndex !== -1, `${section.heading} pointer should remain in slipway.md`);

    const nextSectionIndex = slipwayContract.indexOf("\n## ", headingIndex + section.heading.length);
    const pointerSection = slipwayContract.slice(
      headingIndex,
      nextSectionIndex === -1 ? undefined : nextSectionIndex
    );

    assert.ok(
      pointerSection.includes(`Invoke skill \`${section.skill}\``),
      `${section.heading} should point to ${section.skill}`
    );
    assert.ok(
      !pointerSection.includes(section.inlineDetail),
      `${section.heading} must not keep full execution details inline`
    );
  }
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

// ── Batch G: learnings-capture routing contract ──

test("Mode Detection has routing learnings-capture guidance between Step A and Step B", async () => {
  const modeDetection = slipwayContract.slice(
    slipwayContract.indexOf("## Mode Detection"),
    slipwayContract.indexOf("## Pipeline — full run")
  );

  const stepAIndex = modeDetection.indexOf("### Step A");
  const stepBIndex = modeDetection.indexOf("### Step B");
  assert.ok(stepAIndex !== -1, "Step A must exist in Mode Detection");
  assert.ok(stepBIndex !== -1, "Step B must exist in Mode Detection");
  assert.ok(stepBIndex > stepAIndex, "Step B must come after Step A");

  const betweenSteps = modeDetection.slice(stepAIndex, stepBIndex);

  assert.ok(
    betweenSteps.toLowerCase().includes("learnings-capture") ||
      betweenSteps.toLowerCase().includes("learnings capture"),
    "Routing learnings-capture guidance must appear between Step A and Step B"
  );
});

test("learnings-capture routing guidance includes Category, Source, Pattern-Key, and best-effort semantics", async () => {
  const modeDetection = slipwayContract.slice(
    slipwayContract.indexOf("## Mode Detection"),
    slipwayContract.indexOf("## Pipeline — full run")
  );

  const stepAIndex = modeDetection.indexOf("### Step A");
  const stepBIndex = modeDetection.indexOf("### Step B");
  const betweenSteps = modeDetection.slice(stepAIndex, stepBIndex);

  assert.ok(
    betweenSteps.includes("Category"),
    "Learnings-capture routing must mention Category routing"
  );
  assert.ok(
    betweenSteps.includes("Source") && betweenSteps.includes("slipway"),
    "Learnings-capture routing must mention Source slipway"
  );
  assert.ok(
    betweenSteps.includes("Pattern-Key"),
    "Learnings-capture routing must mention Pattern-Key routing"
  );

  const hasBestEffort =
    betweenSteps.toLowerCase().includes("best-effort") ||
    betweenSteps.toLowerCase().includes("non-blocking") ||
    betweenSteps.toLowerCase().includes("warn-and-continue");
  assert.ok(
    hasBestEffort,
    "Learnings-capture routing must specify best-effort / non-blocking / warn-and-continue semantics"
  );
});

test("existing ambiguity fallback remains: ask once, do not guess silently", async () => {
  const modeDetection = slipwayContract.slice(
    slipwayContract.indexOf("## Mode Detection"),
    slipwayContract.indexOf("## Pipeline — full run")
  );

  assert.ok(
    modeDetection.toLowerCase().includes("ask the user once") ||
      modeDetection.toLowerCase().includes("ask once"),
    "Ambiguity fallback must instruct to ask once"
  );
  assert.ok(
    modeDetection.toLowerCase().includes("do not guess silently") ||
      modeDetection.toLowerCase().includes("never guess silently"),
    "Ambiguity fallback must forbid silent guessing"
  );
});

// ── Batch G: Doctor section 7 — Learnings Memory Health ──

test("Doctor mode includes section 7 Learnings Memory Health", async () => {
  const section7 = extractDoctorSectionN(7);

  assert.ok(section7.length > 0, "Doctor mode must have a numbered section 7");

  assert.ok(
    section7.toLowerCase().includes("learnings") &&
      (section7.toLowerCase().includes("memory health") ||
        section7.toLowerCase().includes("learnings health")),
    "Section 7 must be titled Learnings / Learnings Memory Health"
  );
});

test("Doctor section 7 checks memory.md line count with threshold 100 and warning >90", async () => {
  const section7 = extractDoctorSectionN(7);
  assert.ok(section7.length > 0, "Section 7 must exist");

  assert.ok(
    section7.includes("memory.md"),
    "Section 7 must reference memory.md"
  );
  assert.ok(
    section7.toLowerCase().includes("line count"),
    "Section 7 must check memory.md line count"
  );
  assert.ok(
    section7.includes("100"),
    "Section 7 must define max/threshold of 100 lines"
  );
  assert.ok(
    section7.includes(">90") || section7.includes("90"),
    "Section 7 must define a warning threshold above 90"
  );
});

test("Doctor section 7 reports pending, promoted, and wont_fix counts", async () => {
  const section7 = extractDoctorSectionN(7);

  assert.ok(
    section7.toLowerCase().includes("pending"),
    "Section 7 must report pending count"
  );
  assert.ok(
    section7.toLowerCase().includes("promoted"),
    "Section 7 must report promoted count"
  );
  assert.ok(
    section7.includes("wont_fix"),
    "Section 7 must report wont_fix count"
  );
});

test("Doctor section 7 checks archive.md and promoted.md readability", async () => {
  const section7 = extractDoctorSectionN(7);

  assert.ok(
    section7.includes("archive.md"),
    "Section 7 must check archive.md readability"
  );
  assert.ok(
    section7.includes("promoted.md"),
    "Section 7 must check promoted.md readability"
  );
  assert.ok(
    section7.toLowerCase().includes("readable"),
    "Section 7 must verify archive.md and promoted.md are readable"
  );
});

test("Doctor section 7 is read-only and forbids invoking learnings-capture, bosun, gunner, chronicler", async () => {
  const section7 = extractDoctorSectionN(7);

  assert.ok(
    section7.toLowerCase().includes("read-only"),
    "Section 7 must be read-only"
  );

  const lower = section7.toLowerCase();
  assert.ok(
    lower.includes("learnings-capture"),
    "Section 7 must mention learnings-capture as forbidden to invoke"
  );
  assert.ok(
    lower.includes("bosun"),
    "Section 7 must forbid invoking bosun"
  );
  assert.ok(
    lower.includes("gunner"),
    "Section 7 must forbid invoking gunner"
  );
  assert.ok(
    lower.includes("chronicler"),
    "Section 7 must forbid invoking chronicler"
  );
});

// ── Phase 4: Implementation phrasing routing + direct source-edit prohibition ──

test("Mode Detection classifies implementation phrasing by underlying requirement not surface wording", async () => {
  const modeDetection = slipwayContract.slice(
    slipwayContract.indexOf("## Mode Detection"),
    slipwayContract.indexOf("## Pipeline — full run")
  );

  const bootstrapping = modeDetection.slice(
    modeDetection.indexOf("**Bootstrapping:"),
    modeDetection.indexOf("**Reading/understanding:")
  );

  assert.ok(
    bootstrapping.includes("refactor this service") ||
      bootstrapping.includes("implement X") ||
      bootstrapping.includes("build Y"),
    "Bootstrapping should mention implementation-phrasing examples"
  );
  assert.ok(
    bootstrapping.includes("underlying requirement") ||
      bootstrapping.includes("classified by"),
    "Bootstrapping should classify by underlying requirement, not surface phrasing"
  );
  assert.ok(
    bootstrapping.includes("chartmaker"),
    "Bootstrapping should route implementation phrasing to chartmaker when no docs baseline exists"
  );
  assert.ok(
    bootstrapping.includes("never write source code directly") ||
      bootstrapping.includes("never write source code"),
    "Bootstrapping should forbid direct source code writing"
  );

  const changingScope = modeDetection.slice(
    modeDetection.indexOf("**Changing scope or behavior:"),
    modeDetection.indexOf("**Diagnosing:")
  );

  assert.ok(
    changingScope.includes("refactor this service") ||
      changingScope.includes("implement X") ||
      changingScope.includes("build Y"),
    "Changing scope should mention implementation-phrasing examples"
  );
  assert.ok(
    changingScope.includes("underlying requirement") ||
      changingScope.includes("classified by"),
    "Changing scope should classify by underlying requirement, not surface phrasing"
  );
  assert.ok(
    changingScope.includes("shipwright"),
    "Changing scope should route implementation phrasing to shipwright when baseline docs exist"
  );
  assert.ok(
    changingScope.includes("never write source code directly") ||
      changingScope.includes("never write source code"),
    "Changing scope should forbid direct source code writing"
  );
});

test("Forbidden Behaviors prohibit direct source edits and name Sisyphus omo.dev as implementation owner", async () => {
  const forbiddenBehaviors = slipwayContract.slice(
    slipwayContract.indexOf("## Forbidden Behaviors")
  );

  assert.ok(
    forbiddenBehaviors.includes("Never write, edit, or generate application/source code directly"),
    "Forbidden Behaviors must include direct source-edit prohibition"
  );
  assert.ok(
    forbiddenBehaviors.includes("refactor this") ||
      forbiddenBehaviors.includes("implement X") ||
      forbiddenBehaviors.includes("fix this bug"),
    "Forbidden Behaviors must include implementation-phrasing examples"
  );
  assert.ok(
    forbiddenBehaviors.includes("chartmaker/shipwright → docs → rigger → plan") ||
      forbiddenBehaviors.includes("chartmaker/shipwright"),
    "Forbidden Behaviors must name the normal pipeline"
  );
  assert.ok(
    forbiddenBehaviors.includes("Sisyphus/omo.dev") ||
      forbiddenBehaviors.includes("Sisyphus"),
    "Forbidden Behaviors must name Sisyphus/omo.dev as implementation owner"
  );
});

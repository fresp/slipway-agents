import * as fs from "fs";
import * as path from "path";
import { Hooks, SlipwayConfig } from "../config/types";

/**
 * Opt-in, plugin-level enforcement of pipeline gate preconditions.
 *
 * OpenCode API used: the `tool.execute.before` hook, which fires before a tool
 * call executes — including when the primary orchestrator invokes a subagent
 * via the `task` tool. Throwing inside the hook blocks that specific tool call
 * and surfaces the error message to the model.
 *
 * Scope: exactly one hardcoded assertion this batch — STEP 4 (Optimize
 * Decision) must have a discrete decision record in
 * `.ai/docs/.pipeline-decisions.md` before the orchestrator may delegate to
 * `gunner` (STEP 5). This is defense-in-depth on top of the prompt-level STEP 4
 * logging requirement (subagents/slipway.md, v0.17.0), not a replacement for it
 * and not a generic rule engine.
 *
 * No polling, no background timers, no new persisted state — the assertion
 * reads only the decision log the orchestrator already writes.
 */

const PIPELINE_DECISIONS_RELATIVE_PATH = path.join(
  ".ai",
  "docs",
  ".pipeline-decisions.md"
);

/**
 * Error text thrown when a `task` call to gunner is attempted without a
 * discrete STEP 4 record. Written to (1) name the missing precondition,
 * (2) give the concrete corrective action, and (3) explicitly forbid the
 * fallback of doing gunner's work directly — the empirically-observed failure
 * mode where a blocked delegation is abandoned rather than corrected.
 */
export const STEP4_GATE_ERROR_MESSAGE =
  "[slipway gate assertion] STEP 4 (Optimize Decision) has not been recorded before STEP 5 (security audit / gunner).\n\n" +
  "Precondition missing: no discrete STEP 4 decision record was found in .ai/docs/.pipeline-decisions.md after the most recent STEP 3.5 (grooming) entry. " +
  "Per subagents/slipway.md's STEP 4 section, STEP 4 is mandatory on every pass that reaches it and must be logged as its own entry " +
  "(e.g. \"## [timestamp] — STEP 4 — Optimize Decision\", stating which STEP 4 branch applied and the confidence signal used) before gunner may run. " +
  "A bare \"STEP 3.5 → STEP 5\" auto-continue line is not a substitute for that discrete record.\n\n" +
  "Required next action: evaluate STEP 4 now and append the discrete STEP 4 decision record to .ai/docs/.pipeline-decisions.md in the format defined in that section, " +
  "then retry this exact task call to gunner.\n\n" +
  "Do NOT work around this block. You must not perform gunner's security audit yourself, and you must not substitute bash, read, grep, edit, or any other tool " +
  "for delegating to the gunner subagent. The only valid way forward is to write the missing STEP 4 decision record and re-issue the task call to gunner. " +
  "This block is defense-in-depth for the STEP 4 gate, not an error to route around.";

/** Whether the opt-in gate-assertion feature is turned on for this project. */
export function isGateAssertionsEnabled(
  config: SlipwayConfig | null
): boolean {
  return config?.gate_assertions?.enabled === true;
}

function isHeadingLine(line: string): boolean {
  return /^\s*#{1,6}\s/.test(line);
}

/**
 * Pure assertion logic, decoupled from the filesystem and the OpenCode runtime
 * so it can be unit-tested directly.
 *
 * @param decisionsContent the full text of `.ai/docs/.pipeline-decisions.md`,
 *   or `null` if the file does not exist.
 * @returns an error message string if the STEP 4 → gunner precondition is
 *   violated (caller should throw), or `null` if the call should be allowed
 *   (precondition satisfied, or not yet applicable).
 */
export function checkStep4RecordedBeforeGunner(
  decisionsContent: string | null
): string | null {
  // No decision log yet — the pipeline hasn't reached STEP 4. Not applicable.
  if (decisionsContent === null) {
    return null;
  }

  const lines = decisionsContent.split(/\r?\n/);

  // Find the last heading line that references STEP 3.5. This marks the point
  // after which STEP 4 should have been evaluated and logged.
  let lastStep35HeadingIndex = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (isHeadingLine(lines[i]) && /STEP\s*3\.5/.test(lines[i])) {
      lastStep35HeadingIndex = i;
      break;
    }
  }

  // No STEP 3.5 entry at all — very early pipeline state. Not applicable.
  if (lastStep35HeadingIndex === -1) {
    return null;
  }

  // Look for a discrete STEP 4 decision record among the heading lines strictly
  // after the last STEP 3.5 marker. A discrete record is a heading entry that
  // names STEP 4 as its subject (e.g. "## [timestamp] — STEP 4 — ..."). A
  // generic "STEP 3.5 → STEP 5" auto-continue line does not name STEP 4 and so
  // does not satisfy the gate.
  for (let i = lastStep35HeadingIndex + 1; i < lines.length; i++) {
    if (isHeadingLine(lines[i]) && /STEP\s*4\b/.test(lines[i])) {
      return null;
    }
  }

  return STEP4_GATE_ERROR_MESSAGE;
}

interface ToolExecuteBeforeInput {
  tool?: string;
  [key: string]: unknown;
}

interface ToolExecuteBeforeOutput {
  args?: { subagent_type?: string; [key: string]: unknown };
  [key: string]: unknown;
}

/**
 * Registers the `tool.execute.before` hook that enforces the STEP 4 → gunner
 * assertion. Returns an empty hook set when the feature is disabled, so the
 * default (opt-out) path adds no runtime behavior at all.
 */
export function registerGateAssertions(
  projectRoot: string | undefined,
  config: SlipwayConfig | null
): Hooks {
  if (!isGateAssertionsEnabled(config)) {
    return {};
  }

  const root = projectRoot ?? process.cwd();
  const decisionsPath = path.join(root, PIPELINE_DECISIONS_RELATIVE_PATH);

  return {
    "tool.execute.before": async (
      input: ToolExecuteBeforeInput,
      output: ToolExecuteBeforeOutput
    ): Promise<void> => {
      if (input?.tool !== "task") {
        return;
      }
      if (output?.args?.subagent_type !== "gunner") {
        return;
      }

      const decisionsContent = fs.existsSync(decisionsPath)
        ? fs.readFileSync(decisionsPath, "utf-8")
        : null;

      const errorMessage = checkStep4RecordedBeforeGunner(decisionsContent);
      if (errorMessage) {
        throw new Error(errorMessage);
      }
    },
  };
}

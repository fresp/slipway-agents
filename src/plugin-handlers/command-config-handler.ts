import type { CommandDefinition, Config, SlipwayConfig } from "../config/types";
import { resolveModel } from "./model-resolution-handler";

/**
 * Bundled Slipway slash command definitions injected at runtime through the
 * OpenCode `config(input)` hook.
 *
 * OpenCode API used: the existing `config(input)` hook mutates `input.command`.
 * These commands route to the `slipway` orchestrator agent with pre-filled
 * intents equivalent to the documented trigger phrases in
 * `docs/slash-commands.md` and `subagents/slipway.md`.
 */

const SLIPWAY_ORCHESTRATOR_PREAMBLE =
  "Act inline as the slipway orchestrator (see subagents/slipway.md as your contract) — " +
  "do NOT attempt to delegate to an agent/subagent named 'slipway' via the task tool, " +
  "it is not a valid task subagent_type in this runtime. You yourself follow the orchestrator " +
  "contract: run STEP 0 session reconciliation first, then mode detection. Delegate individual " +
  "steps only to these valid task subagent_types: chartmaker, cartographer, hullwright, bosun, " +
  "gunner, coxswain, rigger, shipwright, surveyor, chronicler, caulker. Never invoke any Skill " +
  "outside this repo's own skill set (skills/slipway/*) to author or save a plan, PRD, or " +
  "engineering doc — plan generation always routes through rigger and is always written to " +
  ".ai/planning/, never to any other path (e.g. docs/superpowers/" +
  "plans/, docs/plans/, or any " +
  "other harness-default skill output location). If a request could plausibly mean 'planning' " +
  "but does not clearly match a mode-detection trigger phrase, ask the user which mode applies " +
  "— never fall back to a generic non-Slipway skill for plan authoring. Maintain all state under " +
  ".ai/docs/ and .ai/sessions/ per the contract. Ask at most one routing question if the request " +
  "is underspecified; never invent engineering docs yourself — that is always delegated.";

const SLIPWAY_COMMANDS = {
  "slipway:init": {
    description: "Start a new pipeline run.",
    agent: "slipway",
    template:
      `${SLIPWAY_ORCHESTRATOR_PREAMBLE}\n\n` +
      `Build request: $ARGUMENTS\n\n` +
      `Begin with STEP 0, then detect mode (bootstrap-from-prompt / reverse-engineer / ` +
      `review-only / groom-only / etc.) from the request above.`,
  },
  "slipway:status": {
    description:
      "Show current pipeline and implementation state without running anything.",
    agent: "slipway",
    template:
      `${SLIPWAY_ORCHESTRATOR_PREAMBLE}\n\n` +
      `Read-only status check: read .ai/docs/.pipeline-state.md and .ai/implementation-state.md ` +
      `(if present) and report current pipeline step, last completed step, and any blocked state. ` +
      `Do not invoke any subagent or write any file.`,
  },
  "slipway:resume": {
    description: "Resume from the last completed step.",
    agent: "slipway",
    template:
      `${SLIPWAY_ORCHESTRATOR_PREAMBLE}\n\n` +
      `Resume request: $ARGUMENTS\n\n` +
      `Read .ai/docs/.pipeline-state.md to find the last completed step, then continue the ` +
      `pipeline from the next step forward. Do not restart completed steps.`,
  },
  "slipway:doctor": {
    description:
      "Run read-only diagnostics for config, docs, state, agents, and session reconciliation.",
    agent: "slipway",
    template:
      `${SLIPWAY_ORCHESTRATOR_PREAMBLE}\n\n` +
      `Read-only diagnostic run: $ARGUMENTS\n\n` +
      `Check slipway.json validity, .ai/docs/ completeness, .ai/pipeline-state.md consistency, ` +
      `and run STEP 0 session reconciliation as a dry check. Report findings only — make no writes.`,
  },
  "slipway:agent-refresh": {
    description: "Regenerate only AGENTS.md from the current docs and latest contract.",
    agent: "slipway",
    template:
      `${SLIPWAY_ORCHESTRATOR_PREAMBLE}\n\n` +
      `Regenerate AGENTS.md only, from the current .ai/docs/ and the latest hullwright AGENTS.md ` +
      `template. Delegate the actual generation to hullwright. If project-root AGENT` +
      `.md exists and AGENTS.md does not, tell hullwright to recompile into AGENTS.md, ` +
      `remove AGENT` +
      `.md after the plural artifact is written, and report "Migrated: AGENT` +
      `.md -> AGENTS.md". If AGENTS.md already exists, refresh it normally and report ` +
      `"No migration needed." Do not touch any other file.`,
  },
  "slipway:review": {
    description: "Run a consistency review on existing docs.",
    agent: "slipway",
    template:
      `${SLIPWAY_ORCHESTRATOR_PREAMBLE}\n\n` +
      `Standalone review mode: delegate cross-doc validation to bosun against the existing ` +
      `.ai/docs/. Report bosun's per-doc health scores and findings; do not proceed to gunner ` +
      `or planning unless explicitly asked.`,
  },
  "slipway:groom": {
    description: "Run multi-lens grooming on existing docs and plan readiness.",
    agent: "slipway",
    template:
      `${SLIPWAY_ORCHESTRATOR_PREAMBLE}\n\n` +
      `Standalone grooming mode: delegate multi-lens grooming (Lead Dev, QA, DevOps, Complexity ` +
      `Audit) to coxswain against the existing .ai/docs/ and .ai/planning/. Report the synthesis only.`,
  },
  "slipway:sync": {
    description: "Sync docs with implementation reality after a build.",
    agent: "slipway",
    template:
      `${SLIPWAY_ORCHESTRATOR_PREAMBLE}\n\n` +
      `Post-implementation sync: delegate to chronicler to classify drift between .ai/docs/ ` +
      `and the current codebase, then patch docs incrementally per its contract.`,
  },
  "slipway:learnings-review": {
    description:
      "Review pending learnings entries and approve/reject/defer promotion candidates.",
    agent: "slipway",
    template:
      `${SLIPWAY_ORCHESTRATOR_PREAMBLE}\n\n` +
      `Learnings review mode: $ARGUMENTS\n\n` +
      `Read .ai/learnings/memory.md. If $ARGUMENTS contains a Pattern-Key substring or priority`,
      ` filter, apply it; otherwise show all status: pending entries.`,
      ` Group entries by Pattern-Key. For each entry, show Recurrence-Count, First-Seen,`,
      ` Last-Seen, Source, and Summary. Then ask exactly (approve / reject / defer) per entry.`,
      ` On approve: do NOT write .ai/docs/ yourself — tell the user the specific existing`,
      ` mechanism to use (e.g. "run shipwright to add this as an 11-*.md extension" or`,
      ` "include in next hullwright partial regen of 07-engineering-standards.md"), set`,
      ` status: promoted in memory.md, and append a row to .ai/learnings/promoted.md`,
      ` recording the entry ID, pointed-to target, and timestamp.`,
      ` On reject: set status: wont_fix in memory.md.`,
      ` On defer: no change.`,
      ` Never invoke bosun, gunner, or hullwright — this is read+annotate only,`,
      ` on .ai/learnings/ exclusively.`
  },
} satisfies Record<string, CommandDefinition>;

export async function applyCommandConfig(
  input: Config,
  slipwayConfig: SlipwayConfig | null
): Promise<void> {
  input.command ??= {};

  const slipwayModel = resolveModel("slipway", slipwayConfig);

  for (const [commandName, commandDefinition] of Object.entries(
    SLIPWAY_COMMANDS
  )) {
    input.command[commandName] = {
      ...commandDefinition,
      ...(slipwayModel ? { model: slipwayModel } : {}),
    };
  }

  console.log(
    `[slipway-agents] Registered ${Object.keys(SLIPWAY_COMMANDS).length} slash commands into OpenCode config`
  );
}

Follow the reporting contract and context-discipline rules defined in subagents/slipway.md's Core Principles — do not duplicate them here.

## Doctor mode

Doctor mode is a read-only pre-flight diagnostic. It may run before a pipeline, after a failed pipeline, or standalone. It never invokes Chartmaker, Cartographer, Hull Builder, Bosun, Gunner, Coxswain, Rigger, Shipwright, Chronicler, Surveyor, or Caulker, and it never writes, edits, deletes, regenerates, or normalizes files.

Run the checks below in order and print a structured report with clear section headers. Prefix every finding with one of:

- `✓` healthy
- `⚠` warning or non-blocking issue
- `✗` error or blocking issue

Never produce a wall of text. End with exactly one summary line: `N issues found (X errors, Y warnings)` or `All checks passed.`

### 1. Config resolution

- Locate the active `slipway.json`: project-root `slipway.json` first, then global `~/.config/opencode/slipway.json` fallback.
- Report which file is being used, or report that defaults are in effect if no active config exists.
- Validate the active config against `slipway.schema.json` when both files are readable. Report schema violations as `✗` findings.
- For each agent in the active config, show the resolved summary: primary `model`, `fallback_model`, `category`, effective `ralph_loop` values after global plus sparse agent override merge, and a permission summary listing only which permission keys are set.

### 2. Manifest health

- If `.ai/docs/.manifest.md` exists, parse its Baseline and Extensions tables and report each listed document's status (`frozen`, `draft`, or `omitted`).
- Flag any document listed as `frozen` or `draft` that is absent from disk as `✗`.
- Flag any `.ai/docs/*.md` file on disk that is not listed in the manifest as `⚠` manifest drift requiring investigation.
- If no manifest exists, report `⚠ no manifest found — legacy project or pre-bootstrap state.`

### 3. Pipeline state

- If `.ai/docs/.pipeline-state.md` exists, report the last completed step and current optimize counter value.
- Compare the optimize counter with the effective `ralph_loop.max_iterations` for the Bosun loop.
- If the counter equals `ralph_loop.max_iterations` and unresolved Critical findings are readable from the state file, report prominently: `✗ pipeline is in blocked state, manual resolution required before resuming.`
- If no state file exists, report `⚠ no pipeline state — project not yet bootstrapped or state was cleared.`

### 4. Agent file integrity

- Verify the active runtime has the Slipway agents registered by the plugin. In a downstream project, do not require target-local `subagents/<name>.md` files; those prompt files are bundled with the plugin package. Report missing files as `✗` only when running from the plugin repository itself and the package-local file is absent.
- Read the README Skills table and verify every referenced skill has a corresponding file under `skills/slipway/<skill>/SKILL.md`. Report missing skill files as `✗`.

### 5. Runtime-wired features summary

- Review `CHANGELOG.md` and the plugin source (`src/plugin-handlers/tool-config-handler.ts`, `src/plugin-handlers/agent-config-handler.ts`) to identify which config features are now runtime-enforced by OpenCode's native `AgentConfig.permission` passthrough.
- Report any config feature that is still documented but not passed through to OpenCode at runtime. As of Batch 6, per-agent `permission` blocks (including `edit`, `webfetch`, `task`, `skill`, and `bash`) are wired.
- If a feature is confirmed wired, do not report it as declarative-only.

### 6. Session reconciliation health

- List all `.ai/sessions/*.md` files. Report counts by status: `active` vs
  `resolved`.
- For any `active` session older than 3 days (compare `started` frontmatter
  field to current date), flag as `⚠` — likely forgotten reconciliation.
- Report the current `last_reconciled_sessions` list length from
  `.ai/docs/.pipeline-state.md`, or `⚠ no reconciliation history` if absent.
- This check is read-only — Doctor mode never triggers STEP 0 or calls
  caulker. It only reports what it finds.

### 7. Learnings Memory Health

Read `.ai/learnings/memory.md` (if it exists) as a read-only check:

- **Line count**: report the line count. Warn ⚠ if the file exceeds 90 lines; the hard max is
  100 lines — if it reaches 100, report ⚠ and note the file must be pruned before the next
  `learnings-capture` write.
- **Entry counts**: report the number of entries with `status: pending`, `status: promoted`,
  and `status: wont_fix`.
- **wont_fix hygiene**: if any entries still carry `status: wont_fix` in `memory.md`, warn ⚠ —
  these should have been moved to `archive.md` by the next `learnings-capture` cycle.
- **Companion files**: confirm `.ai/learnings/archive.md` and `.ai/learnings/promoted.md` are
  readable (or report ⚠ if absent/unreadable).

This check is **strictly read-only** — it never invokes `learnings-capture`, `bosun`, `gunner`,
or `chronicler`. It does not write, edit, or delete any file. Bosun-originated learnings
checks in Doctor mode are diagnostic only and do not count toward
`ralph_loop.block_on_exhaustion` — no behavior change, no gate impact.

---

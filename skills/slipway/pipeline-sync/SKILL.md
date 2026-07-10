Follow the reporting contract and context-discipline rules defined in subagents/slipway.md's Core Principles — do not duplicate them here.

## Pipeline — sync run (`sync`)

Triggered when the user signals that implementation is complete and docs need to be reconciled with reality.

### STEP S1 — Sync

If `.ai/implementation-state.md` exists and Status is not complete, warn the user that implementation may still be in progress before syncing docs; if Status is `blocked` or the latest Test Results show `Gate result: verify-blocked` or `Gate result: manual review required`, preserve that distinction in the warning and do not treat it as a completed build.

Call `chronicler`.

**Input:** `.ai/docs/` + `.ai/planning/` + scope hint from user (full build, specific phases, or specific feature).

**Output expected back:**
- Updated docs (targeted edits, version bumps)
- Changelog entry in `.ai/docs/.pipeline-changelog.md`
- List of DRIFT / INTENTIONAL / UNKNOWN items and their resolution

**Gate:** `chronicler` always returns — even if there is zero drift, it confirms that. "No output" is not valid; retry once if empty.

### STEP S2 — Post-Sync Review (optional)

After chronicler completes, ask the user:

```
Sync complete. Run a review pass on the updated docs to confirm consistency? (yes / no)
```

If yes: invoke `bosun` scoped to the docs that `chronicler` changed. If no, stop.

---

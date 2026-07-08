---
name: learnings-capture
description: Append a candidate learning to .ai/learnings/memory.md — a raw,
  unvetted, project-scoped log of drift, security, validation, and routing
  observations. Deduplicates by Pattern-Key. Used by chronicler, gunner, and
  slipway (never by bosun directly — see Insertion points). Never writes to
  .ai/docs/ and never promotes anything on its own.
---

# learnings-capture

Read `.ai/learnings/memory.md` (≤100 lines). `grep -n "Pattern-Key: <key>"` for a match.

- Match found → bump `Recurrence-Count`, update `Last-Seen`, append caller's entry ID to `See Also`.
- No match → append new entry using the template below.

If `memory.md` would exceed 100 lines after append, move the oldest `wont_fix`/lowest-priority entries to `.ai/learnings/archive.md` first (COLD tier, unlimited).

Never write to `.ai/docs/`, never change `status` to `promoted` (that's `/slipway:learnings-review`'s job only), never block the caller — on failure, warn and continue, same as `session-log`.

## Entry template

```markdown
## LRN-YYYYMMDD-XXX
- **Category**: drift | security | validation | routing
- **Priority**: low | medium | high | critical
- **Status**: pending | promoted | wont_fix
- **Pattern-Key**: area.symptom (e.g. `security.auth.missing-endpoint-auth`, `sync.drift.orm-default-nullable`)
- **Recurrence-Count**: 1
- **First-Seen**: YYYY-MM-DD
- **Last-Seen**: YYYY-MM-DD
- **Source**: chronicler | gunner | slipway
- **Summary**: one paragraph — what was observed and why it's a candidate.
- **See Also**: [other entry IDs] or none
```

## Forbidden behaviors

- Never write to `.ai/docs/`.
- Never change `status` to `promoted`.
- Never block the caller on failure — warn and continue.

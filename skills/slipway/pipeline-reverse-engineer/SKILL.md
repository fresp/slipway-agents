Follow the reporting contract and context-discipline rules defined in subagents/slipway.md's Core Principles — do not duplicate them here.

## Pipeline — reverse-engineer mode

**Trigger:** `.ai/docs/` absent or empty AND root manifest file present at project root (`package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `composer.json`).

This condition is checked BEFORE `bootstrap-from-prompt`. If both a codebase and no docs are present, `reverse-engineer` takes priority.

**Pipeline:**

**STEP 1 — Cartographer**
- Invoke: `cartographer`
- Input: project root directory path
- Gate: `CARTOGRAPHER COMPLETE` signal received
- If `CARTOGRAPHER BLOCKED`: route to `chartmaker` for standard PRD intake instead

**STEP 2 — Chartmaker (gap-fill mode)**
- Invoke: `chartmaker` with cartographer's gap-fill briefing
- Note: chartmaker asks only the gaps cartographer could not infer — not the full PRD intake flow
- Gate: `01-prd.md` written to `.ai/docs/`

**STEP 3 — Bosun (relaxed threshold)**
- Invoke: `bosun`
- Input: all `.ai/docs/` files, including cartographer-generated docs with confidence markers
- Gate: bosun score ≥ 60 (not standard 70 — cartographer docs are expected to have [PARTIAL] sections)
- Pass the 60-threshold override to bosun explicitly in the routing handoff

**STEP 4 — Continue standard pipeline**
- Route to `gunner` and continue from standard STEP 5 onward

---

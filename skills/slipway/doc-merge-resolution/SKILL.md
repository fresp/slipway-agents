# Skill: doc-merge-resolution

Used by: `caulker`

Purpose: Define, per document type, what counts as a "unit" for structural comparison, and the exact rules for classifying a divergence between two versions of that unit. This skill exists because `.ai/docs/*.md` and `AGENT.md` are structured documents wearing markdown as a serialization format — a git line-diff cannot see their structure, so this skill defines it explicitly.

---

## General parsing rule

For any document not covered by a specific rule below, fall back to: one unit per `##`-level heading section. Compare sections by heading text; a section present in only one version is additive, a section present in both with different body content is a diverged edit.

Every specific rule below overrides this fallback for its document.

---

## `01-prd.md`

Unit: one Functional Requirement, identified by its `FR-ID` (e.g. `FR-014`).

- New `FR-ID` in only one version → additive.
- Same `FR-ID` present in both with different text → diverged edit, block.
- Same `FR-ID` with matching text but different `[P0]`/`[P1]`/`[P2]` priority tag → diverged edit, block (priority conflicts affect `rigger` phase placement — never silently pick one).
- Two different new `FR-ID`s that describe the same capability in different words → this skill cannot detect semantic duplication automatically; flag as a **Note** (not a hard block) in the report for the user to check, but do not block the merge on it.

---

## `03-service-boundaries.md`

Unit: one list entry under a service's `Owns` or `Must never own` list.

- New entry, new service section entirely → additive.
- New entry added to an existing service's `Owns` list → additive, **unless** the same capability string (or a close paraphrase) already appears in another service's `Owns` list in either version — that is an ownership collision, block.
- Same service's `Owns` list has an entry worded differently between versions (not a pure addition) → diverged edit, block.
- An entry moved from one service's `Owns` to another's between versions → always block, regardless of whether it looks intentional — ownership transfers are exactly the kind of change that must be a visible human decision.

---

## `08-architecture-decisions.md`

Unit: one ADR block, identified by `ADR-NNN`.

- New `ADR-NNN` in only one version → additive, **unless** its content contradicts an ADR present in the other version (e.g. one ADR says "no shared packages," another new ADR says "introduce a shared package for X") → block as additive-overlapping.
- Same `ADR-NNN` edited differently → diverged edit, block. ADRs are not supposed to change after being frozen; a diverged edit to an existing ADR number is a signal worth flagging even more prominently than usual in the report ("this ADR was supposed to be frozen — confirm this is an intentional revision, not a merge accident").
- ADR numbering collision — two different new ADRs independently claimed the same `ADR-NNN` on different branches → always block; resolution requires renumbering one of them, never silently reassign.

---

## `05-api-specifications.md`

Unit: one endpoint block, identified by `[HTTP method] [path]`.

- New endpoint (new method+path pair) → additive.
- Same method+path defined differently (different owner, different auth, different schema) → diverged edit, block.
- Two different new endpoints that resolve to the same effective path with path-parameter variations that would collide at runtime (e.g. `GET /users/:id` vs `GET /users/active`) → flag as a **Note** for human review; this skill does not attempt full route-collision analysis, only literal string matches are auto-classified.

---

## `04-data-models.md`

Unit: one collection/table schema block, and within it, one field definition.

- New collection/table → additive.
- New field added to an existing collection in only one version → additive.
- Same field name with a different type, required flag, or encryption requirement between versions → diverged edit, block. Type and encryption mismatches are treated as high-severity even though the classification is the same as any other diverged edit — call this out explicitly in the report.

---

## `AGENT.md`

Unit: one named top-level section, per the standard section list (Mission, Source Of Truth, Operating Principles, Context Loading Strategy, Working Loop, Architecture Guardrails, Service Ownership Rules, Development Strategy, Planning Rules, Coding Rules, Runtime Capabilities, Escalation Protocol).

- Within **Operating Principles**: unit is one numbered principle. New principle in only one version → additive, unless it contradicts an existing numbered principle in the other version → block.
- Within **Architecture Guardrails** and **Service Ownership Rules**: treat as high-sensitivity regardless of classification — per caulker's Forbidden Behaviors, any divergence here always escalates to the user even if it would otherwise auto-merge. This skill still performs the classification (so the report can say *why* it's additive-but-escalated), it just never auto-applies the result.
- Any other section: fallback rule (diverged body content → block).

---

## `.pipeline-state.md` / `.pipeline-changelog.md`

These files are not subject to this skill's block/auto-merge logic:

- `.pipeline-changelog.md` is append-only by convention — a "conflict" here almost always means both branches appended entries. Concatenate both sets of entries in chronological order by timestamp; this is always safe and never blocks.
- `.pipeline-state.md` (including the `## Active Locks` block from caulker's Prevention Layer) reflects the most recent run — take the version with the later timestamp for `Last completed step` and related fields, and merge `## Active Locks` / `## Released Locks` entries additively (they are keyed by service+branch, not expected to collide in content, only in git line position).

---

## Session doc cross-reference (optional context)

When `.ai/sessions/*.md` files are available, caulker may use them as
supporting context for the conflict report — never as classification input.
Classification (additive / diverged-block / additive-overlapping-block) is
determined purely by the structural unit comparison rules above. Session docs
never change a classification result; they only enrich the report with
`contributor`, `branch`, and `topic` when a matching unit ID is found.

Matching rule: for a blocked unit (e.g. `FR-021`, `ADR-014`,
`POST /checkout`), scan `.ai/sessions/*.md` Touched Units tables for a row with
the same unit type and unit ID. If found, use that session doc's `contributor`,
`branch`, and `topic` frontmatter fields to fill in caulker's existing report
placeholders (`branch: [name], contributor: [name if known]`) instead of
leaving them as "if known" guesses.

If multiple session docs reference the same unit ID (e.g. two sessions both
touched `FR-021`), include all matching sessions in the report — do not pick
one arbitrarily.

If no matching session doc exists for a unit, fall back to caulker's existing
behavior (branch/contributor from git blame or "unknown" — whatever caulker
already does today). This is a pure enrichment, never a requirement — caulker
must produce a complete, correct report even if `.ai/sessions/` is empty or
absent.

---

## Output shape reused by caulker

This skill does not produce its own output file — it is invoked mid-run by `caulker`, which uses these classifications to populate the Step 3–5 report format defined in `subagents/caulker.md`. This skill's only responsibility is the classification rules above; formatting and user interaction remain caulker's.

# Contributing to slipway-agents

Contributions are welcome — new agents, agent upgrades, skill improvements, bug fixes, and documentation.

---

## Quick orientation

```
slipway-agents/
├── slipway.md                     # Orchestrator — routes between subagents
├── slipway.json                   # Model assignments — edit this to change models
├── slipway.schema.json            # JSON schema for slipway.json
├── opencode.json                  # Plugin registration for OpenCode
├── package.json                   # Root package — this is what gets published to npm
├── subagents/                     # One .md file per agent
├── skills/slipway/                # Skills invoked by agents
│   └── bootstrap-from-prd/
├── packages/slipway-plugin/       # TypeScript plugin for model enforcement
│   └── src/index.ts
└── docs/                          # Installation and usage guides
```

Each agent is a single Markdown file with YAML frontmatter. The orchestrator (`slipway.md`) routes between them. The plugin (`packages/slipway-plugin/src/index.ts`) enforces the model assignments from `slipway.json` at runtime.

---

## Agent file conventions

Every subagent file must follow this structure:

```markdown
---
name: [agent-name]
description: [One paragraph. Describe when to invoke this agent, what it reads, 
              and what it produces. This is what OpenCode uses to decide when to 
              call this agent automatically.]
model: [provider/model-id]
---

# [agent-name]

[One paragraph — what this agent does and does not do.]

---

## Inputs required

[List every file or piece of context this agent needs before it can run.
Include what to do if a required input is missing.]

---

## Output contract

[Describe exactly what this agent produces — file paths, format, required sections.
The orchestrator enforces handoff contracts based on this section.]

...

## Forbidden behaviors

[Explicit list of things this agent must never do.
This is load-bearing — the orchestrator and users rely on it.]
```

**Rules:**
- The `description` frontmatter field must be one complete paragraph. OpenCode uses it for agent discovery.
- Every agent must have an **Inputs required** section and an **Output contract** section.
- Every agent must have a **Forbidden behaviors** section with at least three explicit rules.
- All content must be in English.
- Do not use placeholder text like `[TBD]` or `TODO` in agent files that are merged to `main`.

---

## Adding a new agent

1. Create `subagents/[agent-name].md` following the conventions above.
2. Add the agent to `slipway.json` with a `model` and `fallback_model`.
3. Add the agent to `slipway.schema.json` under `properties.agents.properties`.
4. Update `slipway.md` to include the new agent in:
   - The subagent table at the top
   - The mode detection table (if it introduces a new mode)
   - The relevant pipeline step (if it runs in the main flow)
5. Update `README.md` — agent table and pipeline stages table.
6. Add an entry to `CHANGELOG.md` under `[Unreleased]`.

---

## Upgrading an existing agent

1. Make your changes to the agent file.
2. If the upgrade changes the agent's output contract or gate signal, update `slipway.md` to reflect the new behavior.
3. Add an entry to `CHANGELOG.md` under `[Unreleased]` in the **Changed** section.
4. If the upgrade changes what the agent reads or writes, check all other agents that interact with it and update their docs accordingly.

---

## Modifying the orchestrator (`slipway.md`)

The orchestrator is the most sensitive file in the repo. Changes here affect every pipeline run.

Rules:
- The orchestrator must never generate content directly. It routes only.
- Every new mode added to mode detection must have a corresponding pipeline section.
- Every gate change must be explicitly documented — if a step can now be skipped, say when and why.
- Do not add language-specific trigger strings. Use English-only patterns.

---

## Plugin changes (`packages/slipway-plugin/`)

The plugin must work without crashing even when:
- `slipway.json` is absent (no-op, not an error)
- `slipway.json` is malformed JSON (warn and no-op)
- The OpenCode model listing API fails (skip availability check, use configured models directly)
- A configured model is unavailable (resolve via fallback chain, warn in console)

Run `npm run typecheck` from the repo root before submitting a PR.

---

## Testing

There are no automated tests yet. Manual testing process:

1. Install the plugin locally: `npm run build` from repo root (builds `packages/slipway-plugin/dist/`), then set the `plugin` field in your project's `opencode.json` to an absolute path to the repo root.
2. Create a scratch project, run `@slipway I want to build [idea]`, and walk through the pipeline.
3. Verify the agent table in `slipway.md` matches what actually ran.
4. If you changed model assignments, verify the correct model is selected in the OpenCode session header.

Automated eval framework is on the roadmap. Contributions welcome.

---

## Submitting a PR

- Target the `dev` branch, not `main`.
- PR title format: `[agent-name] short description` or `[orchestrator]`, `[plugin]`, `[docs]`.
- Include a brief description of what changed and why.
- If your change affects the pipeline flow, include a before/after description of the step sequence.

---

## Questions

Open a GitHub issue with the `question` label.

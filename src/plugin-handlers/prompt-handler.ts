import { AgentDefinition } from "../config/types";

/**
 * Applies per-agent prompt_append content to the OpenCode agent prompt.
 *
 * OpenCode API used: AgentConfig.prompt. The plugin already sets `prompt` from
 * bundled Markdown; this handler appends extra config text to that prompt and
 * never replaces the base prompt.
 *
 * Remaining gaps: none for prompt_append; system/instructions aliases are not
 * used because the proven OpenCode field is `prompt`.
 */

export function applyPromptConfig(
  agentDef: AgentDefinition,
  promptAppend: string | undefined
): void {
  if (!promptAppend) {
    return;
  }

  const basePrompt = agentDef.prompt ?? "";
  agentDef.prompt = `${basePrompt}\n\n${promptAppend}`;
}

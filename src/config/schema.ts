import { z } from "zod";

/**
 * Zod validators for slipway.json.
 *
 * OpenCode API used: none. This module validates local plugin configuration
 * before the config hook maps it onto OpenCode agent definitions.
 *
 * Remaining gaps: OpenCode-specific runtime semantics for permission.bash object
 * command matching are not defined here; this module only validates shape.
 */

export const permissionActionSchema = z.enum(["ask", "allow", "deny"]);

export const permissionSchema = z
  .object({
    edit: permissionActionSchema.optional(),
    webfetch: permissionActionSchema.optional(),
    task: permissionActionSchema.optional(),
    bash: z
      .union([permissionActionSchema, z.record(z.string(), permissionActionSchema)])
      .optional(),
  })
  .strict();

export const ralphLoopConfigSchema = z
  .object({
    enabled: z.boolean().optional(),
    max_iterations: z.number().int().min(1).optional(),
    strategy: z.enum(["reset", "continue"]).optional(),
    block_on_exhaustion: z.boolean().optional(),
  })
  .strict();

export const hookConfigSchema = z
  .object({
    url: z.string(),
    method: z.enum(["POST", "GET"]).default("POST").optional(),
    headers: z.record(z.string(), z.string()).optional(),
    template: z.string().optional(),
  })
  .strict();

export const hooksSchema = z
  .object({
    on_step_complete: hookConfigSchema.optional(),
    on_block: hookConfigSchema.optional(),
    on_pipeline_complete: hookConfigSchema.optional(),
    on_user_input_required: hookConfigSchema.optional(),
  })
  .strict();

export const categoryConfigSchema = z
  .object({
    model: z.string(),
    fallback_model: z.string().optional(),
    description: z.string().optional(),
  })
  .strict();

export const agentConfigSchema = z
  .object({
    model: z.string(),
    fallback_model: z.string().optional(),
    mode: z.enum(["primary", "subagent", "all"]).optional(),
    description: z.string().optional(),
    category: z.string().optional(),
    prompt_append: z.string().optional(),
    permission: permissionSchema.optional(),
    ralph_loop: ralphLoopConfigSchema.optional(),
  })
  .strict();

export const slipwayConfigSchema = z
  .object({
    $schema: z.string().optional(),
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    ralph_loop: ralphLoopConfigSchema.optional(),
    hooks: hooksSchema.optional(),
    agents: z.record(z.string(), agentConfigSchema),
    categories: z.record(z.string(), categoryConfigSchema).optional(),
  })
  .strict();

export type SlipwayConfigFromSchema = z.infer<typeof slipwayConfigSchema>;

export function validateSlipwayConfig(input: unknown): SlipwayConfigFromSchema | null {
  const result = slipwayConfigSchema.safeParse(input);

  if (result.success) {
    return result.data;
  }

  console.warn(
    `[slipway-agents] Invalid slipway config — using defaults. ${z.prettifyError(result.error)}`
  );
  return null;
}

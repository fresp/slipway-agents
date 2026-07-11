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
    webfetch: z
      .union([permissionActionSchema, z.record(z.string(), permissionActionSchema)])
      .optional(),
    task: z
      .union([permissionActionSchema, z.record(z.string(), permissionActionSchema)])
      .optional(),
    // Skills must use deny-default allow-list semantics. Do not set "*" to
    // "allow" for skill permissions; each agent should explicitly allow only
    // the repo-local skills it legitimately invokes.
    skill: z
      .union([permissionActionSchema, z.record(z.string(), permissionActionSchema)])
      .optional(),
    // Absence of a `bash` key resolves to permissive/full-allow at OpenCode
    // runtime — this is the OPPOSITE of safe. Every agent must set an explicit
    // `bash` value (`ask`/`allow`/`deny`, or a scoped object) if it should not
    // have unrestricted bash access. Do not rely on omission. This field is
    // still schema-optional (the plugin only passes through what is present),
    // but `tests/config/permission-isolation.test.ts` enforces that every
    // bundled agent declares one explicitly.
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
    // Model used for autonomous decision-making at convenience gates under
    // /slipway:smart when this agent is invoked via that command. Currently
    // only meaningful for the slipway agent.
    smart: z
      .object({
        model: z.string().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export const gateAssertionsConfigSchema = z
  .object({
    // Opt-in plugin-level enforcement of pipeline gate preconditions. Default
    // false / absent = disabled. Currently governs exactly one hardcoded
    // assertion: STEP 4 (Optimize Decision) must have a discrete decision
    // record in .ai/docs/.pipeline-decisions.md before the orchestrator may
    // delegate to gunner (STEP 5). Not a user-definable rule engine.
    enabled: z.boolean().optional(),
  })
  .strict();

export const slipwayConfigSchema = z
  .object({
    $schema: z.string().optional(),
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    ralph_loop: ralphLoopConfigSchema.optional(),
    gate_assertions: gateAssertionsConfigSchema.optional(),
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

import { z } from "zod";
import { slipwayConfigSchema } from "./schema";

// Shared TypeScript types for the OpenCode plugin shape used by this package.
// SlipwayConfig is derived from the Zod schema so runtime validation and compile
// time access stay aligned with slipway.schema.json.

export type SlipwayConfig = z.infer<typeof slipwayConfigSchema>;
export type AgentConfig = SlipwayConfig["agents"][string];
export type PermissionConfig = NonNullable<AgentConfig["permission"]>;
export type HookConfig = NonNullable<NonNullable<SlipwayConfig["hooks"]>[keyof NonNullable<SlipwayConfig["hooks"]>]>

export interface AgentDefinition {
  prompt?: string;
  model?: string;
  mode?: string;
  description?: string;
  permission?: PermissionConfig;
  options?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface Config {
  agent?: Record<string, AgentDefinition>;
  [key: string]: unknown;
}

export interface Hooks {
  config?: (input: Config) => Promise<void>;
  event?: (input: { event: unknown }) => Promise<void>;
  [key: string]: unknown;
}

export interface PluginInput {
  directory: string;
  project?: {
    directory?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

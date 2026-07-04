// Shared TypeScript types for the current OpenCode plugin shape used by this package.
// Part 0 intentionally preserves the existing hand-written interfaces and behavior;
// later parts can widen these types to mirror the full slipway.schema.json contract.

export interface AgentConfig {
  model: string;
  fallback_model?: string;
  mode?: string;
  description?: string;
}

export interface SlipwayConfig {
  version: string;
  agents: Record<string, AgentConfig>;
  categories?: Record<string, { model: string; fallback_model?: string }>;
}

export interface AgentDefinition {
  prompt?: string;
  model?: string;
  mode?: string;
  [key: string]: unknown;
}

export interface Config {
  agent?: Record<string, AgentDefinition>;
  [key: string]: unknown;
}

export interface Hooks {
  config?: (input: Config) => Promise<void>;
  [key: string]: unknown;
}

export interface PluginInput {
  directory: string;
  [key: string]: unknown;
}

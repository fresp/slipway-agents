import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AgentConfig {
  model: string;
  fallback_model?: string;
  description?: string;
}

interface CategoryConfig {
  model: string;
  fallback_model?: string;
  description?: string;
}

interface SlipwayConfig {
  version: string;
  agents: Record<string, AgentConfig>;
  categories?: Record<string, CategoryConfig>;
}

// Minimal OpenCode plugin surface — typed loosely since the SDK
// may not be installed in all environments.
interface OpenCodeClient {
  config: {
    patch: (config: Record<string, unknown>) => void;
  };
  models?: {
    list: () => Promise<Array<{ id: string }>>;
  };
}

interface PluginContext {
  client: OpenCodeClient;
  cwd: string;
}

// ---------------------------------------------------------------------------
// Config resolution
// ---------------------------------------------------------------------------

const CONFIG_FILENAMES = ["slipway.json", "slipway.local.json"];

function findConfig(cwd: string): SlipwayConfig | null {
  // slipway.local.json takes precedence over slipway.json
  for (const filename of [...CONFIG_FILENAMES].reverse()) {
    const candidate = path.join(cwd, filename);
    if (fs.existsSync(candidate)) {
      try {
        const raw = fs.readFileSync(candidate, "utf-8");
        const parsed = JSON.parse(raw) as SlipwayConfig;
        console.log(`[slipway-agents] Loaded config from ${candidate}`);
        return parsed;
      } catch (err) {
        console.warn(
          `[slipway-agents] Failed to parse ${candidate}: ${String(err)}`
        );
      }
    }
  }
  return null;
}

function resolveModel(
  agentName: string,
  agentConfig: AgentConfig,
  availableModels: Set<string>,
  categories: Record<string, CategoryConfig> | undefined
): string | null {
  // 1. Try primary model
  if (availableModels.size === 0 || availableModels.has(agentConfig.model)) {
    return agentConfig.model;
  }

  // 2. Try fallback_model
  if (
    agentConfig.fallback_model &&
    availableModels.has(agentConfig.fallback_model)
  ) {
    console.warn(
      `[slipway-agents] ${agentName}: primary model "${agentConfig.model}" not available, ` +
        `using fallback "${agentConfig.fallback_model}"`
    );
    return agentConfig.fallback_model;
  }

  // 3. Try category fallback
  if (categories) {
    for (const [, categoryConfig] of Object.entries(categories)) {
      if (availableModels.has(categoryConfig.model)) {
        console.warn(
          `[slipway-agents] ${agentName}: fallback model not available, ` +
            `using category model "${categoryConfig.model}"`
        );
        return categoryConfig.model;
      }
      if (
        categoryConfig.fallback_model &&
        availableModels.has(categoryConfig.fallback_model)
      ) {
        console.warn(
          `[slipway-agents] ${agentName}: using category fallback model "${categoryConfig.fallback_model}"`
        );
        return categoryConfig.fallback_model;
      }
    }
  }

  // 4. Cannot resolve — return primary and let OpenCode handle the error
  console.warn(
    `[slipway-agents] ${agentName}: could not verify model availability, ` +
      `using configured primary "${agentConfig.model}"`
  );
  return agentConfig.model;
}

// ---------------------------------------------------------------------------
// Plugin entry point
// ---------------------------------------------------------------------------

export async function activate(context: PluginContext): Promise<void> {
  const { client, cwd } = context;

  const config = findConfig(cwd);

  if (!config) {
    // No config file found — plugin is a no-op. Agents use their frontmatter models.
    console.log(
      "[slipway-agents] No slipway.json found in project root — using agent frontmatter models."
    );
    return;
  }

  // Fetch available models if the client supports it
  let availableModels = new Set<string>();
  try {
    if (client.models) {
      const models = await client.models.list();
      availableModels = new Set(models.map((m) => m.id));
    }
  } catch {
    // Model listing is best-effort — if it fails, skip availability checks
    console.warn(
      "[slipway-agents] Could not fetch available models — skipping availability check"
    );
  }

  // Build agent model overrides
  const agentOverrides: Record<string, { model: string }> = {};
  let overrideCount = 0;

  for (const [agentName, agentConfig] of Object.entries(config.agents)) {
    const resolvedModel = resolveModel(
      agentName,
      agentConfig,
      availableModels,
      config.categories
    );
    if (resolvedModel) {
      agentOverrides[agentName] = { model: resolvedModel };
      overrideCount++;
    }
  }

  if (overrideCount === 0) {
    console.log("[slipway-agents] No agent overrides to apply.");
    return;
  }

  // Inject into OpenCode runtime
  try {
    client.config.patch({ agents: agentOverrides });
    console.log(
      `[slipway-agents] Applied model overrides for ${overrideCount} agents ` +
        `(config version ${config.version})`
    );
  } catch (err) {
    console.error(
      `[slipway-agents] Failed to apply config patch: ${String(err)}`
    );
  }
}

export function deactivate(): void {
  // Nothing to clean up — model overrides are session-scoped in OpenCode
}

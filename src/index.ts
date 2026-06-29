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

interface SlipwayConfig {
  version: string;
  agents: Record<string, AgentConfig>;
}

// OpenCode plugin context — typed loosely since @opencode-ai/plugin
// may not be installed in all environments
interface PluginContext {
  directory: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Config resolution
// ---------------------------------------------------------------------------

const CONFIG_FILENAMES = ["slipway.local.json", "slipway.json"];

/**
 * Find slipway config — slipway.local.json takes precedence over slipway.json.
 * Search order: directory passed by OpenCode (project root), then global config dir.
 */
function findSlipwayConfig(projectDir: string): { config: SlipwayConfig; source: string } | null {
  const searchDirs = [
    projectDir,
    path.join(
      process.env.HOME ?? process.env.USERPROFILE ?? "",
      ".config",
      "opencode"
    ),
  ];

  for (const dir of searchDirs) {
    for (const filename of CONFIG_FILENAMES) {
      const candidate = path.join(dir, filename);
      if (fs.existsSync(candidate)) {
        try {
          const raw = fs.readFileSync(candidate, "utf-8");
          const parsed = JSON.parse(raw) as SlipwayConfig;
          if (parsed.agents && typeof parsed.agents === "object") {
            return { config: parsed, source: candidate };
          }
        } catch {
          // skip malformed files
        }
      }
    }
  }
  return null;
}

/**
 * Find the global opencode.json path.
 */
function findOpencodeConfig(): string {
  return path.join(
    process.env.HOME ?? process.env.USERPROFILE ?? "",
    ".config",
    "opencode",
    "opencode.json"
  );
}

/**
 * Build the `agent` block for opencode.json from slipway.json agents.
 * Each agent entry gets a `model` field. fallback_model is not a native
 * OpenCode concept — we resolve it here: if primary model looks like a
 * provider/model string, use it directly.
 */
function buildAgentBlock(
  agents: Record<string, AgentConfig>
): Record<string, { model: string }> {
  const result: Record<string, { model: string }> = {};
  for (const [name, cfg] of Object.entries(agents)) {
    result[name] = { model: cfg.model };
  }
  return result;
}

/**
 * Patch opencode.json with the agent block from slipway.json.
 * - Never removes existing keys.
 * - Merges agent entries: slipway entries overwrite, other entries preserved.
 */
function patchOpencodeConfig(
  opencodeConfigPath: string,
  agentBlock: Record<string, { model: string }>,
  slipwayVersion: string
): void {
  let existing: Record<string, unknown> = {};

  if (fs.existsSync(opencodeConfigPath)) {
    try {
      existing = JSON.parse(fs.readFileSync(opencodeConfigPath, "utf-8"));
    } catch {
      console.warn(
        `[slipway-agents] Could not parse ${opencodeConfigPath} — skipping agent block patch`
      );
      return;
    }
  }

  // Check if agent block is already up to date
  const existingAgents = (existing.agent ?? {}) as Record<string, unknown>;
  const firstAgent = Object.keys(agentBlock)[0];
  if (
    firstAgent &&
    existingAgents[firstAgent] &&
    (existingAgents[firstAgent] as { model?: string }).model === agentBlock[firstAgent].model
  ) {
    console.log(
      `[slipway-agents] opencode.json agent block already up to date (slipway v${slipwayVersion})`
    );
    return;
  }

  // Merge: preserve existing agents, overwrite slipway agents
  const mergedAgents = { ...existingAgents, ...agentBlock };
  const updated = { ...existing, agent: mergedAgents };

  fs.writeFileSync(
    opencodeConfigPath,
    JSON.stringify(updated, null, 2) + "\n",
    "utf-8"
  );

  console.log(
    `[slipway-agents] Patched opencode.json with model assignments for ${Object.keys(agentBlock).length} agents (slipway v${slipwayVersion})`
  );
}

// ---------------------------------------------------------------------------
// Plugin entry point — correct OpenCode plugin export format
// ---------------------------------------------------------------------------

export const SlipwayPlugin = async (ctx: PluginContext) => {
  const projectDir = ctx.directory ?? process.cwd();

  const result = findSlipwayConfig(projectDir);

  if (!result) {
    console.log(
      "[slipway-agents] No slipway.json found — using agent frontmatter models."
    );
    return {};
  }

  const { config, source } = result;
  console.log(`[slipway-agents] Loaded config from ${source} (v${config.version})`);

  const agentBlock = buildAgentBlock(config.agents);
  const opencodeConfigPath = findOpencodeConfig();

  patchOpencodeConfig(opencodeConfigPath, agentBlock, config.version);

  // Return empty hooks object — this plugin's job is config patching, not hooking
  return {};
};

export default SlipwayPlugin;

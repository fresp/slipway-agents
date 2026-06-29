import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AgentConfig {
  model: string;
  fallback_model?: string;
}

interface SlipwayConfig {
  version: string;
  agents: Record<string, AgentConfig>;
  categories?: Record<string, { model: string; fallback_model?: string }>;
}

// OpenCode plugin client interface
// client.config.patch() merges into the live OpenCode config at runtime
interface OpenCodeClient {
  config: {
    patch: (config: Record<string, unknown>) => void;
  };
}

// OpenCode plugin context
interface PluginContext {
  directory: string;
  client: OpenCodeClient;
  [key: string]: unknown;
}

// OpenCode agent definition shape
interface AgentDefinition {
  system?: string;
  model?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve path to subagents/ directory bundled inside this npm package.
 * __dirname is dist/ after compile — subagents/ is one level up at package root.
 */
function getPackageSubagentsDir(): string {
  return path.join(__dirname, "..", "subagents");
}

/**
 * Read all .md files from the bundled subagents/ directory.
 * Returns a map of agent-name → system prompt content.
 */
function loadAgentDefinitions(): Record<string, string> {
  const subagentsDir = getPackageSubagentsDir();
  const agents: Record<string, string> = {};

  if (!fs.existsSync(subagentsDir)) {
    console.warn(`[slipway-agents] subagents/ directory not found at ${subagentsDir}`);
    return agents;
  }

  const files = fs.readdirSync(subagentsDir).filter((f) => f.endsWith(".md"));

  for (const file of files) {
    const agentName = path.basename(file, ".md");
    const content = fs.readFileSync(path.join(subagentsDir, file), "utf-8");
    agents[agentName] = content;
  }

  console.log(
    `[slipway-agents] Loaded ${files.length} agent definitions: ${files.map((f) => path.basename(f, ".md")).join(", ")}`
  );
  return agents;
}

/**
 * Find and parse slipway.json from the user's project root.
 * slipway.local.json takes precedence if it exists.
 * Returns null if neither file is found — plugin works fine without it.
 */
function loadSlipwayConfig(projectDir: string): SlipwayConfig | null {
  const candidates = ["slipway.local.json", "slipway.json"];

  for (const filename of candidates) {
    const filePath = path.join(projectDir, filename);
    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(raw) as SlipwayConfig;
        if (parsed.agents && typeof parsed.agents === "object") {
          console.log(`[slipway-agents] Config loaded from ${filePath} (v${parsed.version})`);
          return parsed;
        }
      } catch {
        console.warn(`[slipway-agents] Could not parse ${filePath} — skipping`);
      }
    }
  }

  console.log(
    "[slipway-agents] No slipway.json found in project root — using default models from agent frontmatter"
  );
  return null;
}

/**
 * Build the agent patch object for client.config.patch().
 * Merges agent system prompts (from subagents/*.md) with model assignments (from slipway.json).
 */
function buildAgentPatch(
  agentDefinitions: Record<string, string>,
  slipwayConfig: SlipwayConfig | null
): Record<string, AgentDefinition> {
  const patch: Record<string, AgentDefinition> = {};

  for (const [agentName, systemPrompt] of Object.entries(agentDefinitions)) {
    const agentDef: AgentDefinition = {
      system: systemPrompt,
    };

    // Apply model from slipway.json if available for this agent
    if (slipwayConfig?.agents[agentName]?.model) {
      agentDef.model = slipwayConfig.agents[agentName].model;
    }

    patch[agentName] = agentDef;
  }

  return patch;
}

// ---------------------------------------------------------------------------
// Plugin entry point
// ---------------------------------------------------------------------------

export const SlipwayPlugin = async (ctx: PluginContext) => {
  const projectDir = ctx.directory ?? process.cwd();
  const client = ctx.client;

  // 1. Load agent system prompts from bundled subagents/
  const agentDefinitions = loadAgentDefinitions();

  if (Object.keys(agentDefinitions).length === 0) {
    console.warn("[slipway-agents] No agents loaded — plugin will not register any agents");
    return {};
  }

  // 2. Load model config from project's slipway.json (optional)
  const slipwayConfig = loadSlipwayConfig(projectDir);

  // 3. Build agent patch
  const agentPatch = buildAgentPatch(agentDefinitions, slipwayConfig);

  // 4. Inject into OpenCode runtime — zero disk writes
  if (client?.config?.patch) {
    client.config.patch({ agent: agentPatch });
    console.log(
      `[slipway-agents] Registered ${Object.keys(agentPatch).length} agents into OpenCode runtime`
    );
  } else {
    console.warn(
      "[slipway-agents] client.config.patch not available — agents may not be registered"
    );
  }

  return {};
};

export default SlipwayPlugin;

import * as fs from "fs";
import * as path from "path";
import * as os from "os";

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

interface AgentDefinition {
  prompt?: string;
  model?: string;
  [key: string]: unknown;
}

interface Config {
  agent?: Record<string, AgentDefinition>;
  [key: string]: unknown;
}

interface Hooks {
  config?: (input: Config) => Promise<void>;
  [key: string]: unknown;
}

interface PluginInput {
  directory: string;
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
 * Global OpenCode config directory: ~/.config/opencode/
 */
function getGlobalConfigDir(): string {
  return path.join(os.homedir(), ".config", "opencode");
}

/**
 * Read all .md files from the bundled subagents/ directory.
 * Returns a map of agent-name → system prompt content.
 */
function loadAgentDefinitions(): Record<string, string> {
  const subagentsDir = getPackageSubagentsDir();
  const agents: Record<string, string> = {};

  if (!fs.existsSync(subagentsDir)) {
    console.warn(`[slipway-agents] subagents/ not found at ${subagentsDir}`);
    return agents;
  }

  const files = fs.readdirSync(subagentsDir).filter((f) => f.endsWith(".md"));

  for (const file of files) {
    const agentName = path.basename(file, ".md");
    const content = fs.readFileSync(path.join(subagentsDir, file), "utf-8");
    agents[agentName] = content;
  }

  console.log(
    `[slipway-agents] Loaded ${files.length} agent definitions: ${files
      .map((f) => path.basename(f, ".md"))
      .join(", ")}`
  );
  return agents;
}

/**
 * Load slipway.json from ~/.config/opencode/
 * slipway.local.json takes precedence if it exists.
 * Returns null if not found — plugin works fine without it.
 */
function loadSlipwayConfig(): SlipwayConfig | null {
  const configDir = getGlobalConfigDir();
  const candidates = ["slipway.local.json", "slipway.json"];

  for (const filename of candidates) {
    const filePath = path.join(configDir, filename);
    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(raw) as SlipwayConfig;
        if (parsed.agents && typeof parsed.agents === "object") {
          console.log(
            `[slipway-agents] Config loaded from ${filePath} (v${parsed.version})`
          );
          return parsed;
        }
      } catch {
        console.warn(`[slipway-agents] Could not parse ${filePath} — skipping`);
      }
    }
  }

  console.log(
    "[slipway-agents] No slipway.json found in ~/.config/opencode/ — using default models from agent frontmatter"
  );
  return null;
}

// ---------------------------------------------------------------------------
// Plugin export — OpenCode PluginModule format
// { server: (input: PluginInput) => Promise<Hooks> }
// ---------------------------------------------------------------------------

export default {
  server: async (_input: PluginInput): Promise<Hooks> => {
    const agentDefinitions = loadAgentDefinitions();
    const slipwayConfig = loadSlipwayConfig();

    if (Object.keys(agentDefinitions).length === 0) {
      console.warn(
        "[slipway-agents] No agents loaded — plugin will not register any agents"
      );
      return {};
    }

    return {
      config: async (input: Config) => {
        input.agent ??= {};

        for (const [agentName, systemPrompt] of Object.entries(agentDefinitions)) {
          const agentDef: AgentDefinition = {
            prompt: systemPrompt,
          };

          const modelOverride = slipwayConfig?.agents[agentName]?.model;
          if (modelOverride) {
            agentDef.model = modelOverride;
          }

          input.agent[agentName] = agentDef;
        }

        console.log(
          `[slipway-agents] Registered ${Object.keys(agentDefinitions).length} agents into OpenCode config`
        );
      },
    };
  },
};

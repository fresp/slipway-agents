import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { SlipwayConfig } from "./types";

/**
 * Loads bundled agent prompts and the legacy global slipway config.
 *
 * OpenCode API used: none directly. This module performs filesystem reads only,
 * matching the original src/index.ts behavior: subagents are resolved relative to
 * dist/ after compilation, and config is loaded from ~/.config/opencode/ with
 * slipway.local.json taking precedence over slipway.json.
 *
 * Remaining gaps: project-root config loading, field-by-field merging, and schema
 * validation are intentionally not implemented in Part 0 because this refactor is
 * behavior-neutral. Those belong to Part 1.
 */

function getPackageSubagentsDir(): string {
  return path.join(__dirname, "..", "..", "subagents");
}

function getGlobalConfigDir(): string {
  return path.join(os.homedir(), ".config", "opencode");
}

export function loadAgentDefinitions(): Record<string, string> {
  const subagentsDir = getPackageSubagentsDir();
  const agents: Record<string, string> = {};

  if (!fs.existsSync(subagentsDir)) {
    console.warn(`[slipway-agents] subagents/ not found at ${subagentsDir}`);
    return agents;
  }

  const files = fs.readdirSync(subagentsDir).filter((file) => file.endsWith(".md"));

  for (const file of files) {
    const agentName = path.basename(file, ".md");
    const content = fs.readFileSync(path.join(subagentsDir, file), "utf-8");
    agents[agentName] = content;
  }

  console.log(
    `[slipway-agents] Loaded ${files.length} agent definitions: ${files
      .map((file) => path.basename(file, ".md"))
      .join(", ")}`
  );

  return agents;
}

export function loadSlipwayConfig(): SlipwayConfig | null {
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

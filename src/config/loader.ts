import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { validateSlipwayConfig } from "./schema";
import { SlipwayConfig } from "./types";

/**
 * Loads bundled agent prompts and active Slipway config.
 *
 * OpenCode API used: none directly. This module performs filesystem reads only,
 * Subagents are resolved relative to dist/ after compilation. Config loading
 * checks project-root slipway.json, project-root slipway.local.json overrides,
 * then global ~/.config/opencode/slipway.json fallback. Available config objects
 * are merged field-by-field and validated with Zod.
 *
 * Remaining gaps: unsupported OpenCode runtime semantics are handled by later
 * plugin handlers, not by the loader.
 */

function getPackageSubagentsDir(): string {
  return path.join(__dirname, "..", "..", "subagents");
}

function getGlobalConfigDir(): string {
  return path.join(os.homedir(), ".config", "opencode");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mergeRecords(
  base: Record<string, unknown>,
  override: Record<string, unknown>,
  pathParts: string[] = []
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...base };

  for (const [key, value] of Object.entries(override)) {
    const existing = merged[key];
    const nextPath = [...pathParts, key];

    if (shouldReplaceAtomically(nextPath)) {
      merged[key] = value;
    } else {
      merged[key] =
        isRecord(existing) && isRecord(value) ? mergeRecords(existing, value, nextPath) : value;
    }
  }

  return merged;
}

function shouldReplaceAtomically(pathParts: string[]): boolean {
  return pathParts[0] === "agents" && pathParts.length === 3 && pathParts[2] === "permission";
}

function readJsonFile(filePath: string): Record<string, unknown> | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw) as unknown;

    if (isRecord(parsed)) {
      console.log(`[slipway-agents] Config fragment loaded from ${filePath}`);
      return parsed;
    }

    console.warn(`[slipway-agents] Config at ${filePath} is not an object — skipping`);
    return null;
  } catch {
    console.warn(`[slipway-agents] Could not parse ${filePath} — skipping`);
    return null;
  }
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

export function loadSlipwayConfig(projectRoot?: string): SlipwayConfig | null {
  const globalPath = path.join(getGlobalConfigDir(), "slipway.json");
  const projectConfigPath = projectRoot ? path.join(projectRoot, "slipway.json") : null;
  const projectLocalPath = projectRoot ? path.join(projectRoot, "slipway.local.json") : null;

  const fragments = [
    readJsonFile(globalPath),
    projectConfigPath ? readJsonFile(projectConfigPath) : null,
    projectLocalPath ? readJsonFile(projectLocalPath) : null,
  ].filter((fragment): fragment is Record<string, unknown> => fragment !== null);

  if (fragments.length > 0) {
    const merged = fragments.reduce<Record<string, unknown>>(
      (current, fragment) => mergeRecords(current, fragment),
      {}
    );
    const validated = validateSlipwayConfig(merged);

    if (validated) {
      console.log(`[slipway-agents] Config loaded (v${validated.version})`);
      return validated;
    }
  }

  console.log(
    "[slipway-agents] No valid slipway config found — using default models from agent frontmatter"
  );

  return null;
}

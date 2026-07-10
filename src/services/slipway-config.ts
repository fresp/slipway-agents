import { backupFile, copyFile, ensureDirectory, pathExists, readJsonFile, readTextFile, removeFile } from "../utils/filesystem";
import { displayPath, SlipwayPaths } from "../utils/paths";
import { validateSlipwayConfig } from "../config/schema";

export interface InstallSlipwayConfigResult {
  ok: boolean;
  changed: boolean;
  message: string;
  version?: string;
  backupPath?: string;
}

export function installSlipwayConfig(paths: SlipwayPaths): InstallSlipwayConfigResult {
  if (!pathExists(paths.bundledSlipwayConfigFile)) {
    return { ok: false, changed: false, message: "Bundled slipway.json not found in npm package" };
  }

  const source = readVersionedConfig(paths.bundledSlipwayConfigFile, "bundled slipway.json");
  if (!source.ok) {
    return { ok: false, changed: false, message: source.message };
  }

  const dir = ensureDirectory(paths.opencodeConfigDir);
  if (!dir.ok) {
    return { ok: false, changed: false, message: `Could not create OpenCode config directory: ${dir.error}` };
  }

  if (!pathExists(paths.slipwayConfigFile)) {
    const copied = copyFile(paths.bundledSlipwayConfigFile, paths.slipwayConfigFile);
    if (!copied.ok) {
      return { ok: false, changed: false, message: `Could not create slipway.json: ${copied.error}` };
    }
    return {
      ok: true,
      changed: true,
      version: source.version,
      message: `Created slipway.json at ${displayPath(paths.slipwayConfigFile)} (v${source.version})`,
    };
  }

  const destination = readVersionedConfig(paths.slipwayConfigFile, "existing slipway.json");
  if (!destination.ok) {
    return { ok: false, changed: false, message: `${destination.message} — fix it manually` };
  }

  if (destination.version === source.version) {
    return {
      ok: true,
      changed: false,
      version: source.version,
      message: `slipway.json already at v${source.version} — no update needed`,
    };
  }

  const backup = backupFile(paths.slipwayConfigFile, "pre-update");
  if (!backup.ok) {
    return { ok: false, changed: false, message: `Could not back up slipway.json: ${backup.error}` };
  }

  const copied = copyFile(paths.bundledSlipwayConfigFile, paths.slipwayConfigFile);
  if (!copied.ok) {
    return { ok: false, changed: false, message: `Could not update slipway.json: ${copied.error}` };
  }

  return {
    ok: true,
    changed: true,
    version: source.version,
    backupPath: backup.path,
    message: `Updated slipway.json: v${destination.version} → v${source.version}`,
  };
}

export function updateSlipwayConfig(paths: SlipwayPaths): InstallSlipwayConfigResult {
  if (!pathExists(paths.bundledSlipwayConfigFile)) {
    return { ok: false, changed: false, message: "Bundled slipway.json not found in npm package" };
  }

  const source = readVersionedConfig(paths.bundledSlipwayConfigFile, "bundled slipway.json");
  if (!source.ok) {
    return { ok: false, changed: false, message: source.message };
  }

  const dir = ensureDirectory(paths.opencodeConfigDir);
  if (!dir.ok) {
    return { ok: false, changed: false, message: `Could not create OpenCode config directory: ${dir.error}` };
  }

  if (!pathExists(paths.slipwayConfigFile)) {
    const copied = copyFile(paths.bundledSlipwayConfigFile, paths.slipwayConfigFile);
    if (!copied.ok) {
      return { ok: false, changed: false, message: `Could not create slipway.json: ${copied.error}` };
    }
    return {
      ok: true,
      changed: true,
      version: source.version,
      message: `Created slipway.json at ${displayPath(paths.slipwayConfigFile)} (v${source.version})`,
    };
  }

  const destination = readVersionedConfig(paths.slipwayConfigFile, "existing slipway.json");
  if (!destination.ok) {
    return { ok: false, changed: false, message: `${destination.message} — fix it manually` };
  }

  const content = compareConfigContent(paths.bundledSlipwayConfigFile, paths.slipwayConfigFile);
  if (destination.version === source.version && content.same) {
    return {
      ok: true,
      changed: false,
      version: source.version,
      message: `slipway.json already up to date (v${source.version}) — no change needed`,
    };
  }

  const backup = backupFile(paths.slipwayConfigFile, "pre-update");
  if (!backup.ok) {
    return { ok: false, changed: false, message: `Could not back up slipway.json: ${backup.error}` };
  }

  const copied = copyFile(paths.bundledSlipwayConfigFile, paths.slipwayConfigFile);
  if (!copied.ok) {
    return { ok: false, changed: false, message: `Could not update slipway.json: ${copied.error}` };
  }

  if (destination.version === source.version && !content.same) {
    return {
      ok: true,
      changed: true,
      version: source.version,
      backupPath: backup.path,
      message:
        "slipway.json had same version but different content; backed up manual edits and restored bundled config",
    };
  }

  return {
    ok: true,
    changed: true,
    version: source.version,
    backupPath: backup.path,
    message: `Updated slipway.json: v${destination.version} → v${source.version}`,
  };
}

export function removeSlipwayConfig(paths: SlipwayPaths): InstallSlipwayConfigResult {
  if (!pathExists(paths.slipwayConfigFile)) {
    return { ok: true, changed: false, message: "slipway.json missing — no change needed" };
  }

  const backup = backupFile(paths.slipwayConfigFile, "pre-uninstall");
  if (!backup.ok) {
    return { ok: false, changed: false, message: `Could not back up slipway.json: ${backup.error}` };
  }

  const removed = removeFile(paths.slipwayConfigFile);
  if (!removed.ok) {
    return { ok: false, changed: false, message: `Could not remove slipway.json: ${removed.error}` };
  }

  return { ok: true, changed: true, message: "Removed slipway.json", backupPath: backup.path };
}

export function readInstalledSlipwaySummary(
  paths: SlipwayPaths
): { ok: true; version: string; agentCount: number; categoryCount: number; value: unknown } | { ok: false; message: string } {
  if (!pathExists(paths.slipwayConfigFile)) {
    return { ok: false, message: "slipway.json missing" };
  }

  const parsed = readJsonFile(paths.slipwayConfigFile);
  if (!parsed.ok) {
    return { ok: false, message: `slipway.json invalid JSON: ${parsed.error}` };
  }
  if (!isRecord(parsed.value) || typeof parsed.value.version !== "string" || !isRecord(parsed.value.agents) || !isRecord(parsed.value.categories)) {
    return { ok: false, message: "slipway.json does not contain version, agents, and categories object" };
  }

  return {
    ok: true,
    version: parsed.value.version,
    agentCount: Object.keys(parsed.value.agents).length,
    categoryCount: Object.keys(parsed.value.categories).length,
    value: parsed.value,
  };
}

export function validateInstalledSlipwayConfig(paths: SlipwayPaths): { ok: boolean; message: string } {
  const summary = readInstalledSlipwaySummary(paths);
  if (!summary.ok) {
    return summary;
  }

  const validated = validateSlipwayConfig(summary.value);
  if (!validated) {
    return { ok: false, message: "slipway.json failed schema validation" };
  }

  return { ok: true, message: `slipway.json valid (v${summary.version}, ${summary.agentCount} agents, ${summary.categoryCount} categories)` };
}

function readVersionedConfig(
  filePath: string,
  label: string
): { ok: true; version: string } | { ok: false; message: string } {
  const parsed = readJsonFile(filePath);
  if (!parsed.ok) {
    return { ok: false, message: `Could not parse ${label}: ${parsed.error}` };
  }
  if (!isRecord(parsed.value) || typeof parsed.value.version !== "string") {
    return { ok: false, message: `${label} does not contain a string version` };
  }
  return { ok: true, version: parsed.value.version };
}

function compareConfigContent(sourcePath: string, destinationPath: string): { same: boolean } {
  const source = readTextFile(sourcePath);
  const destination = readTextFile(destinationPath);
  if (!source.ok || !destination.ok) {
    return { same: false };
  }
  return { same: source.value === destination.value };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

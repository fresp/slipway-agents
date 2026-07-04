import * as path from "path";
import { backupFile, ensureDirectory, pathExists, readJsonFile, removeFile, writeJsonFile } from "../utils/filesystem";
import { displayPath, PLUGIN_ENTRY, SlipwayPaths } from "../utils/paths";

export interface ServiceResult {
  ok: boolean;
  changed: boolean;
  message: string;
  backupPath?: string;
}

export function patchOpencodeConfig(paths: SlipwayPaths): ServiceResult {
  const config = readExistingOpencodeConfig(paths.opencodeConfigFile);
  if (!config.ok) {
    return { ok: false, changed: false, message: config.message };
  }

  const nextConfig = config.value;
  const plugins = Array.isArray(nextConfig.plugin) ? nextConfig.plugin : [];

  if (plugins.includes(PLUGIN_ENTRY)) {
    return {
      ok: true,
      changed: false,
      message: `opencode.json already contains ${PLUGIN_ENTRY} — no change needed`,
    };
  }

  const backup = config.existed ? backupFile(paths.opencodeConfigFile, "pre-slipway") : { ok: true };
  if (!backup.ok) {
    return { ok: false, changed: false, message: `Could not back up opencode.json: ${backup.error}` };
  }

  nextConfig.plugin = [...plugins, PLUGIN_ENTRY];
  const write = writeJsonFile(paths.opencodeConfigFile, nextConfig);
  if (!write.ok) {
    return { ok: false, changed: false, message: `Could not write opencode.json: ${write.error}` };
  }

  return {
    ok: true,
    changed: true,
    message: `Added ${PLUGIN_ENTRY} to plugin array in ${displayPath(paths.opencodeConfigFile)}`,
    backupPath: backup.path,
  };
}

export function removePluginFromOpencodeConfig(paths: SlipwayPaths): ServiceResult {
  if (!pathExists(paths.opencodeConfigFile)) {
    return { ok: true, changed: false, message: "opencode.json missing — no plugin entry to remove" };
  }

  const config = readExistingOpencodeConfig(paths.opencodeConfigFile);
  if (!config.ok) {
    return { ok: false, changed: false, message: config.message };
  }

  const plugins = Array.isArray(config.value.plugin) ? config.value.plugin : [];
  if (!plugins.includes(PLUGIN_ENTRY)) {
    return { ok: true, changed: false, message: `${PLUGIN_ENTRY} was not registered — no change needed` };
  }

  const backup = backupFile(paths.opencodeConfigFile, "pre-uninstall");
  if (!backup.ok) {
    return { ok: false, changed: false, message: `Could not back up opencode.json: ${backup.error}` };
  }

  config.value.plugin = plugins.filter((plugin) => plugin !== PLUGIN_ENTRY);
  const write = writeJsonFile(paths.opencodeConfigFile, config.value);
  if (!write.ok) {
    return { ok: false, changed: false, message: `Could not write opencode.json: ${write.error}` };
  }

  return {
    ok: true,
    changed: true,
    message: `Removed ${PLUGIN_ENTRY} from opencode.json`,
    backupPath: backup.path,
  };
}

export function isPluginRegistered(paths: SlipwayPaths): { ok: boolean; registered: boolean; message: string } {
  if (!pathExists(paths.opencodeConfigFile)) {
    return { ok: false, registered: false, message: "opencode.json missing" };
  }

  const parsed = readJsonFile(paths.opencodeConfigFile);
  if (!parsed.ok) {
    return { ok: false, registered: false, message: `opencode.json invalid: ${parsed.error}` };
  }
  if (!isRecord(parsed.value)) {
    return { ok: false, registered: false, message: "opencode.json is not a JSON object" };
  }

  const plugins = Array.isArray(parsed.value.plugin) ? parsed.value.plugin : [];
  return {
    ok: true,
    registered: plugins.includes(PLUGIN_ENTRY),
    message: plugins.includes(PLUGIN_ENTRY)
      ? `${PLUGIN_ENTRY} is registered`
      : `${PLUGIN_ENTRY} is not registered`,
  };
}

export function removeOpencodeConfigFile(filePath: string): ServiceResult {
  if (!pathExists(filePath)) {
    return { ok: true, changed: false, message: `${displayPath(filePath)} missing — no change needed` };
  }

  const backup = backupFile(filePath, "pre-remove");
  if (!backup.ok) {
    return { ok: false, changed: false, message: `Could not back up ${displayPath(filePath)}: ${backup.error}` };
  }

  const removed = removeFile(filePath);
  if (!removed.ok) {
    return { ok: false, changed: false, message: `Could not remove ${displayPath(filePath)}: ${removed.error}` };
  }

  return { ok: true, changed: true, message: `Removed ${displayPath(filePath)}`, backupPath: backup.path };
}

function readExistingOpencodeConfig(
  filePath: string
): { ok: true; existed: boolean; value: Record<string, unknown> } | { ok: false; message: string } {
  if (!pathExists(filePath)) {
    const dir = ensureDirectory(path.dirname(filePath));
    if (!dir.ok) {
      return { ok: false, message: `Could not create OpenCode config directory: ${dir.error}` };
    }
    return { ok: true, existed: false, value: {} };
  }

  const parsed = readJsonFile(filePath);
  if (!parsed.ok) {
    return {
      ok: false,
      message: `Could not parse ${displayPath(filePath)} — add ${PLUGIN_ENTRY} manually to the plugin array`,
    };
  }

  if (!isRecord(parsed.value)) {
    return { ok: false, message: `${displayPath(filePath)} is not a JSON object` };
  }

  return { ok: true, existed: true, value: parsed.value };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

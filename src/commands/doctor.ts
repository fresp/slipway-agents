import { isPluginRegistered } from "../services/opencode-config";
import { readInstalledSlipwaySummary, validateInstalledSlipwayConfig } from "../services/slipway-config";
import { isReadableDirectory, pathExists, readJsonFile, readTextFile } from "../utils/filesystem";
import { error, info, success, warning } from "../utils/logger";
import { displayPath, getSlipwayPaths, PLUGIN_ENTRY } from "../utils/paths";

export function runDoctorCommand(): number {
  const paths = getSlipwayPaths();
  let hasFailure = false;

  if (isReadableDirectory(paths.opencodeConfigDir)) {
    success(`OpenCode config directory found: ${displayPath(paths.opencodeConfigDir)}/`);
  } else {
    error(`OpenCode config directory missing or unreadable: ${displayPath(paths.opencodeConfigDir)}/`);
    info("run: bunx slipway-agents@latest install");
    hasFailure = true;
  }

  const opencode = readJsonFile(paths.opencodeConfigFile);
  if (opencode.ok) {
    success("opencode.json valid");
  } else {
    error(`opencode.json missing or invalid: ${opencode.error ?? "not found"}`);
    info("run: bunx slipway-agents@latest install");
    hasFailure = true;
  }

  const plugin = isPluginRegistered(paths);
  if (plugin.ok && plugin.registered) {
    success(`Plugin registered (${PLUGIN_ENTRY})`);
  } else {
    error(`Plugin not registered (${PLUGIN_ENTRY})`);
    info("run: bunx slipway-agents@latest install");
    hasFailure = true;
  }

  const slipway = validateInstalledSlipwayConfig(paths);
  if (slipway.ok) {
    success(slipway.message);
  } else {
    error(slipway.message);
    info("run: bunx slipway-agents@latest install");
    hasFailure = true;
  }

  if (!pathExists(paths.builtPluginEntryFile)) {
    warning("dist/index.js not found — build output missing in this checkout; npm-published packages include it.");
  } else {
    const pluginEntry = readTextFile(paths.builtPluginEntryFile);
    if (pluginEntry.ok && pluginEntry.value?.includes("server:")) {
      success("Plugin export shape looks correct");
    } else {
      error("Plugin export shape check failed");
      hasFailure = true;
    }
  }

  if (hasFailure) {
    return 1;
  }

  const summary = readInstalledSlipwaySummary(paths);
  if (summary.ok) {
    success("All checks passed.");
  }
  return 0;
}

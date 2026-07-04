import { patchOpencodeConfig } from "../services/opencode-config";
import { installSlipwayConfig } from "../services/slipway-config";
import { pathExists, removeDirectory } from "../utils/filesystem";
import { info, success, warning } from "../utils/logger";
import { displayPath, getSlipwayPaths } from "../utils/paths";

export function runInstallCommand(): number {
  const paths = getSlipwayPaths();
  info("Installing slipway-agents...");

  const opencode = patchOpencodeConfig(paths);
  printResult(opencode.ok, opencode.message);
  if (opencode.backupPath) {
    info(`Backed up opencode.json → ${displayPath(opencode.backupPath)}`);
  }

  const slipway = installSlipwayConfig(paths);
  printResult(slipway.ok, slipway.message);
  if (slipway.backupPath) {
    info(`Backed up slipway.json → ${displayPath(slipway.backupPath)}`);
  }
  if (slipway.ok && slipway.changed) {
    info("Edit slipway.json to change model assignments per agent.");
  }

  clearPluginCache(paths.pluginCacheDir);

  if (!opencode.ok || !slipway.ok) {
    warning("Install finished with warnings. Fix the messages above, then restart OpenCode.");
    return 1;
  }

  success("Done. Restart OpenCode to activate the agents.");
  info(`Config: ${displayPath(paths.slipwayConfigFile)}`);
  info("Quick start: @slipway I want to build [your idea here]");
  info("Full guide: https://github.com/fresp/slipway-agents/blob/dev/docs/guide/installation.md");
  return 0;
}

function clearPluginCache(cachePath: string): void {
  if (!pathExists(cachePath)) {
    info("Plugin cache not found — nothing to clear.");
    return;
  }

  const removed = removeDirectory(cachePath);
  if (removed.ok) {
    success("Plugin cache cleared — OpenCode will fetch the latest version on next start.");
    return;
  }

  warning(`Could not clear plugin cache at ${displayPath(cachePath)}: ${removed.error}`);
  info(`You can clear it manually: rm -rf ${displayPath(cachePath)}`);
}

function printResult(ok: boolean, message: string): void {
  if (ok) {
    success(message);
  } else {
    warning(message);
  }
}

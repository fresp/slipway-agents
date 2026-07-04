import { updateSlipwayConfig } from "../services/slipway-config";
import { pathExists, removeDirectory } from "../utils/filesystem";
import { displayPath, getSlipwayPaths } from "../utils/paths";
import { info, success, warning } from "../utils/logger";

export function runUpdateCommand(): number {
  const paths = getSlipwayPaths();
  info("Updating slipway-agents config...");

  const updated = updateSlipwayConfig(paths);
  printResult(updated.ok, updated.message);
  if (updated.backupPath) {
    info(`Backed up slipway.json → ${displayPath(updated.backupPath)}`);
  }

  if (updated.changed && updated.message.includes("same version but different content")) {
    warning(
      "Version field is the canonical update signal; same-version content divergence usually means slipway.json was edited manually."
    );
  }

  clearPluginCache(paths.pluginCacheDir);

  if (!updated.ok) {
    warning("Update finished with warnings. Fix the messages above if needed.");
    return 1;
  }

  success("Update complete.");
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
}

function printResult(ok: boolean, message: string): void {
  if (ok) {
    success(message);
  } else {
    warning(message);
  }
}

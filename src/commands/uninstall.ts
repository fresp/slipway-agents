import { removePluginFromOpencodeConfig } from "../services/opencode-config";
import { removeSlipwayConfig } from "../services/slipway-config";
import { pathExists } from "../utils/filesystem";
import { displayPath, getSlipwayPaths } from "../utils/paths";
import { info, success, warning } from "../utils/logger";

export function runUninstallCommand(): number {
  const paths = getSlipwayPaths();
  info("Uninstalling slipway-agents...");

  const opencode = removePluginFromOpencodeConfig(paths);
  printResult(opencode.ok, opencode.message);
  if (opencode.backupPath) {
    info(`Backed up opencode.json → ${displayPath(opencode.backupPath)}`);
  }

  const slipway = removeSlipwayConfig(paths);
  printResult(slipway.ok, slipway.message);
  if (slipway.backupPath) {
    info(`Backed up slipway.json → ${displayPath(slipway.backupPath)}`);
  }

  // Keep local overrides by default because they contain user-specific model customizations.
  if (pathExists(paths.slipwayLocalConfigFile)) {
    info(
      "slipway.local.json was left in place — it contains your model customizations. Delete it manually if you no longer need it."
    );
  }

  if (!opencode.ok || !slipway.ok) {
    warning("Uninstall finished with warnings. Fix the messages above if needed.");
    return 1;
  }

  success("Uninstall complete.");
  return 0;
}

function printResult(ok: boolean, message: string): void {
  if (ok) {
    success(message);
  } else {
    warning(message);
  }
}

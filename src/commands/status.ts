import { isPluginRegistered } from "../services/opencode-config";
import { readInstalledSlipwaySummary } from "../services/slipway-config";
import { pathExists } from "../utils/filesystem";
import { displayPath, getSlipwayPaths } from "../utils/paths";

export function runStatusCommand(): number {
  const paths = getSlipwayPaths();
  const plugin = isPluginRegistered(paths);
  const summary = readInstalledSlipwaySummary(paths);
  const installed = plugin.ok && plugin.registered;

  process.stdout.write("Slipway Agents\n");
  process.stdout.write(`Installed : ${installed ? "Yes" : "No"}\n`);
  process.stdout.write(`Version   : ${summary.ok ? summary.version : "unknown"}\n`);
  process.stdout.write(`Location  : ${displayPath(paths.slipwayConfigFile)}\n`);
  process.stdout.write(`Agents    : ${summary.ok ? summary.agentCount : "unknown"}\n`);
  process.stdout.write(
    `Local override: ${displayPath(paths.slipwayLocalConfigFile)} (${pathExists(paths.slipwayLocalConfigFile) ? "present" : "not present"})\n`
  );

  return 0;
}

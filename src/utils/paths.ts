import * as os from "os";
import * as path from "path";

export const PLUGIN_ENTRY = "slipway-agents@latest";

export interface SlipwayPaths {
  opencodeConfigDir: string;
  opencodeConfigFile: string;
  slipwayConfigFile: string;
  slipwayLocalConfigFile: string;
  bundledSlipwayConfigFile: string;
  bundledSlipwaySchemaFile: string;
  builtPluginEntryFile: string;
  pluginCacheDir: string;
}

export function getConfigHome(): string {
  if (process.platform === "win32") {
    return process.env.APPDATA ?? path.join(os.homedir(), "AppData", "Roaming");
  }

  return process.env.XDG_CONFIG_HOME ?? path.join(os.homedir(), ".config");
}

export function getCacheHome(): string {
  if (process.platform === "win32") {
    return process.env.LOCALAPPDATA ?? path.join(os.homedir(), "AppData", "Local");
  }

  return process.env.XDG_CACHE_HOME ?? path.join(os.homedir(), ".cache");
}

export function getPackageRoot(): string {
  return path.join(__dirname, "..", "..");
}

export function getSlipwayPaths(): SlipwayPaths {
  const opencodeConfigDir = path.join(getConfigHome(), "opencode");
  const packageRoot = getPackageRoot();
  const pluginCacheDir = path.join(getCacheHome(), "opencode", "packages", PLUGIN_ENTRY);

  return {
    opencodeConfigDir,
    opencodeConfigFile: path.join(opencodeConfigDir, "opencode.json"),
    slipwayConfigFile: path.join(opencodeConfigDir, "slipway.json"),
    slipwayLocalConfigFile: path.join(opencodeConfigDir, "slipway.local.json"),
    bundledSlipwayConfigFile: path.join(packageRoot, "slipway.json"),
    bundledSlipwaySchemaFile: path.join(packageRoot, "slipway.schema.json"),
    builtPluginEntryFile: path.join(packageRoot, "dist", "index.js"),
    pluginCacheDir,
  };
}

export function displayPath(filePath: string): string {
  const home = os.homedir();
  return filePath.startsWith(home) ? `~${filePath.slice(home.length)}` : filePath;
}

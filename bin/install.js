#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const OPENCODE_CONFIG_DIR = path.join(os.homedir(), ".config", "opencode");
const OPENCODE_CONFIG = path.join(OPENCODE_CONFIG_DIR, "opencode.json");
const SLIPWAY_CONFIG = path.join(OPENCODE_CONFIG_DIR, "slipway.json");
const PLUGIN_ENTRY = "slipway-agents@latest";

// slipway.json bundled inside this npm package
const PACKAGE_SLIPWAY_JSON = path.join(__dirname, "..", "slipway.json");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function log(msg) {
  process.stdout.write(`[slipway-agents] ${msg}\n`);
}

function warn(msg) {
  process.stdout.write(`[slipway-agents] WARNING: ${msg}\n`);
}

/** Generate a timestamp string: YYYYMMDD-HHMMSS */
function timestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  );
}

/** Back up a file with a timestamped name. Returns backup path or null. */
function backup(filePath, label) {
  if (!fs.existsSync(filePath)) return null;
  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const base = path.basename(filePath, ext);
  const backupPath = path.join(dir, `${base}-${label}-${timestamp()}${ext}`);
  fs.copyFileSync(filePath, backupPath);
  log(`Backed up ${path.basename(filePath)} → ${path.basename(backupPath)}`);
  return backupPath;
}

/**
 * Patch ~/.config/opencode/opencode.json to add the slipway-agents plugin entry.
 * - Creates the file if it does not exist.
 * - Skips if the entry is already present.
 * - Never removes or overwrites existing keys.
 * - Backs up the file before any modification.
 */
function patchOpencodeJson() {
  let config = {};
  let existed = false;

  if (fs.existsSync(OPENCODE_CONFIG)) {
    existed = true;
    try {
      const raw = fs.readFileSync(OPENCODE_CONFIG, "utf-8");
      config = JSON.parse(raw);
    } catch (e) {
      warn(`Could not parse ${OPENCODE_CONFIG}: ${e.message}`);
      warn("Skipping opencode.json patch — add the plugin entry manually:");
      warn(`  Add "${PLUGIN_ENTRY}" to the "plugin" array in ${OPENCODE_CONFIG}`);
      return;
    }
  } else {
    fs.mkdirSync(OPENCODE_CONFIG_DIR, { recursive: true });
  }

  if (!Array.isArray(config.plugin)) {
    config.plugin = [];
  }

  if (config.plugin.includes(PLUGIN_ENTRY)) {
    log(`opencode.json already contains "${PLUGIN_ENTRY}" — no change needed.`);
    return;
  }

  if (existed) backup(OPENCODE_CONFIG, "pre-slipway");

  config.plugin.push(PLUGIN_ENTRY);
  fs.writeFileSync(OPENCODE_CONFIG, JSON.stringify(config, null, 2) + "\n", "utf-8");
  log(`Added "${PLUGIN_ENTRY}" to plugin array in ${OPENCODE_CONFIG}`);
}

/**
 * Copy slipway.json from the npm package to ~/.config/opencode/slipway.json.
 * - Source is always the bundled slipway.json inside this npm package.
 * - If no slipway.json exists at destination → copy directly.
 * - If destination version matches source → skip (already up to date).
 * - If destination is older → back up, then overwrite.
 * - slipway.local.json is never touched.
 */
function installSlipwayJson() {
  if (!fs.existsSync(PACKAGE_SLIPWAY_JSON)) {
    warn("slipway.json not found in npm package — skipping.");
    return;
  }

  let sourceConfig;
  try {
    sourceConfig = JSON.parse(fs.readFileSync(PACKAGE_SLIPWAY_JSON, "utf-8"));
  } catch (e) {
    warn(`Could not parse bundled slipway.json: ${e.message}`);
    return;
  }

  if (!fs.existsSync(SLIPWAY_CONFIG)) {
    fs.mkdirSync(OPENCODE_CONFIG_DIR, { recursive: true });
    fs.copyFileSync(PACKAGE_SLIPWAY_JSON, SLIPWAY_CONFIG);
    log(`Created slipway.json at ${SLIPWAY_CONFIG} (v${sourceConfig.version})`);
    log("Edit this file to change model assignments per agent.");
    return;
  }

  let destConfig;
  try {
    destConfig = JSON.parse(fs.readFileSync(SLIPWAY_CONFIG, "utf-8"));
  } catch (e) {
    warn(`Could not parse existing slipway.json: ${e.message}`);
    warn("Skipping slipway.json update — fix it manually.");
    return;
  }

  if (destConfig.version === sourceConfig.version) {
    log(`slipway.json already at v${sourceConfig.version} — no update needed.`);
    return;
  }

  backup(SLIPWAY_CONFIG, "pre-update");
  fs.copyFileSync(PACKAGE_SLIPWAY_JSON, SLIPWAY_CONFIG);
  log(`Updated slipway.json: v${destConfig.version} → v${sourceConfig.version}`);
}

/**
 * Clear the OpenCode plugin cache for slipway-agents@latest.
 * This forces OpenCode to fetch the latest published version on next start
 * instead of using a stale cached install.
 */
function clearPluginCache() {
  const cachePath = path.join(os.homedir(), ".cache", "opencode", "packages", "slipway-agents@latest");
  if (!fs.existsSync(cachePath)) {
    log("Plugin cache not found — nothing to clear.");
    return;
  }
  try {
    fs.rmSync(cachePath, { recursive: true, force: true });
    log("Plugin cache cleared — OpenCode will fetch the latest version on next start.");
  } catch (e) {
    warn(`Could not clear plugin cache at ${cachePath}: ${e.message}`);
    warn("You can clear it manually: rm -rf ~/.cache/opencode/packages/slipway-agents@latest");
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  log("Installing slipway-agents...");
  log("");

  // Step 1: Add plugin entry to ~/.config/opencode/opencode.json
  patchOpencodeJson();

  // Step 2: Copy slipway.json to ~/.config/opencode/slipway.json
  installSlipwayJson();

  // Step 3: Clear OpenCode plugin cache so the latest version is fetched on next start
  clearPluginCache();

  log("");
  log("Done. Restart OpenCode to activate the agents.");
  log("");
  log("To change model assignments, edit:");
  log(`  ${SLIPWAY_CONFIG}`);
  log("");
  log("Quick start:");
  log("  @lodestar I want to build [your idea here]");
  log("");
  log("Full guide: https://github.com/fresp/slipway-agents/blob/dev/docs/guide/installation.md");
}

main();

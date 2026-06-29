#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const os = require("os");

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const REPO_URL = "https://github.com/fresp/slipway-agents.git";
const INSTALL_DIR = path.join(
  os.homedir(),
  ".config",
  "opencode",
  "agents",
  "slipway-agents"
);
const OPENCODE_CONFIG_DIR = path.join(os.homedir(), ".config", "opencode");
const OPENCODE_CONFIG = path.join(OPENCODE_CONFIG_DIR, "opencode.json");
const SLIPWAY_CONFIG = path.join(OPENCODE_CONFIG_DIR, "slipway.json");
const PLUGIN_ENTRY = "slipway-agents@latest";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function log(msg) {
  process.stdout.write(`[slipway-agents] ${msg}\n`);
}

function warn(msg) {
  process.stdout.write(`[slipway-agents] WARNING: ${msg}\n`);
}

function die(msg) {
  process.stderr.write(`[slipway-agents] ERROR: ${msg}\n`);
  process.exit(1);
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

/**
 * Back up a file with a timestamped name in the same directory.
 * Returns the backup path, or null if the file did not exist.
 */
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
 * Merge the slipway-agents plugin entry into the user's opencode.json.
 * - Backs up the existing file before any modification.
 * - If the file does not exist, creates it with just the plugin entry.
 * - If the "plugin" array exists and already contains our entry, skips.
 * - Never removes or overwrites existing keys.
 */
function patchOpencodeJson(configPath, pluginEntry) {
  let config = {};
  let existed = false;

  if (fs.existsSync(configPath)) {
    existed = true;
    try {
      const raw = fs.readFileSync(configPath, "utf-8");
      config = JSON.parse(raw);
    } catch (e) {
      warn(`Could not parse ${configPath}: ${e.message}`);
      warn("Skipping opencode.json patch — fix it manually.");
      warn(`Add "${pluginEntry}" to the "plugin" array in ${configPath}`);
      return;
    }
  } else {
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
  }

  if (!Array.isArray(config.plugin)) {
    config.plugin = [];
  }

  if (config.plugin.includes(pluginEntry)) {
    log(`opencode.json already contains "${pluginEntry}" — no change needed.`);
    return;
  }

  // Back up before modifying
  if (existed) {
    backup(configPath, "pre-slipway");
  }

  config.plugin.push(pluginEntry);
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8");
  log(`Added "${pluginEntry}" to plugin array in ${configPath}`);
}

/**
 * Merge the installed slipway.json into the project root (cwd).
 *
 * Behavior:
 * - If no slipway.json exists at cwd → copy from install.
 * - If slipway.json exists and versions match → skip (already up to date).
 * - If slipway.json exists and install has a newer version → back up the
 *   current file, then write the new one.
 * - User customizations in slipway.local.json are never touched.
 */
function patchSlipwayJson(installDir, SLIPWAY_CONFIG) {
  const sourcePath = path.join(installDir, "slipway.json");

  if (!fs.existsSync(sourcePath)) {
    warn("slipway.json not found in install directory — skipping.");
    return;
  }

  let sourceConfig;
  try {
    sourceConfig = JSON.parse(fs.readFileSync(sourcePath, "utf-8"));
  } catch (e) {
    warn(`Could not parse source slipway.json: ${e.message}`);
    return;
  }

  if (!fs.existsSync(SLIPWAY_CONFIG)) {
    fs.copyFileSync(sourcePath, SLIPWAY_CONFIG);
    log(`Created slipway.json at ${SLIPWAY_CONFIG} (version ${sourceConfig.version})`);
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
    log(
      `slipway.json is already at version ${sourceConfig.version} — no update needed.`
    );
    return;
  }

  // Back up before overwriting
  backup(SLIPWAY_CONFIG, "pre-update");
  fs.copyFileSync(sourcePath, SLIPWAY_CONFIG);
  log(
    `Updated slipway.json: ${destConfig.version} → ${sourceConfig.version}`
  );
}

// ---------------------------------------------------------------------------
// Clone / update
// ---------------------------------------------------------------------------
function cloneOrUpdate(repoUrl, installDir) {
  if (fs.existsSync(path.join(installDir, ".git"))) {
    log(`Updating existing install at ${installDir}`);
    try {
      execSync(`git -C "${installDir}" pull --ff-only`, { stdio: "inherit" });
    } catch {
      die(
        "git pull failed. Try deleting the install directory and re-running:\n" +
        `  rm -rf "${installDir}"\n  bunx slipway-agents`
      );
    }
  } else {
    log(`Cloning into ${installDir}`);
    fs.mkdirSync(path.dirname(installDir), { recursive: true });
    try {
      execSync(`git clone --depth 1 "${repoUrl}" "${installDir}"`, {
        stdio: "inherit",
      });
    } catch {
      die("git clone failed. Check your network connection and try again.");
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main() {
  const cwd = process.cwd();

  log("Starting installation...");
  log("");

  // Step 1: Clone or update the repo
  cloneOrUpdate(REPO_URL, INSTALL_DIR);
  log("");

  // Step 2: Patch opencode.json (user-level config)
  patchOpencodeJson(OPENCODE_CONFIG, PLUGIN_ENTRY);

  // Step 3: Patch slipway.json (project-level config, in cwd)
  patchSlipwayJson(INSTALL_DIR, cwd);
  log("");

  // Step 4: Done
  log("Installation complete.");
  log("");
  log("Quick start:");
  log("  @slipway I want to build [your idea here]");
  log("");
  log("Extend an existing project with a new feature:");
  log("  @slipway extend: [feature description]");
  log("");
  log("Review existing docs without a full pipeline run:");
  log("  @slipway review");
  log("");
  log(
    "Full guide: https://github.com/fresp/slipway-agents/blob/main/docs/guide/installation.md"
  );
}

main();

import cac from "cac";
import { runDoctorCommand } from "./commands/doctor";
import { runInstallCommand } from "./commands/install";
import { runStatusCommand } from "./commands/status";
import { runUninstallCommand } from "./commands/uninstall";
import { runUpdateCommand } from "./commands/update";
import { error } from "./utils/logger";

const cli = cac("slipway-agents");

cli.command("install", "Install slipway-agents for OpenCode").action(() => {
  process.exitCode = runInstallCommand();
});

cli.command("uninstall", "Uninstall slipway-agents from OpenCode").action(() => {
  process.exitCode = runUninstallCommand();
});

cli.command("update", "Update the installed slipway.json config").action(() => {
  process.exitCode = runUpdateCommand();
});

cli.command("doctor", "Check slipway-agents installation health").action(() => {
  process.exitCode = runDoctorCommand();
});

cli.command("status", "Show slipway-agents installation status").action(() => {
  process.exitCode = runStatusCommand();
});

cli.command("[...args]", "Install slipway-agents for OpenCode").action((args: string[]) => {
  if (args.length > 0) {
    error(`Unknown command: ${args.join(" ")}`);
    process.exitCode = 1;
    return;
  }
  process.exitCode = runInstallCommand();
});

cli.help();

try {
  cli.parse();
} catch (caught) {
  const message = caught instanceof Error ? caught.message : String(caught);
  error(message);
  process.exitCode = 1;
}

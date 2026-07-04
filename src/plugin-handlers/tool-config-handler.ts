import { AgentDefinition, PermissionConfig } from "../config/types";

/**
 * Applies Slipway permission config to OpenCode's native AgentConfig.permission.
 *
 * OpenCode API used: the SDK AgentConfig type exposes `permission?:
 * PermissionConfig`, and the config hook accepts arbitrary agent fields. This
 * handler only passes through the permission keys represented in slipway.json:
 * edit, webfetch, task, and bash.
 *
 * Remaining gaps: OpenCode supports native `permission.bash`, but this repo does
 * not prove whether object-form command scoping is matched by literal first
 * command token, shell builtins, or another mechanism. We pass the native object
 * through and document command-scoping semantics as an OpenCode runtime gap.
 */

export function applyToolConfig(
  agentDef: AgentDefinition,
  permission: PermissionConfig | undefined
): void {
  if (!permission) {
    return;
  }

  agentDef.permission = permission;
}

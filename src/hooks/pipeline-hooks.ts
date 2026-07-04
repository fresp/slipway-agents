import { HookConfig, Hooks, SlipwayConfig } from "../config/types";

/**
 * Registers lifecycle-level pipeline HTTP hook dispatch.
 *
 * OpenCode API used: the generic plugin `event(input)` hook. This file maps
 * only lifecycle events exposed by OpenCode: session-complete-like events to
 * on_pipeline_complete, and session-error-like events to on_block.
 *
 * Remaining gaps: on_step_complete, gate-level details, and
 * on_user_input_required are Slipway orchestrator prompt events, not plugin
 * lifecycle events, so they are fired by the orchestrator prompt, not plugin.
 */

type LifecycleEventName = "on_pipeline_complete" | "on_block";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getEventName(event: unknown): string {
  if (!isRecord(event)) {
    return "";
  }

  const candidates = [event.type, event.name, event.kind];
  const match = candidates.find((candidate): candidate is string => typeof candidate === "string");
  return match ?? "";
}

function mapLifecycleEvent(event: unknown): LifecycleEventName | null {
  const eventName = getEventName(event).toLowerCase();

  if (eventName.includes("session") && eventName.includes("error")) {
    return "on_block";
  }

  if (
    eventName.includes("session") &&
    (eventName.includes("complete") || eventName.includes("finish"))
  ) {
    return "on_pipeline_complete";
  }

  return null;
}

function renderTemplate(template: string | undefined, eventName: string, project: string): string {
  const values: Record<string, string> = {
    event: eventName,
    step: "",
    gate: "",
    timestamp: new Date().toISOString(),
    project,
  };
  const body = template ?? JSON.stringify(values);

  return Object.entries(values).reduce(
    (current, [key, value]) => current.split(`{{${key}}}`).join(value),
    body
  );
}

function dispatchHook(hook: HookConfig, eventName: string, project: string): void {
  const method = hook.method ?? "POST";
  const body = renderTemplate(hook.template, eventName, project);

  void fetch(hook.url, {
    method,
    headers: hook.headers,
    body: method === "POST" ? body : undefined,
  }).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[slipway-agents] Hook dispatch failed for ${eventName}: ${message}`);
  });
}

export function registerPipelineHooks(config: SlipwayConfig | null, projectRoot: string): Hooks {
  return {
    event: async (input) => {
      const eventName = mapLifecycleEvent(input.event);

      if (!eventName) {
        return;
      }

      const hook = config?.hooks?.[eventName];

      if (hook) {
        dispatchHook(hook, eventName, projectRoot);
      }
    },
  };
}

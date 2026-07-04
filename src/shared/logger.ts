/**
 * Shared logging helpers for future Batch 6 handlers.
 *
 * OpenCode API used: none. Part 0 keeps the same console.log/console.warn style
 * as the original src/index.ts while centralizing a small warning helper for
 * later parts.
 *
 * Remaining gaps: notify_on_fallback support is deferred to later parts.
 */

export function warn(message: string): void {
  console.warn(`[slipway-agents] ${message}`);
}

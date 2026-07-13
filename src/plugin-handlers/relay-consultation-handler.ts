import { createHash } from "crypto";
import { SlipwayConfig } from "../config/types";

/**
 * Pure helpers backing the opt-in STEP 4 Relay Consultation feature.
 *
 * These are reference implementations only. `slipway` (the orchestrator) has
 * `bash: deny` and `edit: deny`, so it cannot execute a hash function itself —
 * its own write-detection procedure (subagents/slipway.md, Relay Consultation)
 * is a plain content/membership diff via the `Glob` and `Read` tools it does
 * have. Nothing here is wired into a runtime hook this batch: unlike
 * gate-assertion-handler.ts's STEP 4 → gunner assertion, there is no
 * structured signal in `task` call args that identifies a given `hullwright`
 * invocation as Consultative Assessment mode (mode is conveyed only in
 * free-text prompt content), so there is no clean hook point to gate.
 */

/** Whether the opt-in Relay Consultation feature is turned on for this project. */
export function isRelayConsultationEnabled(
  config: SlipwayConfig | null
): boolean {
  return config?.relay_consultation?.enabled === true;
}

/** sha1 hex digest of the given file content. */
export function hashContent(content: string): string {
  return createHash("sha1").update(content, "utf8").digest("hex");
}

export interface DocsSnapshotComparison {
  changed: string[];
  added: string[];
  removed: string[];
  hasDrift: boolean;
}

/**
 * Compares a "before" and "after" snapshot of file path -> sha1 hash and
 * reports what changed. Any difference at all (content change, addition, or
 * removal) counts as drift for the write-detection safeguard's purposes.
 */
export function compareDocsSnapshots(
  before: Record<string, string>,
  after: Record<string, string>
): DocsSnapshotComparison {
  const changed: string[] = [];
  const added: string[] = [];
  const removed: string[] = [];

  for (const path of Object.keys(before)) {
    if (!(path in after)) {
      removed.push(path);
    } else if (before[path] !== after[path]) {
      changed.push(path);
    }
  }

  for (const path of Object.keys(after)) {
    if (!(path in before)) {
      added.push(path);
    }
  }

  changed.sort();
  added.sort();
  removed.sort();

  return {
    changed,
    added,
    removed,
    hasDrift: changed.length > 0 || added.length > 0 || removed.length > 0,
  };
}

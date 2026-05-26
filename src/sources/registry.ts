// Source-adapter registry. Bundled configs ship inside the app as the offline
// fallback / default catalogue of sources. A backend registry (S5) will layer
// on top: `refresh()` will try the remote bundle first and fall back to these.
//
// Configs are upserted into the `sources` table; the user's enabled flag is
// preserved across refreshes (sourceRepo.upsert without an explicit `enabled`),
// so a config update never silently re-enables a source the user turned off.
// New sources arrive disabled — the user opts in from the Sources screen.

import { sourceRepo } from "@/db/repositories/sourceRepo";
import type { SourceConfig } from "./types";
import royalroad from "./bundled/royalroad.json";

export const bundledConfigs: SourceConfig[] = [royalroad as SourceConfig];

const REGISTRY_URL = process.env.EXPO_PUBLIC_REGISTRY_URL?.replace(/\/+$/, "");

/** Minimal shape guard for configs arriving from the network. */
function isSourceConfig(value: unknown): value is SourceConfig {
  if (!value || typeof value !== "object") return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c.id === "string" &&
    typeof c.name === "string" &&
    typeof c.version === "number" &&
    typeof c.baseUrl === "string" &&
    typeof c.search === "object" &&
    typeof c.details === "object" &&
    typeof c.chapter === "object"
  );
}

async function fetchRemoteConfigs(): Promise<SourceConfig[] | null> {
  if (!REGISTRY_URL) return null;
  try {
    const res = await fetch(`${REGISTRY_URL}/sources`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { sources?: unknown };
    const list = Array.isArray(data.sources) ? data.sources : [];
    const valid = list.filter(isSourceConfig);
    return valid.length ? valid : null;
  } catch {
    return null; // Network/parse failure → caller falls back to bundled.
  }
}

export const registry = {
  /** Seed/update the sources table from the bundled configs. */
  async syncBundled(): Promise<void> {
    for (const config of bundledConfigs) {
      await sourceRepo.upsert(config);
    }
  },

  /**
   * Refresh the source catalogue. Tries the backend registry (if
   * EXPO_PUBLIC_REGISTRY_URL is set and reachable); falls back to the bundled
   * configs so the app always has a working source list offline.
   */
  async refresh(): Promise<void> {
    const remote = await fetchRemoteConfigs();
    if (remote) {
      for (const config of remote) await sourceRepo.upsert(config);
      return;
    }
    await this.syncBundled();
  },
};

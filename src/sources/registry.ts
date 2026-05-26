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

export const registry = {
  /** Seed/update the sources table from the bundled configs. */
  async syncBundled(): Promise<void> {
    for (const config of bundledConfigs) {
      await sourceRepo.upsert(config);
    }
  },

  /**
   * Refresh the source catalogue. Bundled-only for now (S4); S5 wires the
   * backend registry here with a fallback to the bundled configs.
   */
  async refresh(): Promise<void> {
    await this.syncBundled();
  },
};

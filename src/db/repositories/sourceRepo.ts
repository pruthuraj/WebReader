import { all, first, run } from "../client";
import type { SourceConfig, StoredSource } from "@/sources/types";

interface SourceRow {
  id: string;
  name: string;
  version: number;
  config_json: string;
  enabled: number;
  updated_at: number;
}

function rowToSource(r: SourceRow): StoredSource {
  return {
    id: r.id,
    name: r.name,
    version: r.version,
    config: JSON.parse(r.config_json) as SourceConfig,
    enabled: r.enabled === 1,
    updatedAt: r.updated_at,
  };
}

export const sourceRepo = {
  async list(): Promise<StoredSource[]> {
    const rows = await all<SourceRow>(`SELECT * FROM sources ORDER BY name ASC`);
    return rows.map(rowToSource);
  },

  async listEnabled(): Promise<StoredSource[]> {
    const rows = await all<SourceRow>(
      `SELECT * FROM sources WHERE enabled = 1 ORDER BY name ASC`
    );
    return rows.map(rowToSource);
  },

  async get(id: string): Promise<StoredSource | null> {
    const row = await first<SourceRow>(`SELECT * FROM sources WHERE id = ?`, [id]);
    return row ? rowToSource(row) : null;
  },

  /**
   * Insert or update a source config. Preserves the existing `enabled` flag on
   * update unless one is supplied — a registry refresh must not silently
   * re-enable a source the user disabled.
   */
  async upsert(config: SourceConfig, opts?: { enabled?: boolean }): Promise<void> {
    const now = Date.now();
    const json = JSON.stringify(config);
    if (opts?.enabled === undefined) {
      await run(
        `INSERT INTO sources (id, name, version, config_json, enabled, updated_at)
         VALUES (?, ?, ?, ?, 0, ?)
         ON CONFLICT(id) DO UPDATE SET
           name=excluded.name,
           version=excluded.version,
           config_json=excluded.config_json,
           updated_at=excluded.updated_at`,
        [config.id, config.name, config.version, json, now]
      );
      return;
    }
    await run(
      `INSERT INTO sources (id, name, version, config_json, enabled, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name=excluded.name,
         version=excluded.version,
         config_json=excluded.config_json,
         enabled=excluded.enabled,
         updated_at=excluded.updated_at`,
      [config.id, config.name, config.version, json, opts.enabled ? 1 : 0, now]
    );
  },

  async setEnabled(id: string, enabled: boolean): Promise<void> {
    await run(`UPDATE sources SET enabled = ?, updated_at = ? WHERE id = ?`, [
      enabled ? 1 : 0,
      Date.now(),
      id,
    ]);
  },

  async remove(id: string): Promise<void> {
    await run(`DELETE FROM sources WHERE id = ?`, [id]);
  },

  async count(): Promise<number> {
    const r = await first<{ c: number }>(`SELECT COUNT(*) AS c FROM sources`);
    return r?.c ?? 0;
  },
};

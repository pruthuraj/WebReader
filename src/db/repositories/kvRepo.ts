import { all, first, run } from "../client";

interface KvRow {
  key: string;
  value: string;
}

export const kvRepo = {
  async get<T = unknown>(key: string): Promise<T | null> {
    const row = await first<KvRow>(`SELECT * FROM kv_settings WHERE key = ?`, [key]);
    if (!row) return null;
    try {
      return JSON.parse(row.value) as T;
    } catch {
      return row.value as unknown as T;
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    await run(
      `INSERT INTO kv_settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [key, JSON.stringify(value)]
    );
  },

  async remove(key: string): Promise<void> {
    await run(`DELETE FROM kv_settings WHERE key = ?`, [key]);
  },

  async all(): Promise<Record<string, unknown>> {
    const rows = await all<KvRow>(`SELECT * FROM kv_settings`);
    const out: Record<string, unknown> = {};
    for (const r of rows) {
      try {
        out[r.key] = JSON.parse(r.value);
      } catch {
        out[r.key] = r.value;
      }
    }
    return out;
  },
};

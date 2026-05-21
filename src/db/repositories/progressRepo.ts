import { all, first, run } from "../client";
import type { ProgressEntry } from "@/data/types";

interface ProgressRow {
  novel_id: string;
  chapter_id: string;
  scroll_offset: number;
  percent: number;
  updated_at: number;
}

function rowToProgress(r: ProgressRow): ProgressEntry {
  return {
    novelId: r.novel_id,
    chapterId: r.chapter_id,
    scrollOffset: r.scroll_offset,
    percent: r.percent,
    updatedAt: r.updated_at,
  };
}

export const progressRepo = {
  async get(novelId: string, chapterId: string): Promise<ProgressEntry | null> {
    const row = await first<ProgressRow>(
      `SELECT * FROM progress WHERE novel_id = ? AND chapter_id = ?`,
      [novelId, chapterId]
    );
    return row ? rowToProgress(row) : null;
  },

  async lastForNovel(novelId: string): Promise<ProgressEntry | null> {
    const row = await first<ProgressRow>(
      `SELECT * FROM progress WHERE novel_id = ? ORDER BY updated_at DESC LIMIT 1`,
      [novelId]
    );
    return row ? rowToProgress(row) : null;
  },

  async recent(limit = 10): Promise<ProgressEntry[]> {
    const rows = await all<ProgressRow>(
      `SELECT * FROM progress ORDER BY updated_at DESC LIMIT ?`,
      [limit]
    );
    return rows.map(rowToProgress);
  },

  async upsert(p: ProgressEntry): Promise<void> {
    await run(
      `INSERT INTO progress (novel_id, chapter_id, scroll_offset, percent, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(novel_id, chapter_id) DO UPDATE SET
         scroll_offset=excluded.scroll_offset,
         percent=excluded.percent,
         updated_at=excluded.updated_at`,
      [p.novelId, p.chapterId, p.scrollOffset, p.percent, p.updatedAt]
    );
  },

  async clear(novelId?: string): Promise<void> {
    if (novelId) {
      await run(`DELETE FROM progress WHERE novel_id = ?`, [novelId]);
    } else {
      await run(`DELETE FROM progress`);
    }
  },
};

import { all, first, run } from "../client";
import type { Chapter, ChapterMeta } from "@/data/types";

interface ChapterRow {
  novel_id: string;
  chapter_id: string;
  idx: number;
  title: string;
  body: string | null;
  downloaded_at: number | null;
}

function rowToChapter(r: ChapterRow): Chapter {
  return {
    novelId: r.novel_id,
    chapterId: r.chapter_id,
    idx: r.idx,
    title: r.title,
    body: r.body,
    downloadedAt: r.downloaded_at,
  };
}

export const chapterRepo = {
  async listByNovel(novelId: string): Promise<ChapterMeta[]> {
    const rows = await all<ChapterRow>(
      `SELECT novel_id, chapter_id, idx, title, downloaded_at FROM chapters WHERE novel_id = ? ORDER BY idx ASC`,
      [novelId]
    );
    return rows.map((r) => ({
      novelId: r.novel_id,
      chapterId: r.chapter_id,
      idx: r.idx,
      title: r.title,
      downloadedAt: r.downloaded_at,
    }));
  },

  async getOne(novelId: string, chapterId: string): Promise<Chapter | null> {
    const row = await first<ChapterRow>(
      `SELECT * FROM chapters WHERE novel_id = ? AND chapter_id = ?`,
      [novelId, chapterId]
    );
    return row ? rowToChapter(row) : null;
  },

  async upsertMeta(c: ChapterMeta): Promise<void> {
    await run(
      `INSERT INTO chapters (novel_id, chapter_id, idx, title)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(novel_id, chapter_id) DO UPDATE SET
         idx=excluded.idx,
         title=excluded.title`,
      [c.novelId, c.chapterId, c.idx, c.title]
    );
  },

  async setBody(novelId: string, chapterId: string, body: string): Promise<void> {
    await run(
      `UPDATE chapters SET body = ?, downloaded_at = ? WHERE novel_id = ? AND chapter_id = ?`,
      [body, Date.now(), novelId, chapterId]
    );
  },

  async clearBody(novelId: string, chapterId: string): Promise<void> {
    await run(
      `UPDATE chapters SET body = NULL, downloaded_at = NULL WHERE novel_id = ? AND chapter_id = ?`,
      [novelId, chapterId]
    );
  },

  async countDownloaded(novelId?: string): Promise<number> {
    if (novelId) {
      const r = await first<{ c: number }>(
        `SELECT COUNT(*) AS c FROM chapters WHERE novel_id = ? AND body IS NOT NULL`,
        [novelId]
      );
      return r?.c ?? 0;
    }
    const r = await first<{ c: number }>(
      `SELECT COUNT(*) AS c FROM chapters WHERE body IS NOT NULL`
    );
    return r?.c ?? 0;
  },

  async neighbors(
    novelId: string,
    idx: number
  ): Promise<{ prev: ChapterMeta | null; next: ChapterMeta | null }> {
    const prev = await first<ChapterRow>(
      `SELECT novel_id, chapter_id, idx, title, downloaded_at FROM chapters
       WHERE novel_id = ? AND idx < ? ORDER BY idx DESC LIMIT 1`,
      [novelId, idx]
    );
    const next = await first<ChapterRow>(
      `SELECT novel_id, chapter_id, idx, title, downloaded_at FROM chapters
       WHERE novel_id = ? AND idx > ? ORDER BY idx ASC LIMIT 1`,
      [novelId, idx]
    );
    const map = (r: ChapterRow | null): ChapterMeta | null =>
      r
        ? {
            novelId: r.novel_id,
            chapterId: r.chapter_id,
            idx: r.idx,
            title: r.title,
            downloadedAt: r.downloaded_at,
          }
        : null;
    return { prev: map(prev), next: map(next) };
  },
};

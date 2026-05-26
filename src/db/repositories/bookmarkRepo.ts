import { all, first, run } from "../client";
import type { Bookmark, NewBookmark } from "@/data/types";

interface BookmarkRow {
  id: number;
  novel_id: string;
  chapter_id: string;
  scroll_offset: number;
  percent: number;
  note: string | null;
  created_at: number;
}

function rowToBookmark(r: BookmarkRow): Bookmark {
  return {
    id: r.id,
    novelId: r.novel_id,
    chapterId: r.chapter_id,
    scrollOffset: r.scroll_offset,
    percent: r.percent,
    note: r.note,
    createdAt: r.created_at,
  };
}

export const bookmarkRepo = {
  async listByNovel(novelId: string): Promise<Bookmark[]> {
    const rows = await all<BookmarkRow>(
      `SELECT * FROM bookmarks WHERE novel_id = ? ORDER BY created_at DESC`,
      [novelId]
    );
    return rows.map(rowToBookmark);
  },

  async add(b: NewBookmark): Promise<number> {
    const res = await run(
      `INSERT INTO bookmarks (novel_id, chapter_id, scroll_offset, percent, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [b.novelId, b.chapterId, b.scrollOffset, b.percent, b.note ?? null, Date.now()]
    );
    return res.lastInsertRowId ?? 0;
  },

  async remove(id: number): Promise<void> {
    await run(`DELETE FROM bookmarks WHERE id = ?`, [id]);
  },

  async countByNovel(novelId: string): Promise<number> {
    const r = await first<{ c: number }>(
      `SELECT COUNT(*) AS c FROM bookmarks WHERE novel_id = ?`,
      [novelId]
    );
    return r?.c ?? 0;
  },
};

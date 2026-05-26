import { all, first, run } from "../client";
import type { Novel } from "@/data/types";

interface NovelRow {
  id: string;
  title: string;
  author: string | null;
  source: string | null;
  language: string | null;
  description: string | null;
  tags: string | null;
  cover_hint: string | null;
  cached_at: number;
  source_id: string | null;
}

function rowToNovel(r: NovelRow): Novel {
  return {
    id: r.id,
    title: r.title,
    author: r.author,
    source: r.source,
    language: r.language,
    description: r.description,
    tags: r.tags ? (JSON.parse(r.tags) as string[]) : [],
    coverHint: r.cover_hint,
    cachedAt: r.cached_at,
    sourceId: r.source_id,
  };
}

export const novelRepo = {
  async listAll(): Promise<Novel[]> {
    const rows = await all<NovelRow>(`SELECT * FROM novels ORDER BY title ASC`);
    return rows.map(rowToNovel);
  },

  async getById(id: string): Promise<Novel | null> {
    const row = await first<NovelRow>(`SELECT * FROM novels WHERE id = ?`, [id]);
    return row ? rowToNovel(row) : null;
  },

  async upsert(n: Novel): Promise<void> {
    await run(
      `INSERT INTO novels (id, title, author, source, language, description, tags, cover_hint, cached_at, source_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         title=excluded.title,
         author=excluded.author,
         source=excluded.source,
         language=excluded.language,
         description=excluded.description,
         tags=excluded.tags,
         cover_hint=excluded.cover_hint,
         source_id=excluded.source_id`,
      [
        n.id,
        n.title,
        n.author ?? null,
        n.source ?? null,
        n.language ?? null,
        n.description ?? null,
        JSON.stringify(n.tags ?? []),
        n.coverHint ?? null,
        n.cachedAt ?? Date.now(),
        n.sourceId ?? null,
      ]
    );
  },

  async count(): Promise<number> {
    const r = await first<{ c: number }>(`SELECT COUNT(*) AS c FROM novels`);
    return r?.c ?? 0;
  },
};

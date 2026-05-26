import { all, first, run } from "../client";
import type { Shelf } from "@/data/types";

interface ShelfRow {
  id: number;
  name: string;
  created_at: number;
}

function rowToShelf(r: ShelfRow): Shelf {
  return { id: r.id, name: r.name, createdAt: r.created_at };
}

export interface ShelfWithCount extends Shelf {
  count: number;
}

export const shelfRepo = {
  async list(): Promise<ShelfWithCount[]> {
    const rows = await all<ShelfRow & { count: number }>(
      `SELECT s.*, COUNT(si.novel_id) AS count
       FROM shelves s LEFT JOIN shelf_items si ON si.shelf_id = s.id
       GROUP BY s.id
       ORDER BY s.created_at ASC`
    );
    return rows.map((r) => ({ ...rowToShelf(r), count: r.count }));
  },

  async get(id: number): Promise<Shelf | null> {
    const row = await first<ShelfRow>(`SELECT * FROM shelves WHERE id = ?`, [id]);
    return row ? rowToShelf(row) : null;
  },

  async create(name: string): Promise<number> {
    const res = await run(`INSERT INTO shelves (name, created_at) VALUES (?, ?)`, [
      name.trim(),
      Date.now(),
    ]);
    return res.lastInsertRowId ?? 0;
  },

  async rename(id: number, name: string): Promise<void> {
    await run(`UPDATE shelves SET name = ? WHERE id = ?`, [name.trim(), id]);
  },

  async remove(id: number): Promise<void> {
    await run(`DELETE FROM shelf_items WHERE shelf_id = ?`, [id]);
    await run(`DELETE FROM shelves WHERE id = ?`, [id]);
  },

  async addNovel(shelfId: number, novelId: string): Promise<void> {
    await run(
      `INSERT INTO shelf_items (shelf_id, novel_id, added_at) VALUES (?, ?, ?)
       ON CONFLICT(shelf_id, novel_id) DO NOTHING`,
      [shelfId, novelId, Date.now()]
    );
  },

  async removeNovel(shelfId: number, novelId: string): Promise<void> {
    await run(`DELETE FROM shelf_items WHERE shelf_id = ? AND novel_id = ?`, [shelfId, novelId]);
  },

  /** Shelf ids that contain the given novel (for the add-to-shelf toggles). */
  async shelfIdsForNovel(novelId: string): Promise<number[]> {
    const rows = await all<{ shelf_id: number }>(
      `SELECT shelf_id FROM shelf_items WHERE novel_id = ?`,
      [novelId]
    );
    return rows.map((r) => r.shelf_id);
  },

  /** Novel ids in a shelf, most-recently-added first. */
  async novelIdsInShelf(shelfId: number): Promise<string[]> {
    const rows = await all<{ novel_id: string }>(
      `SELECT novel_id FROM shelf_items WHERE shelf_id = ? ORDER BY added_at DESC`,
      [shelfId]
    );
    return rows.map((r) => r.novel_id);
  },
};

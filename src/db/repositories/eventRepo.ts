import { all, first, run } from "../client";
import type { AnalyticsEvent, EventType } from "@/data/types";

interface EventRow {
  id: number;
  type: EventType;
  payload: string | null;
  duration_ms: number | null;
  novel_id: string | null;
  chapter_id: string | null;
  created_at: number;
}

function rowToEvent(r: EventRow): AnalyticsEvent {
  return {
    id: r.id,
    type: r.type,
    payload: r.payload ? (JSON.parse(r.payload) as Record<string, unknown>) : null,
    durationMs: r.duration_ms,
    novelId: r.novel_id,
    chapterId: r.chapter_id,
    createdAt: r.created_at,
  };
}

export const eventRepo = {
  async record(e: Omit<AnalyticsEvent, "id" | "createdAt"> & { createdAt?: number }): Promise<void> {
    await run(
      `INSERT INTO events (type, payload, duration_ms, novel_id, chapter_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        e.type,
        e.payload ? JSON.stringify(e.payload) : null,
        e.durationMs ?? null,
        e.novelId ?? null,
        e.chapterId ?? null,
        e.createdAt ?? Date.now(),
      ]
    );
  },

  async countByType(type: EventType, sinceMs?: number): Promise<number> {
    if (sinceMs !== undefined) {
      const r = await first<{ c: number }>(
        `SELECT COUNT(*) AS c FROM events WHERE type = ? AND created_at >= ?`,
        [type, sinceMs]
      );
      return r?.c ?? 0;
    }
    const r = await first<{ c: number }>(
      `SELECT COUNT(*) AS c FROM events WHERE type = ?`,
      [type]
    );
    return r?.c ?? 0;
  },

  async sumDurationByType(type: EventType): Promise<number> {
    const r = await first<{ s: number | null }>(
      `SELECT COALESCE(SUM(duration_ms), 0) AS s FROM events WHERE type = ?`,
      [type]
    );
    return r?.s ?? 0;
  },

  async topNovels(byType: EventType, limit = 5): Promise<{ novelId: string; count: number }[]> {
    return all<{ novelId: string; count: number }>(
      `SELECT novel_id AS novelId, COUNT(*) AS count FROM events
       WHERE type = ? AND novel_id IS NOT NULL
       GROUP BY novel_id ORDER BY count DESC LIMIT ?`,
      [byType, limit]
    );
  },

  async recentDistinctNovelIds(
    byType: EventType,
    limit = 10
  ): Promise<{ novelId: string; createdAt: number }[]> {
    return all<{ novelId: string; createdAt: number }>(
      `SELECT novel_id AS novelId, MAX(created_at) AS createdAt FROM events
       WHERE type = ? AND novel_id IS NOT NULL
       GROUP BY novel_id
       ORDER BY createdAt DESC
       LIMIT ?`,
      [byType, limit]
    );
  },

  async chapterOpensByNovel(novelId: string): Promise<{ chapterId: string; count: number }[]> {
    return all<{ chapterId: string; count: number }>(
      `SELECT chapter_id AS chapterId, COUNT(*) AS count FROM events
       WHERE type = 'chapter_open' AND novel_id = ?
       GROUP BY chapter_id ORDER BY chapterId ASC`,
      [novelId]
    );
  },

  async recent(limit = 50): Promise<AnalyticsEvent[]> {
    const rows = await all<EventRow>(
      `SELECT * FROM events ORDER BY created_at DESC LIMIT ?`,
      [limit]
    );
    return rows.map(rowToEvent);
  },

  async totalCount(): Promise<number> {
    const r = await first<{ c: number }>(`SELECT COUNT(*) AS c FROM events`);
    return r?.c ?? 0;
  },
};

import { chapterRepo } from "@/db/repositories/chapterRepo";
import { eventRepo } from "@/db/repositories/eventRepo";
import { novelRepo } from "@/db/repositories/novelRepo";
import type { AnalyticsEvent, Novel } from "@/data/types";

export type Range = "today" | "7d" | "30d" | "all";

export interface AnalyticsSummary {
  searches: number;
  novelOpens: number;
  chaptersRead: number;
  ttsMinutes: number;
  averageSessionMs: number;
  totalEvents: number;
}

export interface TopNovelEntry {
  novel: Novel;
  count: number;
}

export interface DropOffEntry {
  idx: number;
  title: string;
  chapterId: string;
  opens: number;
  reads: number;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function rangeBoundMs(range: Range): number | undefined {
  if (range === "all") return undefined;
  const now = new Date();
  if (range === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start.getTime();
  }
  if (range === "7d") return Date.now() - 7 * MS_PER_DAY;
  if (range === "30d") return Date.now() - 30 * MS_PER_DAY;
  return undefined;
}

function roundMinutes(ms: number): number {
  return Math.round((ms / 60000) * 10) / 10;
}

export const analytics = {
  rangeBoundMs,

  async summary(range: Range): Promise<AnalyticsSummary> {
    const sinceMs = rangeBoundMs(range);
    const [searches, novelOpens, chaptersRead, ttsMs, avgSession, totalEvents] = await Promise.all([
      eventRepo.countByType("search", sinceMs),
      eventRepo.countByType("novel_open", sinceMs),
      eventRepo.countByType("chapter_read", sinceMs),
      eventRepo.sumDurationByType("tts_stop", sinceMs),
      eventRepo.averageDurationByType("session", sinceMs),
      eventRepo.totalCount(),
    ]);
    return {
      searches,
      novelOpens,
      chaptersRead,
      ttsMinutes: roundMinutes(ttsMs),
      averageSessionMs: avgSession,
      totalEvents,
    };
  },

  async topNovels(range: Range, limit = 5): Promise<TopNovelEntry[]> {
    const sinceMs = rangeBoundMs(range);
    const rows = await eventRepo.topNovelsSince("novel_open", sinceMs, limit);
    const resolved = await Promise.all(
      rows.map(async (row) => {
        const novel = await novelRepo.getById(row.novelId);
        return novel ? { novel, count: row.count } : null;
      })
    );
    return resolved.filter((entry): entry is TopNovelEntry => entry !== null);
  },

  async dropOffByChapter(novelId: string): Promise<DropOffEntry[]> {
    const [chapters, openRows] = await Promise.all([
      chapterRepo.listByNovel(novelId),
      eventRepo.chapterOpensByNovel(novelId),
    ]);
    const opensByChapter = new Map<string, number>();
    for (const row of openRows) opensByChapter.set(row.chapterId, row.count);
    return chapters.map((chapter) => ({
      idx: chapter.idx,
      title: chapter.title,
      chapterId: chapter.chapterId,
      opens: opensByChapter.get(chapter.chapterId) ?? 0,
      reads: 0,
    }));
  },

  async recentEvents(limit = 20): Promise<AnalyticsEvent[]> {
    return eventRepo.recent(limit);
  },

  async totalCount(): Promise<number> {
    return eventRepo.totalCount();
  },
};

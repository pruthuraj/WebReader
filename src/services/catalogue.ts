import { mockSource, type SearchOptions } from "@/data/mockSource";
import { chapterRepo } from "@/db/repositories/chapterRepo";
import { novelRepo } from "@/db/repositories/novelRepo";
import { sourceRepo } from "@/db/repositories/sourceRepo";
import { liveSource } from "@/sources/liveSource";
import type { Chapter, ChapterMeta, Novel } from "@/data/types";

export type { SearchOptions, SortKey, SearchFilters } from "@/data/mockSource";

/**
 * Data facade. The default catalogue browse/search reads the local mock
 * catalogue (offline, dev). Live sources are reached via the explicit
 * `*Source` helpers (per-source search/browse) and materialized into the DB on
 * open, after which the rest of the app reads them from the repos like any
 * other novel. `getChapterBody` is the one resolver the reader/downloader share:
 * it branches on the cached chapter's `sourceUrl`.
 */
export const catalogue = {
  // --- Mock-backed catalogue (offline). Live per-source search is separate. ---
  async search(options: SearchOptions): Promise<Novel[]> {
    return mockSource.search(options);
  },

  async getNovel(id: string): Promise<Novel | null> {
    return mockSource.getNovel(id);
  },

  async listChapters(novelId: string): Promise<Chapter[]> {
    return mockSource.listChapters(novelId);
  },

  async getChapter(novelId: string, chapterId: string): Promise<Chapter | null> {
    return mockSource.getChapter(novelId, chapterId);
  },

  async availableGenres(): Promise<string[]> {
    return mockSource.availableGenres();
  },

  async availableLanguages(): Promise<string[]> {
    return mockSource.availableLanguages();
  },

  async availableSources(): Promise<string[]> {
    return mockSource.availableSources();
  },

  // --- Live sources ---

  /**
   * Search (or browse, when the query is empty) a single enabled live source.
   * Returns in-memory Novel rows; nothing is persisted until the user opens one.
   */
  async searchSource(sourceId: string, query: string): Promise<Novel[]> {
    const stored = await sourceRepo.get(sourceId);
    if (!stored) return [];
    return query.trim()
      ? liveSource.search(stored.config, query)
      : liveSource.browse(stored.config);
  },

  /**
   * Fetch a live novel's details + chapter list and upsert them into the DB so
   * the rest of the app (reader, downloads, progress) works against the repos.
   */
  async materializeNovel(
    sourceId: string,
    detailsUrl: string
  ): Promise<{ novel: Novel; chapters: ChapterMeta[] }> {
    const stored = await sourceRepo.get(sourceId);
    if (!stored) throw new Error(`Source not available: ${sourceId}`);
    const { novel, chapters } = await liveSource.getDetails(stored.config, detailsUrl);
    await novelRepo.upsert(novel);
    for (const chapter of chapters) {
      await chapterRepo.upsertMeta(chapter);
    }
    return { novel, chapters };
  },

  /**
   * Resolve a chapter body. Live chapters (sourceUrl set) fetch via the adapter
   * for the novel's source; mock chapters read from the bundled catalogue.
   */
  async getChapterBody(
    chapter: Pick<Chapter, "novelId" | "chapterId" | "sourceUrl">
  ): Promise<string | null> {
    if (chapter.sourceUrl) {
      const novel = await novelRepo.getById(chapter.novelId);
      const stored = novel?.sourceId ? await sourceRepo.get(novel.sourceId) : null;
      if (!stored) {
        throw new Error(`Source unavailable for live chapter ${chapter.novelId}`);
      }
      return liveSource.getChapterBody(stored.config, chapter.sourceUrl);
    }
    return mockSource.getChapter(chapter.novelId, chapter.chapterId)?.body ?? null;
  },
};

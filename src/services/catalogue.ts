import { mockSource, type SearchOptions } from "@/data/mockSource";
import type { Chapter, Novel } from "@/data/types";

export type { SearchOptions, SortKey, SearchFilters } from "@/data/mockSource";

export const catalogue = {
  search(options: SearchOptions): Novel[] {
    return mockSource.search(options);
  },

  getNovel(id: string): Novel | null {
    return mockSource.getNovel(id);
  },

  listChapters(novelId: string): Chapter[] {
    return mockSource.listChapters(novelId);
  },

  getChapter(novelId: string, chapterId: string): Chapter | null {
    return mockSource.getChapter(novelId, chapterId);
  },

  availableGenres(): string[] {
    return mockSource.availableGenres();
  },

  availableLanguages(): string[] {
    return mockSource.availableLanguages();
  },

  availableSources(): string[] {
    return mockSource.availableSources();
  },
};


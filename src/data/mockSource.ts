import novelsJson from "./mock/novels.json";
import chaptersJson from "./mock/chapters.json";
import type { Chapter, Novel } from "./types";

const NOVELS = novelsJson as Novel[];
const CHAPTERS = chaptersJson as Chapter[];

export type SortKey = "relevance" | "popularity" | "updated" | "alpha";

export interface SearchFilters {
  language?: string;
  source?: string;
  genre?: string;
}

export interface SearchOptions {
  query?: string;
  filters?: SearchFilters;
  sort?: SortKey;
}

function scoreNovel(n: Novel, q: string): number {
  if (!q) return 0;
  const needle = q.toLowerCase();
  let score = 0;
  if (n.title.toLowerCase().includes(needle)) score += 10;
  if ((n.author ?? "").toLowerCase().includes(needle)) score += 5;
  if ((n.description ?? "").toLowerCase().includes(needle)) score += 2;
  for (const t of n.tags) {
    if (t.toLowerCase().includes(needle)) score += 3;
  }
  return score;
}

export const mockSource = {
  allNovels(): Novel[] {
    return [...NOVELS];
  },

  getNovel(id: string): Novel | null {
    return NOVELS.find((n) => n.id === id) ?? null;
  },

  listChapters(novelId: string): Chapter[] {
    return CHAPTERS.filter((c) => c.novelId === novelId).sort((a, b) => a.idx - b.idx);
  },

  getChapter(novelId: string, chapterId: string): Chapter | null {
    return (
      CHAPTERS.find((c) => c.novelId === novelId && c.chapterId === chapterId) ?? null
    );
  },

  search({ query = "", filters = {}, sort = "relevance" }: SearchOptions): Novel[] {
    let pool = [...NOVELS];

    if (filters.language) pool = pool.filter((n) => n.language === filters.language);
    if (filters.source) pool = pool.filter((n) => n.source === filters.source);
    if (filters.genre) {
      const g = filters.genre.toLowerCase();
      pool = pool.filter((n) => n.tags.some((t) => t.toLowerCase() === g));
    }

    if (query) {
      pool = pool
        .map((n) => ({ n, score: scoreNovel(n, query) }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((x) => x.n);
    }

    switch (sort) {
      case "alpha":
        pool.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "popularity":
      case "updated":
        // Phase 1 mock has no popularity/update timestamps; fall through to insertion order.
        break;
      case "relevance":
      default:
        break;
    }

    return pool;
  },

  availableGenres(): string[] {
    const set = new Set<string>();
    for (const n of NOVELS) for (const t of n.tags) set.add(t);
    return Array.from(set).sort();
  },

  availableLanguages(): string[] {
    return Array.from(new Set(NOVELS.map((n) => n.language ?? ""))).filter(Boolean);
  },

  availableSources(): string[] {
    return Array.from(new Set(NOVELS.map((n) => n.source ?? ""))).filter(Boolean);
  },
};

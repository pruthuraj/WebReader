export interface Novel {
  id: string;
  title: string;
  author?: string | null;
  source?: string | null;
  language?: string | null;
  description?: string | null;
  tags: string[];
  coverHint?: string | null;
  cachedAt?: number;
  // Live-source identity. Null/undefined = legacy or mock novel.
  sourceId?: string | null;
}

export interface Chapter {
  novelId: string;
  chapterId: string;
  idx: number;
  title: string;
  body?: string | null;
  downloadedAt?: number | null;
  // Absolute/relative URL the live adapter fetches to materialize `body`.
  // Null for mock chapters (body comes from the mock catalogue).
  sourceUrl?: string | null;
}

export type ChapterMeta = Omit<Chapter, "body">;

export interface ProgressEntry {
  novelId: string;
  chapterId: string;
  scrollOffset: number;
  percent: number;
  updatedAt: number;
}

export type DownloadStatus = "queued" | "downloading" | "done" | "failed";

export interface DownloadQueueItem {
  novelId: string;
  chapterId: string;
  status: DownloadStatus;
  error?: string | null;
  enqueuedAt: number;
  updatedAt: number;
}

export type EventType =
  | "search"
  | "novel_open"
  | "chapter_open"
  | "chapter_read"
  | "tts_start"
  | "tts_stop"
  | "session";

export interface AnalyticsEvent {
  id?: number;
  type: EventType;
  payload?: Record<string, unknown> | null;
  durationMs?: number | null;
  novelId?: string | null;
  chapterId?: string | null;
  createdAt: number;
}

export interface PronunciationRule {
  id: number;
  pattern: string;
  isRegex: boolean;
  replacement: string;
  language: string | null;
  caseSensitive: boolean;
  enabled: boolean;
  category: string | null;
  updatedAt: number;
}

export type NewPronunciationRule = Omit<PronunciationRule, "id" | "updatedAt"> & {
  id?: number;
};

export interface Bookmark {
  id: number;
  novelId: string;
  chapterId: string;
  scrollOffset: number;
  percent: number;
  note: string | null;
  createdAt: number;
}

export type NewBookmark = Omit<Bookmark, "id" | "createdAt">;

export interface Shelf {
  id: number;
  name: string;
  createdAt: number;
}

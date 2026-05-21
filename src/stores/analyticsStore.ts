import { create } from "zustand";
import { eventRepo } from "@/db/repositories/eventRepo";
import type { AnalyticsEvent, EventType } from "@/data/types";

export interface AnalyticsState {
  recordEvent: (
    type: EventType,
    extra?: Partial<Omit<AnalyticsEvent, "id" | "createdAt" | "type">>
  ) => Promise<void>;
  recordSearch: (query: string, extra?: Record<string, unknown>) => Promise<void>;
  recordNovelOpen: (novelId: string) => Promise<void>;
  recordChapterOpen: (novelId: string, chapterId: string) => Promise<void>;
  recordChapterRead: (
    novelId: string,
    chapterId: string,
    durationMs: number,
    percent: number
  ) => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>(() => ({
  recordEvent: async (type, extra) => {
    await eventRepo.record({
      type,
      payload: extra?.payload ?? null,
      durationMs: extra?.durationMs ?? null,
      novelId: extra?.novelId ?? null,
      chapterId: extra?.chapterId ?? null,
    });
  },
  recordSearch: async (query, extra) => {
    await eventRepo.record({
      type: "search",
      payload: { query, ...(extra ?? {}) },
    });
  },
  recordNovelOpen: async (novelId) => {
    await eventRepo.record({ type: "novel_open", novelId });
  },
  recordChapterOpen: async (novelId, chapterId) => {
    await eventRepo.record({ type: "chapter_open", novelId, chapterId });
  },
  recordChapterRead: async (novelId, chapterId, durationMs, percent) => {
    await eventRepo.record({
      type: "chapter_read",
      novelId,
      chapterId,
      durationMs,
      payload: { percent },
    });
  },
}));

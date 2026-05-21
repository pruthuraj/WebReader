import { create } from "zustand";
import { eventRepo } from "@/db/repositories/eventRepo";
import type { AnalyticsEvent, EventType } from "@/data/types";

export interface AnalyticsState {
  recordEvent: (
    type: EventType,
    extra?: Partial<Omit<AnalyticsEvent, "id" | "createdAt" | "type">>
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
}));

import { chapterRepo } from "@/db/repositories/chapterRepo";
import { catalogue } from "./catalogue";
import { useAnalyticsStore } from "@/stores/analyticsStore";
import type { Chapter } from "@/data/types";

export async function loadChapterBody(
  novelId: string,
  chapterId: string
): Promise<Chapter | null> {
  const cached = await chapterRepo.getOne(novelId, chapterId);
  if (!cached) return null;

  if (cached.body) {
    await useAnalyticsStore.getState().recordChapterOpen(novelId, chapterId);
    return cached;
  }

  // Body not yet materialized. Resolve it through the facade, which branches on
  // the cached chapter's sourceUrl (live adapter fetch vs. mock catalogue).
  const body = await catalogue.getChapterBody(cached);
  if (!body) return cached;

  await chapterRepo.setBody(novelId, chapterId, body);
  await useAnalyticsStore.getState().recordChapterOpen(novelId, chapterId);

  return {
    ...cached,
    body,
    downloadedAt: Date.now(),
  };
}


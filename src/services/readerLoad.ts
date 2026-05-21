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

  const source = catalogue.getChapter(novelId, chapterId);
  if (!source?.body) return cached;

  await chapterRepo.setBody(novelId, chapterId, source.body);
  await useAnalyticsStore.getState().recordChapterOpen(novelId, chapterId);

  return {
    ...cached,
    body: source.body,
    downloadedAt: Date.now(),
  };
}


import { mockSource } from "@/data/mockSource";
import { novelRepo } from "./repositories/novelRepo";
import { chapterRepo } from "./repositories/chapterRepo";

export async function seedIfEmpty(): Promise<{ seeded: boolean; novels: number; chapters: number }> {
  const existing = await novelRepo.count();
  if (existing > 0) {
    return { seeded: false, novels: existing, chapters: 0 };
  }

  const novels = mockSource.allNovels();
  let chapterCount = 0;
  for (const n of novels) {
    await novelRepo.upsert({ ...n, cachedAt: Date.now() });
    const chapters = mockSource.listChapters(n.id);
    for (const c of chapters) {
      await chapterRepo.upsertMeta({
        novelId: c.novelId,
        chapterId: c.chapterId,
        idx: c.idx,
        title: c.title,
      });
      chapterCount++;
    }
  }
  return { seeded: true, novels: novels.length, chapters: chapterCount };
}

import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { chapterRepo } from "@/db/repositories/chapterRepo";
import { eventRepo } from "@/db/repositories/eventRepo";
import { novelRepo } from "@/db/repositories/novelRepo";
import { progressRepo } from "@/db/repositories/progressRepo";
import type { Novel, ProgressEntry } from "@/data/types";

export interface ContinueReadingItem {
  novel: Novel;
  progress: ProgressEntry;
}

export interface CountedNovelItem {
  novel: Novel;
  count: number;
}

interface HomeRowsState {
  continueReading: ContinueReadingItem[];
  recentlyOpened: CountedNovelItem[];
  popular: CountedNovelItem[];
  downloaded: CountedNovelItem[];
  loading: boolean;
}

async function resolveNovel(id: string) {
  return novelRepo.getById(id);
}

export function useHomeRows() {
  const [state, setState] = useState<HomeRowsState>({
    continueReading: [],
    recentlyOpened: [],
    popular: [],
    downloaded: [],
    loading: true,
  });

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));

    const [progressRows, recentRows, popularRows, downloadedRows] = await Promise.all([
      progressRepo.recent(20),
      eventRepo.recentDistinctNovelIds("novel_open", 10),
      eventRepo.topNovels("novel_open", 5),
      chapterRepo.downloadedNovelCounts(10),
    ]);

    const seenProgress = new Set<string>();
    const continueReading: ContinueReadingItem[] = [];
    for (const progress of progressRows) {
      if (seenProgress.has(progress.novelId)) continue;
      seenProgress.add(progress.novelId);
      const novel = await resolveNovel(progress.novelId);
      if (novel) continueReading.push({ novel, progress });
      if (continueReading.length >= 10) break;
    }

    const recentlyOpened = (
      await Promise.all(
        recentRows.map(async (row) => {
          const novel = await resolveNovel(row.novelId);
          return novel ? { novel, count: 1 } : null;
        })
      )
    ).filter((row): row is CountedNovelItem => Boolean(row));

    const popular = (
      await Promise.all(
        popularRows.map(async (row) => {
          const novel = await resolveNovel(row.novelId);
          return novel ? { novel, count: row.count } : null;
        })
      )
    ).filter((row): row is CountedNovelItem => Boolean(row));

    const downloaded = (
      await Promise.all(
        downloadedRows.map(async (row) => {
          const novel = await resolveNovel(row.novelId);
          return novel ? { novel, count: row.count } : null;
        })
      )
    ).filter((row): row is CountedNovelItem => Boolean(row));

    setState({ continueReading, recentlyOpened, popular, downloaded, loading: false });
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  return { ...state, refresh };
}


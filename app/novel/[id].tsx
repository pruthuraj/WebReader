import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, Text, View } from "react-native";
import { ChapterListItem } from "@/components/novel/ChapterListItem";
import { DescriptionBlock } from "@/components/novel/DescriptionBlock";
import { NovelHeader } from "@/components/novel/NovelHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import type { ChapterMeta, Novel, ProgressEntry } from "@/data/types";
import { chapterRepo } from "@/db/repositories/chapterRepo";
import { novelRepo } from "@/db/repositories/novelRepo";
import { progressRepo } from "@/db/repositories/progressRepo";
import { useAnalyticsStore } from "@/stores/analyticsStore";
import { useDownloadStore } from "@/stores/downloadStore";
import { key } from "@/utils/id";
import { percentLabel } from "@/utils/format";

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default function NovelDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const id = firstParam(params.id);
  const recordNovelOpen = useAnalyticsStore((s) => s.recordNovelOpen);
  const enqueue = useDownloadStore((s) => s.enqueue);
  const refreshQueue = useDownloadStore((s) => s.refresh);
  const queue = useDownloadStore((s) => s.queue);

  const [novel, setNovel] = useState<Novel | null>(null);
  const [chapters, setChapters] = useState<ChapterMeta[]>([]);
  const [lastProgress, setLastProgress] = useState<ProgressEntry | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const [nextNovel, nextChapters, nextProgress] = await Promise.all([
      novelRepo.getById(id),
      chapterRepo.listByNovel(id),
      progressRepo.lastForNovel(id),
      refreshQueue(),
    ]);
    setNovel(nextNovel);
    setChapters(nextChapters);
    setLastProgress(nextProgress);
    setLoading(false);
  }, [id, refreshQueue]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (id) void recordNovelOpen(id);
  }, [id, recordNovelOpen]);

  const inProgressChapterIds = useMemo(() => {
    return new Set(lastProgress ? [lastProgress.chapterId] : []);
  }, [lastProgress]);

  const openChapter = (chapterId: string) => {
    if (!id) return;
    router.push({ pathname: "/reader/[novelId]/[chapterId]", params: { novelId: id, chapterId } });
  };

  const openContinueOrFirst = () => {
    const target = lastProgress?.chapterId ?? chapters[0]?.chapterId;
    if (target) openChapter(target);
  };

  const enqueueAll = async () => {
    if (!id || !chapters.length) return;
    await enqueue(chapters.map((chapter) => ({ novelId: id, chapterId: chapter.chapterId })));
    Alert.alert("Queued", "Chapters are queued. Phase C will add the download worker.");
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950">
        <ActivityIndicator />
        <Text className="mt-3 text-xs text-slate-500 dark:text-slate-400">Loading novel</Text>
      </View>
    );
  }

  if (!novel || !id) {
    return (
      <View className="flex-1 bg-slate-50 p-4 dark:bg-slate-950">
        <EmptyState
          icon="alert-circle"
          title="Novel not found"
          subtitle="The catalogue could not resolve this novel."
        />
      </View>
    );
  }

  return (
    <FlatList
      className="flex-1 bg-slate-50 dark:bg-slate-950"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      data={chapters}
      keyExtractor={(item) => item.chapterId}
      ListHeaderComponent={
        <>
          <NovelHeader novel={novel} onRead={openContinueOrFirst} onDownloadAll={enqueueAll} />
          <DescriptionBlock text={novel.description} />
          {lastProgress ? (
            <Pressable
              onPress={() => openChapter(lastProgress.chapterId)}
              className="mb-5 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 active:opacity-80 dark:border-indigo-900 dark:bg-indigo-950"
            >
              <Text className="text-xs font-black uppercase text-indigo-500 dark:text-indigo-300">
                Continue
              </Text>
              <Text className="mt-1 text-sm font-bold text-indigo-900 dark:text-indigo-100">
                Chapter saved at {percentLabel(lastProgress.percent)}
              </Text>
            </Pressable>
          ) : null}
          <Text className="mb-3 text-lg font-black text-slate-900 dark:text-slate-50">
            Chapters
          </Text>
        </>
      }
      renderItem={({ item }) => (
        <ChapterListItem
          chapter={item}
          isInProgress={inProgressChapterIds.has(item.chapterId)}
          isQueued={Boolean(queue[key(id, item.chapterId)])}
          onPress={() => openChapter(item.chapterId)}
        />
      )}
      ListEmptyComponent={
        <EmptyState
          icon="list"
          title="No chapters"
          subtitle="The local catalogue has no chapters for this novel."
        />
      }
    />
  );
}


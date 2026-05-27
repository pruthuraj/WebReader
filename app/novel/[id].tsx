import { Feather } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, Text, View } from "react-native";
import { ScreenHeader } from "@/components/ui/headers";
import { useAppPalette } from "@/theme/useAppPalette";
import { AddToShelfSheet } from "@/components/novel/AddToShelfSheet";
import { ChapterListItem } from "@/components/novel/ChapterListItem";
import { DescriptionBlock } from "@/components/novel/DescriptionBlock";
import { NovelHeader } from "@/components/novel/NovelHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import type { Bookmark, ChapterMeta, Novel, ProgressEntry } from "@/data/types";
import { bookmarkRepo } from "@/db/repositories/bookmarkRepo";
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
  const palette = useAppPalette();
  const params = useLocalSearchParams<{ id: string }>();
  const id = firstParam(params.id);
  const recordNovelOpen = useAnalyticsStore((s) => s.recordNovelOpen);
  const enqueue = useDownloadStore((s) => s.enqueue);
  const refreshQueue = useDownloadStore((s) => s.refresh);
  const queue = useDownloadStore((s) => s.queue);

  const [novel, setNovel] = useState<Novel | null>(null);
  const [chapters, setChapters] = useState<ChapterMeta[]>([]);
  const [lastProgress, setLastProgress] = useState<ProgressEntry | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [shelfOpen, setShelfOpen] = useState(false);

  const refresh = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const [nextNovel, nextChapters, nextProgress, nextBookmarks] = await Promise.all([
      novelRepo.getById(id),
      chapterRepo.listByNovel(id),
      progressRepo.lastForNovel(id),
      bookmarkRepo.listByNovel(id),
      refreshQueue(),
    ]);
    setNovel(nextNovel);
    setChapters(nextChapters);
    setLastProgress(nextProgress);
    setBookmarks(nextBookmarks);
    setLoading(false);
  }, [id, refreshQueue]);

  const chapterTitleById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of chapters) map.set(c.chapterId, c.title);
    return map;
  }, [chapters]);

  const openBookmark = (b: Bookmark) => {
    router.push({
      pathname: "/reader/[novelId]/[chapterId]",
      params: { novelId: b.novelId, chapterId: b.chapterId, offset: String(b.scrollOffset) },
    });
  };

  const removeBookmark = async (bookmarkId: number) => {
    await bookmarkRepo.remove(bookmarkId);
    setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
  };

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
    Alert.alert("Queued", "Chapters are queued and the download worker will process them.");
  };

  const enqueueOne = async (chapterId: string) => {
    if (!id) return;
    await enqueue([{ novelId: id, chapterId }]);
    Alert.alert("Queued", "Chapter added to the download queue.");
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-app-bg">
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={palette.accent} />
        <Text className="mt-3 text-xs text-app-text-muted">Loading novel</Text>
      </View>
    );
  }

  if (!novel || !id) {
    return (
      <View className="flex-1 bg-app-bg">
        <Stack.Screen options={{ headerShown: false }} />
        <ScreenHeader />
        <View className="p-4">
          <EmptyState
            icon="alert-circle"
            title="Novel not found"
            subtitle="The catalogue could not resolve this novel."
          />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-app-bg">
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader />
      <FlatList
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 }}
        data={chapters}
        keyExtractor={(item) => item.chapterId}
        ListHeaderComponent={
          <>
            <NovelHeader
              novel={novel}
              onRead={openContinueOrFirst}
              onDownloadAll={enqueueAll}
              onAddToShelf={() => setShelfOpen(true)}
            />
            <DescriptionBlock text={novel.description} />
            {lastProgress ? (
              <Pressable
                onPress={() => openChapter(lastProgress.chapterId)}
                className="mb-5 rounded-2xl border border-app-border bg-app-accent-dim p-4 active:opacity-80"
              >
                <Text className="text-xs font-bold uppercase tracking-wide text-app-accent">
                  Continue
                </Text>
                <Text className="mt-1 text-sm font-semibold text-app-text">
                  Chapter saved at {percentLabel(lastProgress.percent)}
                </Text>
              </Pressable>
            ) : null}
            {bookmarks.length ? (
              <View className="mb-5">
                <Text className="mb-2 text-[17px] font-bold text-app-text">Bookmarks</Text>
                {bookmarks.map((b) => (
                  <View
                    key={b.id}
                    className="mb-2 flex-row items-center rounded-2xl border border-app-border bg-app-surface p-3"
                  >
                    <Pressable className="flex-1 active:opacity-70" onPress={() => openBookmark(b)}>
                      <Text className="text-sm font-semibold text-app-text" numberOfLines={1}>
                        {chapterTitleById.get(b.chapterId) ?? "Chapter"}
                      </Text>
                      <Text className="mt-0.5 text-xs text-app-text-muted">
                        Saved at {percentLabel(b.percent)}
                        {b.note ? ` · ${b.note}` : ""}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => void removeBookmark(b.id)}
                      accessibilityRole="button"
                      accessibilityLabel="Remove bookmark"
                      className="ml-3 h-9 w-9 items-center justify-center rounded-full bg-app-surface-2 active:opacity-70"
                    >
                      <Feather name="trash-2" size={16} color={palette.danger} />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null}
            <Text className="mb-1 text-[17px] font-bold text-app-text">Chapters</Text>
          </>
        }
        renderItem={({ item }) => (
          <ChapterListItem
            chapter={item}
            isInProgress={inProgressChapterIds.has(item.chapterId)}
            isQueued={Boolean(queue[key(id, item.chapterId)])}
            onPress={() => openChapter(item.chapterId)}
            onQueue={() => enqueueOne(item.chapterId)}
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
      <AddToShelfSheet visible={shelfOpen} novelId={id} onClose={() => setShelfOpen(false)} />
    </View>
  );
}

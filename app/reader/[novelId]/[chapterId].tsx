import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  InteractionManager,
  ScrollView,
  Text,
  View,
} from "react-native";
import { ChapterHeader } from "@/components/reader/ChapterHeader";
import { ChapterNavigation } from "@/components/reader/ChapterNavigation";
import { ReaderContent } from "@/components/reader/ReaderContent";
import { EmptyState } from "@/components/shared/EmptyState";
import type { Chapter, ChapterMeta, Novel } from "@/data/types";
import { chapterRepo } from "@/db/repositories/chapterRepo";
import { novelRepo } from "@/db/repositories/novelRepo";
import { progressRepo } from "@/db/repositories/progressRepo";
import { useProgressAutoSave } from "@/hooks/useProgressAutoSave";
import { loadChapterBody } from "@/services/readerLoad";
import { useAnalyticsStore } from "@/stores/analyticsStore";
import { useReaderStore } from "@/stores/readerStore";
import { readerPalettes } from "@/theme/readerThemes";

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default function ReaderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ novelId: string; chapterId: string }>();
  const novelId = firstParam(params.novelId) ?? "";
  const chapterId = firstParam(params.chapterId) ?? "";
  const appearance = useReaderStore((s) => s.appearance);
  const setCurrent = useReaderStore((s) => s.setCurrent);
  const recordChapterRead = useAnalyticsStore((s) => s.recordChapterRead);

  const scrollRef = useRef<ScrollView>(null);
  const mountedAt = useRef(Date.now());
  const restored = useRef(false);
  const savedPercentRef = useRef(0);

  const [novel, setNovel] = useState<Novel | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [allChapters, setAllChapters] = useState<ChapterMeta[]>([]);
  const [neighbors, setNeighbors] = useState<{ prev: ChapterMeta | null; next: ChapterMeta | null }>({
    prev: null,
    next: null,
  });
  const [initialOffset, setInitialOffset] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [loading, setLoading] = useState(true);

  const { onScroll, lastSavedPercent } = useProgressAutoSave({
    novelId,
    chapterId,
    contentHeight,
  });

  useEffect(() => {
    savedPercentRef.current = lastSavedPercent;
  }, [lastSavedPercent]);

  useEffect(() => {
    setCurrent(novelId, chapterId);
    mountedAt.current = Date.now();
    return () => {
      setCurrent(null, null);
      const percent = savedPercentRef.current;
      if (percent >= 0.8) {
        void recordChapterRead(novelId, chapterId, Date.now() - mountedAt.current, percent);
      }
    };
  }, [chapterId, novelId, recordChapterRead, setCurrent]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      restored.current = false;
      const [nextNovel, nextChapter, nextChapters, nextProgress] = await Promise.all([
        novelRepo.getById(novelId),
        loadChapterBody(novelId, chapterId),
        chapterRepo.listByNovel(novelId),
        progressRepo.get(novelId, chapterId),
      ]);

      if (cancelled) return;
      setNovel(nextNovel);
      setChapter(nextChapter);
      setAllChapters(nextChapters);
      setInitialOffset(nextProgress?.scrollOffset ?? 0);
      if (nextChapter) {
        setNeighbors(await chapterRepo.neighbors(novelId, nextChapter.idx));
      }
      setLoading(false);
    }

    if (novelId && chapterId) void load();
    return () => {
      cancelled = true;
    };
  }, [chapterId, novelId]);

  useEffect(() => {
    if (restored.current || !initialOffset || !contentHeight || loading) return;
    restored.current = true;
    const task = InteractionManager.runAfterInteractions(() => {
      scrollRef.current?.scrollTo({ y: initialOffset, animated: false });
    });
    return () => task.cancel();
  }, [contentHeight, initialOffset, loading]);

  const openChapter = (target: ChapterMeta | null) => {
    if (!target) return;
    router.replace({
      pathname: "/reader/[novelId]/[chapterId]",
      params: { novelId: target.novelId, chapterId: target.chapterId },
    });
  };

  const palette = readerPalettes[appearance.theme];

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-reader-bg">
        <ActivityIndicator />
        <Text className="mt-3 text-xs text-reader-muted">Loading chapter</Text>
      </View>
    );
  }

  if (!chapter?.body || !novel) {
    return (
      <View className="flex-1 bg-reader-bg p-4">
        <EmptyState
          icon="alert-circle"
          title="Couldn't load this chapter"
          subtitle="The mock catalogue did not return a chapter body."
        />
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollRef}
      className="flex-1"
      style={{ backgroundColor: palette.bg }}
      contentContainerStyle={{
        paddingHorizontal: appearance.margin,
        paddingTop: 24,
        paddingBottom: 36,
      }}
      scrollEventThrottle={80}
      onScroll={onScroll}
      onContentSizeChange={(_, height) => setContentHeight(height)}
    >
      <ChapterHeader
        novelTitle={novel.title}
        chapterTitle={chapter.title}
        idx={chapter.idx}
        total={allChapters.length}
      />
      <ReaderContent text={chapter.body} appearance={appearance} />
      <ChapterNavigation
        prev={neighbors.prev}
        next={neighbors.next}
        onPrev={() => openChapter(neighbors.prev)}
        onNext={() => openChapter(neighbors.next)}
      />
    </ScrollView>
  );
}


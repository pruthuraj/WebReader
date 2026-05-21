import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  InteractionManager,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { ChapterHeader } from "@/components/reader/ChapterHeader";
import { ChapterNavigation } from "@/components/reader/ChapterNavigation";
import { ReaderContent } from "@/components/reader/ReaderContent";
import { ReaderOptionsSheet } from "@/components/reader/ReaderOptionsSheet";
import { ReaderPlaybackBar } from "@/components/reader/ReaderPlaybackBar";
import { ReaderProgress } from "@/components/reader/ReaderProgress";
import { ReaderSettingsSheet } from "@/components/reader/ReaderSettingsSheet";
import { TTSSettingsSheet } from "@/components/reader/TTSSettingsSheet";
import { EmptyState } from "@/components/shared/EmptyState";
import type { Chapter, ChapterMeta, Novel } from "@/data/types";
import { chapterRepo } from "@/db/repositories/chapterRepo";
import { novelRepo } from "@/db/repositories/novelRepo";
import { progressRepo } from "@/db/repositories/progressRepo";
import { useProgressAutoSave } from "@/hooks/useProgressAutoSave";
import { loadChapterBody } from "@/services/readerLoad";
import { useAnalyticsStore } from "@/stores/analyticsStore";
import { useReaderStore } from "@/stores/readerStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useTtsStore } from "@/stores/ttsStore";
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
  const highlightedSentenceIdx = useTtsStore((s) => s.highlightSentenceIdx);
  const ttsStatus = useTtsStore((s) => s.status);
  const playFromSentence = useTtsStore((s) => s.playFromSentence);
  const recordChapterRead = useAnalyticsStore((s) => s.recordChapterRead);
  const autoStartOnOpen = useSettingsStore((s) => s.settings.ttsDefaults.autoStartOnOpen);
  const highlightMode = useSettingsStore((s) => s.settings.ttsDefaults.highlightMode);

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
  const [readerSheetOpen, setReaderSheetOpen] = useState(false);
  const [ttsSheetOpen, setTtsSheetOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);

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

  useEffect(() => {
    if (loading || !autoStartOnOpen || !chapter?.body) return;
    if (ttsStatus !== "idle") return;
    void playFromSentence(chapter.body, 0, { novelId, chapterId });
    // Only auto-start once per chapter load; we depend on chapterId so the
    // effect re-runs cleanly when navigating chapters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId, loading, autoStartOnOpen]);

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
    <View className="flex-1" style={{ backgroundColor: palette.bg }}>
      <ReaderProgress percent={lastSavedPercent} />
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        style={{ backgroundColor: palette.bg }}
        contentContainerStyle={{
          paddingHorizontal: appearance.margin,
          paddingTop: 42,
          paddingBottom: 144,
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
        <Animated.View
          key={chapter.chapterId}
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(120)}
        >
          <ReaderContent
            text={chapter.body}
            appearance={appearance}
            highlightedSentenceIdx={highlightedSentenceIdx}
            highlightMode={highlightMode}
            onSentenceDoubleTap={(sentenceIndex) =>
              void playFromSentence(chapter.body ?? "", sentenceIndex, {
                novelId,
                chapterId,
              })
            }
          />
        </Animated.View>
        <ChapterNavigation
          prev={neighbors.prev}
          next={neighbors.next}
          onPrev={() => openChapter(neighbors.prev)}
          onNext={() => openChapter(neighbors.next)}
        />
      </ScrollView>

      <ReaderPlaybackBar
        text={chapter.body}
        novelId={novelId}
        chapterId={chapterId}
        prev={neighbors.prev}
        next={neighbors.next}
        onPrevChapter={() => openChapter(neighbors.prev)}
        onNextChapter={() => openChapter(neighbors.next)}
      />

      <ReaderSettingsSheet visible={readerSheetOpen} onClose={() => setReaderSheetOpen(false)} />
      <TTSSettingsSheet visible={ttsSheetOpen} onClose={() => setTtsSheetOpen(false)} />
      <ReaderOptionsSheet
        visible={optionsOpen}
        novelId={novelId}
        onClose={() => setOptionsOpen(false)}
        onOpenAppearance={() => setReaderSheetOpen(true)}
        onOpenTtsSettings={() => setTtsSheetOpen(true)}
      />

      <Stack.Screen
        options={{
          headerTitle: () => (
            <Text className="text-base font-black text-slate-50">
              Chapter {chapter.idx} of {allChapters.length}
            </Text>
          ),
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reader options"
              onPress={() => setOptionsOpen(true)}
              className="h-9 w-9 items-center justify-center rounded-full bg-white/10 active:opacity-75 mr-1"
            >
              <Feather name="more-vertical" size={18} color="#F8FAFC" />
            </Pressable>
          ),
        }}
      />
    </View>
  );
}

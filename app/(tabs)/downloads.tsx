import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { AppHeader, SectionHeader } from "@/components/ui/headers";
import { DownloadRow } from "@/components/downloads/DownloadRow";
import { QueueSummary } from "@/components/downloads/QueueSummary";
import { EmptyState } from "@/components/shared/EmptyState";
import type { DownloadQueueItem, DownloadStatus } from "@/data/types";
import { chapterRepo } from "@/db/repositories/chapterRepo";
import { novelRepo } from "@/db/repositories/novelRepo";
import { downloader } from "@/services/downloader";
import { useDownloadStore } from "@/stores/downloadStore";
import { useAppPalette } from "@/theme/useAppPalette";
import { key } from "@/utils/id";

interface RowTitle {
  novelTitle: string;
  chapterTitle: string;
}

const sectionOrder: DownloadStatus[] = ["downloading", "queued", "failed", "done"];
const sectionLabels: Record<DownloadStatus, string> = {
  downloading: "Downloading",
  queued: "Queued",
  failed: "Failed",
  done: "Downloaded",
};

type FilterTab = "all" | "done" | "queued" | "failed";
const filterTabs: { id: FilterTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "done", label: "Downloaded" },
  { id: "queued", label: "Queued" },
  { id: "failed", label: "Failed" },
];

function inFilter(status: DownloadStatus, tab: FilterTab): boolean {
  if (tab === "all") return true;
  if (tab === "queued") return status === "queued" || status === "downloading";
  return status === tab;
}

export default function DownloadsScreen() {
  const router = useRouter();
  const palette = useAppPalette();
  const queue = useDownloadStore((s) => s.queue);
  const refresh = useDownloadStore((s) => s.refresh);
  const retry = useDownloadStore((s) => s.retry);
  const remove = useDownloadStore((s) => s.remove);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<FilterTab>("all");
  const [titles, setTitles] = useState<Record<string, RowTitle>>({});

  const items = useMemo(() => Object.values(queue), [queue]);
  const active = items.some((item) => item.status === "queued" || item.status === "downloading");

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => void refresh(), 1000);
    return () => clearInterval(timer);
  }, [active, refresh]);

  useEffect(() => {
    let cancelled = false;
    async function loadTitles() {
      const next: Record<string, RowTitle> = {};
      for (const item of items) {
        const [novel, chapter] = await Promise.all([
          novelRepo.getById(item.novelId),
          chapterRepo.getOne(item.novelId, item.chapterId),
        ]);
        next[key(item.novelId, item.chapterId)] = {
          novelTitle: novel?.title ?? item.novelId,
          chapterTitle: chapter?.title ?? item.chapterId,
        };
      }
      if (!cancelled) setTitles(next);
    }
    void loadTitles();
    return () => {
      cancelled = true;
    };
  }, [items]);

  const onRefresh = async () => {
    setRefreshing(true);
    downloader.poke();
    await refresh();
    setRefreshing(false);
  };

  const retryAllFailed = async () => {
    for (const item of items.filter((entry) => entry.status === "failed")) {
      await retry(item.novelId, item.chapterId);
    }
    downloader.poke();
  };

  const grouped = sectionOrder
    .filter((status) => inFilter(status, tab))
    .map((status) => ({ status, data: items.filter((item) => item.status === status) }));

  return (
    <ScrollView
      className="flex-1 bg-app-bg"
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.textMuted} />
      }
    >
      <AppHeader title="Downloads" />

      <View className="mt-2 flex-row border-b border-app-border px-5" style={{ gap: 20 }}>
        {filterTabs.map((t) => {
          const on = t.id === tab;
          return (
            <Pressable
              key={t.id}
              onPress={() => setTab(t.id)}
              style={{
                paddingVertical: 10,
                borderBottomWidth: 2,
                borderBottomColor: on ? palette.accent : "transparent",
              }}
            >
              <Text
                className={`text-[13.5px] ${on ? "font-bold text-app-text" : "font-medium text-app-text-muted"}`}
              >
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="mt-4">
        <QueueSummary items={items} onRetryFailed={retryAllFailed} />
      </View>

      {items.length ? (
        grouped.map((section) =>
          section.data.length ? (
            <View key={section.status}>
              <SectionHeader title={`${sectionLabels[section.status]} (${section.data.length})`} />
              <View className="px-5">
                {section.data.map((item: DownloadQueueItem) => {
                  const rowKey = key(item.novelId, item.chapterId);
                  const title = titles[rowKey] ?? {
                    novelTitle: item.novelId,
                    chapterTitle: item.chapterId,
                  };
                  return (
                    <DownloadRow
                      key={rowKey}
                      item={item}
                      novelTitle={title.novelTitle}
                      chapterTitle={title.chapterTitle}
                      onRetry={() => {
                        void retry(item.novelId, item.chapterId).then(() => downloader.poke());
                      }}
                      onRemove={() => void remove(item.novelId, item.chapterId)}
                      onOpen={() =>
                        router.push({
                          pathname: "/reader/[novelId]/[chapterId]",
                          params: { novelId: item.novelId, chapterId: item.chapterId },
                        })
                      }
                    />
                  );
                })}
              </View>
            </View>
          ) : null
        )
      ) : (
        <View className="px-5 pt-6">
          <EmptyState
            icon="download"
            title="No queued downloads"
            subtitle="Use Queue on a novel or chapter to start the worker."
          />
        </View>
      )}
    </ScrollView>
  );
}

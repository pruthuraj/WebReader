import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { DownloadRow } from "@/components/downloads/DownloadRow";
import { QueueSummary } from "@/components/downloads/QueueSummary";
import { EmptyState } from "@/components/shared/EmptyState";
import type { DownloadQueueItem, DownloadStatus } from "@/data/types";
import { chapterRepo } from "@/db/repositories/chapterRepo";
import { novelRepo } from "@/db/repositories/novelRepo";
import { downloader } from "@/services/downloader";
import { useDownloadStore } from "@/stores/downloadStore";
import { key } from "@/utils/id";

interface RowTitle {
  novelTitle: string;
  chapterTitle: string;
}

const sectionOrder: DownloadStatus[] = ["downloading", "queued", "failed", "done"];

export default function DownloadsScreen() {
  const router = useRouter();
  const queue = useDownloadStore((s) => s.queue);
  const refresh = useDownloadStore((s) => s.refresh);
  const retry = useDownloadStore((s) => s.retry);
  const remove = useDownloadStore((s) => s.remove);
  const [refreshing, setRefreshing] = useState(false);
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

  const grouped = sectionOrder.map((status) => ({
    status,
    data: items.filter((item) => item.status === status),
  }));

  return (
    <ScrollView
      className="flex-1 bg-slate-50 dark:bg-slate-950"
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <QueueSummary items={items} onRetryFailed={retryAllFailed} />
      {items.length ? (
        grouped.map((section) =>
          section.data.length ? (
            <View key={section.status} className="mb-5">
              <Text className="mb-2 text-xs font-black uppercase text-slate-400">
                {section.status}
              </Text>
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
          ) : null
        )
      ) : (
        <EmptyState
          icon="download"
          title="No queued downloads"
          subtitle="Use Queue on a novel or chapter to start the worker."
        />
      )}
    </ScrollView>
  );
}

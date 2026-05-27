import { Pressable, Text, View } from "react-native";
import { useAppPalette } from "@/theme/useAppPalette";
import type { DownloadQueueItem, DownloadStatus } from "@/data/types";

interface QueueSummaryProps {
  items: DownloadQueueItem[];
  onRetryFailed: () => void;
}

const statuses: DownloadStatus[] = ["queued", "downloading", "done", "failed"];

export function QueueSummary({ items, onRetryFailed }: QueueSummaryProps) {
  const palette = useAppPalette();
  const counts = Object.fromEntries(statuses.map((status) => [status, 0])) as Record<
    DownloadStatus,
    number
  >;
  for (const item of items) counts[item.status] += 1;

  const cards: { label: string; value: number; color: string }[] = [
    { label: "Downloaded", value: counts.done, color: palette.success },
    { label: "Queued", value: counts.queued, color: palette.textDim },
    { label: "Downloading", value: counts.downloading, color: palette.accent },
    { label: "Failed", value: counts.failed, color: palette.danger },
  ];

  return (
    <View className="px-5 pt-2">
      <View className="flex-row" style={{ gap: 10 }}>
        {cards.map((c) => (
          <View
            key={c.label}
            className="flex-1 rounded-xl border border-app-border bg-app-surface px-2 py-3"
          >
            <Text style={{ color: c.color, fontSize: 22, fontWeight: "700", lineHeight: 24 }}>
              {c.value}
            </Text>
            <Text className="mt-1 text-[10.5px] font-medium text-app-text-muted">{c.label}</Text>
          </View>
        ))}
      </View>
      {counts.failed ? (
        <Pressable
          onPress={onRetryFailed}
          className="mt-3 rounded-full bg-app-surface-2 px-4 py-3 active:opacity-80"
        >
          <Text className="text-center text-xs font-bold text-app-danger">Retry all failed</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

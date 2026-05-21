import { Pressable, Text, View } from "react-native";
import type { DownloadQueueItem, DownloadStatus } from "@/data/types";

interface QueueSummaryProps {
  items: DownloadQueueItem[];
  onRetryFailed: () => void;
}

const statuses: DownloadStatus[] = ["queued", "downloading", "done", "failed"];

export function QueueSummary({ items, onRetryFailed }: QueueSummaryProps) {
  const counts = Object.fromEntries(statuses.map((status) => [status, 0])) as Record<
    DownloadStatus,
    number
  >;
  for (const item of items) counts[item.status] += 1;

  return (
    <View className="mb-4 rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <Text className="text-2xl font-black text-slate-950 dark:text-slate-50">Downloads</Text>
      <Text className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Real queue worker, local catalogue bodies, no network backend.
      </Text>
      <View className="mt-4 flex-row flex-wrap">
        {statuses.map((status) => (
          <View key={status} className="mr-2 mt-2 rounded-full bg-slate-100 px-3 py-2 dark:bg-slate-800">
            <Text className="text-xs font-black text-slate-700 dark:text-slate-200">
              {status}: {counts[status]}
            </Text>
          </View>
        ))}
      </View>
      {counts.failed ? (
        <Pressable
          onPress={onRetryFailed}
          className="mt-4 rounded-full bg-red-100 px-4 py-3 active:opacity-80 dark:bg-red-950"
        >
          <Text className="text-center text-xs font-black text-red-700 dark:text-red-300">
            Retry all failed
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}


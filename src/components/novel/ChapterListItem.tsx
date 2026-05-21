import { Pressable, Text, View } from "react-native";
import type { ChapterMeta } from "@/data/types";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Feather } from "@expo/vector-icons";

interface ChapterListItemProps {
  chapter: ChapterMeta;
  isInProgress: boolean;
  isQueued: boolean;
  onPress: () => void;
  onQueue?: () => void;
}

export function ChapterListItem({
  chapter,
  isInProgress,
  isQueued,
  onPress,
  onQueue,
}: ChapterListItemProps) {
  const status = chapter.downloadedAt
    ? { status: "downloaded" as const, label: "downloaded" }
    : isInProgress
      ? { status: "in-progress" as const, label: "in progress" }
      : isQueued
        ? { status: "queued" as const, label: "queued" }
        : { status: "available" as const, label: "available" };

  return (
    <Pressable
      onPress={onPress}
      className="mb-2 rounded-2xl border border-slate-200 bg-white p-4 active:opacity-80 dark:border-slate-800 dark:bg-slate-900"
    >
      <View className="flex-row items-center justify-between">
        <View className="mr-3 flex-1">
          <Text className="text-xs font-black uppercase text-slate-400">
            Chapter {chapter.idx}
          </Text>
          <Text className="mt-1 text-base font-bold text-slate-900 dark:text-slate-50">
            {chapter.title}
          </Text>
        </View>
        <View className="items-end">
          <StatusBadge status={status.status} label={status.label} />
          {onQueue && !chapter.downloadedAt ? (
            <Pressable
              onPress={onQueue}
              className="mt-2 h-8 w-8 items-center justify-center rounded-full bg-slate-100 active:opacity-70 dark:bg-slate-800"
              accessibilityRole="button"
              accessibilityLabel={`Queue ${chapter.title}`}
            >
              <Feather name="download" size={14} color="#64748B" />
            </Pressable>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

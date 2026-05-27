import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import type { DownloadQueueItem } from "@/data/types";
import { StatusBadge } from "@/components/shared/StatusBadge";

interface DownloadRowProps {
  item: DownloadQueueItem;
  novelTitle: string;
  chapterTitle: string;
  onRetry: () => void;
  onRemove: () => void;
  onOpen: () => void;
}

export function DownloadRow({
  item,
  novelTitle,
  chapterTitle,
  onRetry,
  onRemove,
  onOpen,
}: DownloadRowProps) {
  const action =
    item.status === "failed"
      ? { label: "Retry", onPress: onRetry }
      : item.status === "done"
        ? { label: "Open", onPress: onOpen }
        : { label: "Cancel", onPress: onRemove };

  return (
    <Animated.View
      entering={FadeInDown.duration(180)}
      className="mb-2 rounded-2xl border border-app-border bg-app-surface p-4"
    >
      <View className="flex-row items-start justify-between">
        <View className="mr-3 flex-1">
          <Text className="text-xs font-bold uppercase text-app-text-muted" numberOfLines={1}>
            {novelTitle}
          </Text>
          <Text className="mt-1 text-sm font-semibold text-app-text">{chapterTitle}</Text>
          {item.error ? (
            <Text className="mt-2 text-xs text-app-danger" numberOfLines={2}>
              {item.error}
            </Text>
          ) : null}
        </View>
        <StatusBadge status={item.status === "done" ? "downloaded" : item.status} />
      </View>
      <Pressable
        onPress={action.onPress}
        className="mt-3 rounded-full bg-app-surface-2 px-4 py-2 active:opacity-80"
      >
        <Text className="text-center text-xs font-bold text-app-text">{action.label}</Text>
      </Pressable>
    </Animated.View>
  );
}

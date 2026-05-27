import { Pressable, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { ChapterMeta } from "@/data/types";
import { useAppPalette } from "@/theme/useAppPalette";

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
  const palette = useAppPalette();

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center border-b border-app-border px-1 py-3.5 active:opacity-80"
      style={{ gap: 12, backgroundColor: isInProgress ? palette.accentDim : "transparent" }}
    >
      <Text
        className="text-[13px] font-semibold text-app-text-muted"
        style={{ width: 34 }}
      >
        {chapter.idx}.
      </Text>
      <Text
        className={`flex-1 text-sm ${isInProgress ? "font-semibold text-app-accent" : "text-app-text"}`}
        numberOfLines={2}
      >
        {chapter.title}
      </Text>
      {chapter.downloadedAt ? (
        <Feather name="check-circle" size={18} color={palette.success} />
      ) : isInProgress ? (
        <View className="rounded-full bg-app-accent-dim px-2 py-1">
          <Text className="text-[10px] font-bold tracking-wide text-app-accent">READING</Text>
        </View>
      ) : onQueue ? (
        <Pressable
          onPress={onQueue}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Queue ${chapter.title}`}
        >
          <Feather name="download" size={16} color={isQueued ? palette.accent : palette.textMuted} />
        </Pressable>
      ) : (
        <Feather name="download" size={16} color={palette.textMuted} style={{ opacity: 0.4 }} />
      )}
    </Pressable>
  );
}

import { Feather } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import type { Novel } from "@/data/types";
import { CoverPlaceholder } from "@/components/shared/CoverPlaceholder";
import { Tag } from "@/components/shared/Tag";
import { useAppPalette } from "@/theme/useAppPalette";

interface NovelHeaderProps {
  novel: Novel;
  onRead: () => void;
  onDownloadAll: () => void;
  onAddToShelf: () => void;
}

export function NovelHeader({ novel, onRead, onDownloadAll, onAddToShelf }: NovelHeaderProps) {
  const palette = useAppPalette();
  return (
    <View className="mb-4">
      <View className="flex-row" style={{ gap: 16 }}>
        <CoverPlaceholder
          title={novel.title}
          coverHint={novel.coverHint}
          width={104}
          height={148}
          radius={8}
        />
        <View className="min-w-0 flex-1">
          <Text className="text-[22px] font-bold leading-7 text-app-text">{novel.title}</Text>
          <Text className="mt-1.5 text-[13px] text-app-text-dim">
            {novel.author ?? "Unknown author"}
          </Text>
          <Text className="mt-1 text-xs text-app-text-muted">
            {[novel.source, novel.language].filter(Boolean).join(" · ")}
          </Text>
          <View className="mt-2 flex-row flex-wrap">
            {novel.tags.slice(0, 4).map((tag) => (
              <Tag key={tag} label={tag} />
            ))}
          </View>
        </View>
      </View>

      <View className="mt-5" style={{ gap: 10 }}>
        <Pressable
          onPress={onRead}
          className="flex-row items-center justify-center rounded-xl bg-app-accent px-4 py-3.5 active:opacity-80"
          style={{ gap: 8 }}
        >
          <Feather name="book-open" size={16} color={palette.onAccent} />
          <Text className="text-[15px] font-bold text-app-on-accent">Read</Text>
        </Pressable>
        <View className="flex-row" style={{ gap: 10 }}>
          <Pressable
            onPress={onDownloadAll}
            className="flex-1 flex-row items-center justify-center rounded-xl border border-app-border bg-app-surface px-4 py-3 active:opacity-80"
            style={{ gap: 8 }}
          >
            <Feather name="download" size={16} color={palette.text} />
            <Text className="text-sm font-semibold text-app-text">Download All</Text>
          </Pressable>
          <Pressable
            onPress={onAddToShelf}
            accessibilityRole="button"
            accessibilityLabel="Add to shelf"
            className="h-11 w-11 items-center justify-center rounded-xl border border-app-border bg-app-surface active:opacity-80"
          >
            <Feather name="folder-plus" size={16} color={palette.text} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

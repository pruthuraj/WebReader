import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAppPalette } from "@/theme/useAppPalette";
import type { TopNovelEntry } from "@/services/analytics";

interface TopNovelsListProps {
  items: TopNovelEntry[];
}

export function TopNovelsList({ items }: TopNovelsListProps) {
  const router = useRouter();
  const palette = useAppPalette();

  if (!items.length) {
    return (
      <View className="rounded-2xl border border-app-border p-4">
        <Text className="text-xs text-app-text-muted">No novel opens yet in this range.</Text>
      </View>
    );
  }

  return (
    <View className="overflow-hidden rounded-2xl border border-app-border bg-app-surface">
      {items.map((entry, index) => (
        <Pressable
          key={entry.novel.id}
          onPress={() => router.push({ pathname: "/novel/[id]", params: { id: entry.novel.id } })}
          accessibilityRole="button"
          accessibilityLabel={`Open ${entry.novel.title}`}
          className={`flex-row items-center px-4 py-3 active:opacity-75 ${
            index > 0 ? "border-t border-app-border" : ""
          }`}
        >
          <Text className="w-8 text-sm font-bold text-app-text-muted">{index + 1}</Text>
          <View className="flex-1 pr-3">
            <Text className="text-sm font-semibold text-app-text" numberOfLines={1}>
              {entry.novel.title}
            </Text>
            {entry.novel.author ? (
              <Text className="mt-0.5 text-xs text-app-text-muted" numberOfLines={1}>
                {entry.novel.author}
              </Text>
            ) : null}
          </View>
          <Text className="mr-2 text-sm font-bold text-app-accent">{entry.count}</Text>
          <Feather name="chevron-right" size={16} color={palette.textMuted} />
        </Pressable>
      ))}
    </View>
  );
}

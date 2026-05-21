import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { TopNovelEntry } from "@/services/analytics";

interface TopNovelsListProps {
  items: TopNovelEntry[];
}

export function TopNovelsList({ items }: TopNovelsListProps) {
  const router = useRouter();

  if (!items.length) {
    return (
      <View className="rounded-2xl border border-dashed border-slate-300 p-4 dark:border-slate-700">
        <Text className="text-xs text-slate-500 dark:text-slate-400">
          No novel opens yet in this range.
        </Text>
      </View>
    );
  }

  return (
    <View className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900">
      {items.map((entry, index) => (
        <Pressable
          key={entry.novel.id}
          onPress={() =>
            router.push({ pathname: "/novel/[id]", params: { id: entry.novel.id } })
          }
          accessibilityRole="button"
          accessibilityLabel={`Open ${entry.novel.title}`}
          className={`flex-row items-center px-4 py-3 ${
            index > 0 ? "border-t border-slate-100 dark:border-slate-800" : ""
          } active:opacity-75`}
        >
          <Text className="w-8 text-sm font-black text-slate-400">{index + 1}</Text>
          <View className="flex-1 pr-3">
            <Text className="text-sm font-black text-slate-950 dark:text-slate-50" numberOfLines={1}>
              {entry.novel.title}
            </Text>
            {entry.novel.author ? (
              <Text className="mt-0.5 text-xs text-slate-500 dark:text-slate-400" numberOfLines={1}>
                {entry.novel.author}
              </Text>
            ) : null}
          </View>
          <Text className="mr-2 text-sm font-black text-indigo-500 dark:text-indigo-300">
            {entry.count}
          </Text>
          <Feather name="chevron-right" size={16} color="#94A3B8" />
        </Pressable>
      ))}
    </View>
  );
}

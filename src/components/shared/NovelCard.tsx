import { Pressable, Text, View } from "react-native";
import type { Novel } from "@/data/types";
import { CoverPlaceholder } from "./CoverPlaceholder";

interface NovelCardProps {
  novel: Novel;
  meta?: string;
  onPress: () => void;
}

export function NovelCard({ novel, meta, onPress }: NovelCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="mr-3 w-36 active:opacity-75"
      accessibilityRole="button"
      accessibilityLabel={`Open ${novel.title}`}
    >
      <View className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <CoverPlaceholder title={novel.title} coverHint={novel.coverHint} />
        <Text
          className="mt-3 text-sm font-bold leading-5 text-slate-900 dark:text-slate-50"
          numberOfLines={2}
        >
          {novel.title}
        </Text>
        <Text className="mt-1 text-xs text-slate-500 dark:text-slate-400" numberOfLines={1}>
          {novel.author ?? "Unknown author"}
        </Text>
        {meta ? (
          <Text className="mt-2 text-[11px] font-medium text-indigo-600 dark:text-indigo-300">
            {meta}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}


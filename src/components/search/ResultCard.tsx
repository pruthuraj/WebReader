import { Pressable, Text, View } from "react-native";
import type { Novel } from "@/data/types";
import { CoverPlaceholder } from "@/components/shared/CoverPlaceholder";
import { Tag } from "@/components/shared/Tag";

interface ResultCardProps {
  novel: Novel;
  onPress: () => void;
}

export function ResultCard({ novel, onPress }: ResultCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-3 rounded-2xl border border-slate-200 bg-white p-3 active:opacity-80 dark:border-slate-800 dark:bg-slate-900"
      accessibilityRole="button"
      accessibilityLabel={`Open ${novel.title}`}
    >
      <View className="flex-row">
        <CoverPlaceholder title={novel.title} coverHint={novel.coverHint} compact />
        <View className="ml-3 flex-1">
          <Text className="text-base font-black text-slate-950 dark:text-slate-50" numberOfLines={2}>
            {novel.title}
          </Text>
          <Text className="mt-1 text-xs text-slate-500 dark:text-slate-400" numberOfLines={1}>
            {novel.author ?? "Unknown author"}
          </Text>
          <View className="mt-1 flex-row flex-wrap">
            {novel.source ? <Tag label={novel.source} variant="source" /> : null}
            {novel.language ? <Tag label={novel.language} variant="language" /> : null}
            {novel.tags.slice(0, 2).map((tag) => (
              <Tag key={tag} label={tag} />
            ))}
          </View>
          <Text
            className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300"
            numberOfLines={3}
          >
            {novel.description}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}


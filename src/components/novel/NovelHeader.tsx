import { Feather } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import type { Novel } from "@/data/types";
import { CoverPlaceholder } from "@/components/shared/CoverPlaceholder";
import { Tag } from "@/components/shared/Tag";

interface NovelHeaderProps {
  novel: Novel;
  onRead: () => void;
  onDownloadAll: () => void;
  onAddToShelf: () => void;
}

export function NovelHeader({ novel, onRead, onDownloadAll, onAddToShelf }: NovelHeaderProps) {
  return (
    <View className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <View className="flex-row">
        <CoverPlaceholder title={novel.title} coverHint={novel.coverHint} />
        <View className="ml-4 flex-1">
          <Text className="text-2xl font-black leading-8 text-slate-950 dark:text-slate-50">
            {novel.title}
          </Text>
          <Text className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
            {novel.author ?? "Unknown author"}
          </Text>
          <View className="mt-2 flex-row flex-wrap">
            {novel.source ? <Tag label={novel.source} variant="source" /> : null}
            {novel.language ? <Tag label={novel.language} variant="language" /> : null}
            {novel.tags.map((tag) => (
              <Tag key={tag} label={tag} />
            ))}
          </View>
        </View>
      </View>

      <View className="mt-5 flex-row">
        <Pressable
          onPress={onRead}
          className="mr-3 flex-1 flex-row items-center justify-center rounded-full bg-slate-950 px-4 py-3 active:opacity-80 dark:bg-slate-50"
        >
          <Feather name="book-open" size={16} color="#F8FAFC" />
          <Text className="ml-2 text-sm font-black text-white dark:text-slate-950">Read</Text>
        </Pressable>
        <Pressable
          onPress={onDownloadAll}
          className="mr-3 flex-row items-center justify-center rounded-full border border-slate-200 px-4 py-3 active:opacity-80 dark:border-slate-700"
        >
          <Feather name="download" size={16} color="#64748B" />
          <Text className="ml-2 text-sm font-bold text-slate-600 dark:text-slate-300">
            Queue
          </Text>
        </Pressable>
        <Pressable
          onPress={onAddToShelf}
          accessibilityRole="button"
          accessibilityLabel="Add to shelf"
          className="h-11 w-11 items-center justify-center rounded-full border border-slate-200 active:opacity-80 dark:border-slate-700"
        >
          <Feather name="folder-plus" size={16} color="#64748B" />
        </Pressable>
      </View>
    </View>
  );
}


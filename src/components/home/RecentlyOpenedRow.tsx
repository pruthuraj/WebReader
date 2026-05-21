import { FlatList, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { EmptyState } from "@/components/shared/EmptyState";
import { NovelCard } from "@/components/shared/NovelCard";
import type { CountedNovelItem } from "@/hooks/useHomeRows";

interface RecentlyOpenedRowProps {
  data: CountedNovelItem[];
}

export function RecentlyOpenedRow({ data }: RecentlyOpenedRowProps) {
  const router = useRouter();

  return (
    <View className="mb-7">
      <Text className="mb-3 text-lg font-black text-slate-900 dark:text-slate-50">
        Recently Opened
      </Text>
      {data.length ? (
        <FlatList
          horizontal
          data={data}
          keyExtractor={(item) => item.novel.id}
          showsHorizontalScrollIndicator={false}
          initialNumToRender={4}
          maxToRenderPerBatch={4}
          windowSize={5}
          renderItem={({ item }) => (
            <NovelCard
              novel={item.novel}
              meta="Recently viewed"
              onPress={() => router.push({ pathname: "/novel/[id]", params: { id: item.novel.id } })}
            />
          )}
        />
      ) : (
        <EmptyState
          icon="clock"
          title="Open a novel to see it here"
          subtitle="Your recent catalogue visits stay on this device."
        />
      )}
    </View>
  );
}


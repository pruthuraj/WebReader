import { FlatList, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { EmptyState } from "@/components/shared/EmptyState";
import { NovelCard } from "@/components/shared/NovelCard";
import type { CountedNovelItem } from "@/hooks/useHomeRows";

interface PopularNovelsRowProps {
  data: CountedNovelItem[];
}

export function PopularNovelsRow({ data }: PopularNovelsRowProps) {
  const router = useRouter();

  return (
    <View className="mb-7">
      <Text className="mb-3 text-lg font-black text-slate-900 dark:text-slate-50">
        Popular Here
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
              meta={`${item.count} opens`}
              onPress={() => router.push({ pathname: "/novel/[id]", params: { id: item.novel.id } })}
            />
          )}
        />
      ) : (
        <EmptyState
          icon="trending-up"
          title="Popularity will appear once you start exploring"
          subtitle="This is local popularity, not a network ranking."
        />
      )}
    </View>
  );
}


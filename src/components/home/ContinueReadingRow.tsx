import { FlatList, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { EmptyState } from "@/components/shared/EmptyState";
import { NovelCard } from "@/components/shared/NovelCard";
import { percentLabel } from "@/utils/format";
import type { ContinueReadingItem } from "@/hooks/useHomeRows";

interface ContinueReadingRowProps {
  data: ContinueReadingItem[];
}

export function ContinueReadingRow({ data }: ContinueReadingRowProps) {
  const router = useRouter();

  return (
    <View className="mb-7">
      <Text className="mb-3 text-lg font-black text-slate-900 dark:text-slate-50">
        Continue Reading
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
              meta={percentLabel(item.progress.percent)}
              onPress={() =>
                router.push({
                  pathname: "/reader/[novelId]/[chapterId]",
                  params: {
                    novelId: item.progress.novelId,
                    chapterId: item.progress.chapterId,
                  },
                })
              }
            />
          )}
        />
      ) : (
        <EmptyState
          icon="book-open"
          title="Nothing in progress yet"
          subtitle="Open a chapter and your place will appear here."
        />
      )}
    </View>
  );
}


import { FlatList, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { EmptyState } from "@/components/shared/EmptyState";
import { NovelCard } from "@/components/shared/NovelCard";
import type { CountedNovelItem } from "@/hooks/useHomeRows";

interface DownloadedNovelsRowProps {
  data: CountedNovelItem[];
}

export function DownloadedNovelsRow({ data }: DownloadedNovelsRowProps) {
  const router = useRouter();

  return (
    <View className="mb-8">
      <Text className="mb-3 text-lg font-black text-slate-900 dark:text-slate-50">
        On This Device
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
              meta={`${item.count} chapters local`}
              onPress={() => router.push({ pathname: "/novel/[id]", params: { id: item.novel.id } })}
            />
          )}
        />
      ) : (
        <EmptyState
          icon="download"
          title="Open a chapter to keep it offline"
          subtitle="Phase B stores chapter bodies when you read them."
        />
      )}
    </View>
  );
}


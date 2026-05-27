import type { ComponentProps } from "react";
import { FlatList, View } from "react-native";
import { useRouter } from "expo-router";
import { SectionHeader } from "@/components/ui/headers";
import { EmptyState } from "@/components/shared/EmptyState";
import { NovelCard } from "@/components/shared/NovelCard";
import type { Feather } from "@expo/vector-icons";
import type { CountedNovelItem } from "@/hooks/useHomeRows";

interface NovelRailProps {
  title: string;
  data: CountedNovelItem[];
  itemWidth?: number;
  meta?: (item: CountedNovelItem) => string | undefined;
  emptyIcon: ComponentProps<typeof Feather>["name"];
  emptyTitle: string;
  emptySubtitle?: string;
}

/** Horizontal cover rail with a section header (ref Recent/Popular/Downloaded). */
export function NovelRail({
  title,
  data,
  itemWidth = 96,
  meta,
  emptyIcon,
  emptyTitle,
  emptySubtitle,
}: NovelRailProps) {
  const router = useRouter();
  return (
    <View>
      <SectionHeader title={title} action={data.length ? "See all" : undefined} />
      {data.length ? (
        <FlatList
          horizontal
          data={data}
          keyExtractor={(item) => item.novel.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 4 }}
          initialNumToRender={4}
          maxToRenderPerBatch={4}
          windowSize={5}
          renderItem={({ item }) => (
            <NovelCard
              novel={item.novel}
              width={itemWidth}
              meta={meta?.(item)}
              onPress={() => router.push({ pathname: "/novel/[id]", params: { id: item.novel.id } })}
            />
          )}
        />
      ) : (
        <View className="px-5">
          <EmptyState icon={emptyIcon} title={emptyTitle} subtitle={emptySubtitle} />
        </View>
      )}
    </View>
  );
}

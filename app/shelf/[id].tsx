import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { ResultCard } from "@/components/search/ResultCard";
import { EmptyState } from "@/components/shared/EmptyState";
import type { Novel } from "@/data/types";
import { novelRepo } from "@/db/repositories/novelRepo";
import { shelfRepo } from "@/db/repositories/shelfRepo";

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default function ShelfDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const shelfId = Number(firstParam(params.id));

  const [name, setName] = useState("Shelf");
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [shelf, novelIds] = await Promise.all([
        shelfRepo.get(shelfId),
        shelfRepo.novelIdsInShelf(shelfId),
      ]);
      const resolved = await Promise.all(novelIds.map((id) => novelRepo.getById(id)));
      if (cancelled) return;
      if (shelf) setName(shelf.name);
      setNovels(resolved.filter((n): n is Novel => n !== null));
      setLoading(false);
    }
    if (Number.isFinite(shelfId)) void load();
    return () => {
      cancelled = true;
    };
  }, [shelfId]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950">
        <ActivityIndicator />
        <Text className="mt-3 text-xs text-slate-500 dark:text-slate-400">Loading shelf</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50 p-4 dark:bg-slate-950">
      <Stack.Screen options={{ title: name }} />
      <FlatList
        data={novels}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ResultCard
            novel={item}
            onPress={() => router.push({ pathname: "/novel/[id]", params: { id: item.id } })}
          />
        )}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="book"
            title="Shelf is empty"
            subtitle="Add novels from any novel's page using “Add to shelf.”"
          />
        }
      />
    </View>
  );
}

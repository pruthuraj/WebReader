import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { EmptyState } from "@/components/shared/EmptyState";
import { FiltersSheet } from "@/components/search/FiltersSheet";
import { ResultCard } from "@/components/search/ResultCard";
import { SearchBar } from "@/components/search/SearchBar";
import { SortControl } from "@/components/search/SortControl";
import { catalogue, type SearchFilters, type SortKey } from "@/services/catalogue";
import { useAnalyticsStore } from "@/stores/analyticsStore";
import type { Novel } from "@/data/types";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function normalizeSort(value: string | undefined): SortKey {
  if (value === "popularity" || value === "updated" || value === "alpha") return value;
  return "relevance";
}

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    q?: string;
    sort?: string;
    genre?: string;
    language?: string;
    source?: string;
  }>();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [query, setQuery] = useState(firstParam(params.q) ?? "");
  const lastRecordedQuery = useRef("");
  const recordSearch = useAnalyticsStore((s) => s.recordSearch);

  const sort = normalizeSort(firstParam(params.sort));
  const filters: SearchFilters = useMemo(
    () => ({
      genre: firstParam(params.genre),
      language: firstParam(params.language),
      source: firstParam(params.source),
    }),
    [params.genre, params.language, params.source]
  );

  useEffect(() => {
    setQuery(firstParam(params.q) ?? "");
  }, [params.q]);

  const { debounced: recordSearchDebounced } = useDebouncedCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (!trimmed || trimmed === lastRecordedQuery.current) return;
      lastRecordedQuery.current = trimmed;
      void recordSearch(trimmed, { filters, sort });
    },
    1000
  );

  const replaceParams = useCallback(
    (next: { q?: string; sort?: SortKey; genre?: string; language?: string; source?: string }) => {
      const cleaned: Record<string, string> = {};
      if (next.q?.trim()) cleaned.q = next.q.trim();
      if (next.sort && next.sort !== "relevance") cleaned.sort = next.sort;
      if (next.genre) cleaned.genre = next.genre;
      if (next.language) cleaned.language = next.language;
      if (next.source) cleaned.source = next.source;
      router.replace({ pathname: "/search", params: cleaned });
    },
    [router]
  );

  const results = useMemo<Novel[]>(
    () =>
      catalogue.search({
        query,
        filters,
        sort,
      }),
    [filters, query, sort]
  );

  const submit = () => {
    replaceParams({ q: query, sort, ...filters });
    recordSearchDebounced(query);
  };

  const clear = () => {
    setQuery("");
    replaceParams({ sort, ...filters });
  };

  const updateFilters = (next: SearchFilters) => {
    replaceParams({ q: query, sort, ...next });
  };

  const updateSort = (nextSort: SortKey) => {
    replaceParams({ q: query, sort: nextSort, ...filters });
  };

  return (
    <View className="flex-1 bg-slate-50 p-4 dark:bg-slate-950">
      <SearchBar
        value={query}
        onChangeText={(value) => {
          setQuery(value);
          recordSearchDebounced(value);
        }}
        onSubmit={submit}
        onClear={clear}
      />

      <View className="my-4 flex-row items-center justify-between">
        <SortControl value={sort} onChange={updateSort} />
        <Pressable
          onPress={() => setFiltersOpen(true)}
          className="ml-3 h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
          accessibilityRole="button"
          accessibilityLabel="Open filters"
        >
          <Feather name="sliders" size={17} color="#64748B" />
        </Pressable>
      </View>

      <Text className="mb-3 text-xs font-bold uppercase text-slate-400">
        {results.length} results
      </Text>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ResultCard
            novel={item}
            onPress={() => router.push({ pathname: "/novel/[id]", params: { id: item.id } })}
          />
        )}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        ListEmptyComponent={
          <EmptyState
            icon="search"
            title="No novels match"
            subtitle="Try a different word or clear filters."
          />
        }
      />

      <FiltersSheet
        visible={filtersOpen}
        genres={catalogue.availableGenres()}
        languages={catalogue.availableLanguages()}
        sources={catalogue.availableSources()}
        selected={filters}
        onSelect={updateFilters}
        onClose={() => setFiltersOpen(false)}
      />
    </View>
  );
}

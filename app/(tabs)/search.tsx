import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppPalette } from "@/theme/useAppPalette";
import { EmptyState } from "@/components/shared/EmptyState";
import { FiltersSheet } from "@/components/search/FiltersSheet";
import { ResultCard } from "@/components/search/ResultCard";
import { SearchBar } from "@/components/search/SearchBar";
import { SortControl } from "@/components/search/SortControl";
import { catalogue, type SearchFilters, type SortKey } from "@/services/catalogue";
import { useAnalyticsStore } from "@/stores/analyticsStore";
import { useSourceStore } from "@/stores/sourceStore";
import { detailsUrlFromId } from "@/sources/liveSource";
import type { Novel } from "@/data/types";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";

// null = the bundled local (mock) catalogue; otherwise an enabled live source id.
const LOCAL = "local";

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
  const insets = useSafeAreaInsets();
  const palette = useAppPalette();
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

  const allSources = useSourceStore((s) => s.sources);
  const loadSources = useSourceStore((s) => s.load);
  const enabledSources = useMemo(() => allSources.filter((s) => s.enabled), [allSources]);
  // Active tab: LOCAL (mock catalogue) or an enabled live source id.
  const [activeTab, setActiveTab] = useState<string>(LOCAL);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    void loadSources();
  }, [loadSources]);

  // If the active live source gets disabled elsewhere, fall back to Local.
  useEffect(() => {
    if (activeTab !== LOCAL && !enabledSources.some((s) => s.id === activeTab)) {
      setActiveTab(LOCAL);
    }
  }, [activeTab, enabledSources]);

  const isLocal = activeTab === LOCAL;
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

  const [results, setResults] = useState<Novel[]>([]);
  const [facets, setFacets] = useState<{
    genres: string[];
    languages: string[];
    sources: string[];
  }>({ genres: [], languages: [], sources: [] });

  // Debounce the query so live sources aren't hit on every keystroke.
  const [deferredQuery, setDeferredQuery] = useState(query);
  useEffect(() => {
    const t = setTimeout(() => setDeferredQuery(query), 500);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    setErrorMsg(null);
    if (isLocal) {
      setLoading(false);
      void catalogue.search({ query: deferredQuery, filters, sort }).then((next) => {
        if (!cancelled) setResults(next);
      });
    } else {
      setLoading(true);
      void catalogue
        .searchSource(activeTab, deferredQuery)
        .then((next) => {
          if (!cancelled) setResults(next);
        })
        .catch((e: unknown) => {
          if (cancelled) return;
          setResults([]);
          setErrorMsg(e instanceof Error ? e.message : "Couldn't reach this source.");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }
    return () => {
      cancelled = true;
    };
  }, [activeTab, isLocal, deferredQuery, filters, sort]);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      catalogue.availableGenres(),
      catalogue.availableLanguages(),
      catalogue.availableSources(),
    ]).then(([genres, languages, sources]) => {
      if (!cancelled) setFacets({ genres, languages, sources });
    });
    return () => {
      cancelled = true;
    };
  }, []);

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

  // Live results aren't in the DB yet — materialize the novel (details +
  // chapter list) before navigating so NovelDetails reads it from the repos.
  const openResult = useCallback(
    async (novel: Novel) => {
      if (!novel.sourceId) {
        router.push({ pathname: "/novel/[id]", params: { id: novel.id } });
        return;
      }
      const detailsUrl = detailsUrlFromId(novel.id);
      if (!detailsUrl) return;
      setOpening(true);
      try {
        await catalogue.materializeNovel(novel.sourceId, detailsUrl);
        router.push({ pathname: "/novel/[id]", params: { id: novel.id } });
      } catch (e: unknown) {
        Alert.alert(
          "Couldn't open",
          e instanceof Error ? e.message : "Failed to load this novel from its source."
        );
      } finally {
        setOpening(false);
      }
    },
    [router]
  );

  return (
    <View className="flex-1 bg-app-bg" style={{ paddingTop: insets.top + 8 }}>
      <View className="px-4">
        <SearchBar
          value={query}
          onChangeText={(value) => {
            setQuery(value);
            recordSearchDebounced(value);
          }}
          onSubmit={submit}
          onClear={clear}
        />
      </View>

      {enabledSources.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3 max-h-12"
          contentContainerStyle={{ alignItems: "center", paddingHorizontal: 16 }}
        >
          {[{ id: LOCAL, name: "Local" }, ...enabledSources.map((s) => ({ id: s.id, name: s.name }))].map(
            (tab) => {
              const active = activeTab === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id)}
                  className={`mr-2 rounded-full px-4 py-2 ${
                    active ? "bg-app-accent" : "bg-app-surface-2"
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      active ? "text-app-on-accent" : "text-app-text-dim"
                    }`}
                  >
                    {tab.name}
                  </Text>
                </Pressable>
              );
            }
          )}
        </ScrollView>
      ) : null}

      {isLocal ? (
        <View className="flex-row items-center justify-between border-b border-app-border px-5 py-3">
          <SortControl value={sort} onChange={updateSort} />
          <Pressable
            onPress={() => setFiltersOpen(true)}
            className="h-8 w-8 items-center justify-center rounded-lg bg-app-surface-2 active:opacity-70"
            accessibilityRole="button"
            accessibilityLabel="Open filters"
          >
            <Feather name="sliders" size={16} color={palette.textDim} />
          </Pressable>
        </View>
      ) : (
        <Text className="px-5 py-4 text-xs leading-5 text-app-text-muted">
          {query.trim() ? "Live search" : "Browsing"} via this source. Results load
          over the network and cache on your device when opened.
        </Text>
      )}

      <View className="flex-row items-center justify-between px-5 py-2.5">
        <Text className="text-xs font-bold uppercase tracking-wide text-app-text-muted">
          {loading ? "Searching…" : `${results.length} results`}
        </Text>
        {loading ? <ActivityIndicator size="small" color={palette.accent} /> : null}
      </View>

      {errorMsg ? (
        <Text className="px-5 pb-2 text-xs leading-5 text-app-danger">{errorMsg}</Text>
      ) : null}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ResultCard novel={item} onPress={() => void openResult(item)} />}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        contentContainerStyle={{ paddingBottom: 16 }}
        ListEmptyComponent={
          loading ? null : (
            <View className="px-5 pt-6">
              <EmptyState
                icon="search"
                title={errorMsg ? "Source unavailable" : "No novels match"}
                subtitle={
                  errorMsg
                    ? "Check your connection or try another source."
                    : isLocal
                      ? "Try a different word or clear filters."
                      : "Try a different search term."
                }
              />
            </View>
          )
        }
      />

      <FiltersSheet
        visible={filtersOpen}
        genres={facets.genres}
        languages={facets.languages}
        sources={facets.sources}
        selected={filters}
        onSelect={updateFilters}
        onClose={() => setFiltersOpen(false)}
      />

      {opening ? (
        <View className="absolute inset-0 items-center justify-center bg-black/50">
          <View className="items-center rounded-2xl bg-app-surface px-6 py-5">
            <ActivityIndicator color={palette.accent} />
            <Text className="mt-3 text-xs font-bold text-app-text-dim">Loading from source…</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

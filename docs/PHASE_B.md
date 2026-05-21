# Phase B — Core reading flow

> **Status:** planned (next).
> **Prev:** [PHASE_A.md](./PHASE_A.md) · **Index:** [ROADMAP.md](./ROADMAP.md) · **Next:** [PHASE_C.md](./PHASE_C.md)

## Goal

Replace every placeholder screen with a working, end-to-end reading loop on top of the foundation Phase A laid down. After Phase B, a user can:

> open the app → see Continue Reading / Recently Opened / Popular / Downloaded rows on Home → tap the search affordance → type a query → see filtered, sortable results → tap a result → see the novel's metadata + chapter list → tap a chapter → read its body with the configured reader appearance → scroll mid-page → leave the app → return → Home's *Continue Reading* row shows that novel → tap → reopens the same chapter at the saved scroll offset.

This is the smallest end-to-end vertical slice of the product. Phase C polishes it (settings sheets, TTS, downloader UI), Phase D adds analytics views.

## Exit criteria

- The user-journey above works on Expo Go SDK 55 (Android or iOS).
- All four Home rows render with data once the user has done at least one read.
- `npx tsc --noEmit`, `npm run lint`, and `npx expo export --platform ios` all succeed.
- After a real read, the database satisfies:
  - `SELECT COUNT(*) FROM progress` ≥ 1
  - `SELECT DISTINCT type FROM events` contains `search`, `novel_open`, `chapter_open`, `chapter_read`, `session`
  - `SELECT body IS NOT NULL FROM chapters WHERE novel_id='n1' AND chapter_id='n1-c01'` returns `1` after that chapter has been opened once.

## New files

### Home components — `src/components/home/`

| File | One-liner |
|---|---|
| `HomeHeader.tsx` | App title (`WebReader`) + one-line tagline; pure presentational. |
| `SearchEntry.tsx` | Large tappable card "What do you want to read?" that pushes to `/search`. Optional focus mode (Phase C) opens a sheet; in B it just navigates. |
| `ContinueReadingRow.tsx` | Horizontal `FlatList<NovelCard>` fed by `useHomeRows().continueReading`. Empty state: "Nothing in progress yet". |
| `RecentlyOpenedRow.tsx` | Horizontal list of distinct novels opened recently (last 30 days). Empty state: "Open a novel to see it here". |
| `PopularNovelsRow.tsx` | Horizontal list of top-5 novels by `novel_open` event count. Empty state: "Popularity will appear once you start exploring". |
| `DownloadedNovelsRow.tsx` | Horizontal list of novels with at least one `chapters.body NOT NULL`. Empty state: "You haven't downloaded anything yet". |

Each row is structurally identical: a `<Text>` section title, a `<FlatList horizontal>`, and an `EmptyState` when its data array is empty. They share `src/components/shared/NovelCard.tsx` for the actual card.

### Search components — `src/components/search/`

| File | One-liner |
|---|---|
| `SearchBar.tsx` | Controlled `TextInput` with clear button. Submits via `onSubmitEditing`; in Phase B it pushes the typed query into the URL query param `?q=`. |
| `SortControl.tsx` | Segmented pill bar with 4 options (relevance / popularity / updated / alpha). Drives URL param `?sort=`. |
| `FiltersSheet.tsx` | Bottom-anchored panel toggled by a filter icon. Three pickers: genre (from `mockSource.availableGenres()`), language, source. Phase B uses a plain `<View>` translation; Phase C upgrades to Reanimated `useAnimatedSheet`. |
| `ResultCard.tsx` | Full-width pressable card: title, author, `Tag` chips for source/language/top-2 genres, 3-line description. Press → `/novel/[id]`. |

### Novel components — `src/components/novel/`

| File | One-liner |
|---|---|
| `NovelHeader.tsx` | `CoverPlaceholder` + title + author + tag chips + action row (Read / Download all). Read jumps to the next unread chapter or chapter 1. |
| `DescriptionBlock.tsx` | Expandable description with "more / less" toggle. Defaults to `numberOfLines={4}`. |
| `ChapterListItem.tsx` | Row: `idx` + title + `StatusBadge` (downloaded · available · in-progress if a `progress` row exists). Press → `/reader/[novelId]/[chapterId]`. |

### Reader components — `src/components/reader/`

| File | One-liner |
|---|---|
| `ChapterHeader.tsx` | Compact strip: novel title (muted, small) + chapter title (large) + `Chapter X of Y` label. |
| `ReaderContent.tsx` | Single `<Text>` rendering the chapter body. Styles derived from `readerStore.appearance` (`fontSize`, `lineHeight`, font family, alignment, horizontal margin, theme colors via `bg-reader-bg` / `text-reader-fg`). |
| `ChapterNavigation.tsx` | Sticky-bottom row with Prev / Next buttons. Sourced from `chapterRepo.neighbors`. Disabled when null. |

> Phase C adds `ReaderSettingsSheet`, `TTSSettingsSheet`, and `ReaderProgress`. Don't create them in Phase B — keep the reader minimal.

### Shared components — `src/components/shared/`

| File | One-liner |
|---|---|
| `NovelCard.tsx` | 160 × 220 dp card with cover, title (2 lines), author (1 line). Used by every Home row. |
| `CoverPlaceholder.tsx` | Gradient rectangle keyed by `coverHint` (`"gradient-indigo"` → indigo-500 → 700, etc.). Renders novel title initials in the center. Uses `expo-linear-gradient`. |
| `Tag.tsx` | Pill: rounded-full, `px-2 py-0.5`, small text, subtle border. Variants: `default`, `language`, `source`. |
| `StatusBadge.tsx` | Pill variants: `downloaded` (success), `available` (muted), `in-progress` (brand), `queued` (warning — Phase C), `failed` (error — Phase C). |
| `EmptyState.tsx` | Icon (`@expo/vector-icons` Feather), title, subtitle, optional CTA button. Used by Home rows, search results, and any data-empty surface. |

### Services — `src/services/`

| File | One-liner |
|---|---|
| `catalogue.ts` | Facade interface: `search`, `getNovel`, `listChapters`, `getChapter`, `availableGenres/Languages/Sources`. Phase B delegates to `mockSource`. Phase 2 swaps in an HTTP-backed implementation without changing call sites. |
| `readerLoad.ts` | `loadChapterBody(novelId, chapterId)`: reads via `chapterRepo.getOne`; if `body` is null, fetches via `catalogue.getChapter`, calls `chapterRepo.setBody`, then returns the body. Also records a `chapter_open` event (with novel/chapter ids). |

### Hooks — `src/hooks/`

| File | One-liner |
|---|---|
| `useDebouncedCallback.ts` | Generic `useDebouncedCallback<T extends (...args:any[]) => void>(fn, ms = 300)`. Returns a stable debounced version + a `cancel()` helper. |
| `useProgressAutoSave.ts` | `useProgressAutoSave({ novelId, chapterId, contentHeight })` returns `{ onScroll, lastSavedPercent }`. Internally throttles to one write per 750 ms; calls `progressRepo.upsert` and `readerStore.setScrollOffset`. |
| `useHomeRows.ts` | Pulls Continue Reading / Recently Opened / Popular / Downloaded from the relevant repos in parallel, resolves novel metadata, returns `{ continueReading, recentlyOpened, popular, downloaded, loading, refresh }`. Uses `useFocusEffect` (Expo Router) so the data refreshes when Home regains focus. |

### Utils — `src/utils/`

| File | One-liner |
|---|---|
| `format.ts` | `chapterOfText(idx, total)`, `shortDate(ms)` (dayjs `fromNow`), `percentLabel(p)` (rounded `%`). |
| `id.ts` | `key(novelId, chapterId)` returns `${novelId}::${chapterId}`. |

## Files modified

### `app/index.tsx`

Replace the four `NavTile` cards with the Home composition:

```
<ScrollView refreshControl={<RefreshControl ... />}>
  <HomeHeader />
  <SearchEntry />
  <ContinueReadingRow data={continueReading} />
  <RecentlyOpenedRow data={recentlyOpened} />
  <PopularNovelsRow data={popular} />
  <DownloadedNovelsRow data={downloaded} />
</ScrollView>
```

Pull-to-refresh re-runs `useHomeRows().refresh`. Skeleton loaders show on first paint until data resolves.

### `app/search.tsx`

```
const { q = "", sort = "relevance", genre, language, source } = useLocalSearchParams<{
  q?: string; sort?: SortKey; genre?: string; language?: string; source?: string;
}>();
```

On mount and whenever any param changes, call `catalogue.search({ query: q, filters: { genre, language, source }, sort })`. Record one `search` event per non-empty submission (debounced — see edge cases). Render:

```
<SearchBar />        // controlled, syncs to ?q=
<View row>           // sort + filter
  <SortControl />    // syncs to ?sort=
  <FilterButton />   // opens FiltersSheet
</View>
<FlatList<ResultCard> />
```

Empty results → `EmptyState`. Tap a card → `router.push('/novel/' + id)`.

### `app/novel/[id].tsx`

```
const { id } = useLocalSearchParams<{ id: string }>();
useEffect(() => { recordNovelOpen(id); }, [id]);
const novel = useAsync(() => novelRepo.getById(id));
const chapters = useAsync(() => chapterRepo.listByNovel(id));
const lastProgress = useAsync(() => progressRepo.lastForNovel(id));
```

Render:

```
<NovelHeader novel={novel} onRead={openContinueOrFirst} onDownloadAll={enqueueAll} />
<DescriptionBlock text={novel.description} />
{ lastProgress && <ContinuePill ... /> }
<FlatList<ChapterListItem> />
```

`onDownloadAll` just enqueues into `downloadQueue` for now; the worker that actually downloads lands in Phase C, so chapters become "downloaded" lazily via `readerLoad` until then.

### `app/reader/[novelId]/[chapterId].tsx`

```
const { novelId, chapterId } = useLocalSearchParams<{ novelId: string; chapterId: string }>();

useEffect(() => {
  readerStore.setCurrent(novelId, chapterId);
  return () => { readerStore.setCurrent(null, null); };
}, [novelId, chapterId]);

const chapter = useAsync(() => readerLoad.loadChapterBody(novelId, chapterId));
const neighbors = useAsync(() => chapterRepo.neighbors(novelId, chapter?.idx));
const initialOffset = useAsyncOnce(() => progressRepo.get(novelId, chapterId).then(p => p?.scrollOffset ?? 0));

const scrollRef = useRef<ScrollView>(null);
useEffect(() => { if (initialOffset > 0) scrollRef.current?.scrollTo({ y: initialOffset, animated: false }); }, [initialOffset]);

const { onScroll } = useProgressAutoSave({ novelId, chapterId, contentHeight });
```

Render `<ChapterHeader />` + `<ReaderContent text={chapter.body} />` + `<ChapterNavigation prev={neighbors.prev} next={neighbors.next} />`.

On unmount/blur: if `lastSavedPercent >= 0.8`, record `chapter_read` with `durationMs = now - mountedAt`.

### `src/stores/readerStore.ts`

Add an action that hits the DB:

```ts
setProgress: async (novelId, chapterId, scrollOffset, percent) => {
  await progressRepo.upsert({ novelId, chapterId, scrollOffset, percent, updatedAt: Date.now() });
  set({ scrollOffset });
}
```

The existing `setScrollOffset` stays for non-persistent in-flight updates from `onScroll`; the persistent write is the throttled one inside `useProgressAutoSave` and ultimately calls this action.

### `src/stores/analyticsStore.ts`

Add convenience wrappers so screens don't have to remember the event-payload shape:

```ts
recordSearch(query: string)
recordNovelOpen(novelId: string)
recordChapterOpen(novelId: string, chapterId: string)
recordChapterRead(novelId: string, chapterId: string, durationMs: number, percent: number)
```

All four delegate to the existing `eventRepo.record`.

## Data flow diagrams

### Search submit

```
SearchBar input
  → setQueryParam(q)               (router replace)
  → useLocalSearchParams (search.tsx)
  → catalogue.search({ q, filters, sort })
  → FlatList renders ResultCards
  → tap → router.push('/novel/' + id)
  → side-effect: analyticsStore.recordSearch(q)   (debounced via useDebouncedCallback)
```

### Chapter read

```
ChapterListItem tap
  → router.push('/reader/' + novelId + '/' + chapterId)
  → readerLoad.loadChapterBody(novelId, chapterId)
      → chapterRepo.getOne → if body is null → catalogue.getChapter → chapterRepo.setBody → returns body
      → analyticsStore.recordChapterOpen
  → ReaderContent renders
  → ScrollView.onScroll → useProgressAutoSave (throttle 750ms)
      → progressRepo.upsert → readerStore.setScrollOffset
  → on blur if percent >= 0.8 → analyticsStore.recordChapterRead
```

### Continue Reading

```
HomeScreen mount / focus
  → useHomeRows.refresh()
      → progressRepo.recent(10)
      → resolve unique novelIds via novelRepo.getById(id) in parallel
      → produce {novel, progress} pairs
  → ContinueReadingRow renders NovelCards
  → tap → router.push('/reader/' + novelId + '/' + chapterId)
  → ReaderScreen restores scrollOffset from progressRepo.get
```

## Edge cases

| Case | Handling |
|---|---|
| Empty search results | `EmptyState` titled "No novels match", subtitle "Try a different word or clear filters." |
| Novel with zero chapters in DB (shouldn't happen post-seed) | Skeleton list → `EmptyState` after 500 ms guard. |
| `loadChapterBody` fails (mock returns null) | Show `EmptyState` in ReaderContent area with "Couldn't load this chapter" + Retry button. Do not persist a null body. |
| User scrolls past `contentHeight` (RN over-scroll) | Clamp percent to `[0, 1]` before writing to DB. |
| Reader opened via deep link (no prior novel open) | Works — `loadChapterBody` is self-sufficient. Record `chapter_open` on first render only. |
| Search box typed rapidly | `recordSearch` is debounced 1 s so we don't spam events for every keystroke; only a settled query becomes an event. The query param updates immediately, the analytics event lags. |
| Continue Reading row contains a progress row whose novel was deleted | `useHomeRows` filters out null novels. |
| Chapter without `idx` neighbor (first/last chapter) | Prev/Next buttons disabled; `onPress` is a no-op. |
| Pull-to-refresh while a query is in flight | `refresh()` aborts previous via an internal generation counter; latest wins. |

## Performance notes

- All horizontal rows use `FlatList horizontal initialNumToRender={4} maxToRenderPerBatch={4} windowSize={5}`.
- Search results FlatList uses `keyExtractor={(item) => item.id}` and `removeClippedSubviews` on Android.
- `ReaderContent` renders one large `<Text>`. For ≤2000-word chapters this is fine; if Phase 2 introduces 20k-word web-novel chapters, we'll switch to a paragraph-sliced FlatList. Document the decision when the time comes.
- `useProgressAutoSave` debounce target: ≤1 DB write per 750 ms and ≤30 writes per chapter session.
- `useHomeRows.refresh()` runs the four queries in parallel via `Promise.all`.

## Verification

### Manual (in Expo Go)

1. Fresh launch on a device that has just installed the app. Home should show four empty-state rows.
2. Tap `SearchEntry` → type `iron` → see *Iron Garden* in results.
3. Tap *Iron Garden* → NovelDetails shows description, 10 chapters.
4. Tap Chapter 1 → Reader loads body of `n3-c01` within ~1 second.
5. Scroll halfway → back out two screens to Home.
6. Home now shows *Iron Garden* in **Continue Reading** and **Recently Opened**.
7. Tap *Iron Garden* in Continue Reading → reopens the same chapter at the saved scroll position (off-by-one pixel is acceptable).

### Database (use SQLite browser or temporary console log in dev mode)

```sql
SELECT COUNT(*) FROM progress;                      -- ≥ 1
SELECT type, COUNT(*) FROM events GROUP BY type;    -- search, novel_open, chapter_open, chapter_read, session
SELECT body IS NOT NULL FROM chapters
  WHERE novel_id='n3' AND chapter_id='n3-c01';      -- 1
```

### Static checks

```
npx tsc --noEmit
npm run lint
npx expo export --platform ios
```

All three must exit 0 and the iOS bundle must compile without warnings about the new files.

## Out of scope (handed to Phase C)

- ReaderSettingsSheet and TTSSettingsSheet — Phase B reads using whatever defaults `settingsStore` already holds.
- Real `downloader` service — `Download all` only enqueues; bodies are materialized lazily via `readerLoad` until Phase C.
- DownloadsScreen UI beyond the Phase A placeholder.
- Settings screen edits — Phase B leaves settings read-only.
- Sheet animations — Phase B uses plain `<View>` translations; Phase C swaps in Reanimated.
- Charts and analytics views — Phase D.

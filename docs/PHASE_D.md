# Phase D — Local-only Dashboard

> **Status:** planned.
> **Prev:** [PHASE_C.md](./PHASE_C.md) · **Index:** [ROADMAP.md](./ROADMAP.md)

## Goal

Turn the `events` table — which Phases B and C have been populating with `search`, `novel_open`, `chapter_open`, `chapter_read`, `tts_start`, `tts_stop`, and `session` rows — into an honest, on-device reading dashboard. No network. No analytics service. The user can see their own behavior, and only their own behavior, computed live from the local DB.

This phase is the smallest of the four. It introduces a single new service (`analytics.ts`), several presentational components, and replaces `app/dashboard.tsx`.

## Exit criteria

- DashboardScreen renders all of:
  - Range picker (Today / 7 days / 30 days / All time)
  - Metric cards: searches, novel opens, chapters read, TTS minutes, average session minutes
  - Top-5 novels by `novel_open` count for the selected range
  - Drop-off chart per chapter index for a selected novel
  - (Dev mode only) live event stream preview of the most recent 20 events
- With zero events the screen shows a clean empty state ("Use the app a bit and come back").
- Switching range re-runs the queries and updates all cards within ~200 ms on the test device.
- `npx tsc --noEmit`, `npm run lint`, `npx expo export --platform ios` succeed.

## New files

### Service — `src/services/analytics.ts`

A thin computational layer between the dashboard UI and `eventRepo`. Pure functions, no React state.

```ts
export type Range = 'today' | '7d' | '30d' | 'all';

export interface Summary {
  searches: number;
  novelOpens: number;
  chaptersRead: number;
  ttsMinutes: number;
  averageSessionMs: number;
  totalEvents: number;
}

export const analytics = {
  rangeBoundMs(range: Range): number | undefined,   // ms since epoch lower bound, undefined for 'all'
  summary(range: Range): Promise<Summary>,
  topNovels(range: Range, n?: number): Promise<{ novel: Novel; count: number }[]>,
  dropOffByChapter(novelId: string): Promise<{ idx: number; opens: number; reads: number }[]>,
  ttsMinutes(range: Range): Promise<number>,
  averageSessionMs(range: Range): Promise<number>,
  recentEventStream(limit?: number): Promise<AnalyticsEvent[]>,
};
```

Implementation notes:

- `summary` calls `eventRepo.countByType` once per relevant event type plus `eventRepo.sumDurationByType('tts_start')` (or `tts_stop`, whichever carries duration in Phase C — pick one and document inside the file).
- `topNovels` extends `eventRepo.topNovels` with a `sinceMs` parameter; that may require a new repo method (`eventRepo.topNovelsSince`) — add it during Phase D.
- `dropOffByChapter` joins the chapter list for the novel with `eventRepo.chapterOpensByNovel`; "reads" = events where `type='chapter_read'`.
- `averageSessionMs` reads all `session` events with `duration_ms IS NOT NULL` since the range start and averages.
- `rangeBoundMs('today')` returns the local midnight ms (use `dayjs().startOf('day').valueOf()`).

### Dashboard components — `src/components/dashboard/`

| File | One-liner |
|---|---|
| `MetricCard.tsx` | Big stat tile: label (small uppercase), value (large), trend label (optional sub-line, Phase D shows raw range). Variants for emphasis (`primary`, `muted`). |
| `RangePicker.tsx` | Segmented pill bar with four options: Today / 7d / 30d / All. Calls `onChange(range)`. |
| `TopNovelsList.tsx` | Vertical list of up to 5 novels with their opens count. Each row is pressable → `/novel/[id]`. |
| `DropOffChart.tsx` | Bar chart of chapter index vs `opens` (and a lighter overlay for `reads`). Uses `victory-native` if available; otherwise falls back to a hand-rolled `react-native-svg` bar renderer (defined in `DropOffChartFallback.tsx`). Has an internal picker for which novel to inspect (defaults to the user's most-opened novel for the range). |
| `DropOffChartFallback.tsx` | The svg-only fallback renderer for `DropOffChart`. Pure presentational, takes the same `data` prop. |
| `EventStreamPreview.tsx` | Dev-only. List of the most recent 20 events with type, timestamp (`shortDate`), and a short payload preview. Refreshes every 2 s. |
| `DashboardEmptyState.tsx` | Friendly empty surface when `totalEvents === 0`. Includes a CTA "Open a novel" that pushes `/search`. |

### Repo extension — `src/db/repositories/eventRepo.ts` (modified, not new)

Add the range-bound variants needed by `analytics.ts`:

```ts
async countByTypeSince(type: EventType, sinceMs?: number): Promise<number>
async sumDurationByTypeSince(type: EventType, sinceMs?: number): Promise<number>
async topNovelsSince(byType: EventType, sinceMs?: number, limit?: number): Promise<{ novelId: string; count: number }[]>
async averageDurationByType(type: EventType, sinceMs?: number): Promise<number>
```

Each accepts an optional `sinceMs`; if omitted, the query has no time clause. Reuse the existing `countByType` shape — these are sibling functions.

## Files modified

### `app/dashboard.tsx`

Replace the Phase A summary with the full screen:

```
<ScrollView>
  <RangePicker value={range} onChange={setRange} />

  { totalEvents === 0
    ? <DashboardEmptyState />
    : (
      <>
        <View row wrap>
          <MetricCard label="Searches" value={summary.searches} />
          <MetricCard label="Novel opens" value={summary.novelOpens} />
          <MetricCard label="Chapters read" value={summary.chaptersRead} />
          <MetricCard label="TTS minutes" value={summary.ttsMinutes} />
          <MetricCard label="Avg session (min)" value={summary.averageSessionMs / 60000} />
        </View>

        <SectionHeader>Top novels</SectionHeader>
        <TopNovelsList items={topNovels} />

        <SectionHeader>Drop-off</SectionHeader>
        <DropOffChart range={range} />

        { devMode && (
          <>
            <SectionHeader>Recent events</SectionHeader>
            <EventStreamPreview />
          </>
        )}
      </>
    )
  }
</ScrollView>
```

Run `analytics.summary(range)` and `analytics.topNovels(range)` whenever `range` changes (use a small `useEffect` with the range as a key). Show a small inline loading spinner while a transition is in flight.

### `src/bootstrap.ts` (no functional change)

No new long-running workers in Phase D. The existing `session` event recorded at app launch is sufficient input for "Avg session (min)".

## Data flow

```
range change
  → analytics.summary(range)
      → eventRepo.countByTypeSince('search', boundMs)
      → eventRepo.countByTypeSince('novel_open', boundMs)
      → eventRepo.countByTypeSince('chapter_read', boundMs)
      → eventRepo.sumDurationByTypeSince('tts_start', boundMs)  // or tts_stop
      → eventRepo.averageDurationByType('session', boundMs)
  → analytics.topNovels(range)
      → eventRepo.topNovelsSince('novel_open', boundMs, 5)
      → novelRepo.getById for each → drop null entries
  → DropOffChart: when active novel changes →
      → analytics.dropOffByChapter(novelId)
      → eventRepo.chapterOpensByNovel(novelId)
      → joined with chapterRepo.listByNovel(novelId) to ensure missing-idx chapters render as zero
```

## Charts decision

Default attempt: install `victory-native@latest` via `npx expo install victory-native` (it brings `react-native-svg` as a peer, also installed via `expo install`). If `expo-doctor` complains about an incompatibility for SDK 55, fall back to the in-house `DropOffChartFallback` that renders bars directly with `react-native-svg`. Either way the public `DropOffChart` API stays the same.

Document the chosen library in a short note at the top of `DropOffChart.tsx`:

```ts
// Charts via victory-native@<version>.
// See PHASE_D.md "Charts decision". Fallback: DropOffChartFallback (react-native-svg).
```

## Edge cases

| Case | Handling |
|---|---|
| Zero events at all | `DashboardEmptyState` with CTA to `/search`. |
| Range with zero matching events | Show all metric cards with `0`; no chart. |
| `novel_open` event for a novel that was deleted from `novels` | `analytics.topNovels` filters out null lookups; `EventStreamPreview` displays the raw novel_id with a muted "(deleted)" suffix. |
| Future timestamps from a bad system clock | Clamp `created_at` to `min(created_at, Date.now())` in display. Don't rewrite the DB row. |
| `tts_start` written without a matching `tts_stop` (crash, kill) | Skip rows where `duration_ms IS NULL` in the TTS sum. Don't fabricate durations. |
| User clears DB mid-view | Subscribed effect notices `totalEvents` dropped to 0 and switches to the empty state on next focus. |
| Drop-off chart for a novel with one chapter | Render the one bar; chart is allowed to look sparse. |

## Verification

### Manual

1. Use the app for ~5 minutes after Phase C ships: search 2–3 terms, open 3–4 novels, read parts of 5–6 chapters, play TTS for at least a minute total.
2. Open the Dashboard.
3. Range = `All time` → all five metric cards are non-zero.
4. Switch to `Today` → all cards re-render; values are ≤ "All time".
5. Top novels list shows the novel you opened most.
6. Drop-off chart picker is preset to the most-opened novel; bars are highest at idx 1 and taper.
7. Toggle dev mode in Settings → reopen Dashboard → event stream preview shows the most recent 20 events.
8. Clear DB from Developer panel → re-enter Dashboard → empty state with the search CTA.

### Static checks

```
npx tsc --noEmit
npm run lint
npx expo export --platform ios
```

All exit 0. iOS bundle compiles with the chart library.

## Out of scope

- Any network call. Dashboards never phone home.
- Sharing / export of analytics — not in Phase 1.
- Cross-device aggregation — Phase 2 if sync ever lands.
- Per-chapter heatmap (would require richer scroll-position events than Phase B persists). Defer.
- Real-time chart updates while the user is actively reading — re-runs on focus is fine for Phase 1.

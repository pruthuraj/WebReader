# Phase C — Polish

> **Status:** planned.
> **Prev:** [PHASE_B.md](./PHASE_B.md) · **Index:** [ROADMAP.md](./ROADMAP.md) · **Next:** [PHASE_D.md](./PHASE_D.md)

## Goal

Promote the Phase B reading loop from "usable demo" to "comfortable to use for an hour." Phase C adds editable reader appearance, working Text-to-Speech, a real download queue, the Settings screen, and motion that makes the app feel native.

## Recommended internal build order

Phase C is the largest phase in the roadmap; ship it as five sequential checkpoints, each independently shippable and verifiable. The whole phase is "done" only when C5 lands.

| Step | Scope | Why this order |
|---|---|---|
| C1 | `ReaderSettingsSheet` + the visible `ReaderProgress` strip | Smallest blast radius. No new services, no new background workers. Validates the sheet-animation primitive on something low-risk. |
| C2 | Editable `SettingsScreen` (Reader defaults, TTS defaults, Downloads prefs, Developer panel) | Same Zustand surface as C1, just exposed app-wide. Adds dev panel that everything else benefits from (clear DB, force reseed, dump events). |
| C3 | `services/tts.ts` + `TTSSettingsSheet` + TTS event recording | Audio path is independent of downloads; build it next so dashboard TTS minutes have data by Phase D. |
| C4 | `services/network.ts` + `services/downloader.ts` + `DownloadsScreen` UI + per-chapter enqueue | Largest moving piece. Touches concurrency, network state, and queue UI. Build only after settings + dev panel exist so toggling wifi-only / clearing failed items is easy during development. |
| C5 | Animations sweep (sheet polish, list enter, chapter cross-fade, button press scale) | Pure-presentational. Lands last so we never re-tune animations against a moving target. |

Each step gets its own commit (or PR). `tsc --noEmit`, `npm run lint`, and an iOS bundle must stay clean at every step.

## Exit criteria

- Reader appearance is editable from the Reader itself (sheet) and persists across launches (`kv_settings`).
- TTS plays a chapter aloud, with at least: play / pause / resume / stop, speed, pitch, voice picker, sleep timer.
- DownloadsScreen visually shows queue progression `queued → downloading → done` (and `failed` with retry).
- SettingsScreen is fully editable; reader and TTS defaults flow back into the stores.
- Wifi-only flag actually gates the downloader: queue pauses when offline / not on wifi (if enabled).
- `npx tsc --noEmit`, `npm run lint`, `npx expo export --platform ios` succeed.
- All animations: sheet slide-up, list enter, chapter cross-fade, button press scale — visible and never frame-spike on a low-end device.

## New files

### Reader — `src/components/reader/`

| File | One-liner |
|---|---|
| `ReaderSettingsSheet.tsx` | Bottom sheet exposing the full `ReaderAppearance` shape. Sliders for font size (range from `readerFontSizes`) and line height (`readerLineHeights`); pickers for theme (light/dark/sepia) and font family (system/serif/sans/mono); segmented control for alignment (left/justify); slider for horizontal margin; slider for brightness (uses `expo-brightness`); switch for keep-awake (`expo-keep-awake`). Writes through `settingsStore.update({ readerDefaults: ... })` and pushes the same change into the live `readerStore.setAppearance` so the underlying ReaderContent updates immediately. |
| `TTSSettingsSheet.tsx` | Bottom sheet with TTS controls. Top row: Play / Pause / Resume / Stop. Below: speed slider (`0.5×–2.0×`), pitch slider (`0.5–2.0`), voice picker (lists `Speech.getAvailableVoicesAsync()` filtered by current language), language picker (top 8 commonly available), auto-play-next toggle, sleep timer picker (Off · 5 · 15 · 30 · 60 min · End of chapter), highlight-current-sentence toggle, background-playback toggle. All actions delegate to `services/tts.ts`. |
| `ReaderProgress.tsx` | Thin sticky strip at the top of the reader. Two elements: a `1.5px` progress bar and a small percent label. Re-renders from `readerStore.scrollOffset` derived against `contentHeight`. |

### Downloads — `src/components/downloads/`

| File | One-liner |
|---|---|
| `DownloadRow.tsx` | A row representing one chapter in the queue. Shows novel + chapter title, current status pill (`queued`/`downloading`/`done`/`failed`), and a context action: Retry (failed), Cancel (queued/downloading), Delete (done), Open (done). Long-press to copy the chapter id (dev only). |
| `QueueSummary.tsx` | Sticky header showing counts per status plus a "Retry all failed" button. |

### Settings — `src/components/settings/`

| File | One-liner |
|---|---|
| `SettingsSection.tsx` | A titled group (`<Text>` heading + bordered container). Used to chunk Reader / TTS / Downloads / Developer settings. |
| `SettingsRow.tsx` | A single row primitive supporting variants: `switch`, `slider`, `picker`, `tap`. Reads its current value, calls a single `onChange` callback. |
| `DeveloperPanel.tsx` | Internal-only section. Buttons: "Clear DB" (`resetDb()`), "Force reseed" (`seedIfEmpty()`), "Show pending events count", "Dump last 50 events" (`eventRepo.recent(50)` printed to console). Visible only when `settingsStore.settings.devMode` is true. |

### Services — `src/services/`

| File | One-liner |
|---|---|
| `tts.ts` | Wrapper around `expo-speech`. Exports `play(text, opts)`, `pause()`, `resume()`, `stop()`, `getVoices()`, `subscribe(listener)`. Internally splits text via `splitSentences()` (regex on `.!?` followed by whitespace/EOF, careful with abbreviations), keeps a `currentSentenceIdx`, fires status events. Handles `onBoundary` (iOS) and falls back to wall-clock estimation on Android when boundary isn't available. **Analytics contract:** on each `play()` it records a `tts_start` event (no `duration_ms`) and stamps `Date.now()` on a local `playStartedAt`; on `stop()` (whether user-triggered, end-of-text, or sleep-timer-driven) it records a `tts_stop` event with `duration_ms = now - playStartedAt`. Pause/resume do **not** emit `tts_start`/`tts_stop` — they accumulate into the same span. Phase D reads `duration_ms` only from `tts_stop` rows. |
| `downloader.ts` | Long-running queue runner. On start, polls `downloadQueueRepo.listByStatus('queued')` at most every 500 ms; runs up to 2 concurrent items via a small in-memory worker pool. Each worker: read item → check `services/network.shouldAllowDownload(settingsStore.settings.wifiOnlyDownloads)` → if not allowed, leave queued and bail → else `catalogue.getChapter` → `chapterRepo.setBody` → `downloadQueueRepo.setStatus('done')` → `downloadStore.refresh`. Errors set status `'failed'` with the message string. |
| `network.ts` | Wraps `expo-network`. Exports `isOnline()`, `isWifi()`, `shouldAllowDownload(wifiOnly: boolean)`. Subscribes to network changes via `Network.addNetworkStateListener`; pushes updates to a small subscriber list so `downloader.ts` can re-evaluate the queue when state changes. |

### Hooks — `src/hooks/`

| File | One-liner |
|---|---|
| `useAnimatedSheet.ts` | Reanimated-based slide-up bottom sheet primitive. Returns `{ ref, open, close, animatedStyle, isOpen }`. Backdrop fades 0→0.4 opacity over 200ms; sheet translates from `+screenHeight` to its content height with spring stiffness ~180. Drag-to-dismiss with a velocity threshold. |
| `useSleepTimer.ts` | `useSleepTimer(active, durationSec, onElapsed)`. Maintains a countdown, exposes `{ remaining }`, calls `onElapsed` exactly once when the timer expires (used by TTSSettingsSheet to call `tts.stop()`). |

## Files modified

### `app/reader/[novelId]/[chapterId].tsx`

- Mount `ReaderSettingsSheet` and `TTSSettingsSheet` as siblings of the content; both are controlled by local state `{ showReaderSheet, showTtsSheet }`.
- Add two floating action buttons in the bottom-right corner: `Aa` (appearance) and `▶` (TTS). They open the corresponding sheets.
- Wrap `ReaderContent` in an `Animated.View` that cross-fades when `chapterId` changes (250 ms).
- Pass a `highlightedSentenceIdx` prop down so `ReaderContent` can underline / background-highlight the spoken sentence when TTS is playing.

### `app/downloads.tsx`

Replace placeholder. Render `QueueSummary` + four `SectionList` sections (queued / downloading / done / failed) of `DownloadRow`. Subscribes to `useDownloadStore` and refreshes every 1 s while any item is in `queued` or `downloading`. Pull-to-refresh forces an immediate `downloadStore.refresh()`.

### `app/novel/[id].tsx`

- Add a small download icon to each `ChapterListItem` that enqueues the single chapter.
- Promote the `NovelHeader` "Download all" action to actually enqueue all not-yet-downloaded chapters in order.
- A small toast confirms enqueue ("10 chapters queued").

### `app/settings.tsx`

Replace read-only display with `SettingsSection` groups, each populated with `SettingsRow` instances bound to `settingsStore.update`:

```
[Reader defaults]
  font size (slider) · line height (slider) · font family (picker) · theme (picker)
  alignment (segmented) · margin (slider) · keep awake (switch)

[TTS defaults]
  speed (slider) · pitch (slider) · language (picker) · auto-play next (switch)

[Downloads]
  wifi-only (switch) · auto-retry failed (switch)
  ⟶ "Clear download queue" button (queued + failed entries)

[Developer]                        // visible when devMode = true
  Clear DB · Force reseed · Show pending events · Dump last 50 events
```

### `src/stores/ttsStore.ts`

Stop being a pure state container; route actions through `services/tts.ts`:

```ts
play: async (text) => { ttsStore.setStatus('playing'); await tts.play(text, { speed, pitch, voiceId, language, onSentence: (idx) => set({ highlightSentenceIdx: idx }) }); },
pause: () => { tts.pause(); set({ status: 'paused' }); },
resume: () => { tts.resume(); set({ status: 'playing' }); },
stop: () => { tts.stop(); set({ status: 'idle', highlightSentenceIdx: null }); }
```

### `src/bootstrap.ts`

After the existing pipeline, kick off the long-running background workers:

```ts
network.start();              // subscribe to expo-network state
downloader.start();           // begin the queue loop
```

Both expose `.stop()` for `useEffect` cleanup in a parent (currently only the root layout, so just call once).

### `src/components/reader/ReaderContent.tsx`

Add `highlightedSentenceIdx?: number | null` prop. When set, split the body by sentence at render time (memoized) and apply a subtle background highlight to the matching `<Text>` span. When null, render as Phase B did.

## Animations checklist

| Where | What | Implementation |
|---|---|---|
| ReaderSettingsSheet / TTSSettingsSheet open/close | Slide-up + backdrop fade | `useAnimatedSheet` (spring) |
| Search results list | Fade + slight Y on enter | `Animated.View` with `FadeInDown` from `react-native-reanimated` |
| Chapter change in Reader | Cross-fade between bodies | Local `useSharedValue` opacity, swap text on midpoint |
| DownloadRow status change | Color fade between badge variants | Animated background interpolation, 200 ms |
| All pressable buttons | Press-in scale 0.96 / opacity 0.85 | `Pressable` style callback or `useAnimatedStyle` |

The animations should never block interactivity; everything runs on the UI thread via Reanimated worklets where possible.

## Edge cases

| Case | Handling |
|---|---|
| TTS voice not available for chosen language | `services/tts.ts` picks the OS default voice for the language; falls back to the device default voice if that also fails; UI shows a small "Using default voice" hint. |
| TTS interrupted by phone call | OS pauses speech automatically; on next `play` we resume from the current sentence index. Background-playback flag only relevant when the user enables it; iOS requires `UIBackgroundModes` (defer to a dedicated config doc if/when implemented). |
| Sleep timer hits 0 mid-utterance | Wait for current sentence boundary (or 1 s timeout), then `stop()`. |
| Wifi-only enabled while items are mid-download | Workers finish their current item, then refuse to pick new ones. The queue stays `queued`; status pill changes to `paused` (visual only — DB stays `queued`). |
| 100 items queued at once | Concurrency is still 2. UI shows "X downloading, Y queued, Z done" in `QueueSummary`. |
| Multiple "Download all" presses | Idempotent — `downloadQueueRepo.enqueue` is an upsert; items already `done` stay `done`. |
| `expo-brightness` not authorized on iOS | Catch the error from `setBrightnessAsync` and show a small disabled state hint; do not crash. |
| User clears DB while TTS playing | `tts.stop()` is called as part of `Clear DB` cleanup. |
| `expo-speech` queue stuck | `stop()` calls `Speech.stop()` and resets `currentSentenceIdx`. |

## Verification

### Manual

1. Open any chapter → tap `Aa` → ReaderSettingsSheet slides up.
2. Increase font size to 24, switch theme to sepia → ReaderContent updates live.
3. Close sheet; close app; reopen; navigate back to same chapter → still 24 / sepia.
4. Tap `▶` → TTSSettingsSheet appears → Play → audio comes out → speed slider to `1.5×` → speech speeds up after the current sentence.
5. Set sleep timer to 1 minute → wait → audio stops on next sentence boundary.
6. From NovelDetails of *Iron Garden* → "Download all" → DownloadsScreen shows 10 items moving through `queued → downloading → done`. Force one to fail (toggle airplane mode mid-download) → status shows `failed` → tap Retry → completes after re-enabling network.
7. Settings → toggle Wifi-only on → enable airplane mode → enqueue chapters from any novel → queue stays at `queued`. Disable airplane mode (still wifi) → queue proceeds.
8. Settings → DeveloperPanel → "Clear DB" → app navigates back to a fresh seed state.

### Database

```sql
SELECT key FROM kv_settings WHERE key = 'settings.v1';   -- one row
SELECT type, COUNT(*) FROM events GROUP BY type;         -- adds tts_start, tts_stop
SELECT status, COUNT(*) FROM download_queue GROUP BY status;  -- mostly 'done', some 'failed' if you forced it
```

### Static checks

```
npx tsc --noEmit
npm run lint
npx expo export --platform ios
```

All exit 0.

## Out of scope (handed to Phase D)

- The Dashboard screen still shows Phase A's basic counts; Phase D rebuilds it.
- TTS background playback config (`UIBackgroundModes`) — opt-in feature, document only if user requests.
- Cross-device sync of `kv_settings` / `progress` — explicitly Phase 2.
- Long-form chapter virtualization in ReaderContent — only if Phase 2 introduces ≥5 k-word chapters.

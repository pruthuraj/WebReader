# Remaining work — ongoing tracker

> **Index:** [ROADMAP.md](./ROADMAP.md) · **Last shipped commit:** `7da1a75` (Group E residuals — Phase 1 complete)
> **Audience:** any agent or engineer picking up the project mid-stream. Read this top-to-bottom to know what's left.

## What's already shipped (skip)

| Phase                                                                                                                                           | Commit    | Status |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------ |
| Phase A · Foundation                                                                                                                            | `127b9ff` | done   |
| Phase B · Core reading flow                                                                                                                     | `dbd0e1e` | done   |
| Phase C · Polish + persistent playback bar + dark sheets                                                                                        | `85204f2` | done   |
| Reader UI cleanup (drop popup, double-tap fix, conditional Stop)                                                                                | `912254c` | done   |
| Bottom tabs + reader header redesign (⋮ menu, chapter chevrons)                                                                                 | `344b4f8` | done   |
| TTS Settings Priority 1 (play / pause / resume / stop, speed, pitch, language, voice, sleep, auto-play, sentence highlight, double-tap-to-read) | various   | done   |
| Phase D · Local-only Dashboard (D1–D4)                                                                                                          | `f5a2347` | done   |
| TTS Settings Priority 2 (cleaning toggles, sentence pause, auto-start, EOC sleep, paragraph/comma highlight)                                    | `6151260` | done   |
| TTS Settings Priority 3 (pronunciation rules CRUD + schema v2 + dedicated screen)                                                               | `326cf3e` | done   |
| TTS Settings Priority 4 (Android intents, playlist, auto-advance, background-playback flag, network-voice hint)                                 | `644a147` | done   |

## Remaining work — by group

The four groups below are independent. Pick one at a time; do not interleave.

---

### Group A · Phase D — Local-only Dashboard **(SHIPPED)**

**Source of truth:** [PHASE_D.md](./PHASE_D.md).
**Status:** done. All four sub-steps landed in a single commit on top of `5311a9e`.

| Step | New files | Status |
|---|---|---|
| **D1** — analytics summary + MetricCard + RangePicker | `src/services/analytics.ts`, `src/components/dashboard/MetricCard.tsx`, `src/components/dashboard/RangePicker.tsx` | done |
| **D2** — TopNovelsList | `src/components/dashboard/TopNovelsList.tsx` + `eventRepo.topNovelsSince` | done |
| **D3** — EventStreamPreview (dev-mode only) | `src/components/dashboard/EventStreamPreview.tsx` | done |
| **D4** — DropOffChart | `src/components/dashboard/DropOffChart.tsx` (hand-rolled `react-native-svg` bars; victory-native intentionally skipped as oversized for one chart) | done |

`app/dashboard.tsx` is now the full screen: `RangePicker` + 5 `MetricCard` (searches / novel opens / chapters read / TTS minutes / avg session) + `TopNovelsList` + `DropOffChart` + dev-only `EventStreamPreview` + `DashboardEmptyState` when `summary.totalEvents === 0`.

`eventRepo` gained `topNovelsSince`, `sumDurationByType(sinceMs)`, and `averageDurationByType(sinceMs)`. `react-native-svg` was added via `npx expo install` (no doctor warnings).

---

### Group B · TTS Settings Priority 2 **(SHIPPED)**

**Source of truth:** [TTS_SETTINGS.md](./TTS_SETTINGS.md) sections 1 / 4 / 5 / 7.
**Status:** done. Landed in a single commit on top of `f5a2347`.

| Sub-task | Notes |
|---|---|
| `cleanSentence(s, opts)` pipeline | Per-sentence filter in `src/services/tts.ts`. 10 toggles: symbols / emojis / superscript / URLs / `[…]` / `(…)` / spaced-uppercase collapse / hyphens / line-break hyphens / linked refs. |
| Pause between sentences | Chip picker (Off · 100 · 200 · 400 · 800 ms). `services/tts` sleeps via `setTimeout` between `Speech.speak` calls. |
| Auto-start reading on chapter open | `ttsDefaults.autoStartOnOpen` toggle. Reader screen kicks off `playFromSentence(body, 0, …)` when status is idle on chapter load. |
| End-of-chapter sleep | New `"eoc"` chip on the sleep-timer row. `armSleepTimer` skips the countdown for EOC; the `onEnd` path already stops at chapter end. |
| Paragraph highlight | `ReaderContent` computes paragraph index per sentence and highlights every sentence in the active paragraph. |
| Underline paragraph | Same as paragraph + adds `textDecorationLine: "underline"`. |
| Comma mode | `splitSentences(text, { commaMode: true })` splits on `,;.!?`. Service and renderer both honor it so indices stay aligned. |
| "Keep original color when highlighting" | Already the default — accent backgrounds only. No layout-reflow side effect. |

**Skip page header / page footer** intentionally deferred — see TTS_SETTINGS.md note. Per-sentence cleaning was the safer Phase 1 cut.

---

### Group C · TTS Settings Priority 3 — Pronunciation Correction **(SHIPPED)**

**Status:** done. Schema v2 + repo + screen + cleaner integration landed in a single commit on top of `6151260`. Import/export deferred (optional/last per spec).

**Shipped:**
- Schema v2: `pronunciation_rules` table (id PK auto, pattern, is_regex, replacement, language, case_sensitive, enabled, category, updated_at) + `idx_pronun_enabled_lang` + `idx_pronun_category`. Migration runner picks up version 1 → 2 cleanly.
- `pronunciationRepo`: `listAll`, `listEnabledForLanguage(lang)` (matches by full code or 2-char root), `search(query)`, `getById`, `upsert`, `setEnabled`, `remove`, `categories`, `count`, `countEnabled`.
- Cleaner: `cleanSentence(input, toggles, rules)` runs enabled rules after the regex toggle pipeline. Honors `is_regex` + `case_sensitive`; literal patterns are regex-escaped; bad user regex is silently skipped.
- `ttsStore.playbackOptions` is now async and pulls `pronunciationRepo.listEnabledForLanguage(state.language)` before each `play`/`playFromSentence`.
- Route: `app/tts-pronunciation.tsx` (root stack, no tabs). Search bar, category filter chips, per-row enable/edit/delete, FAB → modal editor with live preview against a fixed sample sentence.
- TTS sheet entry row: `Pronunciation rules → N active · M total` row pushes to the new screen and closes the sheet.

**Known typed-routes quirk:** `expo-router` regenerates `.expo/types/router.d.ts` on `expo start`, not on `expo export`. The new `/tts-pronunciation` route is added to the d.ts only after the next `npm run start`. `TTSSettingsSheet` casts the route string to `never` so tsc passes in the meantime.

**Out of scope this commit (still queued):** import/export of rule sets (`src/services/pronunciation-io.ts` + `expo-document-picker`).

**Source of truth:** [TTS_SETTINGS.md](./TTS_SETTINGS.md) section 3.

Largest single piece of remaining Phase 1 work. Introduces a new SQLite table and a dedicated screen — the TTS bottom sheet outgrows its size at this point.

| Sub-task                           | Notes                                                                                                                                                                                                                                                                        |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Schema migration                   | Bump `SCHEMA_VERSION` to 2 in `src/db/schema.ts`. Add `pronunciation_rules` table with `id`, `pattern`, `is_regex`, `replacement`, `language`, `case_sensitive`, `enabled`, `category`, `updated_at`. Add `idx_pronun_enabled_lang` index.                                   |
| Repository                         | New `src/db/repositories/pronunciationRepo.ts` with `list`, `listByCategory`, `search(query)`, `upsert`, `delete`, `setEnabled`.                                                                                                                                             |
| Settings screen                    | New `app/settings/tts-pronunciation.tsx` (top-level under `(tabs)/settings` → row → push). Search bar (matches `pattern` + `replacement`); category filter chips; "Add rule" button; per-row enable / edit / delete; "Test" button reads the rule against a sample sentence. |
| Cleaner integration                | Extend `services/tts.cleanText(input, settings)` to apply enabled rules whose `language` matches the active TTS language (or is NULL). Run after the Section-4 skip pipeline, before whitespace normalize.                                                                   |
| Settings entry                     | Add a new row inside the TTS settings sheet: "Pronunciation rules → 24 active" tapping pushes to the new screen.                                                                                                                                                             |
| Import / export _(optional, last)_ | `src/services/pronunciation-io.ts` with `exportRules()` and `importRules(json)` using `expo-document-picker`. JSON schema `webreader-pronunciation-v1.json`. Conflict policy: skip duplicates on `(pattern, language)` unless overwrite confirmed.                           |

**Exit criteria:**

- Add 3 rules, restart app, rules persist and apply to TTS playback.
- Disabling a rule mid-session takes effect on the next `play` call.
- Delete confirmation prevents accidental loss.
- Category filter + search both narrow the list correctly.
- Migration is forward-only — old `webreader.db` files from before bump receive the new table on first launch without losing data.

---

### Group D · TTS Settings Priority 4 — Device + Engine **(SHIPPED, partial)**

**Status:** done for everything that fits Expo Go. Bluetooth pause/resume and the Android foreground-service for true background playback both need a prebuild and are documented as future work.

**Shipped:**
- `services/intent.ts` wraps `expo-intent-launcher` with `openTtsSettings`, `openVoiceDataSettings`, `openBatteryOptimization`, `openGoogleTtsListing`. Each call no-ops on iOS and returns a boolean so UI can show a toast on failure.
- `stores/playlistStore.ts` — in-memory `usePlaylistStore` with `queue`, `enqueue`, `enqueueMany`, `removeAt`, `removeByKey`, `clear`, `popNext`, `has`. No DB persistence (Phase 2).
- Reader auto-advance: when TTS transitions playing/paused → idle, the reader pops the next playlist item or, if `autoPlayNext` is on, navigates to `neighbors.next`. Suppressed when sleep timer is `"eoc"`.
- TTS sheet additions:
  - Listening queue section (count display + Add current + Add next + Clear queue).
  - Device & engine collapsible section with: Background playback toggle (stored in `ttsDefaults.backgroundPlayback`, doc-only behavior until prebuild), Open TTS engine settings, Download more voices, Update Google TTS engine, Disable battery optimization. All four intents disabled with hint on iOS.
  - Bluetooth pause/resume row rendered as a static note explaining the native-module gap.
  - Voice picker labels enhanced voices with a `· HQ` suffix and includes a Wi-Fi caveat line.
- `ttsDefaults` gains `backgroundPlayback: boolean` (default false), wired through `mergeTtsDefaults`.

**Still future work** (track here, not in a new group):
- Real Bluetooth pause/resume — needs `react-native-bluetooth-state-manager` (or platform listeners) and a prebuild. Permission-gate `BLUETOOTH_CONNECT`.
- iOS background playback — `app.json` `ios.infoPlist.UIBackgroundModes: ["audio"]` + `expo-av`/`expo-audio` `AVAudioSession` category `playback`.
- Android foreground service for background playback — small native module or `expo-task-manager` with FGS notification.
- Per-voice "needs Wi-Fi" detection — `expo-speech` does not expose `networkConnectionRequired`. Shipped fallback is the `HQ` suffix + a generic note.
- Pronunciation import/export (still deferred from Group C).

**Source of truth:** [TTS_SETTINGS.md](./TTS_SETTINGS.md) sections 2 / 6 / 8.

This group is largely platform-specific. Plan one commit per sub-task; do not bundle.

| Sub-task                               | Pending notes                                                                                                                                                                                                                                                                                                                                             |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bluetooth pause / resume               | New `src/services/bluetooth.ts`. Use the `expo-network` listener as a placeholder; full Bluetooth state requires a new dep (`expo-bluetooth` is not a thing — likely `react-native-bluetooth-state-manager` or platform-specific listeners). Permission gate: request `BLUETOOTH_CONNECT` only when the user enables the toggle; revert toggle if denied. |
| Battery-optimization warning (Android) | One-time banner shown when the user first enables auto-play-next or background playback. Banner has "Open battery settings" CTA → `ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` via `expo-intent-launcher`.                                                                                                                                               |
| Install more TTS engines (Android)     | Row in TTS sheet that fires `android.intent.action.MAIN` for `com.android.settings.TTS_SETTINGS`. Hidden on iOS.                                                                                                                                                                                                                                          |
| Download more voices (Android)         | Row that deep-links into the active engine's voice-data UI (per-engine intent). Hidden on iOS.                                                                                                                                                                                                                                                            |
| Update Google voice engine (Android)   | Play Store deep-link to `market://details?id=com.google.android.tts`. Hidden when the active engine isn't Google.                                                                                                                                                                                                                                         |
| Background playback                    | iOS: add `UIBackgroundModes: ["audio"]` to `app.json` `ios.infoPlist`, configure `AVAudioSession` category `playback` via `expo-audio` or `expo-av`. Android: foreground service notification with `expo-task-manager` or a small native module. Document the iOS setup in `docs/setup/`.                                                                 |
| Playlist / queue store                 | New `src/stores/playlistStore.ts` (in-memory only — DB-backed sync is Phase 2). State: `queue: { novelId, chapterId }[]`, `currentIdx`. Actions: `enqueue`, `removeAt`, `clear`, `moveTo(idx)`. Auto-advance on `onEnd` if non-empty.                                                                                                                     |
| Network-voice marker                   | Append a `· network` badge to voice picker rows whose `Voice.networkConnectionRequired === true`.                                                                                                                                                                                                                                                         |

**Exit criteria** (cumulative):

- Toggles disabled on unsupported platforms render with a one-line explanation.
- Permissions requested only at enable time, not at boot.
- Background playback survives ~5 minutes of screen-off (iOS) or app-backgrounded (Android with foreground service).
- Playlist auto-advances through 3 queued chapters end-to-end.

---

### Group E · Smaller residuals discovered along the way **(SHIPPED)**

Independent of the four big groups. All eight items landed across commits `c1fe7f4`, `52da790`, `b79cea5`, `7a53a9d`, `7da1a75`.

| Item                                                    | Where                                           | Shipped notes                                                                                                                                                       |
| ------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ~~Wifi-only flag respects current network state on enable~~ | `src/services/downloader.ts`                | `downloader.start()` now subscribes to `network` change events and triggers `tick()` on every flip. `stop()` unsubscribes.                                          |
| ~~`auto-retry failed` toggle~~                          | `src/services/downloader.ts`                    | `maybeRetryFailed()` runs at the head of each tick. Promotes `failed` rows back to `queued` on an exponential backoff (1s, 2s, 4s, … capped at 60s). Counts in-memory; relaunch resets. |
| ~~Pull-to-refresh on Home triggers full repo re-query~~ | `app/(tabs)/index.tsx`                          | In-flight ref guards `rows.refresh()` so rapid pulls coalesce instead of racing.                                                                                    |
| ~~`chapter_read` event recording threshold~~            | `app/reader/[novelId]/[chapterId].tsx`          | Replaced hardcoded `0.8` with `settings.chapterReadThreshold` (default 0.8, range 0.5–1.0). Stepper added under Settings → Reading insights.                        |
| ~~Cover gradient palette~~                              | `src/components/shared/CoverPlaceholder.tsx`    | Added sky / violet / teal / fuchsia / lime. Exported `supportedCoverHints` for enumeration.                                                                         |
| ~~Reader appearance brightness restore on unmount~~     | `app/reader/[novelId]/[chapterId].tsx`          | Mount/unmount effect reapplies stored brightness on enter and calls `Brightness.restoreSystemBrightnessAsync()` on leave.                                           |
| ~~Keep-awake cleanup~~                                  | `app/reader/[novelId]/[chapterId].tsx`          | Same effect calls `KeepAwake.deactivateKeepAwake("webreader-reader")` on unmount regardless of the toggle state.                                                    |
| ~~Search debouncing~~                                   | `app/(tabs)/search.tsx`                         | **Verified clean.** `recordSearchDebounced` throttles at 1000ms via `useDebouncedCallback`; URL params update only on submit / clear / filter / sort, not per keystroke; `lastRecordedQuery` ref dedupes identical trimmed queries. |

---

## Phase 2+ scope (explicitly out of Phase 1)

These are **not** in any of the groups above. Track here so they don't leak into Phase 1 work.

| Area                                                                          | Status  |
| ----------------------------------------------------------------------------- | ------- |
| FastAPI backend + REST surface                                                | Phase 2 |
| Server-side web scraping (with source-adapter + allowlist + rate-limit)       | Phase 2 |
| Cross-device sync (`sync_queue`, `sync_state` tables, event flush to backend) | Phase 2 |
| Cloud authentication / accounts                                               | Phase 2 |
| Push notifications                                                            | Phase 2 |
| Bookmarks / highlights / notes                                                | Phase 2 |
| Library shelves / categorization                                              | Phase 2 |
| Embedded web-page reading                                                     | Phase 2 |
| Cloud TTS engines                                                             | Phase 2 |

When any of these stop being "Phase 2", move the relevant row into the phase doc that picks it up — do not edit the cross-phase invariants in `ROADMAP.md` casually.

---

## Recommended order

1. ~~**Group A (Phase D)**~~ — **shipped.** Skip.
2. ~~**Group B (TTS P2)**~~ — **shipped.** Skip.
3. ~~**Group C (TTS P3 pronunciation)**~~ — **shipped.** Skip.
4. ~~**Group D (TTS P4 device + engine)**~~ — **shipped** (partial, see notes). Skip the remaining native-only items until a prebuild is on the table.
5. ~~**Group E residuals**~~ — **shipped.** Phase 1 is now feature-complete; the only deferred work is the native-prebuild slice of Group D documented above.

Each group exits when its own bullets pass, **and** the four standing static checks stay green:

```
npx tsc --noEmit
npm run lint
npx expo-doctor
npx expo export --platform ios --output-dir .expo-export-test
```

---

### Phase 2d · UI re-skin to the `ref/` dark-navy design **(in progress)**

**Source of truth:** `ref/*.jsx` (web prototype defining the dark-navy design language) +
the approved plan. Branch: `phase-2c-bookmarks-shelves` (or a new `phase-2d-ui-reskin`).

Port the ref's visuals + screens into the existing RN app, **reusing the current file
structure and data layer**. Logic stays; the look and the settings tree get rebuilt. This
group is explicitly authorized by the user and so supersedes the "don't add features beyond
the active group's doc" house rule for the items below.

**Locked decisions**

1. Scope = visual re-skin **+ build the ref's new screens** (Focus Blur, 7 TTS sub-pages,
   full settings detail pages).
2. App-chrome themes = **light / dark / dark-navy (default) / custom**. Reader keeps its own
   theme set (light / sepia / dark + new **oled**).
3. **Custom = full color editor** (user picks palette slots; persisted; app-wide).
4. **Fonts = reader text only** — bundle Lora, Inter, Raleway, Montserrat, Libre Caslon,
   Libre Baskerville (+ System); picker drives reader body/title font. App chrome font fixed.

**Sub-steps (one commit each, `feat(area): 2d-S# …`)**

| Step | Scope |
|---|---|
| **S1** | Theme foundation — `src/theme/appThemes.ts`, `global.css` `--app-*` vars, `tailwind.config.js` `app.*` tokens + font families, `settingsStore` (`appTheme`+`customPalette`), `ThemeProvider` rewrite (decouple chrome from reader theme), root-layout `useFonts`. |
| **S2** | Shared UI kit re-skin — CoverPlaceholder, headers, Tag/Chip, StatusBadge, SettingsSection/Row, reusable Stepper/Toggle/Segmented/Select/Slider; glass-navy bottom Tabs. |
| **S3** | Tab screens — Home, Search, Downloads, Settings (6-row list). |
| **S4** | Stack screens — NovelDetails, Dashboard, Reader. |
| **S5** | Reader sheets — ReaderOptionsSheet, ReaderSettingsSheet, TTSSettingsSheet. |
| **S6** | Settings detail routes — `app/settings/{appearance,downloads,developer,about}.tsx`. |
| **S7** | TTS tree — `app/settings/tts/` root + playback / voice / pronunciation / cleaning / highlighting / queue / device. Reuse `ttsDefaults.cleaning`, `highlightMode`, `playlistStore`, `pronunciationRepo`. |
| **S8** | Focus Blur — `ReaderAppearance.focus`; `ReaderContent` dim/highlight (per-paragraph blur is **not** native to RN — focus uses dim/highlight, `blurAll` uses an `expo-blur` overlay); Focus sub-page + Appearance entry. |
| **S9** | Custom theme color editor in Appearance/Theme (live via `customPalette` + `vars()`). |

**No schema change expected** — all new settings persist through the existing `settings.v1`
kv blob via `settingsStore`. Bump `SCHEMA_VERSION` only if a table becomes necessary.

The ref's iOS device frame / keyboard (`ref/ios-frame.jsx`) is preview-only and is **not**
ported.

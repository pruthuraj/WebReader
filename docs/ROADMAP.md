# WebReader — Roadmap

## Product summary

WebReader is an offline-first Expo (React Native) mobile app for searching, reading, downloading, and listening to web novels. Phase 1 ships against a **local mock catalogue** (5 novels × 10 chapters) so the full reading loop — search, details, reader, progress tracking, downloads, TTS, and on-device analytics — can be exercised end-to-end before any backend exists. There is **no authentication** and **no network calls to a server** in Phase 1; the only network use is `expo-network` for the wifi-only download check. A future Phase 2 may layer a FastAPI backend, real source scraping, and (separately) optional cloud sync — those are explicitly out of scope below.

The single source of design truth for screens and responsibilities is [`SPEC.md`](./SPEC.md). The per-phase documents in this folder describe how that spec is realized incrementally.

## Phase status

| Phase | Title                                                      | Status               | Plan                       | Exit signal                                           |
| ----- | ---------------------------------------------------------- | -------------------- | -------------------------- | ----------------------------------------------------- |
| A     | Foundation: scaffold, persistence, navigation, seed        | **done** (`127b9ff`) | [PHASE_A.md](./PHASE_A.md) | App boots; DB has 5 seeded novels; 7 routes navigable |
| B     | Core reading flow: search → details → reader with progress | planned              | [PHASE_B.md](./PHASE_B.md) | Read a chapter, leave, return, resume at saved scroll |
| C     | Polish: reader settings sheet, TTS, downloader, animations | planned              | [PHASE_C.md](./PHASE_C.md) | Settings persist; TTS plays; downloads queue/retry    |
| D     | Local-only Dashboard from `events` table                   | planned              | [PHASE_D.md](./PHASE_D.md) | Metrics non-zero after real usage                     |
| 2a    | Live Sources — on-device adapters + config registry        | **implemented** (`phase-2a-live-sources`) | [PHASE_2A.md](./PHASE_2A.md) | Search/read a real Royal Road novel on device; backend deployed |
| 2c    | Bookmarks + Shelves (app-side library)                     | **implemented** (`phase-2c-bookmarks-shelves`) | [PHASE_2C.md](./PHASE_2C.md) | Bookmark a spot + jump back; add a novel to a shelf |
| 2d+   | Cloud sync, push, aggregate search (auth permanently out)  | **out of scope**     | —                          | —                                                     |

## Navigation shell

WebReader uses an Expo Router **tab group + root stack** layout:

```
app/
├── _layout.tsx                      root Stack
├── (tabs)/
│   ├── _layout.tsx                  bottom Tabs
│   ├── index.tsx                    Home   (tab 1)
│   ├── search.tsx                   Search (tab 2)
│   ├── downloads.tsx                Downloads (tab 3)
│   └── settings.tsx                 Settings  (tab 4)
├── novel/[id].tsx                   NovelDetails (root stack, no tabs)
├── reader/
│   └── [novelId]/[chapterId].tsx    Reader (root stack, no tabs)
└── dashboard.tsx                    Dashboard (root stack, no tabs)
```

The bottom tab bar is visible on Home / Search / Downloads / Settings only. NovelDetails, Reader, and Dashboard run inside the root stack so they get a back arrow and no tabs — they are detail / immersive screens. Dashboard is reachable from a "Reading insights" row inside Settings (no top-level tab).

## Recommended build order inside each phase

Each phase doc has a "Recommended internal build order" section; the short version is summarized here so the order is visible from the index.

**Phase B — Core reading flow**

```
B1  Shared primitives + useHomeRows skeleton
B2  HomeScreen rows wired to repos
B3  Search flow (SearchBar, SortControl, FiltersSheet, ResultCard)
B4  NovelDetails (header, description, chapter list)
B5  Reader + progress persistence/restoration
```

**Phase C — Polish (largest phase; ship in five commits)**

```
C1  ReaderSettingsSheet + visible ReaderProgress strip
C2  Editable SettingsScreen + Developer panel
C3  services/tts.ts + TTSSettingsSheet + TTS event recording
C4  services/network.ts + services/downloader.ts + DownloadsScreen + per-chapter enqueue
C5  Animations sweep (sheets, list enter, chapter cross-fade, button press)
```

**Phase D — Local-only dashboard**

```
D1  analytics.summary + MetricCard + RangePicker
D2  TopNovelsList (+ eventRepo.topNovelsSince)
D3  EventStreamPreview (dev-mode only)
D4  DropOffChart (+ react-native-svg fallback)
```

## TTS Settings extension (P1 shipped, P2–P4 deferred)

See [TTS_SETTINGS.md](./TTS_SETTINGS.md) for the full spec. Phase 1 ships **Priority 1 only**. P2–P4 land in subsequent commits without re-opening Phase C scope.

```
TTSSettings
├── Playback
│   ├── Play / pause / resume / stop          (P1, shipped)
│   ├── Auto-play next chapter                (P1, shipped)
│   ├── Sleep timer                           (P1 shipped · EOC option in P2)
│   ├── Pause between sentences               (P2)
│   ├── Double tap to read aloud              (P1, shipped)
│   └── Pause / resume behavior               (P4: navigation audio, Bluetooth)
│
├── Voice
│   ├── Language                              (P1, shipped)
│   ├── Voice selection                       (P1, shipped)
│   ├── Download more voices                  (P4, Android)
│   ├── Install more TTS engines              (P4, Android)
│   └── Update voice engine                   (P4, Android)
│
├── Pronunciation                             (entire section is P3)
│   ├── Pronunciation rules
│   ├── Rule categories
│   ├── Case-sensitive rules
│   └── Enable / disable rules
│
├── Text Cleaning                             (entire section is P2)
│   ├── Skip symbols / emojis / URLs
│   ├── Skip brackets / parentheses
│   ├── Skip headers / footers
│   └── Read main text only
│
├── Highlighting
│   ├── Highlight sentence                    (P1, shipped)
│   ├── Highlight word                        (P4, iOS boundary required)
│   ├── Highlight paragraph                   (P2)
│   ├── Underline paragraph                   (P2)
│   └── Comma mode                            (P2)
│
├── Queue / Playlist                          (entire section is P4)
│   ├── Add to playlist directly
│   ├── Download before playlist
│   ├── Continue from current position
│   └── Clear queue
│
└── Device Support                            (entire section is P4)
    ├── Background playback                   (iOS UIBackgroundModes / Android FGS)
    ├── Battery-optimization warning          (Android)
    ├── Bluetooth disconnect behavior
    └── Network-voice warning
```

## Cross-phase invariants

These are the rules you can cite when judging a borderline change:

- **Progress persistence ships in Phase B; the visible progress UI ships in Phase C.** The reader must restore scroll position from day one — but the on-screen progress strip can wait.
- **Lazy chapter-body materialization ships in Phase B; the real download worker (concurrency, retry, wifi-only) ships in Phase C.** The `DownloadedNovelsRow` in Phase B is sourced from lazy materialization only.
- **TTS event semantics: `tts_start` is a marker (no `duration_ms`); `tts_stop` carries the canonical `duration_ms`.** Pause/resume do not emit either; they fold into the active span. The Dashboard derives TTS minutes from `tts_stop.duration_ms` alone.
- **No network calls in Phase 1**, including from the Dashboard. `expo-network` is used solely for the wifi-only download check in Phase C.
- **Bookmarks are Phase 2+, not Phase 1.** Reading progress is required; bookmarks are not.
- **Bottom tabs are visible on the four main tabs only.** NovelDetails, Reader, and Dashboard hide tabs and run inside the root stack. Dashboard is not a tab — it is opened from inside Settings.

## Locked stack decisions

| Area          | Choice                                             | Notes                                                       |
| ------------- | -------------------------------------------------- | ----------------------------------------------------------- |
| Framework     | Expo SDK 55 (managed workflow)                     | Matches Expo Go on user's phone                             |
| Language      | TypeScript (strict)                                | `tsconfig.json` extends `expo/tsconfig.base`                |
| Routing       | Expo Router (file-based)                           | `app/` directory drives the route tree                      |
| Styling       | NativeWind v4 + Tailwind 3.4                       | `className` prop on RN primitives                           |
| Component lib | None imported yet                                  | Copy gluestack-ui v2 components on demand as we need them   |
| Animations    | `react-native-reanimated` v4                       | NativeWindUI-style primitives built in-house via Reanimated |
| State         | Zustand 5                                          | One store per concern; persistence via `kv_settings` table  |
| Local DB      | `expo-sqlite` (async API)                          | WAL mode; 6 tables; migration runner in `src/db/client.ts`  |
| TTS           | `expo-speech`                                      | Wrapped behind `services/tts.ts` (Phase C)                  |
| Network check | `expo-network`                                     | Used only for wifi-only download flag (Phase C)             |
| HTTP client   | `axios`                                            | Installed for Phase 2; unused in Phase 1                    |
| Auth          | None                                               | Not deferred — explicitly out of scope for this product     |
| Data source   | Local JSON: `src/data/mock/{novels,chapters}.json` | 5 × 10 = 50 chapter rows                                    |
| Dashboard     | Computed on-device from `events` table             | No analytics network calls, ever                            |

## How to use these docs

1. **Each phase document is the single source of truth for that phase.** When you start a phase, open the corresponding `PHASE_*.md` and execute it top to bottom. Do not improvise file paths or component names — adjust the doc first if you need to deviate.
2. **Cross-document changes are rare.** If a Phase B decision invalidates a Phase C item, edit `PHASE_C.md` in the same commit as the deviation.
3. **`SPEC.md` is frozen.** Treat it as the original product design. If a screen's responsibilities truly change, write the change into a phase doc — do not rewrite history in `SPEC.md`.
4. **Exit criteria are non-negotiable.** A phase is "done" when `tsc --noEmit` is clean, `expo-doctor` passes, the iOS bundle compiles, and every bullet under that phase's Verification section has been observed manually.

## Files in this folder

- [SPEC.md](./SPEC.md) — original design doc (screen-by-screen responsibilities). Frozen.
- [ROADMAP.md](./ROADMAP.md) — this file.
- [PHASE_A.md](./PHASE_A.md) — retrospective of the foundation work.
- [PHASE_B.md](./PHASE_B.md) — next up.
- [PHASE_C.md](./PHASE_C.md) — polish.
- [PHASE_D.md](./PHASE_D.md) — dashboard.
- [TTS_SETTINGS.md](./TTS_SETTINGS.md) — full TTS settings extension spec (P1 shipped, P2–P4 deferred).

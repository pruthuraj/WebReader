# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Read first

`docs/` holds the long-form plans. Read them in this order before changing code:

1. [PLAN.md](./PLAN.md) — one-screen current-state snapshot (what's shipped, current contracts, what's next).
2. [docs/ROADMAP.md](./docs/ROADMAP.md) — phase index, locked stack, cross-phase invariants, navigation shell.
3. [docs/phaseongoing3.md](./docs/phaseongoing3.md) — remaining work in priority order (Groups A–E).
4. [docs/PHASE_A.md](./docs/PHASE_A.md) / [PHASE_B.md](./docs/PHASE_B.md) / [PHASE_C.md](./docs/PHASE_C.md) / [PHASE_D.md](./docs/PHASE_D.md) — per-phase plans. A/B/C are retrospective; D is the next one to execute.
5. [docs/TTS_SETTINGS.md](./docs/TTS_SETTINGS.md) — full TTS feature surface (P1 shipped, P2–P4 deferred).
6. [docs/SPEC.md](./docs/SPEC.md) — frozen original product design. Do not edit.

When a phase doc and PLAN.md disagree, the phase doc wins. When a phase doc and ROADMAP "Cross-phase invariants" disagree, ROADMAP wins.

## Commands

```bash
npm run start             # expo start (Metro)
npm run android           # expo start --android
npm run ios               # expo start --ios (macOS only)
npm run web               # expo start --web (NOT a Phase 1 target — expo-sqlite WASM breaks this)
npm run lint              # expo lint (ESLint via eslint-config-expo)
npm run typecheck         # tsc --noEmit
```

**The four-command ritual before every commit** (CI gates):

```bash
npx tsc --noEmit
npm run lint
npx expo-doctor
npx expo export --platform ios --output-dir .expo-export-test
```

All must exit 0. The iOS export is the only bundle target verified in this loop — Android runs on device, web is intentionally broken.

There is no test runner wired up yet. Manual device QA on Expo Go SDK 55 is the canonical functional check; each phase doc lists its Verification bullets.

## Stack (locked)

| Area | Choice |
|---|---|
| Framework | Expo SDK 55 (managed) |
| Language | TypeScript (strict) |
| Routing | Expo Router (file-based) |
| Styling | NativeWind v4 + Tailwind 3.4 |
| Component lib | None imported. Copy gluestack-ui v2 components on demand. |
| Animations | `react-native-reanimated` v4 |
| State | Zustand 5 — one store per concern |
| Local DB | `expo-sqlite` (WAL, async API). 6 tables + `schema_meta`. |
| TTS | `expo-speech` wrapped behind `src/services/tts.ts` |
| Network | `expo-network` (only for wifi-only download flag) |
| HTTP | `axios` (installed; unused in Phase 1) |
| Auth | None. Not a Phase 1 concern. Not deferred — explicitly out of product scope. |
| Data source | `src/data/mock/{novels,chapters}.json` (5 novels × 10 chapters) |
| Dashboard | On-device only. No network calls, ever. |

If `expo-doctor` flags a version mismatch on any dep, pin to the SDK 55-compatible version it suggests. Do not bypass doctor.

## Architecture

### Route layout

```
app/
├── _layout.tsx                      root Stack (boots DB, provides theme + safe area)
├── (tabs)/
│   ├── _layout.tsx                  bottom Tabs config
│   ├── index.tsx                    Home   (tab 1)
│   ├── search.tsx                   Search (tab 2)
│   ├── downloads.tsx                Downloads (tab 3)
│   └── settings.tsx                 Settings  (tab 4)
├── novel/[id].tsx                   NovelDetails (root stack, no tabs)
├── reader/[novelId]/[chapterId].tsx Reader (root stack, no tabs)
└── dashboard.tsx                    Dashboard (root stack, no tabs)
```

Tabs render only on the four tab routes. NovelDetails / Reader / Dashboard are deliberately tab-less so they stay immersive. Dashboard has no top-level entry — Settings → "Reading insights → Open dashboard" is the only way in.

### Boot pipeline (`src/bootstrap.ts`)

`app/_layout.tsx` awaits `bootstrap()` before rendering anything:

```
initDb()                              → opens expo-sqlite, runs migrations
seedIfEmpty()                         → inserts mock catalogue on first launch
settingsStore.hydrate()               → reads `settings.v1` from kv_settings
readerStore.setAppearance(defaults)   → applies hydrated reader defaults to live state
ttsStore.set{Speed,Pitch,Language,AutoPlayNext}(...)  → applies hydrated TTS defaults
downloadStore.refresh()               → mirrors download_queue into memory
network.start()                       → expo-network listener
downloader.start()                    → background queue worker (concurrency 2)
eventRepo.record({ type: "session" }) → app_launch marker
```

On error the layout renders a fatal banner. On loading it renders a spinner. Everything past this is post-boot.

### Data flow

```
mock JSON (src/data/mock/*.json)
        │
        ▼
mockSource (src/data/mockSource.ts) — search / filter / sort over the JSON
        │
        ▼
catalogue (src/services/catalogue.ts) — facade; Phase 2 swaps in HTTP without call-site changes
        │
        ├──► readerLoad (src/services/readerLoad.ts) — first-open materializes body into chapters.body
        │             writes via chapterRepo.setBody and records `chapter_open`
        │
        └──► search / details screens — read directly via catalogue
```

Persistence sits behind `src/db/repositories/*`:

- `novelRepo` — novels metadata (id, title, author, source, language, tags, description, cover_hint).
- `chapterRepo` — chapter metadata + bodies. `body` is `NULL` until materialized.
- `progressRepo` — `(novel_id, chapter_id)` → `scroll_offset`, `percent`, `updated_at`.
- `downloadQueueRepo` — queue rows (`queued | downloading | done | failed`).
- `eventRepo` — analytics events (`search | novel_open | chapter_open | chapter_read | tts_start | tts_stop | session`). Dashboard reads from here only.
- `kvRepo` — JSON-typed key/value bag for `settingsStore` persistence.

### State (Zustand stores in `src/stores/`)

| Store | What it owns |
|---|---|
| `readerStore` | currentNovelId, currentChapterId, scrollOffset, `appearance` (font/line/theme/alignment/margin/brightness/keepAwake), `setProgress` writes through to `progressRepo` |
| `ttsStore` | status (`idle/playing/paused`), speed, pitch, voice, language, sleep timer, sleepRemainingSec, highlightSentenceIdx + actions that proxy through `services/tts` |
| `settingsStore` | `readerDefaults`, `ttsDefaults`, `wifiOnlyDownloads`, `autoRetryFailed`, `devMode`. `hydrate()` reads from `kvRepo`, `update()` writes through. |
| `downloadStore` | in-memory mirror of `download_queue`; `enqueue / retry / remove / refresh` |
| `analyticsStore` | typed helpers (`recordSearch`, `recordNovelOpen`, `recordChapterOpen`, `recordChapterRead`) wrapping `eventRepo.record` |

### Services (`src/services/`)

- `catalogue.ts` — **async** data facade (Phase 2a). Mock-backed browse/search by default; live sources via `searchSource` / `materializeNovel`; `getChapterBody(chapter)` branches on `chapters.source_url` (live adapter vs mock). All methods return Promises — call sites must await.
- `readerLoad.ts` — `loadChapterBody(novelId, chapterId)`: read from DB; if `body` is null, resolve via `catalogue.getChapterBody(cached)` (mock or live) and persist. Records `chapter_open`.
- `tts.ts` — wraps `expo-speech`. Sentence splitter, sleep-timer hookup. **Analytics contract**: `tts_start` is a marker (no `duration_ms`); `tts_stop` carries `duration_ms = stop - start`; pause/resume fold into the same span and emit nothing.
- `downloader.ts` — queue runner with concurrency 2. Per item: read row → check `network.shouldAllowDownload(wifiOnly)` → fetch via `catalogue` → `chapterRepo.setBody` → mark `done`. Errors mark `failed`.
- `network.ts` — `expo-network` wrapper. `isOnline()`, `isWifi()`, `shouldAllowDownload(wifiOnly)`, subscriber API.

### Live sources (Phase 2a — `src/sources/`)

On-device declarative adapters (LNReader/Tachiyomi model): the app fetches from a source for the user's personal reading and caches on-device only. **No server stores or redistributes content.** Sources ship disabled; the user opts in via Settings → Manage sources.

- `types.ts` — `SourceConfig` (declarative selectors + `@attr` mini-language). Mirrors `backend/app/models.py` (hand-synced, no codegen).
- `engine.ts` — generic interpreter (`parseList/parseDetails/parseChapterBody` + rate-limited, robots-aware `fetchHtml`) over `node-html-parser` (NOT cheerio — cheerio's `undici` import breaks the Metro/Hermes bundle).
- `rateLimiter.ts` — per-host single-in-flight chain + min gap.
- `liveSource.ts` — maps engine output to `Novel`/`ChapterMeta`; ids namespaced `"<sourceId>::<url>"`.
- `registry.ts` — loads bundled configs + tries `EXPO_PUBLIC_REGISTRY_URL` with bundled fallback; upserts into the `sources` table (preserves the user's enabled flag).
- `sourceRepo` / `sourceStore` / `app/sources.tsx` — persistence, state, management UI.
- `backend/` — FastAPI service serving adapter **configs only** (`/sources`, `/sources/{id}`, `/sources/{id}/validate`, `POST /sources/test` dry-run). Never serves content. Run/deploy: `backend/README.md`. Validate offline: `npx tsx scripts/validate-source-engine.ts`.

### Theme

`src/theme/`:

- `tokens.ts` — spacing, radius, font sizes, `readerFontSizes` array, `readerLineHeights` array.
- `readerThemes.ts` — light / dark / sepia palettes + CSS-var class names.
- `ThemeProvider.tsx` — subscribes to `readerStore.appearance.theme`; applies the corresponding class on the root `View` so the reader's `bg-reader-bg` / `text-reader-fg` CSS vars resolve correctly.

The dark-glass sheet aesthetic (`rgba(2, 6, 23, 0.96)`, yellow accent, pink close, cyan sleep chip) is the canonical look for all bottom sheets in `src/components/reader/*Sheet.tsx`. Match it when adding new sheets.

## Reader UI contract (do not regress)

- **Top header:** `‹ back · "Chapter X of Y" · ⋮` — set per-route via `Stack.Screen options` inside the reader file.
- **`⋮` opens `ReaderOptionsSheet`** (six rows: Contents · About · Appearance · TTS · Downloads · Reader settings).
- **Bottom bar** — always visible, no close button:
  `‹ prev chapter` · `play / pause` · `next chapter ›` · `stop (only when status !== "idle")` · `sleep timer`
- **Reader text** — single-tap is a no-op; double-tap a sentence starts TTS from that sentence (`onSentenceDoubleTap` → `playFromSentence`).
- **Sentence skip lives only in `useTtsStore` as `previousSentence` / `nextSentence`** for a future advanced surface (`docs/TTS_SETTINGS.md` Group/P2). **Do not put it back into the playback bar.**

## House rules

- **Don't bypass `expo-doctor`.** Pin versions it suggests rather than override.
- **Don't add SQLite tables without bumping `SCHEMA_VERSION`** in `src/db/schema.ts` and adding a migration string to `MIGRATIONS`.
- **Don't mix visual reader settings with TTS settings.** The split is locked in `docs/TTS_SETTINGS.md` "Relationship with ReaderScreen". Visual → `ReaderSettings`; audio → `TTSSettings`.
- **Don't reintroduce sentence-skip buttons into the playback bar.** Explicitly out per `docs/phaseongoing3.md`.
- **Don't add features beyond the active group's doc.** If scope spans groups in `docs/phaseongoing3.md`, edit the doc first, then implement.
- **TTS analytics contract:** Dashboard derives TTS minutes from `tts_stop.duration_ms` only. `tts_start` carries no duration. Pause/resume emit no events. Never break this.
- **No network calls in Phase 1.** `expo-network` is only allowed for the wifi-only download check. The Dashboard never phones home.
- **No bookmarks in Phase 1.** They're Phase 2+ per ROADMAP cross-phase invariants.
- **Commit prefixes:** `feat(area): …`, `docs: …`, `fix(area): …`. One commit per group sub-step.

## Path aliases (`tsconfig.json`)

- `@/*` → `src/*`
- `@app/*` → `app/*`

Use the aliases; do not use long relative paths like `../../../stores/readerStore`.

## Phase status

Phase A (foundation), Phase B (core reading flow), Phase C (polish + TTS P1), Reader UI cleanup, and the bottom-tabs nav restructure are all shipped. TTS Priority 1 is complete. Next up is **Group A — Phase D Dashboard** (see `docs/PHASE_D.md` and `docs/phaseongoing3.md`).

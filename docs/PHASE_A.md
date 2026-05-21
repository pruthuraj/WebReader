# Phase A — Foundation

> **Status:** done. Local commit `127b9ff` on top of `e1981ba` (initial scaffold).
> **Prev:** [ROADMAP](./ROADMAP.md) · **Next:** [PHASE_B.md](./PHASE_B.md)

## Goal

Stand up an Expo SDK 55 + TypeScript + Expo Router project with persistence, navigation, theming, and a seeded mock catalogue — so every subsequent phase can focus on UI/UX rather than infrastructure.

## Exit criteria (all achieved)

- `npx tsc --noEmit` exits 0.
- `npx expo-doctor` reports 18/18 checks passing.
- `npm run lint` (= `expo lint`) reports 0 errors / 0 warnings.
- `npx expo export --platform ios` produces a Hermes bundle without errors (observed: 4.1 MB, 1432 modules).
- App can be opened in Expo Go SDK 55; all 7 routes navigate; on first launch the DB is created and 5 novels appear in the `novels` table.

> **Web target:** intentionally not supported in Phase 1. `expo-sqlite` imports a `.wasm` module that the Metro web bundler cannot resolve without extra config. Native bundles (iOS / Android) are unaffected.

## Shipped file map

```
NovelReaderApp/
├── app/                                 # Expo Router routes
│   ├── _layout.tsx                      # global.css import, bootstrap, ThemeProvider, Stack
│   ├── index.tsx                        # Home — NavTile placeholders
│   ├── search.tsx                       # Search — placeholder
│   ├── novel/[id].tsx                   # NovelDetails — placeholder
│   ├── reader/[novelId]/[chapterId].tsx # Reader — placeholder
│   ├── downloads.tsx                    # Downloads — placeholder
│   ├── settings.tsx                     # Settings — reads hydrated settings store
│   └── dashboard.tsx                    # Dashboard — basic event counts
│
├── src/
│   ├── bootstrap.ts                     # initDb → seed → hydrate settings → refresh queue → session event
│   │
│   ├── data/
│   │   ├── types.ts                     # Novel, Chapter, ChapterMeta, ProgressEntry, DownloadQueueItem, AnalyticsEvent
│   │   ├── mockSource.ts                # search/filter/sort facade over JSON
│   │   └── mock/
│   │       ├── novels.json              # 5 novels with id/title/author/source/language/tags/description/coverHint
│   │       └── chapters.json            # 50 chapter rows (novelId, chapterId, idx, title, body)
│   │
│   ├── db/
│   │   ├── client.ts                    # expo-sqlite singleton, initDb, run/all/first/exec, resetDb
│   │   ├── schema.ts                    # SCHEMA_VERSION = 1, single migration string with 6 tables + indexes
│   │   ├── seed.ts                      # seedIfEmpty(): copies novels.json into novels, chapter metadata (body NULL)
│   │   └── repositories/
│   │       ├── novelRepo.ts
│   │       ├── chapterRepo.ts
│   │       ├── progressRepo.ts
│   │       ├── downloadQueueRepo.ts
│   │       ├── eventRepo.ts
│   │       └── kvRepo.ts
│   │
│   ├── stores/
│   │   ├── readerStore.ts               # currentNovelId, currentChapterId, scrollOffset, appearance{...}
│   │   ├── ttsStore.ts                  # status, speed, pitch, voice, language, sleep timer, highlight idx
│   │   ├── settingsStore.ts             # readerDefaults, ttsDefaults, wifiOnlyDownloads, autoRetryFailed, devMode + hydrate/update
│   │   ├── downloadStore.ts             # in-memory mirror of download_queue + enqueue/retry/remove/refresh
│   │   └── analyticsStore.ts            # recordEvent() facade over eventRepo
│   │
│   └── theme/
│       ├── tokens.ts                    # spacing, radius, fontSizes, readerFontSizes, readerLineHeights
│       ├── readerThemes.ts              # light/dark/sepia palettes + CSS-var class names
│       └── ThemeProvider.tsx            # subscribes to readerStore.appearance.theme, applies CSS-var class on root
│
├── docs/
│   ├── SPEC.md                          # original design doc (was a stray .md at root, moved here)
│   ├── ROADMAP.md                       # phase index
│   └── PHASE_A.md                       # this file
│
├── app.json                             # WebReader / slug=webreader; no newArchEnabled (SDK 55 default); expo-sqlite + expo-font + expo-image + expo-web-browser plugins
├── babel.config.js                      # babel-preset-expo (jsxImportSource: nativewind) + nativewind/babel
├── metro.config.js                      # withNativeWind(config, { input: "./global.css" })
├── tailwind.config.js                   # content paths, nativewind preset, brand + reader CSS-var colors
├── global.css                           # @tailwind directives + :root / .theme-dark / .theme-sepia CSS vars
├── nativewind-env.d.ts                  # /// <reference types="nativewind/types" />
├── tsconfig.json                        # strict; @/* -> src/*; @app/* -> app/*
├── package.json
└── package-lock.json
```

## SQLite schema (`src/db/schema.ts`)

```sql
PRAGMA journal_mode = WAL;

CREATE TABLE novels (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT,
  source TEXT,
  language TEXT,
  description TEXT,
  tags TEXT,                -- JSON array
  cover_hint TEXT,
  cached_at INTEGER NOT NULL
);

CREATE TABLE chapters (
  novel_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  idx INTEGER NOT NULL,
  title TEXT NOT NULL,
  body TEXT,                -- NULL until "downloaded"
  downloaded_at INTEGER,
  PRIMARY KEY (novel_id, chapter_id),
  FOREIGN KEY (novel_id) REFERENCES novels(id)
);
CREATE INDEX idx_chapters_novel_idx ON chapters(novel_id, idx);

CREATE TABLE progress (
  novel_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  scroll_offset REAL NOT NULL,
  percent REAL NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (novel_id, chapter_id)
);
CREATE INDEX idx_progress_updated ON progress(updated_at DESC);

CREATE TABLE download_queue (
  novel_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  status TEXT NOT NULL,     -- queued | downloading | done | failed
  error TEXT,
  enqueued_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (novel_id, chapter_id)
);
CREATE INDEX idx_queue_status ON download_queue(status);

CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,       -- search | novel_open | chapter_open | chapter_read | tts_start | tts_stop | session
  payload TEXT,             -- JSON
  duration_ms INTEGER,
  novel_id TEXT,
  chapter_id TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_events_type_time ON events(type, created_at);

CREATE TABLE kv_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

A `schema_meta(key, value)` table holds `version`. The migration runner reads the version, applies any indexed migrations between `currentVersion` and `SCHEMA_VERSION`, then writes the new version back.

## Bootstrap pipeline (`src/bootstrap.ts`)

`bootstrap()` is awaited by `app/_layout.tsx` before any screen renders:

1. **`initDb()`** opens `webreader.db`, ensures `schema_meta`, applies migrations.
2. **`seedIfEmpty()`** — if `novels` is empty, inserts all 5 mock novels + 50 chapter metadata rows. Chapter `body` remains `NULL`; downloading materializes it in Phase B.
3. **`useSettingsStore.getState().hydrate()`** — reads `settings.v1` from `kv_settings` (or uses defaults).
4. **`useDownloadStore.getState().refresh()`** — pulls current queue rows into memory.
5. **`eventRepo.record({ type: 'session', payload: { event: 'app_launch' } })`** — first analytics datapoint.

Returns `{ dbReady, seeded, novels, totalEvents }`; layout renders a loading screen until this resolves, an error screen if it rejects.

## Known gaps (handed to later phases)

- **Chapter bodies are NULL after seed.** Phase B's `services/readerLoad.ts` reads from `mockSource.getChapter()` on first open and writes the body into `chapters.body` to simulate the download materialization step.
- **No real UI.** Every screen is a placeholder ScrollView with a heading and a dashed box. Phases B and C replace them.
- **Reader animation between chapters, sheet animations, and TTS** — all Phase C.
- **No charts in Dashboard yet.** Phase D adds `victory-native` (or fallback).
- **Web target intentionally broken** by `expo-sqlite` WASM import. Not a Phase 1 target.

## Verification proof

```
> npx tsc --noEmit
(exit 0)

> npx expo-doctor
18/18 checks passed. No issues detected!

> npm run lint
(exit 0)

> npx expo export --platform ios
› ios bundles (1):
_expo/static/js/ios/entry-b314df51285b18f46affdbcde25fe19a.hbc (4.1MB)
Exported: .expo-export-test
```

In Expo Go on the user's phone: app launched, navigation between all 7 routes worked, Settings screen showed hydrated reader/TTS defaults, Dashboard rendered zero counts (no events yet).

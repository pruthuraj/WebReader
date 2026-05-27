# WebReader — current state

> **Snapshot only.** This file replaces older multi-section refactor plans; treat it as the one-screen status check before starting work.
> **Detailed plans live under [`docs/`](./docs/).** Update those, not this file, when scope changes.

## What's shipped

| Commit | Title |
|---|---|
| `127b9ff` | Phase A — scaffold (Expo SDK 55, TS, Expo Router, NativeWind, SQLite schema, Zustand stores, seeded mock catalogue) |
| `dbd0e1e` | Phase B — core reading flow (Home rows · Search · NovelDetails · Reader with progress persist/restore) |
| `85204f2` | Phase C — polish + persistent playback bar + dark glass sheets |
| `912254c` | Drop popup, fix double-tap, conditional Stop, TTS settings spec |
| `344b4f8` | Bottom tabs + reader header redesign (`⋮` menu, chapter chevrons) |
| `f5a2347` | Phase D — local-only Dashboard (D1–D4: MetricCard, RangePicker, TopNovelsList, EventStreamPreview, DropOffChart) |
| `6151260` | TTS Priority 2 — cleaning toggles, sentence pause, auto-start, EOC sleep, paragraph/comma highlight |
| `326cf3e` | TTS Priority 3 — pronunciation rules CRUD + schema v2 + dedicated screen |
| `644a147` | TTS Priority 4 — Android intents, playlist, auto-advance, background-playback flag, network-voice hint |
| Phase 2a (`phase-2a-live-sources`) | Live Sources — on-device adapter engine, async catalogue facade, Royal Road config, FastAPI config registry + dry-run, Sources screen, Search/Browse tab. See [docs/PHASE_2A.md](./docs/PHASE_2A.md). |
| Phase 2c (`phase-2c-bookmarks-shelves`) | Bookmarks + Shelves — schema v4, reader bookmark + jump, NovelDetails bookmarks, add-to-shelf sheet, Shelves/ShelfDetail screens, Home entry. App-side only. See [docs/PHASE_2C.md](./docs/PHASE_2C.md). |

TTS Settings **Priorities 1–4** all shipped (P4 partial — Bluetooth pause/resume and Android foreground-service deferred until a prebuild lands; tracked in `docs/phaseongoing3.md` Group D notes).

## Current reader UI contract

- **Top header:** `‹ back` · `Chapter X of Y` · `⋮` — Phase 2d renders this as an in-content bar themed to the reader palette (navigator header hidden), not via `Stack.Screen` options.
- **`⋮` opens `ReaderOptionsSheet`** with six rows: Contents · About · Appearance · TTS · Downloads · Reader settings.
- **Bottom bar** — always visible, no close button:
  `‹ prev chapter` · `play / pause` · `next chapter ›` · `stop (only when status !== "idle")` · `sleep timer`
- **Reader text** — single-tap is a no-op; double-tap a sentence starts TTS from that sentence.
- **Sentence skip is intentionally NOT in the bar.** It lives only in `useTtsStore` as `previousSentence` / `nextSentence` for a future advanced surface documented in `docs/TTS_SETTINGS.md`. Do not put it back into the playback bar.

## App navigation contract

- `app/(tabs)/_layout.tsx` owns the bottom tabs: **Home · Search · Downloads · Settings.**
- `app/_layout.tsx` owns the root Stack: `(tabs)` + `novel/[id]` + `reader/[novelId]/[chapterId]` + `dashboard` + `app/settings/**` (appearance, focus, downloads, developer, about, tts/*) + sources/shelves/shelf/tts-pronunciation.
- **Phase 2d:** tab and most stack headers are hidden; screens render their own in-content header (`AppHeader`/`ScreenHeader` in `src/components/ui/headers.tsx`) themed by the active app-chrome theme. The Settings tab is a 6-row list that drills into the `app/settings/**` detail routes.
- Tabs are visible on the four tab routes only. NovelDetails, Reader, Dashboard, and settings detail pages render without tabs.
- Dashboard is reachable via Settings → "Activity / Dashboard".

## What's next

**Phase 1 is feature-complete** (Groups A–E shipped; per-item status in [`docs/phaseongoing3.md`](./docs/phaseongoing3.md)).

**Phase 2a — Live Sources is implemented** on branch `phase-2a-live-sources` (S1–S9; [docs/PHASE_2A.md](./docs/PHASE_2A.md)). Real content fetched live from real sources (Royal Road reference) via on-device declarative adapters behind the `catalogue` facade; a FastAPI service serves adapter **configs only**. Personal-use, on-device, robots-aware. Outstanding before merge: **deploy the backend** (manual) + **on-device QA** of the live path.

**Phase 2c — Bookmarks + Shelves is implemented** on branch `phase-2c-bookmarks-shelves` (stacked on 2a; schema v3→v4). App-side only. Outstanding before merge: on-device QA.

**Phase 2d — UI re-skin (in progress)** — port the `ref/*.jsx` dark-navy design language into the existing RN app, reusing the current file structure + data layer. Adds selectable app-chrome themes (light / dark / dark-navy default / custom color editor), a reader font picker (Lora/Inter/Raleway/Montserrat/Libre Caslon/Libre Baskerville), Focus Blur, and the full settings tree (Appearance, Downloads, Developer, About, TTS root + 7 sub-pages). See `docs/phaseongoing3.md` "Phase 2d".

Still deferred:
- Native-prebuild slice of Group D — Bluetooth pause/resume, Android background foreground-service, iOS `UIBackgroundModes: ["audio"]` — none fit Expo Go.
- Other Phase 2 slices: cloud sync, push, aggregate multi-source search. Bookmark notes + shelf rename are small follow-ups (see PHASE_2C). Auth is permanently out of scope.

## Static checks (every commit)

```
npx tsc --noEmit
npm run lint
npx expo-doctor
npx expo export --platform ios --output-dir .expo-export-test
```

All four must exit 0. iOS bundle is the only platform target verified in CI — Android works on device, web is intentionally broken by `expo-sqlite` WASM import.

## House rules

- Don't bypass `expo-doctor`. If a new dep makes it red, pin the version it suggests.
- Don't add SQLite tables without bumping `SCHEMA_VERSION` in `src/db/schema.ts` and adding a migration string.
- Don't mix visual reader settings (font / theme / margin) into TTS settings or vice versa. The split is locked in `docs/TTS_SETTINGS.md` "Relationship with ReaderScreen".
- Don't reintroduce sentence-skip buttons into the playback bar.
- Don't add features beyond the active group's doc. If a change spans groups, edit the doc first.
- Use commit prefixes: `feat(area):`, `docs:`, `fix(area):`. One commit per group sub-step.

## Where to look

| Need | File |
|---|---|
| High-level map + locked stack | [docs/ROADMAP.md](./docs/ROADMAP.md) |
| What's left to ship | [docs/phaseongoing3.md](./docs/phaseongoing3.md) |
| Original product design (frozen) | [docs/SPEC.md](./docs/SPEC.md) |
| Foundation retrospective | [docs/PHASE_A.md](./docs/PHASE_A.md) |
| Core reading flow plan | [docs/PHASE_B.md](./docs/PHASE_B.md) |
| Polish phase plan | [docs/PHASE_C.md](./docs/PHASE_C.md) |
| Dashboard plan | [docs/PHASE_D.md](./docs/PHASE_D.md) |
| Full TTS settings spec (P1 shipped, P2–P4 deferred) | [docs/TTS_SETTINGS.md](./docs/TTS_SETTINGS.md) |
| Project conventions for future Claude sessions | [CLAUDE.md](./CLAUDE.md) |

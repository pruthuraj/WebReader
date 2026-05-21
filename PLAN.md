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

TTS Settings **Priority 1** is fully shipped: play / pause / resume / stop · speed · pitch · language · voice · sleep timer · auto-play next · sentence highlight · double-tap-to-read.

## Current reader UI contract

- **Top header:** `‹ back` · `Chapter X of Y` · `⋮`
- **`⋮` opens `ReaderOptionsSheet`** with six rows: Contents · About · Appearance · TTS · Downloads · Reader settings.
- **Bottom bar** — always visible, no close button:
  `‹ prev chapter` · `play / pause` · `next chapter ›` · `stop (only when status !== "idle")` · `sleep timer`
- **Reader text** — single-tap is a no-op; double-tap a sentence starts TTS from that sentence.
- **Sentence skip is intentionally NOT in the bar.** It lives only in `useTtsStore` as `previousSentence` / `nextSentence` for a future advanced surface documented in `docs/TTS_SETTINGS.md`. Do not put it back into the playback bar.

## App navigation contract

- `app/(tabs)/_layout.tsx` owns the bottom tabs: **Home · Search · Downloads · Settings.**
- `app/_layout.tsx` owns the root Stack: `(tabs)` (no header) + `novel/[id]` + `reader/[novelId]/[chapterId]` + `dashboard`.
- Tabs are visible on the four tab routes only. NovelDetails, Reader, and Dashboard render without tabs.
- Dashboard is reachable only via Settings → "Reading insights → Open dashboard". Not a top-level tab.

## What's next

See [`docs/phaseongoing3.md`](./docs/phaseongoing3.md). In priority order:

1. **Group A — Phase D** (local-only Dashboard): MetricCard / RangePicker / TopNovelsList / EventStreamPreview / DropOffChart.
2. **Group B — TTS Priority 2**: paragraph + comma highlight · text-cleaning skip rules · pause between sentences · auto-start on chapter open · end-of-chapter sleep.
3. **Group E — small residuals** (interleave with B): wifi-only listener · auto-retry · search debounce · keep-awake cleanup · brightness restore.
4. **Group C — TTS Priority 3**: pronunciation rules CRUD (new `pronunciation_rules` table + screen).
5. **Group D — TTS Priority 4**: Bluetooth, battery-optimization, voice/engine deep-links, background playback, playlist queue.

Phase 2+ remains out of scope: FastAPI backend, scraping, auth, cloud sync, push, bookmarks, shelves.

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

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

TTS Settings **Priorities 1–4** all shipped (P4 partial — Bluetooth pause/resume and Android foreground-service deferred until a prebuild lands; tracked in `docs/phaseongoing3.md` Group D notes).

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

Groups A–D shipped. Only **Group E residuals** remain in Phase 1 (see [`docs/phaseongoing3.md`](./docs/phaseongoing3.md)):

- Wi-Fi-only flag respects current network state on enable (downloader listener nudge on reconnect)
- `auto-retry failed` actually retries `failed` rows with backoff
- Pull-to-refresh throttle on Home
- `chapter_read` threshold configurable via settings
- Cover gradient palette extension
- Brightness restore on Reader unmount
- Keep-awake cleanup on Reader unmount
- Search debouncing on `app/(tabs)/search.tsx`

Group D Phase 1 cuts (Bluetooth pause/resume, true Android background-playback FGS, iOS `UIBackgroundModes` audio) are deferred until a prebuild is on the table — they don't fit Expo Go.

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

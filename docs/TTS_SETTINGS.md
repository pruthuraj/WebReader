# TTS Settings — Full Extension Spec

> **Index:** [ROADMAP.md](./ROADMAP.md) · **Phase doc:** [PHASE_C.md](./PHASE_C.md)
> **Status:** Priority 1 shipped. P2–P4 land in subsequent commits without re-opening Phase C scope.

## Purpose

Phase C shipped the minimum TTS surface that makes WebReader listenable: play / pause / resume / stop, speed, pitch, voice + language pickers, sleep timer, and auto-play-next. This document captures the full target TTS settings surface — the eight sections of behavior that turn TTS Settings into a real listening control center — and the priority order in which they ship.

The hierarchy and naming are fixed:

```
ReaderScreen
├── ReaderContent
├── ReaderSettings   (visual reading: font, line height, theme, margin, alignment)
└── TTSSettings      (audio listening: everything in this document)
```

Visual settings stay in `ReaderSettings`. Listening settings stay in `TTSSettings`. They do not mix.

## What's already implemented (Priority 1)

| Feature | Location |
|---|---|
| Play / pause / resume / stop | `src/components/reader/ReaderPlaybackBar.tsx` |
| Speech rate (0.5×–2×) | `TTSSettingsSheet` "Speech rate" |
| Pitch (0.5–2) | `TTSSettingsSheet` "Pitch" |
| Language picker (en-US, en-GB, en-AU, hi-IN) | `TTSSettingsSheet` "Language" |
| Voice picker (filtered by language, top 8) | `TTSSettingsSheet` "Voice" |
| Sleep timer (Off · 5 · 15 · 30 · 60 m) | `TTSSettingsSheet` "Sleep timer" + bottom playback bar quick picker |
| Auto-play next chapter (toggle, persisted) | `TTSSettingsSheet` "Auto-play next chapter" |
| `tts_start` / `tts_stop` events with `duration_ms` on stop only | `src/services/tts.ts`, `src/stores/ttsStore.ts` |
| Sentence-level highlight while playing | `src/components/reader/ReaderContent.tsx` (`highlightedSentenceIdx`) |
| Double-tap a sentence to start TTS from that sentence | `ReaderContent.onSentenceDoubleTap` → `useTtsStore.playFromSentence` |
| End-of-text auto-stop + sleep-timer auto-stop | `services/tts.onEnd` + ttsStore `armSleepTimer` |

Persistence: all of the above ride on the existing `settings.v1` row in `kv_settings`.

## Section 1 — Basic Playback Settings

Controls when TTS starts, pauses, resumes, and moves forward.

| Setting | Priority | Notes |
|---|---|---|
| Auto-play next chapter | P1 (shipped) | Continues into chapter `idx + 1` after `onEnd`. |
| Auto-play next page | n/a | Web-novel reader has continuous scroll, not pages. Skip. |
| Skip page header | P2 | Strip the first `\n\n`-delimited block if it matches a "Chapter N" pattern. Toggle. |
| Skip page footer | P2 | Strip a trailing block matching common footer markers (e.g. "← Previous · Next →"). Toggle. |
| Pause time between sentences | P2 | 0–800 ms slider. Implemented by sleeping between `Speech.speak` calls in the sentence loop. |
| Double-tap to read aloud | P1 (shipped) | Already in `ReaderContent`. |
| Pause when navigation audio plays | P4 | Subscribe to audio interruptions via `expo-audio` / `expo-av`. Resume on interruption end. |
| Pause after Bluetooth disconnects | P4 | Requires `expo-network` plus Bluetooth-state listener. Permission-gated. |
| Pause and resume at the same word | P4 | Needs `Speech.onBoundary` (iOS only). Fall back to sentence on Android. Persist the word index across pause/resume. |
| Auto-start reading when chapter opens | P2 | Toggle. When on, `ReaderScreen` calls `playFromSentence(body, 0, …)` after `loadChapterBody` resolves. Off by default to avoid surprising users. |

## Section 2 — Voice and Engine Settings

Controls available voices and the underlying TTS engine.

| Setting | Priority | Notes |
|---|---|---|
| Voice selection | P1 (shipped) | `Speech.getAvailableVoicesAsync()` filtered by language. |
| Language selection | P1 (shipped) | Currently four English variants + Hindi. Extend on demand. |
| Install more TTS engines | P4 | Android only. `ACTION_TTS_SETTINGS` intent via `expo-intent-launcher`. Hidden on iOS. |
| Download more voices | P4 | Android only. Deep-link into the active engine's voice-data UI. |
| Update Google voice engine | P4 | Android only. Play Store deep-link to `com.google.android.tts`. Hidden when the engine isn't Google. |
| Disable battery optimization | P4 | Android only. `ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` intent. Show a one-time warning when the user enables long-form playback. |
| Background playback | P4 | iOS requires `UIBackgroundModes: ["audio"]` in `app.json` + `AVAudioSession.Category.playback`. Android requires a foreground service notification. Document only in Phase 1. |
| Embedded web-page reading | out of scope | Phase 2+ if/when the catalogue ever serves HTML. |

## Section 3 — Pronunciation Correction (P3)

Lets users override how TTS pronounces specific words, abbreviations, and symbols.

### Rule schema

New SQLite table `pronunciation_rules`:

```sql
CREATE TABLE pronunciation_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pattern TEXT NOT NULL,         -- literal or regex source
  is_regex INTEGER NOT NULL,     -- 0 | 1
  replacement TEXT NOT NULL,
  language TEXT,                 -- NULL means "all languages"
  case_sensitive INTEGER NOT NULL DEFAULT 0,
  enabled INTEGER NOT NULL DEFAULT 1,
  category TEXT,                 -- e.g. "abbreviations", "fantasy-names"
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_pronun_enabled_lang ON pronunciation_rules(enabled, language);
```

New repository: `src/db/repositories/pronunciationRepo.ts` — `list`, `listByCategory`, `search(query)`, `upsert(rule)`, `delete(id)`, `setEnabled(id, on)`.

### Settings UI

A dedicated screen `app/settings/tts-pronunciation.tsx` (TTS settings sheet outgrows the bottom-sheet form factor at this point). Surfaces:

- Search bar matches on `pattern` and `replacement`.
- Filter chips for categories.
- Toggle: case-sensitive.
- Add / edit / delete actions with confirmation on delete.
- "Test" button: runs the rule against a sample sentence and reads it aloud.

### Application order

In `services/tts.cleanText(input, settings)`:

1. Skip-rules pass (Section 4).
2. Pronunciation pass — iterate enabled rules whose `language` matches the current TTS language (or is NULL), applying literal replacements with `String.prototype.replaceAll` or `RegExp` when `is_regex`.
3. Whitespace normalization.

### Examples

| Pattern | Replacement | Notes |
|---|---|---|
| `b.a.s.t.a.r.d` | `bastard` | literal |
| `i.e.` | `that is` | literal |
| `+` | `plus` | literal |
| `\b([A-Z]){2,}\b` (regex) | uses spaced-out letters via callback | regex example |

### Import / export (optional, last)

`src/services/pronunciation-io.ts` — serialize rules to JSON and import a JSON file via `expo-document-picker`. Saved as `webreader-pronunciation-v1.json`. Conflict policy: skip duplicates on `(pattern, language)` unless the user opts to overwrite.

## Section 4 — Text Cleaning and Skip Rules (P2)

Pre-TTS text filters that strip noise before sending to the engine. All toggles persist via `settingsStore` under `ttsDefaults.cleaning.*`.

| Toggle | Behavior |
|---|---|
| Skip symbols | Strip any character outside `\p{L}\p{N}\s.,!?;:'-"()` (and the punctuation `tts.ts` already keeps). |
| Skip emojis | `\p{Extended_Pictographic}` removed. |
| Skip superscript | Strip `²³¹⁰-₟` and `<sup>…</sup>` if any. |
| Skip URLs | Strip `https?://\S+` and `www\.\S+`. |
| Skip square-bracket text `[…]` | Strip the brackets and their contents. |
| Skip parentheses `(…)` | Strip the brackets and their contents. |
| Skip spaces between uppercase letters | Collapse `H E L L O` → `HELLO`. Treat as one word. |
| Skip hyphens | Replace `-` with space, except inside known compound words (skip the special-case until P3 needs it). |
| Skip line-breaking hyphens | Strip `-\n` and rejoin the surrounding word. |
| Skip linked / reference text | Strip leading `[1]`, `^1`, footnote markers. |
| Read main text only | Drop top-of-page header block + bottom-of-page footer block (overlaps with Section 1's two skip toggles). |
| Skip more linked text | Domain-specific add-on; defer. |
| Prevent reading certain patterns | Free-form list of regex patterns the user adds (overlaps with pronunciation rules where replacement = `""`). |

Implementation: a single `cleanText(input, settings)` in `services/tts.ts`. Order of operations is documented inline. Add unit-style smoke tests in `src/services/__tests__/cleanText.test.ts` (Phase 1 doesn't run a test runner yet — write the file anyway so a future test setup picks it up; otherwise rename to `.cases.md`).

## Section 5 — Highlighting (P2)

Controls how the spoken text is highlighted on screen.

| Setting | Priority | Notes |
|---|---|---|
| Highlight current sentence | P1 (shipped) | Already wired via `highlightedSentenceIdx` + sentence-span backgrounds. |
| Highlight each word | P4 | Needs `Speech.onBoundary` (iOS). Fall back to sentence on Android. Show a hint when boundary events aren't supported. |
| Highlight paragraph | P2 | Compute paragraph boundaries (`\n\n` splits) and highlight the paragraph containing the active sentence. |
| Highlight entire paragraph | P2 | Same as above but with a heavier background. |
| Underline paragraph | P2 | Toggle on top of paragraph highlight. |
| Keep original text color when highlighting | P2 | Override the highlight's foreground re-color. Already the default behavior; expose the toggle. |
| Comma mode | P2 | Sub-sentence clauses split on `,` and `;`. Highlight a clause at a time. Requires `cleanText` to preserve commas. |

Constraint: highlighting must never reflow the layout. All effects are applied with `backgroundColor` / `textDecorationLine` / inline `style` — no font-weight or font-size changes mid-paragraph.

## Section 6 — Playlist / Queue (P4)

Controls how chapters are queued for continuous listening.

| Setting | Notes |
|---|---|
| Always download before adding to playlist | When enabled, enqueue via `downloadQueueRepo` and only mark "in playlist" after `body` is materialized. |
| Always add to playlist directly | When enabled, skip the download step (mock catalogue is fast; backend Phase 2 will revisit). |
| Auto-play next chapter | P1 (shipped). |
| Continue from current reading position | When the playlist auto-advances, start at the current chapter's saved scroll percent rather than from sentence 0. |
| Add current chapter to listening queue | UI button in `TTSSettingsSheet` or `NovelDetails`. |
| Clear listening queue | UI button + confirm. Clears in-memory queue, leaves the DB alone. |
| Sleep-timer integration | Sleep timer hitting 0 stops the current chapter AND clears the queue. Currently it just stops playback. |

Data: a new in-memory store `useTtsPlaylistStore` (no DB until Phase 2's sync work) keyed by `${novelId}::${chapterId}`.

## Section 7 — Sleep Timer (P1 shipped + one addition for P2)

| Option | Status |
|---|---|
| Off | P1 (shipped) |
| 5 m | P1 (shipped) |
| 15 m | P1 (shipped) |
| 30 m | P1 (shipped) |
| 60 m | P1 (shipped) |
| **End of chapter** | **P2** — stop after the current chapter finishes; no countdown UI. |

## Section 8 — Platform and Permission Handling (P4)

A horizontal concern that touches several sections.

| Rule | Behavior |
|---|---|
| Unsupported setting | Render the row as visible-but-disabled with a one-line "Not available on this platform" hint. Never hide the row. |
| Network-only voice | When `Voice.networkConnectionRequired` is true, append a small "needs Wi-Fi" badge to the picker option. |
| Background playback | Show a one-line note under the toggle: "Requires additional setup on iOS." Toggle no-ops on Android until the foreground-service notification is built. |
| Android battery optimization | Show a one-time banner when the user first enables auto-play-next or background playback. Banner links into the OS intent. |
| Bluetooth pause/resume permission | Request `BLUETOOTH_CONNECT` only at the moment the user toggles the feature on. Toggle reverts if the permission is denied. |

## Data persistence

All TTS settings persist locally:

- Simple toggles, sliders, picker values → `kv_settings` row `settings.v1` under `ttsDefaults.*`.
- Pronunciation rules (P3) → dedicated `pronunciation_rules` table.

Settings survive:

- Closing the app.
- Restarting the app.
- Opening another chapter.
- Navigating between `ReaderScreen` and `SettingsScreen`.

The `settingsStore.hydrate()` already runs during `bootstrap()`; no new wiring required for kv-backed toggles.

## Relationship with ReaderScreen

```
ReaderScreen
├── ReaderContent
├── ReaderSettings   (visual)
│   ├── Font size · line height · margin · brightness · keep-awake
│   ├── Theme · font family · alignment
└── TTSSettings      (audio)
    ├── Voice · language
    ├── Speech rate · pitch
    ├── Pronunciation rules (P3)
    ├── Skip / cleaning rules (P2)
    ├── Highlighting (P1 + P2)
    ├── Sleep timer (P1 + EOC in P2)
    ├── Auto-play / playlist (P1 + P4)
    └── Playback behavior (P1 + P2 + P4)
```

`ReaderScreen` never owns any of these settings directly. It reads from `settingsStore` and `useTtsStore` and writes to them via existing actions.

## Priority ladder

| Priority | Scope |
|---|---|
| **P1 (shipped)** | Play / pause / resume / stop, speed, pitch, language, voice, sleep timer, auto-play next chapter, sentence highlight, double-tap to read. |
| **P2** | Paragraph + comma highlight; text-cleaning toggles (symbols, emojis, URLs, brackets, parentheses, headers/footers, line-break hyphens); pause time between sentences; auto-start on chapter open; End-of-chapter sleep option. |
| **P3** | Pronunciation rules CRUD; rule categories; case sensitivity; search; optional import/export. `pronunciation_rules` table lands here. |
| **P4** | Bluetooth pause/resume; Android battery-optimization warning + intent; install / download more voices (Android intents); update Google engine deep-link; playlist behavior (always-download, manual queue, EOC clears queue); background playback config (iOS `UIBackgroundModes`, Android foreground service). |

## Implementation appendix

| Priority | Likely files |
|---|---|
| P2 | `src/services/tts.ts` (extend `cleanText`, sentence-pause sleep, paragraph splitter) · `src/components/reader/ReaderContent.tsx` (paragraph + comma highlight modes) · `src/components/reader/TTSSettingsSheet.tsx` (new sections, EOC sleep option) · `src/stores/settingsStore.ts` (extend `TtsDefaults` shape) |
| P3 | `src/db/schema.ts` (new `pronunciation_rules` migration; bump `SCHEMA_VERSION`) · `src/db/repositories/pronunciationRepo.ts` (new) · `src/services/tts.ts` (extend `cleanText` to apply rules) · `app/settings/tts-pronunciation.tsx` (new screen) · `src/services/pronunciation-io.ts` (optional import/export) |
| P4 | `src/services/intent.ts` (Android-only deep links via `expo-intent-launcher`) · `src/services/audioSession.ts` (`expo-audio`/`expo-av` interruption handling) · `src/services/bluetooth.ts` (state listener + permission gate) · `app.json` (`ios.infoPlist.UIBackgroundModes`, Android foreground-service plumbing) · `src/stores/playlistStore.ts` (new) |

## Out of scope

- Bookmarks. Remain Phase 2+ as locked in `docs/ROADMAP.md` cross-phase invariants.
- Embedded web-page reading.
- Cross-device sync of pronunciation rules.
- Cloud TTS engines.

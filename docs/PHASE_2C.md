# Phase 2c — Bookmarks + Shelves

> Pure app-side library features (SQLite + UI). No backend, no network. Built on branch `phase-2c-bookmarks-shelves` (off `phase-2a-live-sources`, so the schema continues v3→v4). Works for mock and live novels alike (keyed by `novel_id`).

## What shipped

| Step | Summary |
|---|---|
| 2c-S1 | Schema v4 (`migration[3]`): `bookmarks`, `shelves`, `shelf_items`. `bookmarkRepo`, `shelfRepo` (+ counts). Types `Bookmark`/`Shelf`. |
| 2c-S2 | **Bookmarks**: reader `⋮` → "Add bookmark" saves current scroll offset + percent; reader accepts an `offset` route param to jump to a saved spot. NovelDetails shows a Bookmarks section (tap to jump, trash to delete). |
| 2c-S3 | **Shelves add**: `libraryStore` (shelves with counts) + `AddToShelfSheet` (toggle membership, create inline) opened from a NovelHeader "Add to shelf" action. |
| 2c-S4 | **Shelves screens**: `app/shelves.tsx` (list + create + delete), `app/shelf/[id].tsx` (novels via `ResultCard`), Home "Your shelves" entry. Routes registered tab-less. |

## Data model

```sql
bookmarks(id, novel_id, chapter_id, scroll_offset, percent, note, created_at)
shelves(id, name, created_at)
shelf_items(shelf_id, novel_id, added_at)   -- many-to-many
```

Bookmarks are explicit, multiple per novel, distinct from the single auto-saved
`progress` row per chapter. Shelves are named collections; a novel can sit in
many.

## UI map

- **Bookmark add** — Reader `⋮` (ReaderOptionsSheet) → "Add bookmark".
- **Bookmark list / jump / delete** — NovelDetails → Bookmarks section.
- **Add to shelf** — NovelDetails header → folder-plus → `AddToShelfSheet`.
- **Shelves** — Home → "Your shelves" → `app/shelves.tsx` → `app/shelf/[id].tsx`.

## Verification

All four static checks green at every step (`tsc --noEmit`, `expo lint`,
`expo-doctor` 19/19, iOS export). Functional QA is on-device (no test runner).

## Deferred / notes

- **Bookmark notes** — the `note` column exists but the UI saves `null` for now
  (no cross-platform inline prompt; `Alert.prompt` is iOS-only). A note editor is
  a follow-up.
- **Shelf rename** — create + delete + open shipped; rename deferred for the same
  prompt reason (would need an inline editor).
- **Remove-from-shelf inside ShelfDetail** — manage membership from the novel's
  "Add to shelf" sheet for now.
- Branch is independent of live sources conceptually; it stacks on `phase-2a` only
  to keep schema versions sequential (v3→v4). Merge order: 2a then 2c (or 2c,
  which contains 2a).

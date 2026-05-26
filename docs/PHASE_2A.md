# Phase 2a — Live Sources

> First Phase 2 slice. Replaces the mock-only catalogue with **real content fetched live from real sources**, on-device, behind the existing `catalogue` facade. Design + rationale: [`superpowers/specs/2026-05-26-live-sources-design.md`](./superpowers/specs/2026-05-26-live-sources-design.md).

## What shipped

| Step | Commit | Summary |
|---|---|---|
| S1 | `615d72f` | Schema v3: `sources` table + `novels.source_id` + `chapters.source_url`; `sourceRepo`; `SourceConfig` types. Additive migration, mock path untouched. |
| S2 | `f11792c` | Adapter **engine** (`parseList/parseDetails/parseChapterBody` + `fetchHtml`) with a `selector@attr` mini-language; per-host **rate limiter**. Parser is `node-html-parser` (cheerio's `undici` import breaks the Metro/Hermes bundle). Offline-validated by `scripts/validate-source-engine.ts`. |
| S3 | `6bce929` | `liveSource` (engine→domain types, namespaced ids); **async `catalogue` facade** with source-aware `getChapterBody`, `searchSource`, `materializeNovel`; engine honors `robots.txt`. `readerLoad`/`downloader`/`search.tsx` moved onto the async facade. |
| S4 | `3178cc7` | Royal Road bundled config (selectors verified against live DOM); `registry` (bundled-only) seeded at boot; source OFF by default. |
| S5 | `ffee5ec` | FastAPI `backend/` serving **configs only**: `/health`, `/sources`, `/sources/{id}`, `/sources/{id}/validate`; pydantic schema + validation; pytest (10). App `registry.refresh()` tries `EXPO_PUBLIC_REGISTRY_URL` with bundled fallback. |
| S6 | `aa86beb` | `POST /sources/test` dry-run (selectolax mirror of the TS engine) returning verification samples; verified live against Royal Road. pytest → 15. |
| S7 | `fb6375a` | `sourceStore` + `app/sources.tsx` (Settings → Manage sources): enable/disable, registry refresh, ToS note. |
| S8 | `ba593e3` | Search → **Search/Browse tab**: source chips (Local + enabled sources), debounced live search/browse, materialize-on-open, loading/error states. |

## Architecture (delta from Phase 1)

```
app
 │  Search/Browse tab: Local (mock) | <live source> chips
 ▼
catalogue (async facade)
 ├─ mock path  → mockSource (offline/dev)
 └─ live path  → liveSource → engine (node-html-parser) → fetchHtml (rate-limited, robots-aware)
                    ▲
                    └ config from sourceRepo (sources table) ← registry (bundled + EXPO_PUBLIC_REGISTRY_URL)

Opening a live result → catalogue.materializeNovel → novelRepo/chapterRepo upsert
 → the rest of the app (NovelDetails, Reader, Downloads, Dashboard, Home) reads the DB unchanged.
Chapter bodies materialize through readerLoad/downloader → catalogue.getChapterBody
 (branches on chapters.source_url: live adapter fetch vs mock).
```

The personal-use posture is locked: the app fetches on the user's behalf for
personal reading, caches on-device only; the backend holds **configs only** and
never touches content. Sources ship disabled; the user opts in.

## Verification

- All four static checks green at every step (`tsc --noEmit`, `expo lint`,
  `expo-doctor` 19/19, iOS export).
- Engine validated offline against synthetic fixtures + robots parsing
  (`scripts/validate-source-engine.ts`).
- Royal Road config + dry-run verified against the **live** site (search 20,
  details title/author/cover + 16 chapters, body sample).
- Backend pytest: 15 passing.

## Deferred / follow-ups

- **Deploy the backend** (Render/Fly) and set `EXPO_PUBLIC_REGISTRY_URL` —
  manual; the app works on bundled configs without it.
- **On-device QA** — live fetch, reader, and downloads against Royal Road on a
  real device (could not run in the build environment). Watch the typed-route
  `as never` cast on `/sources` until an `expo start` regenerates router types.
- **Schema sync** — `backend/app/models.py` (canonical) and
  `src/sources/types.ts` are hand-synced; change both together.

## Polish (shipped after S9)

- **Live cover images** — `CoverPlaceholder` renders an `<Image>` when
  `coverHint` is an http(s) URL (live covers), falling back to the gradient
  placeholder on non-URL hints or load error. One change covers ResultCard /
  NovelHeader / NovelCard / Home rows.
- **Hidden anti-scrape text** — `parseChapterBody` drops nodes hidden by the
  page's `<style>` (`display:none` / `visibility:hidden`) and by inline style,
  removing Royal Road's decoy paragraphs. Generic across sources; covered by the
  engine fixture validation.

## Out of scope (later slices)

Bookmarks · shelves · cloud/per-user sync · push · aggregate multi-source
search · downloadable JS plugins · auth (permanently out of product scope).

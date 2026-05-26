# Phase 2a — Live Sources (design)

> **Status:** approved design, pre-implementation.
> **Scope:** Phase 2 slices **2a (real data) + 2b (scraper)** only, reframed under a personal-use, on-device model.
> **Supersedes:** the ROADMAP "Phase 2+" one-liner for the data/scraper portion. Auth, cloud sync, push, bookmarks, shelves remain out (separate slices / out of product scope).

## 1. Goal

Replace the local mock catalogue with **real web-novel content fetched live from real sources**, without standing up a content-redistributing backend. The app's existing `catalogue` facade was built precisely so the data source can be swapped without touching call sites; this phase delivers that swap.

The reference source for validating the engine is **Royal Road**.

## 2. Legal / personal-use posture (non-negotiable constraints)

Scraping copyrighted web novels into a central backend that re-serves them is infringement. This design avoids that entirely by using the **on-device adapter model** (the LNReader / Tachiyomi pattern):

- The **app itself** fetches from the source, on the user's behalf, for that user's personal reading.
- Copyrighted chapter text is cached **only on that user's device** (the existing SQLite cache). No server the project runs ever stores or redistributes chapter bodies.
- The backend holds **adapter configuration only** (selectors, URLs, rate limits) — never content.
- Sources are **off by default**; the user enables them. The Sources screen and backend README state the personal-use / respect-source-terms posture.

Royal Road specifically: free-to-read content, but its ToS prohibits automated access. The adapter is built respectfully (rate-limited, robots-aware, no bulk crawl, on-device only) and ships as an opt-in registry entry. Legal responsibility for use sits with the end user, as with any source-plugin reader.

## 3. Architecture — three layers

```
┌─ Backend (FastAPI, deployed free tier) ───────────────────┐
│  GET  /sources            → versioned list of configs     │
│  GET  /sources/{id}       → one config                    │
│  POST /sources/test       → dry-run a config server-side  │
│  config store: JSON files; NO chapter bodies, ever        │
└────────────────────────────────────────────────────────────┘
        │ adapter configs (JSON)          ▲ bundled fallback in app
        ▼                                 │
┌─ App: source layer ───────────────────────────────────────┐
│  sourceRegistry  ← fetch configs, cache, bundled fallback  │
│  adapterEngine   ← interprets a config + node-html-parser: │
│                    search() · details() · chapterList()    │
│                    · chapterBody()   (rate-limited fetch)  │
│  liveSource      ← implements the SAME interface mockSource │
└────────────────────────────────────────────────────────────┘
        │ behind the existing facade
        ▼
   catalogue.ts  ──►  readerLoad / search / details screens   (call sites unchanged)
        │
        ▼
   SQLite cache (bodies persisted on first open — already exists)
```

`liveSource` satisfies the same interface `mockSource` does, so `catalogue.ts` and every screen calling it are unchanged. Mock stays as a dev/offline source.

## 4. Adapter config schema (the contract)

A declarative config interpreted by a generic engine (node-html-parser) — **no remote code execution**. A small selector mini-language (`selector` plus optional `@attr` to read an attribute) keeps it safe and debuggable.

```jsonc
{
  "id": "royalroad",
  "name": "Royal Road",
  "version": 3,
  "baseUrl": "https://www.royalroad.com",
  "lang": "en",
  "rateLimitMs": 1000,            // min gap between requests, enforced on-device
  "userAgent": "WebReader/2.0 (personal use)",
  "search": {
    "url": "/fictions/search?title={query}",
    "item": "div.fiction-list-item",          // repeated result row
    "title": "h2.fiction-title a",
    "link":  "h2.fiction-title a@href",        // @attr = read that attribute
    "cover": "img@src"
  },
  "details": {
    "title": "h1[property='name']",
    "author": "h4 a",
    "cover": ".cover-art-container img@src",
    "description": "div.description",
    "chapterItem": "table#chapters tbody tr",
    "chapterTitle": "td a",
    "chapterLink": "td a@href"
  },
  "chapter": {
    "body": "div.chapter-content"             // innerHTML → cleaned → SQLite
  },
  "browse": {                                  // optional; empty-query landing list
    "url": "/fictions/best-rated",
    "item": "div.fiction-list-item",
    "title": "h2.fiction-title a",
    "link":  "h2.fiction-title a@href",
    "cover": "img@src"
  }
}
```

The engine maps parsed output to the existing `Novel` / `ChapterMeta` / `Chapter` types. The pydantic model in the backend (`models.py`) is the canonical schema; the TS `SourceConfig` type mirrors it (kept in sync by hand — no codegen this phase).

## 5. Data model / schema migration (`SCHEMA_VERSION` 2 → 3)

```sql
-- migration[2]
CREATE TABLE IF NOT EXISTS sources (
  id          TEXT PRIMARY KEY,      -- "royalroad"
  name        TEXT NOT NULL,
  version     INTEGER NOT NULL,
  config_json TEXT NOT NULL,         -- cached adapter config
  enabled     INTEGER NOT NULL DEFAULT 0,
  updated_at  INTEGER NOT NULL
);

ALTER TABLE novels   ADD COLUMN source_id  TEXT;   -- null = legacy/mock
ALTER TABLE chapters ADD COLUMN source_url TEXT;   -- per-chapter live fetch URL
```

- For live novels, `id = "{source_id}:{slug}"` so two sources cannot collide on primary key. `source_id` namespaces the novel.
- `chapters.source_url` is what `readerLoad` fetches when `body` is null **and** the novel is live. Mock novels leave it null and fall back to `mockSource` — **existing mock data keeps working untouched.**
- New repo `sourceRepo` (list / get / upsert / setEnabled), mirroring existing repo patterns.
- Migration is additive (`ALTER TABLE ADD COLUMN`, `CREATE TABLE IF NOT EXISTS`); no data rewrite. Per house rules, bump `SCHEMA_VERSION` and append the migration string in `src/db/schema.ts`.

## 6. App source layer (new files under `src/`)

| File | Responsibility |
|---|---|
| `src/sources/types.ts` | `SourceConfig`, `SourceSelector` types (the schema above) |
| `src/sources/registry.ts` | fetch configs from backend → cache in `sources` table; bundled fallback at `src/sources/bundled/*.json`; version-aware refresh |
| `src/sources/engine.ts` | interpreter: `parseList/parseDetails/parseChapterBody` + `fetchHtml` via node-html-parser; builds results from a config |
| `src/sources/rateLimiter.ts` | per-source min-gap queue (honors `rateLimitMs`); single in-flight chain per host |
| `src/sources/liveSource.ts` | implements the `mockSource` interface using engine + a resolved config |
| `src/stores/sourceStore.ts` | enabled sources, active-browse-source, registry-refresh state |
| `src/sources/bundled/royalroad.json` | bundled fallback config for the reference source |

`src/services/catalogue.ts` gains a resolver: pick `liveSource` when the target novel/source is live, else `mockSource`. Call sites unchanged.

**Parsing dep:** `node-html-parser` (pure JS, Hermes-safe). Originally specced as `cheerio`, but cheerio 1.x statically imports `undici` (via its `fromURL` export), whose `node:` built-ins break the Metro/Hermes bundle. node-html-parser provides the same `querySelector`/`getAttribute`/`innerHTML` surface the selector mini-language needs, bundles clean (verified by the S2 iOS export), and is validated offline by `scripts/validate-source-engine.ts`.

## 7. App UI + navigation

Fitted to the existing tab + root-stack shell:

- **Sources screen** — `app/sources.tsx` (root stack, tab-less), opened from **Settings → "Sources"**. Lists registry adapters with enable/disable switches, version, last-refresh, and "Refresh from registry". Matches the Settings visual language; off by default.
- **Browse** — promote **Search (tab 2) into a Search / Browse tab.** Adds a source-selector chip-row (enabled sources) at top. Empty query = the source's `browse` list (if the config defines one), else search-only. Reuses existing `ResultCard`.
- **NovelDetails / Reader** — unchanged screens; they receive live-sourced novels. Live chapter bodies materialize through `readerLoad`, which now branches on `source_url`.
- **Downloads** — unchanged; live chapters enqueue exactly like mock ones (downloader fetches via `catalogue` → `liveSource.chapterBody`).

Nav contract addition: `sources` joins `novel/[id]`, `reader/...`, `dashboard` as a tab-less root-stack route. Tabs stay on the four mains. (Note: typed-routes `router.d.ts` only regenerates on `expo start`, not `expo export` — new routes may need the documented `as never` cast until a dev server run regenerates types.)

## 8. Backend (FastAPI, `backend/` — monorepo)

```
backend/
├── app/
│   ├── main.py            # FastAPI app, CORS, GET /health
│   ├── models.py          # pydantic SourceConfig (canonical schema)
│   ├── registry.py        # load/serve config JSONs from backend/configs/*.json
│   ├── validate.py        # schema + selector sanity (non-empty, valid @attr form)
│   └── dry_run.py         # POST /sources/test runner (named dry_run so pytest doesn't collect it)
├── configs/               # published adapter configs (royalroad.json, …)
├── tests/                 # pytest: schema validation, /sources/test against a saved fixture
├── requirements.txt       # fastapi, uvicorn, httpx, selectolax (or beautifulsoup4)
└── README.md              # run + deploy notes + ToS/personal-use posture
```

Endpoints:
- `GET /sources` → `{ version, sources: [config…] }`. App caches the whole bundle; `version` gates refresh.
- `GET /sources/{id}` → one config.
- `POST /sources/test` → body `{ config, query? }`. Server fetches live with `httpx`, runs selectors with `selectolax`/`bs4`, returns a parsed **sample** (one search hit + a chapter-list slice + first ~500 chars of a body) so selectors are verifiable before a config is committed. **Test path returns samples only — never stores or redistributes content.**

Deploy: free tier (Render / Fly). App reads `EXPO_PUBLIC_REGISTRY_URL`; on fetch failure it falls back to bundled `src/sources/bundled/*.json`, so the app never hard-depends on the backend being reachable.

## 9. Offline-first contract (guarantees preserved)

| Action | Online required? | Cache behavior |
|---|---|---|
| Browse / search a source | yes | not persisted (live list) |
| Open NovelDetails | yes, first time | novel meta + chapter list upserted to SQLite |
| Open / download a chapter | yes, first time | body persisted (`readerLoad` / downloader) → reads offline forever after |
| Home "Continue / Downloaded" | no | read from SQLite |
| Registry refresh | yes, else bundled fallback | configs cached in `sources` table |

No regression: mock novels and already-cached content remain fully offline.

## 10. Royal Road reference adapter — respectful access (baked in)

- `rateLimitMs: 1000`, enforced by `rateLimiter.ts` (one request/sec/host, single in-flight chain).
- Realistic `userAgent`; honor `robots.txt` — engine fetches + caches `/robots.txt` and skips disallowed paths.
- No bulk / whole-site crawl. Fetch only what the user opens; no prefetch beyond the next chapter.
- On-device only; backend never stores RR bodies. Config ships as a registry entry, **off by default**.
- ToS reality stated in `backend/README.md` and on the Sources screen.

## 11. Build order (engine-first)

Each step is one commit; the four-command ritual (`tsc --noEmit`, `lint`, `expo-doctor`, iOS export) must stay green.

```
S1  schema v3 migration + sourceRepo + types               (no behavior change yet)
S2  adapter engine + rateLimiter + cheerio, validated against a saved RR HTML fixture
S3  liveSource + catalogue resolver; readerLoad branch on source_url
S4  Royal Road bundled config + registry.ts (bundled-only) → first real on-device fetch
S5  FastAPI backend: /health, /sources, /sources/{id}, validate, pytest; wire registry.ts w/ fallback
S6  POST /sources/test + backend deploy
S7  Sources screen (Settings entry) + sourceStore
S8  Search → Browse tab: source chips + per-source browse/search
S9  Downloads + Dashboard sanity pass with live content; docs (ROADMAP/PLAN/PHASE_2A.md)
```

S1–S4 prove the hardest part (on-device parsing) before backend or UI exist.

## 12. Out of scope (this phase)

Auth · cloud / per-user sync · push notifications · bookmarks · shelves · aggregate multi-source search · downloadable JS plugins · iOS/Android native prebuild work · TS↔pydantic codegen. Bookmarks/shelves remain the separate 2c slice.

## 13. Risks

- **Brittle selectors:** Royal Road HTML changes break the config. Mitigated by registry-served configs (fix without app release) + `/sources/test` to verify before publishing.
- **Hermes parser edge cases:** resolved at S2 — cheerio dropped for node-html-parser (cheerio's `undici` import breaks the Metro bundle). node-html-parser validated offline + bundles clean in the iOS export.
- **Rate-limit / blocking:** respectful defaults reduce but don't eliminate the chance a source blocks requests; surfaced as a clear error state, not a crash.
- **Schema drift (TS ↔ pydantic):** hand-synced; README flags they move together. Low volume this phase.
- **Anti-scrape injected text (Royal Road):** RR injects hidden paragraphs (CSS-hidden, randomized class names) into chapter bodies to catch scrapers. The selector engine captures them along with real text. Acceptable for S4 (selectors verified against live DOM: search/details/body all parse). Stripping CSS-hidden nodes needs the stylesheet and is deferred to a body-cleaning pass (the existing TTS cleaning toggles are a partial lever). Tracked for S9/follow-up.
- **Live cover images:** adapters capture real cover URLs into `coverHint`, but the UI renders gradient placeholders from that string. Real `<Image>` cover rendering is future polish, not in this phase.

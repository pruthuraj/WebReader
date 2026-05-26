// Declarative source-adapter config. A generic engine (S2) interprets these
// with cheerio — there is no remote code execution. The backend registry (S5)
// serves configs of this exact shape; the pydantic model in backend/app/models.py
// is the canonical schema and this type mirrors it (hand-synced, no codegen).

/**
 * A selector string with optional `@attr` suffix:
 *   "h2.fiction-title a"        → text content of the matched node
 *   "h2.fiction-title a@href"   → the node's `href` attribute
 *   "img@src"                   → the node's `src` attribute
 */
export type SourceSelector = string;

/** Selectors for a list page (search results or a browse listing). */
export interface SourceListSelectors {
  /** Path or absolute URL. `{query}` is replaced (URL-encoded) for search. */
  url: string;
  /** Selector matching each repeated result row. */
  item: SourceSelector;
  title: SourceSelector;
  /** Link to the novel's details page (usually `... @href`). */
  link: SourceSelector;
  cover?: SourceSelector;
}

/** Selectors for a novel details page, including its chapter list. */
export interface SourceDetailsSelectors {
  title: SourceSelector;
  author?: SourceSelector;
  cover?: SourceSelector;
  description?: SourceSelector;
  /** Selector matching each chapter row in the list. */
  chapterItem: SourceSelector;
  chapterTitle: SourceSelector;
  /** Link to a chapter page (usually `... @href`). */
  chapterLink: SourceSelector;
}

/** Selector for the chapter body on a chapter page. */
export interface SourceChapterSelectors {
  /** Container whose inner HTML becomes the chapter body. */
  body: SourceSelector;
}

export interface SourceConfig {
  id: string;
  name: string;
  /** Bumped when selectors change; gates registry refresh. */
  version: number;
  /** Site origin, e.g. "https://www.royalroad.com". Relative links resolve against this. */
  baseUrl: string;
  lang?: string;
  /** Minimum gap between requests to this source, enforced on-device. Defaults applied by the engine. */
  rateLimitMs?: number;
  userAgent?: string;
  search: SourceListSelectors;
  details: SourceDetailsSelectors;
  chapter: SourceChapterSelectors;
  /** Optional landing list shown when the search query is empty. */
  browse?: SourceListSelectors;
}

/** A source as cached in the `sources` table. */
export interface StoredSource {
  id: string;
  name: string;
  version: number;
  config: SourceConfig;
  enabled: boolean;
  updatedAt: number;
}

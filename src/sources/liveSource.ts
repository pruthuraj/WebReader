// liveSource maps the generic engine's parsed output onto the app's domain
// types (Novel / ChapterMeta), assigning stable ids. It is the live-fetch
// counterpart to mockSource and is reached behind the `catalogue` facade.
//
// ID scheme (namespaced so two sources never collide):
//   novelId   = "<sourceId>::<absolute details URL>"
//   chapterId = "<absolute chapter URL>"   (already unique within a novel)
// A chapter's `sourceUrl` mirrors chapterId — it's the URL the engine fetches
// to materialize the body.

import type { ChapterMeta, Novel } from "@/data/types";
import {
  buildSearchUrl,
  fetchHtml,
  parseChapterBody,
  parseDetails,
  parseList,
  type ParsedListItem,
} from "./engine";
import type { SourceConfig } from "./types";

const ID_SEP = "::";

export function liveNovelId(sourceId: string, detailsUrl: string): string {
  return `${sourceId}${ID_SEP}${detailsUrl}`;
}

/** Recover the details URL encoded in a live novel id (for re-materialization). */
export function detailsUrlFromId(novelId: string): string | null {
  const i = novelId.indexOf(ID_SEP);
  return i < 0 ? null : novelId.slice(i + ID_SEP.length);
}

function listItemToNovel(config: SourceConfig, item: ParsedListItem): Novel {
  return {
    id: liveNovelId(config.id, item.url),
    title: item.title,
    author: null,
    source: config.name,
    language: config.lang ?? null,
    description: null,
    tags: [],
    // Live covers are real image URLs. The current UI renders gradient
    // placeholders from coverHint; real <Image> rendering is future polish.
    coverHint: item.cover ?? null,
    sourceId: config.id,
  };
}

export const liveSource = {
  async search(config: SourceConfig, query: string): Promise<Novel[]> {
    const html = await fetchHtml(buildSearchUrl(config, query), config);
    return parseList(html, config.search, config.baseUrl).map((it) => listItemToNovel(config, it));
  },

  /** The source's landing list (config.browse). Empty if the source defines none. */
  async browse(config: SourceConfig): Promise<Novel[]> {
    if (!config.browse) return [];
    const url = buildSearchUrl({ ...config, search: config.browse }, "");
    const html = await fetchHtml(url, config);
    return parseList(html, config.browse, config.baseUrl).map((it) => listItemToNovel(config, it));
  },

  /** Fetch a details page → novel metadata + chapter list (with per-chapter sourceUrl). */
  async getDetails(
    config: SourceConfig,
    detailsUrl: string
  ): Promise<{ novel: Novel; chapters: ChapterMeta[] }> {
    const html = await fetchHtml(detailsUrl, config);
    const parsed = parseDetails(html, config.details, config.baseUrl);
    const novelId = liveNovelId(config.id, detailsUrl);
    const novel: Novel = {
      id: novelId,
      title: parsed.title || "Untitled",
      author: parsed.author ?? null,
      source: config.name,
      language: config.lang ?? null,
      description: parsed.description ?? null,
      tags: [],
      coverHint: parsed.cover ?? null,
      sourceId: config.id,
    };
    const chapters: ChapterMeta[] = parsed.chapters.map((c, i) => ({
      novelId,
      chapterId: c.url,
      idx: i + 1,
      title: c.title,
      downloadedAt: null,
      sourceUrl: c.url,
    }));
    return { novel, chapters };
  },

  async getChapterBody(config: SourceConfig, chapterUrl: string): Promise<string> {
    const html = await fetchHtml(chapterUrl, config);
    return parseChapterBody(html, config.chapter);
  },
};

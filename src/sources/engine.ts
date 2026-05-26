// Generic adapter engine: interprets a declarative SourceConfig against fetched
// HTML using node-html-parser. No remote code execution — only selectors.
//
// Selector mini-language: a CSS selector with an optional trailing `@attr`:
//   "h2.fiction-title a"        → text content of the matched node
//   "h2.fiction-title a@href"   → the node's `href` attribute
// The `@attr` suffix is recognized only as a trailing token of attribute-name
// characters, so attribute selectors like `a[title='x@y']` are left intact.

import { parse, type HTMLElement } from "node-html-parser";
import { rateLimited } from "./rateLimiter";
import type {
  SourceConfig,
  SourceListSelectors,
  SourceSelector,
} from "./types";

export const DEFAULT_RATE_MS = 1000;
export const DEFAULT_USER_AGENT = "WebReader/2.0 (personal use)";

export class SourceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SourceError";
  }
}

export interface ParsedListItem {
  title: string;
  url: string;
  cover?: string;
}

export interface ParsedChapterRef {
  title: string;
  url: string;
}

export interface ParsedDetails {
  title: string;
  author?: string;
  cover?: string;
  description?: string;
  chapters: ParsedChapterRef[];
}

const ATTR_SUFFIX = /@([a-zA-Z][\w:-]*)$/;

interface ParsedSelector {
  selector: string;
  attr: string | null;
}

function splitSelector(raw: SourceSelector): ParsedSelector {
  const m = raw.match(ATTR_SUFFIX);
  if (m && m.index !== undefined) {
    return { selector: raw.slice(0, m.index).trim(), attr: m[1] };
  }
  return { selector: raw.trim(), attr: null };
}

function readValue(node: HTMLElement, attr: string | null): string {
  if (attr) return (node.getAttribute(attr) ?? "").trim();
  return node.text.replace(/\s+/g, " ").trim();
}

/** Resolve a possibly-relative href against the source's base URL. */
export function resolveUrl(base: string, href: string): string {
  const link = (href ?? "").trim();
  if (!link) return "";
  if (/^https?:\/\//i.test(link)) return link;
  const originMatch = base.match(/^(https?:\/\/[^/]+)/i);
  const origin = originMatch ? originMatch[1] : base.replace(/\/+$/, "");
  if (link.startsWith("//")) return (originMatch ? originMatch[1].split(":")[0] : "https") + ":" + link;
  if (link.startsWith("/")) return origin + link;
  return origin + "/" + link.replace(/^\.?\//, "");
}

function selectOne(root: HTMLElement, raw: SourceSelector | undefined, base: string): string | undefined {
  if (!raw) return undefined;
  const { selector, attr } = splitSelector(raw);
  const node = selector ? root.querySelector(selector) : root;
  if (!node) return undefined;
  const value = readValue(node, attr);
  if (!value) return undefined;
  return attr === "href" || attr === "src" ? resolveUrl(base, value) : value;
}

/** Parse a search/browse list page into result rows. */
export function parseList(html: string, sel: SourceListSelectors, base: string): ParsedListItem[] {
  const root = parse(html);
  const itemSel = splitSelector(sel.item).selector;
  const rows = root.querySelectorAll(itemSel);
  const out: ParsedListItem[] = [];
  for (const row of rows) {
    const title = selectOne(row, sel.title, base);
    const url = selectOne(row, sel.link, base);
    if (!title || !url) continue;
    out.push({ title, url, cover: selectOne(row, sel.cover, base) });
  }
  return out;
}

/** Parse a novel details page (metadata + chapter list). */
export function parseDetails(
  html: string,
  sel: SourceConfig["details"],
  base: string
): ParsedDetails {
  const root = parse(html);
  const title = selectOne(root, sel.title, base) ?? "";
  const chapterItemSel = splitSelector(sel.chapterItem).selector;
  const chapterRows = root.querySelectorAll(chapterItemSel);
  const chapters: ParsedChapterRef[] = [];
  for (const row of chapterRows) {
    const cTitle = selectOne(row, sel.chapterTitle, base);
    const cUrl = selectOne(row, sel.chapterLink, base);
    if (!cTitle || !cUrl) continue;
    chapters.push({ title: cTitle, url: cUrl });
  }
  return {
    title,
    author: selectOne(root, sel.author, base),
    cover: selectOne(root, sel.cover, base),
    description: selectOne(root, sel.description, base),
    chapters,
  };
}

/** Parse a chapter page into its body HTML (inner HTML of the body container). */
export function parseChapterBody(html: string, sel: SourceConfig["chapter"]): string {
  const root = parse(html);
  const { selector } = splitSelector(sel.body);
  const node = selector ? root.querySelector(selector) : root;
  if (!node) throw new SourceError(`Chapter body selector matched nothing: "${sel.body}"`);
  return node.innerHTML.trim();
}

/** Build a search URL from the config template, URL-encoding the query. */
export function buildSearchUrl(config: SourceConfig, query: string): string {
  const tmpl = config.search.url;
  const path = tmpl.includes("{query}")
    ? tmpl.replace("{query}", encodeURIComponent(query))
    : tmpl;
  return resolveUrl(config.baseUrl, path);
}

function hostOf(url: string): string {
  const m = url.match(/^https?:\/\/([^/]+)/i);
  return m ? m[1] : url;
}

/** Rate-limited HTML GET honoring the source's userAgent + pacing. */
export async function fetchHtml(url: string, config: SourceConfig): Promise<string> {
  const gap = config.rateLimitMs ?? DEFAULT_RATE_MS;
  return rateLimited(hostOf(url), gap, async () => {
    const res = await fetch(url, {
      headers: {
        "User-Agent": config.userAgent ?? DEFAULT_USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) throw new SourceError(`HTTP ${res.status} fetching ${url}`);
    return res.text();
  });
}

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

const HIDDEN_DECL = /(display\s*:\s*none|visibility\s*:\s*hidden)/i;

/**
 * Collect selectors hidden by the page's <style> blocks (display:none /
 * visibility:hidden). Sites like Royal Road inject hidden decoy paragraphs to
 * trap scrapers; these selectors let us drop them before extracting the body.
 */
function collectHiddenSelectors(root: HTMLElement): string[] {
  const out: string[] = [];
  const ruleRe = /([^{}]+)\{([^{}]*)\}/g;
  for (const styleEl of root.querySelectorAll("style")) {
    const css = styleEl.text || "";
    let m: RegExpExecArray | null;
    while ((m = ruleRe.exec(css))) {
      if (!HIDDEN_DECL.test(m[2])) continue;
      for (const part of m[1].split(",")) {
        const s = part.trim();
        if (s && !s.startsWith("@")) out.push(s);
      }
    }
  }
  return out;
}

/** Parse a chapter page into its body HTML, dropping hidden anti-scrape nodes. */
export function parseChapterBody(html: string, sel: SourceConfig["chapter"]): string {
  const root = parse(html);
  const { selector } = splitSelector(sel.body);
  const node = selector ? root.querySelector(selector) : root;
  if (!node) throw new SourceError(`Chapter body selector matched nothing: "${sel.body}"`);

  // Remove nodes hidden via the page stylesheet…
  for (const hiddenSel of collectHiddenSelectors(root)) {
    try {
      for (const hidden of node.querySelectorAll(hiddenSel)) hidden.remove();
    } catch {
      // Unsupported selector syntax — skip it rather than fail the whole body.
    }
  }
  // …and via inline style attributes.
  for (const el of node.querySelectorAll("[style]")) {
    if (HIDDEN_DECL.test(el.getAttribute("style") || "")) el.remove();
  }

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

function originOf(url: string): string {
  const m = url.match(/^(https?:\/\/[^/]+)/i);
  return m ? m[1] : url.replace(/\/+$/, "");
}

// robots.txt is fetched once per host and cached. We honor Disallow rules under
// the wildcard (`User-agent: *`) group — respectful access, personal use.
const robotsCache = new Map<string, Promise<string[]>>();

function parseRobots(txt: string): string[] {
  const disallow: string[] = [];
  let active = false;
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) continue;
    const idx = line.indexOf(":");
    if (idx < 0) continue;
    const k = line.slice(0, idx).trim().toLowerCase();
    const v = line.slice(idx + 1).trim();
    if (k === "user-agent") active = v === "*";
    else if (active && k === "disallow" && v) disallow.push(v);
  }
  return disallow;
}

function disallowedPaths(config: SourceConfig): Promise<string[]> {
  const host = hostOf(config.baseUrl);
  let cached = robotsCache.get(host);
  if (!cached) {
    cached = (async () => {
      try {
        const res = await fetch(`${originOf(config.baseUrl)}/robots.txt`, {
          headers: { "User-Agent": config.userAgent ?? DEFAULT_USER_AGENT },
        });
        if (!res.ok) return [];
        return parseRobots(await res.text());
      } catch {
        return []; // No robots.txt reachable → no restrictions inferred.
      }
    })();
    robotsCache.set(host, cached);
  }
  return cached;
}

/** Throws if robots.txt disallows the path. Fetched outside the rate limiter. */
export async function assertAllowed(url: string, config: SourceConfig): Promise<void> {
  const rules = await disallowedPaths(config);
  if (!rules.length) return;
  const path = url.replace(/^https?:\/\/[^/]+/i, "") || "/";
  for (const rule of rules) {
    if (rule === "/" || path.startsWith(rule)) {
      throw new SourceError(`Blocked by robots.txt rule "${rule}": ${path}`);
    }
  }
}

/** Rate-limited, robots-aware HTML GET honoring the source's userAgent + pacing. */
export async function fetchHtml(url: string, config: SourceConfig): Promise<string> {
  await assertAllowed(url, config);
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

export const _internal = { parseRobots, robotsCache };

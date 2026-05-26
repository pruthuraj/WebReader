// Offline validation of the source adapter engine against synthetic fixtures.
// No test runner is wired in this project, so this is run on demand:
//
//   npx tsx scripts/validate-source-engine.ts
//
// It proves the selector engine (parseList / parseDetails / parseChapterBody)
// and URL resolution behave correctly. Useful for debugging real adapter
// selectors too: point the config + a saved HTML file at it.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  parseList,
  parseDetails,
  parseChapterBody,
  buildSearchUrl,
  resolveUrl,
  _internal,
} from "../src/sources/engine";
import type { SourceConfig } from "../src/sources/types";

const BASE = "https://www.royalroad.com";

const config: SourceConfig = {
  id: "fixture",
  name: "Fixture",
  version: 1,
  baseUrl: BASE,
  search: {
    url: "/fictions/search?title={query}",
    item: "div.fiction-list-item",
    title: "h2.fiction-title a",
    link: "h2.fiction-title a@href",
    cover: "img@src",
  },
  details: {
    title: "h1.novel-title",
    author: "h4.author a",
    cover: ".cover img@src",
    description: ".description",
    chapterItem: "table#chapters tbody tr",
    chapterTitle: "td a",
    chapterLink: "td a@href",
  },
  chapter: { body: ".chapter-content" },
};

function read(name: string): string {
  return readFileSync(fileURLToPath(new URL(`../src/sources/__fixtures__/${name}`, import.meta.url)), "utf8");
}

let failures = 0;
function check(label: string, cond: boolean, detail?: unknown) {
  if (cond) {
    console.log(`  ok  ${label}`);
  } else {
    failures++;
    console.error(`FAIL  ${label}`, detail ?? "");
  }
}

console.log("resolveUrl");
check("relative path", resolveUrl(BASE, "/a/b") === `${BASE}/a/b`);
check("absolute kept", resolveUrl(BASE, "https://cdn.x/y.jpg") === "https://cdn.x/y.jpg");
check("bare relative", resolveUrl(BASE, "a/b") === `${BASE}/a/b`);

console.log("buildSearchUrl");
check(
  "encodes query",
  buildSearchUrl(config, "a b&c") === `${BASE}/fictions/search?title=a%20b%26c`,
  buildSearchUrl(config, "a b&c")
);

console.log("parseList");
const list = parseList(read("list.html"), config.search, BASE);
check("skips malformed row → 2 items", list.length === 2, list.length);
check("first title", list[0]?.title === "Alpha Saga", list[0]);
check("first link resolved", list[0]?.url === `${BASE}/fiction/101/alpha`, list[0]?.url);
check("relative cover resolved", list[0]?.cover === `${BASE}/covers/1.jpg`, list[0]?.cover);
check("absolute cover kept", list[1]?.cover === "https://cdn.example.com/covers/2.jpg", list[1]?.cover);

console.log("parseDetails");
const details = parseDetails(read("details.html"), config.details, BASE);
check("title", details.title === "Alpha Saga", details.title);
check("author", details.author === "Jane Writer", details.author);
check("cover resolved", details.cover === `${BASE}/covers/1-big.jpg`, details.cover);
check("description", (details.description ?? "").includes("epic test"), details.description);
check("3 chapters", details.chapters.length === 3, details.chapters.length);
check("chapter title", details.chapters[0]?.title === "Chapter 1: Begin", details.chapters[0]);
check(
  "chapter link resolved",
  details.chapters[0]?.url === `${BASE}/fiction/101/alpha/chapter/1`,
  details.chapters[0]?.url
);

console.log("parseChapterBody");
const body = parseChapterBody(read("chapter.html"), config.chapter);
check("captures body paragraphs", body.includes("First paragraph of the body."), body.slice(0, 80));
check("keeps second paragraph", body.includes("Second paragraph"), body.slice(0, 80));
check("excludes site chrome", !body.includes("site chrome"), body.slice(0, 80));
check("drops stylesheet-hidden decoy", !body.includes("DECOY paragraph"), body);
check("drops inline-hidden decoy", !body.includes("INLINE decoy"), body);
check("drops visibility-hidden decoy", !body.includes("Another DECOY"), body);

console.log("parseRobots");
const robots = _internal.parseRobots(
  [
    "# comment",
    "User-agent: Googlebot",
    "Disallow: /secret-bot-only",
    "User-agent: *",
    "Disallow: /private",
    "Disallow: /tmp # trailing comment",
    "Allow: /",
  ].join("\n")
);
check("only wildcard-group disallows", robots.length === 2, robots);
check("captures /private", robots.includes("/private"), robots);
check("strips trailing comment", robots.includes("/tmp"), robots);
check("ignores other-agent rule", !robots.includes("/secret-bot-only"), robots);

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log("\nAll engine checks passed.");

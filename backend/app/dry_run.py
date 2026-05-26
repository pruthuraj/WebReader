"""Server-side dry-run of an adapter config against a live source.

Mirrors the on-device TypeScript engine (src/sources/engine.ts) using selectolax,
so a config's selectors can be verified before publishing. Returns small SAMPLES
only (a search hit, a chapter-list slice, a body excerpt) — it never stores or
redistributes content.
"""

from __future__ import annotations

import re
from typing import Optional
from urllib.parse import quote

import httpx
from selectolax.parser import HTMLParser, Node

from .models import ChapterSelectors, DetailsSelectors, ListSelectors, SourceConfig

DEFAULT_USER_AGENT = "WebReader/2.0 (personal use)"
ATTR_RE = re.compile(r"@([a-zA-Z][\w:-]*)$")
BODY_SAMPLE_CHARS = 500


def split_selector(raw: str) -> tuple[str, Optional[str]]:
    m = ATTR_RE.search(raw)
    if m:
        return raw[: m.start()].strip(), m.group(1)
    return raw.strip(), None


def resolve_url(base: str, href: str) -> str:
    link = (href or "").strip()
    if not link:
        return ""
    if re.match(r"^https?://", link, re.I):
        return link
    origin_match = re.match(r"^(https?://[^/]+)", base, re.I)
    origin = origin_match.group(1) if origin_match else base.rstrip("/")
    if link.startswith("//"):
        scheme = origin.split(":")[0] if origin_match else "https"
        return f"{scheme}:{link}"
    if link.startswith("/"):
        return origin + link
    return origin + "/" + re.sub(r"^\.?/", "", link)


def _read(node: Node, attr: Optional[str]) -> str:
    if attr:
        return (node.attributes.get(attr) or "").strip()
    return " ".join(node.text(strip=True).split())


def select_one(root: Node | HTMLParser, raw: Optional[str], base: str) -> Optional[str]:
    if not raw:
        return None
    sel, attr = split_selector(raw)
    node = root.css_first(sel) if sel else (root if isinstance(root, Node) else None)
    if node is None:
        return None
    val = _read(node, attr)
    if not val:
        return None
    return resolve_url(base, val) if attr in ("href", "src") else val


def parse_list(html: str, sel: ListSelectors, base: str) -> list[dict]:
    tree = HTMLParser(html)
    out: list[dict] = []
    for row in tree.css(split_selector(sel.item)[0]):
        title = select_one(row, sel.title, base)
        url = select_one(row, sel.link, base)
        if not title or not url:
            continue
        out.append({"title": title, "url": url, "cover": select_one(row, sel.cover, base)})
    return out


def parse_details(html: str, sel: DetailsSelectors, base: str) -> dict:
    tree = HTMLParser(html)
    chapters: list[dict] = []
    for row in tree.css(split_selector(sel.chapterItem)[0]):
        c_title = select_one(row, sel.chapterTitle, base)
        c_url = select_one(row, sel.chapterLink, base)
        if not c_title or not c_url:
            continue
        chapters.append({"title": c_title, "url": c_url})
    return {
        "title": select_one(tree, sel.title, base) or "",
        "author": select_one(tree, sel.author, base),
        "cover": select_one(tree, sel.cover, base),
        "description": select_one(tree, sel.description, base),
        "chapters": chapters,
    }


def parse_chapter_body_sample(html: str, sel: ChapterSelectors) -> str:
    node = HTMLParser(html).css_first(split_selector(sel.body)[0])
    if node is None:
        return ""
    return " ".join(node.text(strip=True).split())[:BODY_SAMPLE_CHARS]


async def run_dry_run(config: SourceConfig, query: str) -> dict:
    """Fetch search → first details → first chapter, returning verification samples."""
    base = config.baseUrl
    search_path = (
        config.search.url.replace("{query}", quote(query, safe=""))
        if "{query}" in config.search.url
        else config.search.url
    )
    search_url = resolve_url(base, search_path)
    headers = {"User-Agent": config.userAgent or DEFAULT_USER_AGENT}
    result: dict = {"searchUrl": search_url}

    async with httpx.AsyncClient(
        headers=headers, timeout=20.0, follow_redirects=True
    ) as client:
        search_html = (await client.get(search_url)).text
        items = parse_list(search_html, config.search, base)
        result["searchCount"] = len(items)
        result["firstResult"] = items[0] if items else None

        if items:
            details_html = (await client.get(items[0]["url"])).text
            details = parse_details(details_html, config.details, base)
            result["details"] = {
                "title": details["title"],
                "author": details["author"],
                "cover": details["cover"],
                "chapterCount": len(details["chapters"]),
                "firstChapter": details["chapters"][0] if details["chapters"] else None,
            }
            if details["chapters"]:
                body_html = (await client.get(details["chapters"][0]["url"])).text
                result["bodySample"] = parse_chapter_body_sample(body_html, config.chapter)

    return result

from fastapi.testclient import TestClient

from app.dry_run import (
    parse_chapter_body_sample,
    parse_details,
    parse_list,
    resolve_url,
)
from app.main import app
from app.models import ChapterSelectors, DetailsSelectors, ListSelectors

client = TestClient(app)

BASE = "https://example.com"

LIST_HTML = """
<div class="fiction-list">
  <div class="fiction-list-item">
    <img src="/c/1.jpg">
    <h2 class="fiction-title"><a href="/fiction/1/alpha">Alpha</a></h2>
  </div>
  <div class="fiction-list-item">
    <img src="https://cdn.x/2.jpg">
    <h2 class="fiction-title"><a href="/fiction/2/beta">Beta</a></h2>
  </div>
  <div class="fiction-list-item"><h2 class="fiction-title">No link</h2></div>
</div>
"""

DETAILS_HTML = """
<h1 class="font-white">Alpha</h1>
<h4 class="font-white"><a href="/profile/7">Jane</a></h4>
<div class="description">A test.</div>
<table id="chapters"><tbody>
  <tr class="chapter-row"><td><a href="/fiction/1/alpha/chapter/1">Ch 1</a></td></tr>
  <tr class="chapter-row"><td><a href="/fiction/1/alpha/chapter/2">Ch 2</a></td></tr>
</tbody></table>
"""

CHAPTER_HTML = """
<div class="chapter-content"><p>Hello body.</p><p>More.</p></div>
<div class="footer">chrome</div>
"""

SEARCH = ListSelectors(
    url="/s?title={query}",
    item="div.fiction-list-item",
    title="h2.fiction-title a",
    link="h2.fiction-title a@href",
    cover="img@src",
)
DETAILS = DetailsSelectors(
    title="h1.font-white",
    author="h4 a",
    description="div.description",
    chapterItem="tr.chapter-row",
    chapterTitle="td a",
    chapterLink="td a@href",
)
CHAPTER = ChapterSelectors(body="div.chapter-content")


def test_resolve_url():
    assert resolve_url(BASE, "/a") == f"{BASE}/a"
    assert resolve_url(BASE, "https://cdn.x/2.jpg") == "https://cdn.x/2.jpg"
    assert resolve_url(BASE, "a/b") == f"{BASE}/a/b"


def test_parse_list_skips_malformed():
    items = parse_list(LIST_HTML, SEARCH, BASE)
    assert len(items) == 2
    assert items[0] == {"title": "Alpha", "url": f"{BASE}/fiction/1/alpha", "cover": f"{BASE}/c/1.jpg"}
    assert items[1]["cover"] == "https://cdn.x/2.jpg"


def test_parse_details():
    d = parse_details(DETAILS_HTML, DETAILS, BASE)
    assert d["title"] == "Alpha"
    assert d["author"] == "Jane"
    assert len(d["chapters"]) == 2
    assert d["chapters"][0] == {"title": "Ch 1", "url": f"{BASE}/fiction/1/alpha/chapter/1"}


def test_parse_chapter_body_sample():
    body = parse_chapter_body_sample(CHAPTER_HTML, CHAPTER)
    assert "Hello body." in body
    assert "chrome" not in body


def test_endpoint_rejects_invalid_config():
    bad = {
        "config": {
            "id": "x",
            "name": "X",
            "version": 1,
            "baseUrl": "example.com",  # not absolute
            "search": {"url": "/s", "item": ".r", "title": "a", "link": "a"},  # no {query}, no @attr
            "details": {
                "title": "h1",
                "chapterItem": "tr",
                "chapterTitle": "td a",
                "chapterLink": "td a@href",
            },
            "chapter": {"body": ".c"},
        },
        "query": "test",
    }
    r = client.post("/sources/test", json=bad)
    assert r.status_code == 422
    assert "issues" in r.json()["detail"]

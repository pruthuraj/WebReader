"""Config sanity checks beyond pydantic's structural validation."""

from __future__ import annotations

import re

from .models import SourceConfig

ATTR_RE = re.compile(r"@([a-zA-Z][\w:-]*)$")


def validate_config(cfg: SourceConfig) -> list[str]:
    """Return a list of human-readable issues; empty means the config is sane."""
    issues: list[str] = []

    if not cfg.baseUrl.lower().startswith(("http://", "https://")):
        issues.append("baseUrl must be an absolute http(s) URL")

    if "{query}" not in cfg.search.url:
        issues.append("search.url should contain a {query} placeholder")

    # Link selectors must read an attribute (otherwise they'd capture text, not a URL).
    link_selectors = {
        "search.link": cfg.search.link,
        "details.chapterLink": cfg.details.chapterLink,
    }
    if cfg.browse is not None:
        link_selectors["browse.link"] = cfg.browse.link
    for label, sel in link_selectors.items():
        if not ATTR_RE.search(sel):
            issues.append(f"{label} should end with @attr (e.g. ...@href)")

    # No selector should be blank.
    flat = {
        "search.item": cfg.search.item,
        "search.title": cfg.search.title,
        "details.title": cfg.details.title,
        "details.chapterItem": cfg.details.chapterItem,
        "details.chapterTitle": cfg.details.chapterTitle,
        "chapter.body": cfg.chapter.body,
    }
    for label, sel in flat.items():
        if not sel or not sel.strip():
            issues.append(f"{label} must not be empty")

    return issues

"""Canonical adapter-config schema.

This pydantic model is the single source of truth for the source-adapter config
shape. The TypeScript `SourceConfig` in src/sources/types.ts mirrors it by hand
(no codegen) — keep them in step when either changes.
"""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


class ListSelectors(BaseModel):
    url: str
    item: str
    title: str
    link: str
    cover: Optional[str] = None


class DetailsSelectors(BaseModel):
    title: str
    author: Optional[str] = None
    cover: Optional[str] = None
    description: Optional[str] = None
    chapterItem: str
    chapterTitle: str
    chapterLink: str


class ChapterSelectors(BaseModel):
    body: str


class SourceConfig(BaseModel):
    id: str
    name: str
    version: int
    baseUrl: str
    lang: Optional[str] = None
    rateLimitMs: Optional[int] = None
    userAgent: Optional[str] = None
    search: ListSelectors
    details: DetailsSelectors
    chapter: ChapterSelectors
    browse: Optional[ListSelectors] = None

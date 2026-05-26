from app.models import (
    ChapterSelectors,
    DetailsSelectors,
    ListSelectors,
    SourceConfig,
)
from app.registry import load_configs
from app.validate import validate_config


def _good_config() -> SourceConfig:
    return SourceConfig(
        id="x",
        name="X",
        version=1,
        baseUrl="https://example.com",
        search=ListSelectors(
            url="/s?title={query}", item=".row", title="a", link="a@href"
        ),
        details=DetailsSelectors(
            title="h1",
            chapterItem="tr",
            chapterTitle="td a",
            chapterLink="td a@href",
        ),
        chapter=ChapterSelectors(body=".content"),
    )


def test_good_config_has_no_issues():
    assert validate_config(_good_config()) == []


def test_relative_base_url_flagged():
    cfg = _good_config()
    cfg.baseUrl = "example.com"
    assert any("baseUrl" in i for i in validate_config(cfg))


def test_missing_query_placeholder_flagged():
    cfg = _good_config()
    cfg.search.url = "/search"
    assert any("{query}" in i for i in validate_config(cfg))


def test_link_without_attr_flagged():
    cfg = _good_config()
    cfg.search.link = "a"  # no @href
    assert any("search.link" in i for i in validate_config(cfg))


def test_bundled_royalroad_is_valid():
    configs = {c.id: c for c in load_configs()}
    assert "royalroad" in configs
    assert validate_config(configs["royalroad"]) == []

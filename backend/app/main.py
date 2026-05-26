"""WebReader source-adapter registry API.

Serves declarative adapter *configs* only — never novel/chapter content. The app
fetches content on-device (personal use); this service exists to update selectors
without an app release and to dry-run configs server-side before publishing.
"""

from __future__ import annotations

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .dry_run import run_dry_run
from .models import SourceConfig
from .registry import bundle_version, load_configs
from .validate import validate_config


class DryRunRequest(BaseModel):
    config: SourceConfig
    query: str = "test"

app = FastAPI(title="WebReader Source Registry", version="1.0.0")

# Public, read-only config API. CORS is open because configs are non-sensitive
# and the consuming clients are mobile apps without a fixed origin.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/sources")
def list_sources() -> dict:
    configs = load_configs()
    return {
        "version": bundle_version(configs),
        "sources": [c.model_dump(exclude_none=True) for c in configs],
    }


@app.get("/sources/{source_id}")
def get_source(source_id: str) -> dict:
    for cfg in load_configs():
        if cfg.id == source_id:
            return cfg.model_dump(exclude_none=True)
    raise HTTPException(status_code=404, detail="source not found")


@app.get("/sources/{source_id}/validate")
def validate_source(source_id: str) -> dict:
    for cfg in load_configs():
        if cfg.id == source_id:
            issues = validate_config(cfg)
            return {"id": source_id, "ok": not issues, "issues": issues}
    raise HTTPException(status_code=404, detail="source not found")


@app.post("/sources/test")
async def test_source(req: DryRunRequest) -> dict:
    """Dry-run a (possibly unpublished) config against the live source.

    Validates first, then fetches search → details → a chapter and returns
    small samples so selectors can be verified. Returns samples only — never
    stores or redistributes content.
    """
    issues = validate_config(req.config)
    if issues:
        raise HTTPException(status_code=422, detail={"issues": issues})
    try:
        return await run_dry_run(req.config, req.query)
    except httpx.HTTPError as exc:  # network/transport failures
        raise HTTPException(status_code=502, detail=f"fetch failed: {exc}") from exc

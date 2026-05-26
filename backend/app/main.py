"""WebReader source-adapter registry API.

Serves declarative adapter *configs* only — never novel/chapter content. The app
fetches content on-device (personal use); this service exists to update selectors
without an app release and to dry-run configs server-side before publishing.
"""

from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .registry import bundle_version, load_configs
from .validate import validate_config

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

# WebReader Source Registry (backend)

A small FastAPI service that serves **declarative source-adapter configs** to the
WebReader app. It exists to update adapter selectors without an app release, and
(via `/sources/test`) to dry-run a config against a live source before publishing.

## What this service does NOT do

It never fetches, stores, caches, or serves novel/chapter **content**. The app
fetches content on-device, on the user's behalf, for that user's personal
reading (the LNReader / Tachiyomi model). This service only handles
configuration: selectors, URLs, rate limits.

## Personal-use / ToS posture

Adapter configs may point at sites whose terms prohibit automated access. They
ship **disabled by default**; the user opts in. Fetching is on-device, rate
limited, and honors `robots.txt`. Legal responsibility for use sits with the end
user, as with any source-plugin reader. Do not use this service to build a
content-redistribution backend.

## Layout

```
backend/
├── app/
│   ├── main.py       # FastAPI app, CORS, endpoints
│   ├── models.py     # pydantic SourceConfig — canonical schema
│   ├── registry.py   # load configs from backend/configs/*.json
│   └── validate.py   # selector/config sanity checks
├── configs/          # published adapter configs (royalroad.json, …)
├── tests/            # pytest (validation + endpoints)
└── requirements.txt
```

## Run locally

```bash
cd backend
py -m venv .venv                       # or: python3 -m venv .venv
./.venv/Scripts/python -m pip install -r requirements.txt   # Windows
# source .venv/bin/activate && pip install -r requirements.txt  # macOS/Linux
./.venv/Scripts/python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Point the app at it by setting, in the project root `.env`:

```
EXPO_PUBLIC_REGISTRY_URL=http://<your-LAN-ip>:8000
```

The app always falls back to its **bundled** configs if the registry is
unreachable, so the backend is optional for the app to function.

## Test

```bash
./.venv/Scripts/python -m pytest -q
```

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | liveness |
| GET | `/sources` | `{ version, sources: [config…] }` — the whole bundle |
| GET | `/sources/{id}` | one config |
| GET | `/sources/{id}/validate` | run config sanity checks |

## Deploy (manual)

Any container/Python host works (Render, Fly, Railway). Example start command:

```
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Then set `EXPO_PUBLIC_REGISTRY_URL` to the deployed origin and rebuild the app.

## Schema sync

`app/models.py` is the **canonical** config schema. The TypeScript
`SourceConfig` in `src/sources/types.ts` mirrors it by hand — change both
together (no codegen).

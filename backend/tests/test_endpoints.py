from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_list_sources():
    r = client.get("/sources")
    assert r.status_code == 200
    body = r.json()
    assert body["version"] >= 1
    ids = {s["id"] for s in body["sources"]}
    assert "royalroad" in ids


def test_get_source():
    r = client.get("/sources/royalroad")
    assert r.status_code == 200
    assert r.json()["name"] == "Royal Road"


def test_get_source_404():
    assert client.get("/sources/nope").status_code == 404


def test_validate_source():
    r = client.get("/sources/royalroad/validate")
    assert r.status_code == 200
    assert r.json()["ok"] is True

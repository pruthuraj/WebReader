"""Load adapter configs served by the registry from backend/configs/*.json."""

from __future__ import annotations

from pathlib import Path

from .models import SourceConfig

CONFIG_DIR = Path(__file__).resolve().parent.parent / "configs"


def load_configs() -> list[SourceConfig]:
    configs: list[SourceConfig] = []
    for path in sorted(CONFIG_DIR.glob("*.json")):
        configs.append(SourceConfig.model_validate_json(path.read_text(encoding="utf-8")))
    return configs


def bundle_version(configs: list[SourceConfig]) -> int:
    """A monotonic version for the whole bundle = max of per-source versions."""
    return max((c.version for c in configs), default=0)

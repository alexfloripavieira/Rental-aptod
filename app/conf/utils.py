import os
from pathlib import Path
from typing import Iterable, Optional


def env(key: str, default: Optional[str] = None) -> Optional[str]:
    value = os.getenv(key)
    return value if value is not None else default


def env_bool(key: str, default: bool = False) -> bool:
    value = env(key)
    if value is None:
        return default
    return value.lower() in {"1", "true", "t", "yes", "y", "on"}


def env_int(key: str, default: int) -> int:
    value = env(key)
    if value is None:
        return default
    try:
        return int(value)
    except ValueError:
        return default


def env_list(key: str, default: Optional[Iterable[str]] = None, separator: str = ",") -> list[str]:
    value = env(key)
    if value is None:
        return list(default or [])
    return [item.strip() for item in value.split(separator) if item.strip()]


def env_path(key: str, default: Path) -> Path:
    value = env(key)
    return Path(value) if value else default

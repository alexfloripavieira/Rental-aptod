"""Settings loader used by manage.py and pytest.

Defaults to development settings, but applies safe overrides when running tests
to avoid external services (e.g., Redis) in CI/local test runs.
"""
import os

from app.conf.development import *  # noqa: F401,F403

# Test-time overrides: use in-memory cache and DB-backed sessions to avoid Redis
if os.environ.get("PYTEST_CURRENT_TEST") or os.environ.get("DJANGO_TEST", "0") == "1":
    CACHES = {  # type: ignore[name-defined]
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "aptos-test-cache",
        }
    }
    # Ensure sessions don't depend on cache backend
    SESSION_ENGINE = "django.contrib.sessions.backends.db"  # type: ignore[name-defined]

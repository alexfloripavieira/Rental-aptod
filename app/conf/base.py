from pathlib import Path
import dj_database_url

from .utils import env, env_bool, env_int, env_list, env_path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Core flags
SECRET_KEY = env(
    "DJANGO_SECRET_KEY",
    "django-insecure-v9j-p9@(j_8_k#h^ap4(wk$lwey#6r#kirh2wao7()7wcab&s5",
)
DEBUG = env_bool("DJANGO_DEBUG", False)
ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS", ["localhost", "127.0.0.1"])
CSRF_TRUSTED_ORIGINS = env_list("DJANGO_CSRF_TRUSTED_ORIGINS")

# Applications
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "django_filters",
    "corsheaders",
    "drf_spectacular",
    "aptos",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "app.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "app" / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "app.wsgi.application"

# Database ---------------------------------------------------------------
DEFAULT_CONN_AGE = env_int("DJANGO_DB_CONN_MAX_AGE", 600)


def _default_database():
    if url := env("DATABASE_URL"):
        return dj_database_url.config(
            default=url,
            conn_max_age=DEFAULT_CONN_AGE,
            ssl_require=env_bool("DATABASE_SSL_REQUIRE", True),
        )

    if env("POSTGRES_DB") or env("POSTGRES_USER") or env("POSTGRES_PASSWORD"):
        config = {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": env("POSTGRES_DB", "aptos_db"),
            "USER": env("POSTGRES_USER", "aptos_user"),
            "PASSWORD": env("POSTGRES_PASSWORD", "changeme123"),
            "HOST": env("POSTGRES_HOST", "db"),
            "PORT": env("POSTGRES_PORT", "5432"),
            "CONN_MAX_AGE": DEFAULT_CONN_AGE,
            "CONN_HEALTH_CHECKS": True,
        }
        isolation = env("POSTGRES_DEFAULT_ISOLATION")
        if isolation:
            config.setdefault("OPTIONS", {})["options"] = f"-c default_transaction_isolation={isolation}"
        return config

    return {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }


DATABASES = {"default": _default_database()}

# Password validation ----------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Internationalization ---------------------------------------------------
LANGUAGE_CODE = "pt-br"
TIME_ZONE = "America/Sao_Paulo"
USE_I18N = True
USE_TZ = True

# Static/media -----------------------------------------------------------
STATIC_URL = "/static/"
STATIC_ROOT = env_path("DJANGO_STATIC_ROOT", BASE_DIR / "staticfiles")

if STATIC_ROOT == BASE_DIR / "staticfiles":
    STATICFILES_DIRS = [BASE_DIR / "static"]
else:
    STATICFILES_DIRS = []

STORAGES = {
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    }
}

DEFAULT_FILE_STORAGE = env(
    "DJANGO_DEFAULT_FILE_STORAGE",
    "django.core.files.storage.FileSystemStorage",
)
STORAGES.setdefault("default", {"BACKEND": DEFAULT_FILE_STORAGE})

MEDIA_ROOT = env_path("DJANGO_MEDIA_ROOT", BASE_DIR / "media")
MEDIA_URL = "/media/"

FILE_UPLOAD_MAX_MEMORY_SIZE = env_int(
    "DJANGO_FILE_UPLOAD_MAX_MEMORY_SIZE", 10 * 1024 * 1024
)
DATA_UPLOAD_MAX_MEMORY_SIZE = env_int(
    "DJANGO_DATA_UPLOAD_MAX_MEMORY_SIZE", 50 * 1024 * 1024
)
FILE_UPLOAD_PERMISSIONS = 0o644
FILE_UPLOAD_TEMP_DIR = env_path(
    "DJANGO_FILE_UPLOAD_TEMP_DIR", BASE_DIR / "tmp" / "uploads"
)

# Django REST Framework --------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}

# CORS -------------------------------------------------------------------
CORS_ALLOWED_ORIGINS = env_list(
    "DJANGO_CORS_ALLOWED_ORIGINS",
    ["http://localhost:3000", "http://127.0.0.1:3000"],
)
CORS_ALLOW_CREDENTIALS = env_bool("DJANGO_CORS_ALLOW_CREDENTIALS", True)
CORS_ALLOW_ALL_ORIGINS = env_bool("DJANGO_CORS_ALLOW_ALL", False)

# API schema -------------------------------------------------------------
SPECTACULAR_SETTINGS = {
    "TITLE": "Aptos Rental API",
    "DESCRIPTION": "API para sistema de gerenciamento de aluguel de apartamentos",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_REQUEST": True,
}

# Logging (basic console; environments can override) ---------------------
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "filters": {
        "require_debug_false": {
            "()": "django.utils.log.RequireDebugFalse",
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
        }
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": "INFO",
        },
        "aptos": {
            "handlers": ["console"],
            "level": "INFO",
        },
    },
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
ADMIN_URL = env("DJANGO_ADMIN_URL", "admin/")

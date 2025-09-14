"""
Configuração Django para ambiente Docker
Otimizada para PostgreSQL e serving de media files
"""

from .settings import *
import os

# Django REST Framework apps (already included in base settings)
# Verificar se já estão incluídos para evitar duplicatas

# Docker-specific database configuration
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('POSTGRES_DB', 'aptos_db'),
        'USER': os.environ.get('POSTGRES_USER', 'aptos_user'),
        'PASSWORD': os.environ.get('POSTGRES_PASSWORD', 'aptos_password'),
        'HOST': os.environ.get('POSTGRES_HOST', 'db'),
        'PORT': os.environ.get('POSTGRES_PORT', '5432'),
        'CONN_MAX_AGE': 600,
        'CONN_HEALTH_CHECKS': True,
    }
}

# Media files configuration for Docker
MEDIA_URL = '/media/'
MEDIA_ROOT = '/app/media/'

# Ensure media directories exist
import os
os.makedirs(os.path.join(MEDIA_ROOT, 'aptos', 'aptos_videos'), exist_ok=True)
os.makedirs(os.path.join(MEDIA_ROOT, 'aptos', 'aptos_photos'), exist_ok=True)
os.makedirs(os.path.join(MEDIA_ROOT, 'builders', 'builders_videos'), exist_ok=True)
os.makedirs(os.path.join(MEDIA_ROOT, 'builders', 'builders_photos'), exist_ok=True)

# File upload settings
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB
FILE_UPLOAD_PERMISSIONS = 0o644

# Static files for Docker
STATIC_URL = '/static/'
STATIC_ROOT = '/app/static/'
# Avoid including STATIC_ROOT in STATICFILES_DIRS
STATICFILES_DIRS = []

# Security settings for Docker production
ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', 'aptos-backend']

# Additional security headers
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
USE_TZ = True

# Logging for Docker environment
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': '/app/logs/django.log',
            'maxBytes': 1024*1024*10,  # 10MB
            'backupCount': 5,
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'aptos': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# Cache configuration for Docker (Redis optional)
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    }
}

# Admin optimizations
ADMIN_URL = os.environ.get('ADMIN_URL', 'admin/')

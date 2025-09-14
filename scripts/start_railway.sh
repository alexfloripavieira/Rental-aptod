#!/usr/bin/env bash
set -euo pipefail

echo "[start] Applying migrations..."
python manage.py migrate --noinput

echo "[start] Collecting static files..."
python manage.py collectstatic --noinput

echo "[start] Launching Gunicorn..."
exec gunicorn app.wsgi:application --bind 0.0.0.0:${PORT:-8000}


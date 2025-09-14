#!/usr/bin/env bash
set -euo pipefail

echo "[start] Applying migrations..."
python manage.py migrate --noinput

echo "[start] Ensuring superuser (if env provided)..."
python - <<'PY'
import os
from django.contrib.auth import get_user_model
import django
django.setup()

username = os.getenv('DJANGO_SUPERUSER_USERNAME')
password = os.getenv('DJANGO_SUPERUSER_PASSWORD')
email = os.getenv('DJANGO_SUPERUSER_EMAIL', 'admin@example.com')

if username and password:
    User = get_user_model()
    if not User.objects.filter(username=username).exists():
        User.objects.create_superuser(username=username, email=email, password=password)
        print(f"[start] Superuser '{username}' created.")
    else:
        print(f"[start] Superuser '{username}' already exists. Skipping.")
else:
    print("[start] Superuser env vars not set; skipping.")
PY

echo "[start] Collecting static files..."
python manage.py collectstatic --noinput

echo "[start] Launching Gunicorn..."
exec gunicorn app.wsgi:application --bind 0.0.0.0:${PORT:-8000}

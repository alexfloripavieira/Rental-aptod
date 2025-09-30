#!/usr/bin/env bash
set -euo pipefail

echo "[start] Applying migrations..."
python manage.py migrate --noinput

echo "[start] Ensuring media and temp directories..."
MEDIA_ROOT_PATH=${DJANGO_MEDIA_ROOT:-/app/media}
mkdir -p "$MEDIA_ROOT_PATH/aptos/aptos_videos" \
         "$MEDIA_ROOT_PATH/aptos/aptos_photos" \
         "$MEDIA_ROOT_PATH/builders/builders_videos" \
         "$MEDIA_ROOT_PATH/builders/builders_photos" || true
mkdir -p /app/tmp/uploads || true

echo "[start] Ensuring superuser (if env provided)..."
python - <<'PY'
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app.settings')
import django
django.setup()
from django.contrib.auth import get_user_model

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

echo "[start] Synchronizing frontend bundle..."
if [ -d "/app/frontend_dist" ]; then
    python - <<'PY'
import shutil
from pathlib import Path

assets_src = Path('/app/frontend_dist/assets')
index_src = Path('/app/frontend_dist/index.html')
assets_dst = Path('/app/static/assets')
template_dst = Path('/app/app/templates/index.html')

assets_dst.parent.mkdir(parents=True, exist_ok=True)

if assets_src.exists():
    if assets_dst.exists():
        shutil.rmtree(assets_dst)
    shutil.copytree(assets_src, assets_dst)
else:
    print('[start] Aviso: /app/frontend_dist/assets não encontrado.')

if index_src.exists():
    template_dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(index_src, template_dst)
else:
    print('[start] Aviso: /app/frontend_dist/index.html não encontrado.')
PY
else
    echo "[start] Frontend dist não encontrado; pulando sincronização."
fi

echo "[start] Collecting static files..."
python manage.py collectstatic --noinput

echo "[start] Launching Gunicorn..."
exec gunicorn app.wsgi:application \
  --bind 0.0.0.0:${PORT:-8000} \
  --timeout 300 \
  --graceful-timeout 300 \
  --keep-alive 5 \
  --access-logfile - \
  --error-logfile -

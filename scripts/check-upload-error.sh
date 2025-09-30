#!/bin/bash

echo "=========================================="
echo "Verificação de Erro de Upload"
echo "=========================================="

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo ""
log_info "1. Verificando últimos logs de erro do backend..."
docker compose logs backend --tail=50 | grep -A 15 -B 5 -E "(ERROR|Exception|Traceback|500|PermissionError|OSError)" || log_info "Nenhum erro recente"

echo ""
log_info "2. Verificando configurações de upload do Django..."
docker compose exec -T backend python manage.py shell -c "
from django.conf import settings
print('=== Configurações de Upload ===')
print(f'FILE_UPLOAD_MAX_MEMORY_SIZE: {settings.FILE_UPLOAD_MAX_MEMORY_SIZE / (1024*1024):.0f}MB')
print(f'DATA_UPLOAD_MAX_MEMORY_SIZE: {settings.DATA_UPLOAD_MAX_MEMORY_SIZE / (1024*1024):.0f}MB')
print(f'MEDIA_ROOT: {settings.MEDIA_ROOT}')
print(f'MEDIA_URL: {settings.MEDIA_URL}')
"

echo ""
log_info "3. Verificando permissões dos diretórios de mídia..."
docker compose exec -T backend sh -c "
echo '=== Diretório MEDIA_ROOT ==='
ls -la /app/media/ 2>/dev/null || echo 'Diretório não existe'
echo ''
echo '=== Diretórios de upload ==='
ls -la /app/media/aptos/ 2>/dev/null || echo 'Diretório aptos não existe'
ls -la /app/media/builders/ 2>/dev/null || echo 'Diretório builders não existe'
"

echo ""
log_info "4. Verificando espaço em disco..."
docker compose exec -T backend df -h /app/media

echo ""
log_info "5. Testando escrita no diretório de mídia..."
docker compose exec -T backend sh -c "
echo 'test' > /app/media/test_write.txt && \
echo '✓ Escrita OK' && \
rm /app/media/test_write.txt || \
echo '✗ Erro ao escrever'
"

echo ""
log_info "6. Verificando campo de vídeo no modelo Aptos..."
docker compose exec -T backend python manage.py shell -c "
from aptos.models import Aptos
import os

# Pegar campo de vídeo
video_field = Aptos._meta.get_field('video')
print('=== Campo de Vídeo ===')
print(f'Upload to: {video_field.upload_to}')
print(f'Blank: {video_field.blank}')
print(f'Null: {video_field.null}')
print(f'Max length: {getattr(video_field, \"max_length\", \"N/A\")}')
"

echo ""
log_info "=========================================="
log_info "Verificação concluída!"
log_info "=========================================="
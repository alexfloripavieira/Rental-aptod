#!/bin/bash

echo "=========================================="
echo "Verificação de Erro no Admin"
echo "=========================================="

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo ""
log_info "1. Verificando últimos logs do backend com erros..."
docker compose logs backend --tail=100 | grep -A 10 -B 5 -E "(ERROR|Exception|Traceback|500)" || log_info "Nenhum erro recente encontrado"

echo ""
log_info "2. Testando acesso à página de add do admin (aptos)..."
docker compose exec -T backend python manage.py shell -c "
from django.contrib.auth.models import User
from django.test import Client

# Criar cliente de teste
client = Client()

# Tentar fazer login com credenciais
user = User.objects.filter(is_superuser=True).first()
if user:
    print(f'Usuário superuser encontrado: {user.username}')

    # Simular acesso à página de add
    from django.urls import reverse
    url = reverse('admin:aptos_aptos_add')
    print(f'URL de add: {url}')

    # Fazer login
    client.force_login(user)

    # Tentar acessar a página
    response = client.get(url)
    print(f'Status code: {response.status_code}')

    if response.status_code != 200:
        print('ERRO: Página não carregou corretamente')
        print(f'Content: {response.content.decode()[:500]}')
else:
    print('ERRO: Nenhum superuser encontrado')
"

echo ""
log_info "3. Verificando se há problemas com readonly_fields..."
docker compose exec -T backend python manage.py shell -c "
from aptos.admin import AptosAdmin, BuildersAdmin

# Verificar AptosAdmin
print('=== AptosAdmin ===')
admin_aptos = AptosAdmin(model=None, admin_site=None)
print(f'readonly_fields: {admin_aptos.readonly_fields}')

# Testar photo_preview com objeto None
try:
    result = admin_aptos.photo_preview(None)
    print(f'photo_preview(None): {result}')
except Exception as e:
    print(f'ERRO em photo_preview(None): {e}')

# Testar video_preview com objeto None
try:
    result = admin_aptos.video_preview(None)
    print(f'video_preview(None): {result}')
except Exception as e:
    print(f'ERRO em video_preview(None): {e}')

print()
print('=== BuildersAdmin ===')
admin_builders = BuildersAdmin(model=None, admin_site=None)
print(f'readonly_fields: {admin_builders.readonly_fields}')

# Testar photo_preview com objeto None
try:
    result = admin_builders.photo_preview(None)
    print(f'photo_preview(None): {result}')
except Exception as e:
    print(f'ERRO em photo_preview(None): {e}')

# Testar video_preview com objeto None
try:
    result = admin_builders.video_preview(None)
    print(f'video_preview(None): {result}')
except Exception as e:
    print(f'ERRO em video_preview(None): {e}')
"

echo ""
log_info "4. Verificando se o código atualizado está no servidor..."
docker compose exec -T backend cat aptos/admin.py | grep -A 3 "def photo_preview" | head -n 10

echo ""
log_info "=========================================="
log_info "Verificação concluída!"
log_info "=========================================="
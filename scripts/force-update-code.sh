#!/bin/bash
set -e

echo "=========================================="
echo "Atualização Forçada do Código"
echo "=========================================="

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo ""
log_info "1. Verificando branch e status do Git..."
git branch
git status

echo ""
log_info "2. Último commit local..."
git log -1 --oneline

echo ""
log_info "3. Último commit remoto..."
git fetch origin
git log origin/main -1 --oneline

echo ""
log_info "4. Fazendo backup de mudanças locais (se houver)..."
git stash || log_info "Nenhuma mudança local para guardar"

echo ""
log_info "5. Resetando para o código remoto..."
git reset --hard origin/main

echo ""
log_info "6. Verificando se o código foi atualizado..."
log_info "Procurando por 'if not obj or not obj.pk:' no admin.py..."
if grep -q "if not obj or not obj.pk:" aptos/admin.py; then
    log_info "✅ Código atualizado encontrado!"
    echo ""
    echo "Trecho do código:"
    grep -A 3 "def photo_preview" aptos/admin.py | head -n 8
else
    log_error "❌ Código ainda não foi atualizado!"
    echo ""
    echo "Código atual:"
    grep -A 3 "def photo_preview" aptos/admin.py | head -n 8
    exit 1
fi

echo ""
log_info "7. Reiniciando backend..."
docker compose restart backend

echo ""
log_info "8. Aguardando backend inicializar..."
sleep 10

echo ""
log_info "9. Verificando logs do backend..."
docker compose logs backend --tail=20

echo ""
log_info "10. Testando se o erro foi corrigido..."
docker compose exec -T backend python manage.py shell -c "
from aptos.admin import AptosAdmin
from aptos.models import Aptos

# Criar instância do admin
admin = AptosAdmin(Aptos, None)

# Testar com objeto None
try:
    result = admin.photo_preview(None)
    print(f'✅ photo_preview(None) funcionou: {result}')
except Exception as e:
    print(f'❌ ERRO em photo_preview(None): {e}')

# Testar com objeto mock sem pk
class MockObj:
    pk = None

try:
    result = admin.photo_preview(MockObj())
    print(f'✅ photo_preview(MockObj sem pk) funcionou: {result}')
except Exception as e:
    print(f'❌ ERRO em photo_preview(MockObj sem pk): {e}')
"

echo ""
log_info "=========================================="
log_info "Atualização concluída!"
log_info "=========================================="
echo ""
log_info "Agora teste acessando:"
log_info "  https://seualuguelfacil.com.br/admin/aptos/aptos/add/"
log_info "  https://seualuguelfacil.com.br/admin/aptos/builders/add/"
echo ""
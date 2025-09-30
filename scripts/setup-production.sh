#!/bin/bash
set -e

echo "=========================================="
echo "Setup de Produção - Aptos Rental"
echo "=========================================="

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Função de log
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 1. Verificar se docker-compose está rodando
log_info "Verificando containers Docker..."
if ! docker compose ps | grep -q "backend"; then
    log_error "Containers não estão rodando. Execute 'docker compose up -d' primeiro."
    exit 1
fi

# 2. Verificar conexão com o banco de dados
log_info "Testando conexão com banco de dados..."
if docker compose exec -T backend python manage.py shell -c "from django.db import connection; connection.ensure_connection(); print('OK')" 2>/dev/null | grep -q "OK"; then
    log_info "Conexão com banco de dados OK"
else
    log_error "Falha na conexão com banco de dados"
    exit 1
fi

# 3. Aplicar migrações
log_info "Aplicando migrações do Django..."
docker compose exec -T backend python manage.py migrate --noinput

# 4. Verificar se existe superusuário
log_info "Verificando superusuários..."
SUPERUSER_COUNT=$(docker compose exec -T backend python manage.py shell -c "
from django.contrib.auth.models import User
print(User.objects.filter(is_superuser=True).count())
" 2>/dev/null | tail -n 1)

if [ "$SUPERUSER_COUNT" = "0" ]; then
    log_warn "Nenhum superusuário encontrado. Criando superusuário padrão..."
    docker compose exec -T backend python manage.py shell -c "
from django.contrib.auth.models import User
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@seualuguelfacil.com.br', 'admin123')
    print('Superusuário criado: admin / admin123')
else:
    print('Usuário admin já existe')
"
else
    log_info "Superusuário(s) encontrado(s): $SUPERUSER_COUNT"
fi

# 5. Coletar arquivos estáticos
log_info "Coletando arquivos estáticos..."
docker compose exec -T backend python manage.py collectstatic --noinput

# 6. Criar diretórios de mídia se não existirem
log_info "Criando diretórios de mídia..."
docker compose exec -T backend mkdir -p /app/media/aptos/aptos_photos
docker compose exec -T backend mkdir -p /app/media/aptos/aptos_videos
docker compose exec -T backend mkdir -p /app/media/builders/builders_photos
docker compose exec -T backend mkdir -p /app/media/builders/builders_videos
docker compose exec -T backend mkdir -p /app/media/inquilinos/documentos

# 7. Ajustar permissões
log_info "Ajustando permissões dos diretórios..."
docker compose exec -T backend chmod -R 755 /app/media || true

# 8. Verificar tabelas criadas
log_info "Verificando tabelas do banco de dados..."
TABLES=$(docker compose exec -T backend python manage.py shell -c "
from django.db import connection
cursor = connection.cursor()
cursor.execute(\"SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'\")
tables = [row[0] for row in cursor.fetchall()]
print(f'Total de tabelas: {len(tables)}')
for table in sorted(tables):
    print(f'  - {table}')
" 2>/dev/null)
echo "$TABLES"

# 9. Verificar modelos registrados no admin
log_info "Verificando modelos registrados no admin..."
docker compose exec -T backend python manage.py shell -c "
from django.contrib import admin
from django.apps import apps

print('Modelos registrados no admin:')
for model in apps.get_app_config('aptos').get_models():
    if admin.site.is_registered(model):
        print(f'  ✓ {model.__name__}')
    else:
        print(f'  ✗ {model.__name__} (não registrado)')
" 2>/dev/null

# 10. Teste de criação de objeto
log_info "Testando criação de construtora..."
docker compose exec -T backend python manage.py shell -c "
from aptos.models import Builders
import sys

# Verificar se já existe alguma construtora
count = Builders.objects.count()
print(f'Construtoras existentes: {count}')

# Criar construtora de teste se não existir
if count == 0:
    try:
        builder = Builders.objects.create(
            name='Construtora Teste',
            street='Rua Teste, 123',
            neighborhood='Bairro Teste',
            city='São Paulo',
            state='SP',
            zip_code='01000-000',
            country='Brasil'
        )
        print(f'Construtora de teste criada com ID: {builder.id}')
        print('Você pode acessar o admin e verificar!')
    except Exception as e:
        print(f'ERRO ao criar construtora: {e}')
        sys.exit(1)
else:
    print('Já existem construtoras no banco.')
" 2>/dev/null

# 11. Mostrar informações finais
echo ""
log_info "=========================================="
log_info "Setup concluído com sucesso!"
log_info "=========================================="
echo ""
log_info "URLs:"
log_info "  Admin: https://seualuguelfacil.com.br/admin/"
log_info "  API:   https://seualuguelfacil.com.br/api/v1/"
echo ""
log_info "Credenciais padrão (se criado):"
log_info "  Usuário: admin"
log_info "  Senha:   admin123"
echo ""
log_warn "IMPORTANTE: Troque a senha padrão imediatamente!"
echo ""
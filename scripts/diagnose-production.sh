#!/bin/bash

echo "=========================================="
echo "Diagnóstico de Produção - Aptos Rental"
echo "=========================================="

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo ""
log_info "1. Verificando containers Docker..."
docker compose ps

echo ""
log_info "2. Verificando status dos serviços..."
docker compose ps --format "table {{.Service}}\t{{.Status}}\t{{.Ports}}"

echo ""
log_info "3. Verificando logs do backend (últimas 30 linhas)..."
docker compose logs --tail=30 backend

echo ""
log_info "4. Verificando logs do database (últimas 30 linhas)..."
docker compose logs --tail=30 db

echo ""
log_info "5. Verificando variáveis de ambiente do backend..."
docker compose exec -T backend env | grep -E "(POSTGRES|DATABASE|DJANGO)" | sort

echo ""
log_info "6. Testando conexão de rede entre backend e db..."
docker compose exec -T backend ping -c 3 db || log_warn "Ping falhou (normal se ICMP bloqueado)"

echo ""
log_info "7. Verificando se o PostgreSQL está escutando..."
docker compose exec -T db pg_isready -U aptos_user -d aptos_db || log_error "PostgreSQL não está pronto"

echo ""
log_info "8. Verificando portas abertas no container do db..."
docker compose exec -T db netstat -tlnp 2>/dev/null || docker compose exec -T db ss -tlnp

echo ""
log_info "=========================================="
log_info "Diagnóstico concluído!"
log_info "=========================================="
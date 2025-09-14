#!/bin/bash
# Script de build para containers Docker

set -e

echo "=== Build Script para Aptos Docker ==="

# Verificar se .env existe
if [ ! -f .env ]; then
    echo "Criando arquivo .env baseado no exemplo..."
    cp .env.example .env
fi

# Carregar variáveis de ambiente
set -a
source .env
set +a

# Função para mostrar ajuda
show_help() {
    echo "Uso: $0 [OPÇÃO]"
    echo "Opções:"
    echo "  dev       Fazer build para desenvolvimento"
    echo "  prod      Fazer build para produção"
    echo "  clean     Limpar images e volumes"
    echo "  help      Mostrar esta ajuda"
}

# Função de build para desenvolvimento
build_dev() {
    echo "🔨 Fazendo build para DESENVOLVIMENTO..."
    
    # Build do backend Django
    echo "Building Django backend..."
    docker build -t aptos-backend:dev --target development .
    
    # Build do frontend React (se existir)
    if [ -d "frontend" ]; then
        echo "Building React frontend..."
        cd frontend
        docker build -t aptos-frontend:dev -f Dockerfile.dev .
        cd ..
    fi
    
    echo "✅ Build de desenvolvimento concluído!"
}

# Função de build para produção
build_prod() {
    echo "🔨 Fazendo build para PRODUÇÃO..."
    
    # Build do backend Django
    echo "Building Django backend (production)..."
    docker build -t aptos-backend:prod --target production .
    
    # Build do frontend React (se existir)
    if [ -d "frontend" ]; then
        echo "Building React frontend (production)..."
        cd frontend
        docker build -t aptos-frontend:prod -f Dockerfile.prod .
        cd ..
    fi
    
    echo "✅ Build de produção concluído!"
}

# Função para limpar recursos Docker
clean_docker() {
    echo "🧹 Limpando recursos Docker..."
    
    # Parar containers
    docker-compose down --remove-orphans || true
    
    # Remover images do projeto
    docker rmi $(docker images -q aptos-*) 2>/dev/null || true
    
    # Limpar volumes não utilizados (cuidado!)
    read -p "Deseja remover volumes não utilizados? (y/N): " confirm
    if [ "$confirm" = "y" ]; then
        docker volume prune -f
    fi
    
    # Limpar imagens não utilizadas
    docker image prune -f
    
    echo "✅ Limpeza concluída!"
}

# Verificar argumentos
case "${1:-help}" in
    "dev")
        build_dev
        ;;
    "prod")
        build_prod
        ;;
    "clean")
        clean_docker
        ;;
    "help"|*)
        show_help
        ;;
esac
#!/bin/bash

# ==============================================================================
# SCRIPT DE CONFIGURAÇÃO INICIAL PARA INSTÂNCIA EC2
# ==============================================================================

set -euo pipefail

echo "🚀 Configurando instância EC2 para Rental-aptod..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

# Verificar se está rodando como usuário não-root
if [ "$EUID" -eq 0 ]; then
    print_error "Não execute este script como root!"
    exit 1
fi

# Atualizar sistema
print_step "Atualizando sistema..."
sudo apt update && sudo apt upgrade -y

# Instalar dependências básicas
print_step "Instalando dependências básicas..."
sudo apt install -y curl wget git unzip ca-certificates gnupg lsb-release

# Instalar Docker
print_step "Instalando Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    sudo usermod -aG docker $USER
    print_success "Docker instalado"
else
    print_success "Docker já está instalado"
fi

# Clonar repositório
print_step "Clonando repositório..."
if [ ! -d ~/Rental-aptod ]; then
    cd ~
    git clone https://github.com/your-username/Rental-aptod.git
    print_success "Repositório clonado"
else
    print_success "Repositório já existe"
fi

# Navegar para o diretório do projeto
cd ~/Rental-aptod

# Configurar arquivo .env
print_step "Configurando arquivo .env..."
if [ ! -f .env ]; then
    cp .env.example .env
    print_warning "Arquivo .env criado. VOCÊ PRECISA EDITÁ-LO!"
    echo ""
    print_warning "Edite o arquivo .env e configure as variáveis:"
    echo "  - DJANGO_SECRET_KEY"
    echo "  - DJANGO_ALLOWED_HOSTS (adicione o IP público da EC2)"
    echo "  - POSTGRES_PASSWORD"
    echo "  - DJANGO_CORS_ALLOWED_ORIGINS (adicione o IP público da EC2)"
    echo ""
    print_warning "Para editar: nano .env"
else
    print_success "Arquivo .env já existe"
fi

# Configurar firewall/security groups
print_step "Informações sobre Security Groups..."
echo ""
print_warning "Configure o Security Group da sua instância EC2 para permitir:"
echo "  - Porta 22 (SSH) - apenas do seu IP"
echo "  - Porta 80 (HTTP) - 0.0.0.0/0"
echo "  - Porta 443 (HTTPS) - 0.0.0.0/0 (se usar SSL)"
echo ""

# Preparar diretórios
print_step "Preparando diretórios..."
mkdir -p logs tmp/uploads
sudo chown -R $USER:$USER logs tmp

print_success "Configuração inicial completa!"
echo ""
print_warning "PRÓXIMOS PASSOS:"
echo "1. Edite o arquivo .env com suas configurações"
echo "2. Configure o Security Group no AWS Console"
echo "3. Configure as secrets no GitHub:"
echo "   - EC2_HOST: ${HOSTNAME:-$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 || echo 'SEU_IP_PUBLICO')}"
echo "   - EC2_USER: $USER"
echo "   - EC2_SSH_KEY: sua chave privada SSH"
echo "4. Faça um push para o repositório para ativar o deploy"
echo ""
print_success "Para testar o deploy manualmente:"
echo "docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile production up -d --build"
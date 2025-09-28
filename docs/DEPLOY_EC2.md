# Deploy no AWS EC2

Guia atualizado para executar o Aptos em uma instância EC2 usando Docker Compose e entregar deploy contínuo via GitHub Actions compilando diretamente na própria máquina EC2.

## 1. Preparação da instância

1. Provisionar uma instância (ex.: Ubuntu 22.04). Liberar portas 22, 80 e 443 no Security Group.
2. Instalar Docker + plugins:
   ```bash
   sudo apt-get update && sudo apt-get upgrade -y
   sudo apt-get install -y ca-certificates curl gnupg git
   curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker.gpg
   echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
   sudo apt-get update
   sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
   sudo usermod -aG docker $USER
   newgrp docker
   ```
3. Opcional: criar swap (`fallocate -l 2G /swapfile`, `chmod 600 /swapfile`, `mkswap /swapfile`, `swapon /swapfile`).

## 2. Clonar e configurar

```bash
git clone git@github.com:<seu-usuario>/<seu-repo>.git aptos
cd aptos
```

Criar `.env` na raiz (não versionar). Exemplo para produção:

```ini
POSTGRES_DB=aptos
POSTGRES_USER=aptos
POSTGRES_PASSWORD=<senha forte>
POSTGRES_PORT=5432

DJANGO_SECRET_KEY=<chave enorme>
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=<ip-publico-ou-dominio>,localhost

BACKEND_PORT=8000
FRONTEND_PORT=3000
HTTP_PORT=80
HTTPS_PORT=443

BUILD_TARGET=production
FRONTEND_DOCKERFILE=Dockerfile.prod

DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_PASSWORD=<senha admin>
DJANGO_SUPERUSER_EMAIL=admin@example.com

REACT_APP_API_URL=http://<ip-publico-ou-dominio>/api/v1
VITE_API_BASE_URL=http://<ip-publico-ou-dominio>/api/v1

# (Opcional) sobrescrever módulo de settings; o padrão já usa `app.conf.production`
# DJANGO_SETTINGS_MODULE=app.conf.production
```

> Sempre que o IP público mudar, atualize as variáveis e reinicie os containers (`docker compose ... up -d`). Use um Elastic IP para manter endereço fixo.

## 3. Primeiro deploy manual

1. Geração inicial (se ainda não existir imagem no servidor). O comando combina o arquivo base e o override de produção:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile production up -d --build
   ```
2. Validar:
   ```bash
   docker compose ps
   docker compose logs -f backend
   docker compose logs -f nginx
   ```
3. Acesse `http://<ip-publico>/` e confirme que o app responde.

## 4. Automação com GitHub Actions

### 4.1 Configurar secrets no GitHub

- `EC2_HOST`: IP/domínio público da instância.
- `EC2_USER`: usuário SSH (ex.: `ubuntu`).
- `EC2_SSH_KEY`: conteúdo da chave privada usada no SSH (ex.: `rental-apto.pem`).

Somente esses três secrets são necessários, já que o build e o deploy acontecerão na própria instância.

### 4.2 Fluxo do workflow `Deploy to EC2`

1. Faz checkout do repositório.
2. Executa checagens locais (manage.py check com `app.conf.production` e `npm run build`).
3. Conecta via SSH ao EC2, executa `git pull` no branch alvo e roda:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile production up -d --build
   ```
4. (Opcional) Prune de imagens antigas.

### 4.3 Estrutura esperada no EC2

```
~/Rental-aptod/
├── .env              # contém segredos locais
├── docker-compose.yml
├── docker-compose.prod.yml
├── nginx/
└── ...
```

O pipeline não copia `.env` ou certificados; mantenha-os diretamente na instância.

## 5. Manutenção

- Ajuste `DJANGO_ALLOWED_HOSTS` e URLs sempre que mudar domínio/IP.
- Para renovar TLS, atualize arquivos em `nginx/ssl` e reinicie o nginx (`docker compose restart nginx`).
- Monitore containers com `docker compose ps`/`logs`; configure observabilidade conforme necessário.

Com esses passos, um push no branch configurado dispara build + deploy automáticos para o EC2 executando a compilação diretamente na instância.

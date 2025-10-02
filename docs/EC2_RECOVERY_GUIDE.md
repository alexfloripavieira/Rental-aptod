# 🔄 EC2 Recovery Guide - Rental Aptod

## Situação
Instância EC2 foi encerrada (terminated). Elastic IP `52.201.111.228` foi preservado.

## 📋 Passo a Passo para Recuperação

### 1️⃣ Criar Nova Instância EC2

**No AWS Console:**

1. Acesse **EC2 Dashboard** → **Launch Instance**

2. **Configurações:**
   - **Name**: `Rental-Aptod-Production`
   - **AMI**: Ubuntu Server 24.04 LTS (ou 22.04 LTS)
   - **Instance type**: `t2.small` (mínimo) ou `t2.medium` (recomendado)
   - **Key pair**:
     - Se já tem: selecione a existente
     - Se não tem: crie nova e **baixe o arquivo .pem**

3. **Network Settings:**
   - ✅ Allow SSH traffic from: **Anywhere (0.0.0.0/0)**
   - ✅ Allow HTTP traffic from the internet
   - ✅ Allow HTTPS traffic from the internet

4. **Configure Storage:**
   - Tamanho: **20-30 GB**
   - Tipo: **gp3** (melhor performance)

5. **Launch instance**

6. Aguarde status mudar para **"running"** (2-3 minutos)

### 2️⃣ Associar Elastic IP

1. **EC2 Dashboard** → **Elastic IPs** (menu lateral)
2. Selecione o IP `52.201.111.228`
3. **Actions** → **Associate Elastic IP address**
4. **Instance**: selecione a nova instância
5. **Associate**

### 3️⃣ Configurar Security Group (se necessário)

Se o GitHub Actions ainda falhar, adicione IPs do GitHub:

1. **EC2 Dashboard** → **Security Groups**
2. Selecione o security group da instância
3. **Inbound rules** → **Edit inbound rules**
4. Adicione regra SSH:
   - Type: **SSH**
   - Port: **22**
   - Source: **0.0.0.0/0** (ou IPs específicos do GitHub Actions)

### 4️⃣ Conectar via SSH

```bash
# Ajustar permissões da chave (apenas primeira vez)
chmod 400 sua-chave.pem

# Conectar
ssh -i sua-chave.pem ubuntu@52.201.111.228
```

### 5️⃣ Executar Setup Automático

**No servidor EC2:**

```bash
# Baixar e executar script de setup
curl -O https://raw.githubusercontent.com/alexlopesbr/Rental-aptod/main/scripts/ec2-setup.sh
chmod +x ec2-setup.sh
./ec2-setup.sh
```

Ou copie o script manualmente:

```bash
# No seu computador local
scp -i sua-chave.pem scripts/ec2-setup.sh ubuntu@52.201.111.228:~/

# No servidor EC2
chmod +x ~/ec2-setup.sh
./ec2-setup.sh
```

### 6️⃣ Configurar Variáveis de Ambiente

**No servidor EC2:**

```bash
# Gerar SECRET_KEY
python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'

# Editar .env
nano ~/Rental-aptod/.env
```

**Atualizar:**
- `SECRET_KEY=` (cole a chave gerada acima)
- `POSTGRES_PASSWORD=` (senha forte para o banco)

Salve com **Ctrl+O**, **Enter**, **Ctrl+X**

### 7️⃣ Iniciar Aplicação

```bash
cd ~/Rental-aptod

# Build e start
docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile production up -d --build

# Aguardar (2-3 minutos)
docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile production logs -f

# Verificar status
docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile production ps
```

### 8️⃣ Criar Superusuário Django

```bash
docker compose exec backend python manage.py createsuperuser
```

### 9️⃣ Testar Aplicação

```bash
# Health check
curl http://localhost:8000/api/v1/health/

# Ou acesse no navegador:
# http://52.201.111.228
```

### 🔟 Atualizar GitHub Secrets

**No GitHub:**

1. Vá em **Settings** → **Secrets and variables** → **Actions**

2. Atualize (se necessário):
   - `EC2_HOST` = `52.201.111.228`
   - `EC2_USER` = `ubuntu`
   - `EC2_SSH_KEY` = conteúdo completo do arquivo `.pem`

3. Teste o deploy:
   - **Actions** → **Deploy to EC2** → **Run workflow**

---

## 🆘 Troubleshooting

### Problema: GitHub Actions ainda falha com timeout

**Solução 1 - Liberar IPs do GitHub Actions:**
```bash
# Buscar IPs atuais
curl https://api.github.com/meta | jq -r '.actions[]'

# Adicionar ao Security Group manualmente
```

**Solução 2 - Testar conexão SSH:**
```bash
# Do GitHub Actions runner
ssh -v -i key.pem ubuntu@52.201.111.228
```

### Problema: Docker não inicia containers

```bash
# Verificar logs
docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile production logs

# Verificar espaço em disco
df -h

# Limpar recursos
docker system prune -af --volumes
```

### Problema: Frontend não carrega

```bash
# Verificar se assets foram copiados
docker compose exec backend ls -la /app/staticfiles/

# Rebuild
docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile production up -d --build --force-recreate
```

---

## 📝 Checklist Final

- [ ] Instância EC2 criada e running
- [ ] Elastic IP `52.201.111.228` associado
- [ ] Security Group permite SSH (porta 22)
- [ ] Docker e Docker Compose instalados
- [ ] Repositório clonado em `~/Rental-aptod`
- [ ] Arquivo `.env` configurado com SECRET_KEY e senhas
- [ ] Aplicação rodando: `docker compose ps` mostra todos "Up"
- [ ] Health check OK: `curl http://localhost:8000/api/v1/health/`
- [ ] Superusuário Django criado
- [ ] Frontend acessível em `http://52.201.111.228`
- [ ] GitHub Secrets atualizados
- [ ] Deploy via GitHub Actions funcionando

---

## 🔐 Backup Recomendado (Para Evitar Perder Tudo de Novo)

### Criar AMI (Imagem) da Instância

```bash
# No AWS Console:
# 1. Selecione a instância
# 2. Actions → Image and templates → Create image
# 3. Nome: "rental-aptod-backup-YYYY-MM-DD"
# 4. Create image
```

### Criar Snapshot do Volume EBS

```bash
# No AWS Console:
# 1. EC2 → Volumes
# 2. Selecione o volume da instância
# 3. Actions → Create snapshot
# 4. Agendar snapshots automáticos (Lifecycle Manager)
```

### Backup do Banco de Dados

```bash
# Criar dump do PostgreSQL
docker compose exec db pg_dump -U postgres rental_aptod > backup-$(date +%Y%m%d).sql

# Baixar para local
scp -i sua-chave.pem ubuntu@52.201.111.228:~/backup-*.sql ./backups/
```

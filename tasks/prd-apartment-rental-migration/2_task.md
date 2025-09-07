---
status: pending
parallelizable: true
blocked_by: ["1.0"]
unblocks: ["8.0", "9.0"]
---

<task_context>
<domain>infra/containerization</domain>
<type>implementation</type>
<scope>configuration</scope>
<complexity>medium</complexity>
<dependencies>docker</dependencies>
</task_context>

# Tarefa 2.0: Configuração Docker e Docker Compose

## Visão Geral

Criar configuração Docker completa com containers separados para frontend React, backend Django, PostgreSQL e Nginx, utilizando Docker Compose para orquestração e volumes persistentes para dados críticos.

<requirements>
- Docker Compose configurado com todos os serviços
- Dockerfiles otimizados para desenvolvimento e produção
- Multi-stage builds para otimização de tamanho
- Volumes persistentes para dados PostgreSQL e media files
- Network configuration para comunicação entre containers
- Environment variables para configurações sensíveis
- Health checks implementados em todos serviços
</requirements>

## Subtarefas

- [ ] 2.1 Criar Dockerfile para backend Django
- [ ] 2.2 Criar Dockerfile para frontend React (dev e prod)
- [ ] 2.3 Configurar Docker Compose com todos serviços
- [ ] 2.4 Implementar volumes persistentes
- [ ] 2.5 Configurar networks e environment variables
- [ ] 2.6 Implementar health checks
- [ ] 2.7 Criar scripts de build e deploy

## Detalhes de Implementação

### Docker Compose Structure (conforme techspec.md):

```yaml
version: '3.8'

services:
  frontend:
    build: 
      context: ./frontend
      dockerfile: Dockerfile.prod
      target: production
    container_name: aptos-frontend
    depends_on:
      - backend
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  backend:
    build: 
      context: .
      dockerfile: Dockerfile
    container_name: aptos-backend
    depends_on:
      db:
        condition: service_healthy
    environment:
      - DATABASE_URL=postgresql://aptos_user:${POSTGRES_PASSWORD}@db:5432/aptos
      - DJANGO_SECRET_KEY=${DJANGO_SECRET_KEY}
      - DJANGO_DEBUG=False
    volumes:
      - media_volume:/app/media
    healthcheck:
      test: ["CMD", "python", "manage.py", "check"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:15-alpine
    container_name: aptos-db
    environment:
      POSTGRES_DB: aptos
      POSTGRES_USER: aptos_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U aptos_user -d aptos"]
      interval: 10s
      timeout: 5s
      retries: 5

  nginx:
    build: ./nginx
    container_name: aptos-nginx
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - frontend
      - backend
    volumes:
      - media_volume:/media
      - ./nginx/ssl:/etc/nginx/ssl
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
  media_volume:

networks:
  default:
    driver: bridge
```

### Multi-stage Dockerfile para Frontend:

```dockerfile
# Dockerfile.prod para React
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine AS production
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Dockerfile para Backend Django:

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN python manage.py collectstatic --noinput
EXPOSE 8000
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "app.wsgi:application"]
```

## Critérios de Sucesso

- Docker Compose sobe todos os serviços sem erros
- Health checks passando em todos containers
- Comunicação entre containers funcionando
- Volumes persistentes preservam dados entre restarts
- Build times otimizados (<5min total)
- Container sizes otimizados (<500MB total)
- Environment variables configuradas corretamente
- Scripts de build/deploy funcionais e documentados
- Logs centralizados e acessíveis
- Hot reload funcionando em desenvolvimento
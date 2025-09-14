# Multi-stage build para Django backend
FROM python:3.11-slim as base

# Variáveis de ambiente para Python
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1
ENV PIP_NO_CACHE_DIR=1

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Criar usuário não-root para segurança
RUN addgroup --gid 1000 appgroup && \
    adduser --uid 1000 --gid 1000 --disabled-password --gecos "" appuser

WORKDIR /app

# Stage para dependências
FROM base as dependencies

# Copiar requirements e instalar dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Stage de desenvolvimento
FROM dependencies as development

# Copiar código fonte
COPY --chown=appuser:appgroup . .

# Mudar para usuário não-root
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python manage.py check --database default || exit 1

# Comando padrão para desenvolvimento
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

# Stage de produção
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
# Instala dependências do frontend
COPY frontend/package*.json ./
RUN npm ci --no-audit --no-fund
COPY frontend .
# Garante base de assets para Django
ENV VITE_BASE_PATH=/static/
RUN npm run build

FROM dependencies as production

# Instalar gunicorn para produção
RUN pip install --no-cache-dir gunicorn

# Copiar código fonte
COPY --chown=appuser:appgroup . .

# Garantir permissão de execução do script de start
RUN chmod +x scripts/start_railway.sh || true

# Copiar build do frontend para o Django
COPY --from=frontend-builder --chown=appuser:appgroup /app/frontend/dist/assets /app/static/assets
COPY --from=frontend-builder --chown=appuser:appgroup /app/frontend/dist/index.html /app/app/templates/index.html

# Criar diretórios necessários para media
RUN mkdir -p /app/media/aptos/aptos_videos \
    /app/media/aptos/aptos_photos \
    /app/media/builders/builders_videos \
    /app/media/builders/builders_photos \
    /app/static /app/staticfiles /app/logs && \
    chown -R appuser:appgroup /app/media /app/static /app/staticfiles /app/logs

# (Removido) Coleta de estáticos no build para evitar duplicidade / permissões

# Mudar para usuário não-root
USER appuser

# Expor porta
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/admin/ || exit 1

# Comando padrão para produção (aplica migrações, collectstatic e inicia Gunicorn)
CMD ["bash", "scripts/start_railway.sh"]

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
FROM dependencies as production

# Instalar gunicorn para produção
RUN pip install --no-cache-dir gunicorn

# Copiar código fonte
COPY --chown=appuser:appgroup . .

# Criar diretórios necessários para media
RUN mkdir -p /app/media/aptos/aptos_videos \
    /app/media/aptos/aptos_photos \
    /app/media/builders/builders_videos \
    /app/media/builders/builders_photos \
    /app/static /app/logs && \
    chown -R appuser:appgroup /app/media /app/static /app/logs

# Coletar arquivos estáticos
RUN python manage.py collectstatic --noinput --settings=app.settings_docker

# Mudar para usuário não-root
USER appuser

# Expor porta
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/admin/ || exit 1

# Comando padrão para produção
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "60", "app.wsgi:application"]
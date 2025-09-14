# Deploy no Railway (Django + Postgres)

Este projeto está pronto para deploy no Railway usando Gunicorn e WhiteNoise.

## Pré‑requisitos

- Repositório no GitHub conectado ao Railway
- Banco PostgreSQL no Railway (plugin) — ele cria `DATABASE_URL`

## Arquivos adicionados/ajustados

- `Procfile`: define o comando web com Gunicorn
- `requirements.txt`: adiciona `gunicorn`, `whitenoise[brotli]`, `dj-database-url`
- `app/settings.py`: ajustado para ler env vars, usar Postgres via `DATABASE_URL`, WhiteNoise e configurações de produção

## Variáveis de ambiente (Railway → Variables)

- `DJANGO_SECRET_KEY`: uma chave segura (obrigatória em produção)
- `DJANGO_DEBUG`: `False`
- `DJANGO_ALLOWED_HOSTS`: `.railway.app,seu-dominio.com` (se usar domínio próprio)
- `DJANGO_CSRF_TRUSTED_ORIGINS`: `https://seu-dominio.com,https://*.railway.app`
- `DATABASE_URL`: criada automaticamente ao adicionar o Postgres plugin
- Opcional: `DJANGO_SECURE_SSL_REDIRECT=True` após HTTPS ativo

## Deploy

1. No Railway, crie um novo serviço “Deploy from GitHub” e selecione o repo
2. Adicione o plugin PostgreSQL (gerará `DATABASE_URL`)
3. Start Command (se o Railway não detectar automaticamente):
   
   `gunicorn app.wsgi:application --bind 0.0.0.0:$PORT`

4. Pós-deploy automático

Este repo executa migrações e `collectstatic` automaticamente em cada deploy via `scripts/start_railway.sh`, chamado pelo `Procfile`.

Se precisar criar o admin: abra o Shell do Railway e rode `python manage.py createsuperuser`.

5. Adicione seu domínio em Settings → Domains e aponte um CNAME no DNS para o host do serviço

## Notas

- Estáticos servidos pelo WhiteNoise (`STATIC_ROOT=staticfiles`); não é necessário S3/CDN para começar
- Banco local continua SQLite por padrão; em produção o `DATABASE_URL` ativa o Postgres
- Ajuste CORS/CSRF conforme seu frontend/domínios

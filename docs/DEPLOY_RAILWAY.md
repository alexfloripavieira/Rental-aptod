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
- Uploads e mídia:
  - `DJANGO_MEDIA_ROOT` (opcional): caminho absoluto para mídia quando usar Volume (ex.: `/data`)
  - `DJANGO_FILE_UPLOAD_TEMP_DIR` (opcional): diretório temporário de upload (padrão `/app/tmp/uploads`)
  - `DJANGO_DATA_UPLOAD_MAX_MEMORY_SIZE` / `DJANGO_FILE_UPLOAD_MAX_MEMORY_SIZE`: ajuste limites conforme seu caso

## Deploy

1. No Railway, crie um novo serviço “Deploy from GitHub” e selecione o repo
2. Adicione o plugin PostgreSQL (gerará `DATABASE_URL`)
3. Start Command (se o Railway não detectar automaticamente):
   
   `gunicorn app.wsgi:application --bind 0.0.0.0:$PORT`

4. Pós-deploy automático

Este repo executa migrações e `collectstatic` automaticamente em cada deploy via `scripts/start_railway.sh`, chamado pelo `Procfile`.

Se precisar criar o admin: abra o Shell do Railway e rode `python manage.py createsuperuser`.

5. Adicione seu domínio em Settings → Domains e aponte um CNAME no DNS para o host do serviço

## Persistindo uploads (Volume)

1. Crie um Volume e monte no serviço em `/data`
2. Defina `DJANGO_MEDIA_ROOT=/data`
3. Redeploy — o script de start cria as subpastas necessárias

## Alternativa sem Volume: Cloudflare R2 (S3)

Se o menu de Volumes não estiver disponível na sua conta/plano, use um storage S3‑compatível (ex.: Cloudflare R2) para armazenar mídia:

1. Crie um bucket no R2 (ex.: `rental-media`) e ative acesso público (R2.dev) ou CDN próprio
2. Gere um par de chaves (Access Key/Secret Key) e anote o `Account ID`
3. Railway → Variables (serviço web):
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_STORAGE_BUCKET_NAME=rental-media`
   - `AWS_S3_ENDPOINT_URL=https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
   - `AWS_S3_REGION_NAME=auto`
   - `AWS_S3_ADDRESSING_STYLE=virtual`
   - `AWS_S3_SIGNATURE_VERSION=s3v4`
   - (opcional) `AWS_S3_CUSTOM_DOMAIN=<bucket>.<ACCOUNT_ID>.r2.cloudflarestorage.com` ou um domínio próprio via CNAME
4. Redeploy — uploads do Django irão para o bucket R2


## Notas

- Estáticos servidos pelo WhiteNoise (`STATIC_ROOT=staticfiles`); não é necessário S3/CDN para começar
- Banco local continua SQLite por padrão; em produção o `DATABASE_URL` ativa o Postgres
- Ajuste CORS/CSRF conforme seu frontend/domínios

# Projeto Aptos — Guia Técnico Completo

Este documento descreve a arquitetura, organização de código, pipelines e decisões técnicas do projeto Aptos, cobrindo backend (Django), frontend (Vite/React), CI/CD (GitHub Actions) e deploy (Railway). Serve como material de manutenção para engenheiros de software.

## Visão Geral

- Backend: Django 5 + DRF, API em `/api/v1`, admin em `/admin`, mídia estática em `/static/`, mídia de upload em `/media/`.
- Frontend: Vite + React + TypeScript, servido pelo próprio Django (assets em `/static/assets`, SPA em `/`).
- Deploy: Railway (Dockerfile). Build multi-stage: Node (build do frontend) + Python (app). Gunicorn + WhiteNoise.
- Mídia persistente: Volume Railway montado em `/data`, configurado por `DJANGO_MEDIA_ROOT=/data`.
- Logs: Gunicorn com acessos/erros no stdout; Django loga `django` e `django.request` no console para aparecer nos Deploy Logs do Railway.

## Backend (Django)

Arquivos principais:

- `manage.py`: util de execução (migrate, runserver, etc.).
- `app/settings.py`:
  - Baseado em env (SECRET, DEBUG, ALLOWED_HOSTS, etc.).
  - `DATABASES`: por padrão SQLite; em produção usa `DATABASE_URL` (Postgres no Railway) via `dj-database-url`.
  - `INSTALLED_APPS`: Django + DRF + app local `aptos`.
  - Estáticos: `STATIC_ROOT=staticfiles`, WhiteNoise ligado em `MIDDLEWARE` e `STORAGES["staticfiles"]`.
  - Mídia: `MEDIA_ROOT` via `DJANGO_MEDIA_ROOT` (em produção `/data`), `MEDIA_URL=/media/`.
  - Upload limits: `DJANGO_DATA_UPLOAD_MAX_MEMORY_SIZE`, `DJANGO_FILE_UPLOAD_MAX_MEMORY_SIZE`, `DJANGO_FILE_UPLOAD_TEMP_DIR`.
  - Segurança: `SECURE_PROXY_SSL_HEADER`, `SECURE_SSL_REDIRECT` (ativar depois do HTTPS), `CSRF_TRUSTED_ORIGINS`.
  - DRF: autenticação de sessão, paginação, filtros, schema drf-spectacular.
  - LOGGING: envia erros para o console (Railway Deploy Logs).

- `app/urls.py`:
  - Admin: `/admin/`
  - API: `/api/v1/` (inclui `aptos.api_urls`)
  - Docs OpenAPI: `/api/docs/`, `/api/redoc/`, schema em `/api/schema/`.
  - SPA: catch‑all via TemplateView para `index.html`.
  - Mídia: `path('media/<path:path>', serve_media)` — resposta completa com suporte a `Range` (vídeo).

- `app/media_serve.py`: handler de mídia (filesystem) com range HTTP (vídeos). Evita problemas de `static()` sem range.

- `aptos/`:
  - `models.py`: entidades `Builders`, `Aptos`, `Foto`, `BuilderFoto` com `FileField/ImageField` para `video` e `photos`.
  - `serializers.py`: Serializers otimizados para lista e detalhe.
    - `AptosListSerializer` expõe `photo_count`, `main_photo` e `has_video` (não retorna array completo de fotos na listagem).
  - `views.py`: ViewSets DRF (filtros, busca, ordering) e endpoints auxiliares; `health` para checagem leve.
  - `api_urls` (incluído em `app/urls.py`): roteamento de API.

### Variáveis de Ambiente (Django)

- Gerais: `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`, `DJANGO_CSRF_TRUSTED_ORIGINS`.
- Banco: `DATABASE_URL`, `DATABASE_SSL_REQUIRE` (em produção pode ser `true`).
- Estáticos: WhiteNoise sem necessidade de S3/CDN.
- Mídia: `DJANGO_MEDIA_ROOT` (ex.: `/data`), `DJANGO_FILE_UPLOAD_TEMP_DIR` (`/app/tmp/uploads`).
- Uploads: `DJANGO_DATA_UPLOAD_MAX_MEMORY_SIZE` (~200MB), `DJANGO_FILE_UPLOAD_MAX_MEMORY_SIZE` (~50MB).

## Frontend (Vite + React)

Estrutura:

- `frontend/` com Vite, React 19, TS.
- `frontend/vite.config.ts`:
  - Base `/static/` em produção (`VITE_BASE_PATH`), para os assets compilados funcionarem servidos pelo Django.
  - Dev server com proxy para `/api` e `/media` em `http://localhost:8000`.

- `frontend/src/services/api.ts`:
  - `VITE_API_BASE_URL` (em produção pode ser omitido; usa caminho relativo `/api/v1`).
  - `getMediaUrl(relativePath)`: monta URL absoluta para `/media/...` considerando base.

- Componentes relevantes:
  - `ApartmentCard.tsx`:
    - Na listagem, `photo_count` vem sem fotos; ao clicar em capa/botão “Ver fotos”, busca o detalhe via API (`getApartment`) e abre `PhotoGallery` com o array de fotos.
  - `PhotoGallery.tsx`: exibe modal de fotos com navegação e miniaturas.

Scripts importantes do `package.json`:

- `build`: `vite build` — usado no Dockerfile stage Node.
- `dev`: `vite` — desenvolvimento local.
- `test:coverage`: `vitest --coverage` — usado na pipeline.

## Build e Deploy (Railway)

Arquivo: `Dockerfile` (multi-stage).

1. Stage `frontend-builder` (Node 20):
   - `npm install` e `npm run build` em `frontend/`.
   - Exporta `dist/assets` e `index.html`.

2. Stage final (Python):
   - `pip install -r requirements.txt` + `gunicorn`.
   - Copia o código; move `dist/assets` para `/app/static/assets` e `index.html` para `app/templates/index.html`.
   - Cria diretórios para mídia/estático/logs/tmp.
   - CMD: `scripts/start_railway.sh` — migrações + collectstatic + inicia Gunicorn.

`scripts/start_railway.sh`:
- `python manage.py migrate` e `collectstatic`.
- Garante diretórios de mídia em `MEDIA_ROOT` e `DJANGO_FILE_UPLOAD_TEMP_DIR`.
- Inicia Gunicorn com access/error log no stdout.

Exposição/Networking (Railway):
- Serviço exposto (public) na porta `$PORT` (Gunicorn escuta em `$PORT`, ex.: 8080).
- Domínio do Railway configurado no painel em Settings → Domains (ex.: `rental-imoveis.up.railway.app`).

## CI/CD (GitHub Actions)

Workflow `./.github/workflows/test.yml`:

- Backend:
  - Postgres de serviço no runner (porta 5432 mapeada).
  - `DATABASE_URL` local e `DATABASE_SSL_REQUIRE=false`.
  - Força storage de arquivos em filesystem no CI:
    - `DJANGO_DEFAULT_FILE_STORAGE=django.core.files.storage.FileSystemStorage`
    - `DJANGO_MEDIA_ROOT=$RUNNER_TEMP/media`
    - `DJANGO_FILE_UPLOAD_TEMP_DIR=$RUNNER_TEMP/uploads`
  - Roda `coverage run manage.py test` e envia o report ao Codecov.

- Frontend:
  - Node 20 com cache npm.
  - `npm install` + `npm run test:coverage` (Vitest) + Codecov.

Observação: o deploy em Railway é gatilhado por push (sem GitHub Actions) porque o Railway está conectado ao repositório. Se quiser, podemos adicionar workflow para deploy manual/automático via API do Railway.

## Operação/Runbook

- Primeiro deploy:
  - Defina envs (ver seção de variáveis) e conecte Postgres no Railway.
  - Verify: `/health` (se exposto), `/admin`, `/api/docs/`.
  - Pós-deploy o script já roda migrações e collectstatic.

- Admin:
  - Crie superuser via Shell (apenas primeira vez se necessário): `python manage.py createsuperuser`.

- Mídia:
  - Volume montado em `/data`; garantir `DJANGO_MEDIA_ROOT=/data`.
  - Upload de vídeos usa Range pela rota `/media/<path>`, suportado pelo handler custom.

- Logs/Debug:
  - Deploy Logs do Railway mostram start, migrations, collectstatic, e tracebacks (se houver). Gunicorn access logs ajudam a inspecionar requests.

## Estrutura do Repositório

- `app/` — settings, URLs, WSGI/ASGI, handler de mídia (media_serve.py) e templates (index.html gerado).
- `aptos/` — domínio do negócio (modelos, serializers, views, urls da API, templates HTML legado se existir).
- `frontend/` — Vite/React/TS.
- `static/` — assets estáticos do projeto (não gerados, fontes, css, imagens do admin etc.).
- `staticfiles/` — destino do collectstatic (ignorado no Git).
- `templates/` — templates server-side adicionais (inclui `app/templates/index.html` do SPA após build).
- `scripts/` — scripts de inicialização (`start_railway.sh`).
- `docs/` — documentação (inclui `DEPLOY_RAILWAY.md` e este guia).
- `.github/workflows/` — CI (tests + coverage).

Diretórios legados/auxiliares (opcionais):

- `nginx/`, `haproxy/`, `docker-compose.*.yml`: usados em fluxos alternativos de deploy local/blue‑green. Não necessários no Railway.
- `performance/`, `accessibility/`, `browser-compatibility/`, `validation-runner.js`: harness de validações opcionais; não usados no fluxo de deploy atual.
- `tasks/`, `RELEASES/`: documentação e roteiros históricos do projeto.

## Decisões Técnicas Importantes

- WhiteNoise para estáticos: reduz dependência de Nginx/CDN no início.
- Handler de mídia com `Range`: necessário para streaming de vídeo correto sem Nginx.
- API paginada com DRF: filtros, buscas e ordenações eficientes.
- SPA servido pelo Django: simplifica domínio e CORS (frontend e backend sob o mesmo host).
- CI separa storage (FS no runner) do storage em produção (Volume): estabilidade de testes.

## Como dar manutenção

- Alterar modelos: criar migrations (`python manage.py makemigrations`) e garantir que o script de start aplica (`migrate`).
- Novas rotas da API: adicionar em `aptos/api_urls.py` e serializers/views correspondentes.
- Novo asset frontend: rodar `npm run build` localmente para testar, o Dockerfile faz no deploy.
- Atualizar dependências: `requirements.txt` (Python) e `frontend/package.json` (Node). Testar no CI antes de deploy.

## Próximos passos sugeridos

- Adicionar página `/health` no Nginx (se migrar para front com Proxy) e readiness/liveness checks.
- Habilitar HTTPS enforcement (`DJANGO_SECURE_SSL_REDIRECT=True`) após o domínio público estar 100% em HTTPS.
- Adicionar monitoramento e métricas (Sentry, Prometheus/exporters) quando necessário.


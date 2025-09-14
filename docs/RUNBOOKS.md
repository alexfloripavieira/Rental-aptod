# Runbooks Operacionais

Este documento cobre procedimentos de operação e troubleshooting para produção.

## Sumário rápido
- Ver status: `docker compose ps`
- Logs: `docker compose logs -f <serviço>`
- Health API: `GET /api/v1/health/`
- Reiniciar serviço: `docker compose restart <serviço>`

## Incidente: Backend unhealthy
1. `docker compose logs -f backend` e verificar erros.
2. Checar DB: `docker compose logs -f db`; se necessário, reiniciar `db` e `backend`.
3. Conferir envs do backend (`DJANGO_SETTINGS_MODULE`, credenciais). 
4. Se migrações pendentes: `docker compose exec backend python manage.py migrate`.

## Incidente: Frontend em branco
1. `docker compose logs -f frontend` – erros de Vite/PostCSS.
2. Confirmar `VITE_API_BASE_URL` aponta para `http://localhost:8000/api/v1` (dev) ou para o domínio (prod).
3. Verificar CORS no backend (`CORS_ALLOWED_ORIGINS`).

## Incidente: Nginx não serve SPA
1. Verificar volumes mapeados (`./frontend/dist` para produção).
2. Ver `nginx/conf.d/default.conf` e `nginx/nginx.conf` – rotas `/` e `/api/`.

## Blue‑Green: mudar ambiente ativo manualmente
1. `rm haproxy/active_* && touch haproxy/active_green` (ou `active_blue`).
2. `docker compose -f docker-compose.blue-green.yml restart loadbalancer`.

## Backup/Restore
- Backup (automático no deploy BG) salva em `backups/`.
- Restore: `docker exec -i aptos-db psql -U aptos_user aptos < backups/backup_YYYYMMDD_HHMMSS.sql`.

## Coleta de estáticos (produção)
`docker compose exec backend python manage.py collectstatic --noinput`.

## Rotina de manutenção
- Rotacionar logs (Nginx: `nginx/logrotate.conf`).
- Limpeza de backups antigos (`find backups/ -name 'backup_*' -mtime +14 -delete`).

# Aptos – Apartment Rental System

Aplicação de gerenciamento de apartamentos com frontend em React (Vite + Tailwind) e backend em Django REST, empacotada com Docker. Inclui configuração de Nginx para produção, scripts de deploy blue‑green e suíte de validação/monitoramento.

## Documentação
- Visão técnica (arquitetura): `docs/ARCHITECTURE.md`
- Runbooks operacionais: `docs/RUNBOOKS.md`
- Plano de Go‑Live: `docs/GO-LIVE.md`
- Guia de usuário (Django Admin): `docs/ADMIN_GUIDE.md`
- Monitoramento: `docs/MONITORING.md`
- Checklist de pré‑produção: `docs/PREPROD_CHECKLIST.md`
- Plano de DR: `docs/DR_PLAN.md`
- Índice de documentação: `docs/README.md`

Veja também o changelog: `CHANGELOG.md`.

## Como rodar (rápido)
- Dev (React + Django): `make up`
- Produção local (Nginx): `make up-prod`
- Blue‑Green deploy: `make bg-deploy` e `make bg-validate`

### URLs padrão
- Frontend: http://localhost:3000
- API: http://localhost:8000/api/v1
- Admin: http://localhost:8000/admin/

## Testes e validação
- Backend (Django): `docker compose exec backend python manage.py test`
- Frontend (Vitest): `cd frontend && npm ci && npm run test:coverage`
- Validação (perf/a11y/bundle/browser): `make validate`

## Estrutura
- `frontend/` – SPA (Vite + React + Tailwind)
- `app/`, `aptos/` – Django project/app
- `nginx/` – configuração de Nginx (produção)
- `haproxy/` – configuração para blue‑green
- `scripts/` – deploy e pós‑deploy
- `monitoring/` – base Prometheus/Grafana/Alertmanager
- `docs/` – documentação técnica e operacional

---

Para detalhes e procedimentos, consulte os documentos acima.

# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2025-09-14
### Added
- README with documentation links and quickstart.
- Full documentation set (architecture, runbooks, go‑live, admin guide, monitoring, pre‑prod checklist, DR plan, training).
- Docker Compose for dev and production (Nginx), plus blue‑green stack with HAProxy.
- Nginx configuration (proxy, static/media, security headers, gzip, rate limiting).
- Blue‑green deploy scripts: `scripts/deploy.sh` and post‑deploy validation.
- Validation tooling (Lighthouse/axe/Playwright) and bundle analysis.
- Test scaffolding: Django unit/API tests, Vitest for React, Playwright E2E, CI workflow.
- Frontend React (Vite + Tailwind) pages and core components.
- Health endpoint `/api/v1/health/`.

### Changed
- Project structure aligned to Docker workflows, Makefile with common targets.

### Security
- Guidance for HTTPS and security headers in production.

---

Generated using Conventional Commits style for headings.

# Plano de Go‑Live

## Resumo
Objetivo: realizar a virada para o novo sistema com zero downtime usando blue‑green.

## Timeline (exemplo)
- T‑7 dias: Congelar escopo, finalizar testes (unit, integração, E2E)
- T‑3 dias: Ensaiar deploy em staging, validar monitoramento e alertas
- T‑1 dia: Backup completo do BD, checklist de pré‑produção
- T‑hora: Executar deploy (green), validação pós‑deploy, switch LB
- T+1h: Monitoramento intensivo, plano de reversão pronto

## Passos
1. Preparação
   - `make validate` (performance, a11y, bundle)
   - `docker compose pull && docker compose build` (se aplicável)
2. Deploy BG
   - `make bg-deploy`
   - `make bg-validate`
3. Aprovação
   - Validação funcional por negócios (smoke test UI + Admin)
4. Switch definitivo
   - Confirmar métricas estáveis (erro <1%, latência ok)
5. Pós‑go‑live
   - Monitoramento 24–48h, incidentes e RCA se necessário

## Rollback
- `scripts/deploy.sh` já efetua rollback automático em falha.
- Manual: `rm haproxy/active_* && touch haproxy/active_<anterior>; docker compose -f docker-compose.blue-green.yml restart loadbalancer`.

## Comunicações
- Anunciar janelas de mudança para stakeholders (TI, suporte, usuários‑chave)

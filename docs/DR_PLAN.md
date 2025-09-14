# Plano de Recuperação de Desastres (DR)

## Objetivo
Restaurar serviço e dados dentro de RTO 4h e RPO 15min.

## Backups
- Banco: dumps automáticos antes de deploy BG (`backups/`)
- Política: retenção 14 dias, verificação semanal de restore

## Procedimento de Restore (exemplo)
1. Provisionar instância DB saudável
2. `docker exec -i aptos-db psql -U aptos_user -c 'DROP DATABASE aptos; CREATE DATABASE aptos;'`
3. `zcat backups/backup_YYYYMMDD_HHMMSS.sql.gz | docker exec -i aptos-db psql -U aptos_user aptos`
4. Reiniciar backend e validar `/api/v1/health/`

## Failover (app)
- Usar BG para ativar ambiente alternativo estável
- Troca de `active_blue/active_green` + restart do LB

## Comunicação
- Acionar equipe de suporte, TI e stakeholders
- Registrar incidente e RCA posterior

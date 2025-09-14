#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE=${COMPOSE_FILE:-docker-compose.blue-green.yml}
LB_CFG_DIR=${LB_CFG_DIR:-haproxy}
BACKUP_DIR=${BACKUP_DIR:-backups}
HEALTH_TIMEOUT=${HEALTH_TIMEOUT:-300}

log() { echo -e "[$(date '+%F %T')] $*"; }
fail() { log "ERROR: $*"; exit 1; }

current_env() {
  if   [ -f "$LB_CFG_DIR/active_blue" ]; then echo blue; 
  elif [ -f "$LB_CFG_DIR/active_green" ]; then echo green; 
  else echo none; fi
}

target_env() {
  local cur=$(current_env)
  if [ "$cur" = blue ]; then echo green; else echo blue; fi
}

backup_db() {
  mkdir -p "$BACKUP_DIR"
  local f="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"
  log "Creating DB backup -> $f"
  docker exec aptos-db pg_dump -U aptos_user aptos > "$f" || fail "pg_dump failed"
  gzip "$f"
}

health_wait() {
  local env=$1; shift
  local until=$(( $(date +%s) + HEALTH_TIMEOUT ))
  log "Waiting health for $env (timeout ${HEALTH_TIMEOUT}s)"
  while [ $(date +%s) -lt $until ]; do
    if docker exec "aptos-backend-$env" python manage.py check --deploy >/dev/null 2>&1 \
       && curl -fsS "http://localhost:80/api/v1/health/" >/dev/null 2>&1; then
      log "$env healthy"; return 0; fi
    sleep 5
  done
  return 1
}

switch_lb() {
  local env=$1
  log "Switching load balancer to $env"
  rm -f "$LB_CFG_DIR/active_blue" "$LB_CFG_DIR/active_green"
  : > "$LB_CFG_DIR/active_${env}"
  docker compose -f "$COMPOSE_FILE" restart loadbalancer
}

rollback() {
  local prev=$1
  log "Rolling back to $prev"
  switch_lb "$prev" || true
}

main() {
  log "Blue-Green deploy starting"
  backup_db
  local cur=$(current_env)
  local tgt=$(target_env)
  log "Current: $cur | Target: $tgt"

  docker compose -f "$COMPOSE_FILE" up -d --build backend-$tgt frontend-$tgt loadbalancer
  if ! health_wait "$tgt"; then
    log "Target env failed health. Aborting."; rollback "$cur"; exit 1; fi

  switch_lb "$tgt"
  log "Deployment switched to $tgt successfully"
}

main "$@"


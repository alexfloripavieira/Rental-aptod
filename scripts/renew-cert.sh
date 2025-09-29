#!/bin/bash
set -euo pipefail

CERT_DOMAIN="seualuguelfacil.com.br"
PROJECT_DIR="/home/ubuntu/Rental-aptod"
NGINX_SSL_DIR="$PROJECT_DIR/nginx/ssl"
COMPOSE_CMD="docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile production"

DRY_RUN_FLAG=""
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN_FLAG="--dry-run"
fi

certbot renew $DRY_RUN_FLAG --quiet \
  --pre-hook "$COMPOSE_CMD stop nginx" \
  --deploy-hook "cp /etc/letsencrypt/live/$CERT_DOMAIN/fullchain.pem $NGINX_SSL_DIR/$CERT_DOMAIN.fullchain.pem && cp /etc/letsencrypt/live/$CERT_DOMAIN/privkey.pem $NGINX_SSL_DIR/$CERT_DOMAIN.privkey.pem && chown ubuntu:ubuntu $NGINX_SSL_DIR/$CERT_DOMAIN.fullchain.pem $NGINX_SSL_DIR/$CERT_DOMAIN.privkey.pem" \
  --post-hook "$COMPOSE_CMD up -d nginx"

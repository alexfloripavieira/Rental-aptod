#!/bin/bash
set -euo pipefail

CERT_DOMAIN="seualuguelfacil.com.br"
PROJECT_DIR="/home/ubuntu/Rental-aptod"
NGINX_SSL_DIR="$PROJECT_DIR/nginx/ssl"
COMPOSE_CMD="docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile production"

certbot renew --quiet --deploy-hook "\
  cp /etc/letsencrypt/live/$CERT_DOMAIN/fullchain.pem $NGINX_SSL_DIR/$CERT_DOMAIN.fullchain.pem && \
  cp /etc/letsencrypt/live/$CERT_DOMAIN/privkey.pem $NGINX_SSL_DIR/$CERT_DOMAIN.privkey.pem && \
  chown ubuntu:ubuntu $NGINX_SSL_DIR/$CERT_DOMAIN.fullchain.pem $NGINX_SSL_DIR/$CERT_DOMAIN.privkey.pem && \
  cd $PROJECT_DIR && \
  $COMPOSE_CMD exec -T nginx nginx -s reload"

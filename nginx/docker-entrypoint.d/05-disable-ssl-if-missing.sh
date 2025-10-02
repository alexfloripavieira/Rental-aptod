#!/bin/sh
set -e

SSL_DIR="/etc/nginx/ssl"
DOMAIN_MAIN="seualuguelfacil.com.br"
CONF_SSL="/etc/nginx/conf.d/default-ssl.conf"
CONF_SSL_DISABLED="/etc/nginx/conf.d/default-ssl.conf.disabled"

# If certs are missing, disable the SSL server block to avoid boot loop
if [ ! -f "$SSL_DIR/live/$DOMAIN_MAIN/fullchain.pem" ] || [ ! -f "$SSL_DIR/live/$DOMAIN_MAIN/privkey.pem" ]; then
  if [ -f "$CONF_SSL" ]; then
    echo "[entrypoint] SSL certs not found; disabling $CONF_SSL"
    mv "$CONF_SSL" "$CONF_SSL_DISABLED" || true
  fi
else
  # Certs exist: ensure SSL config is enabled
  if [ -f "$CONF_SSL_DISABLED" ]; then
    echo "[entrypoint] SSL certs present; enabling $CONF_SSL"
    mv "$CONF_SSL_DISABLED" "$CONF_SSL" || true
  fi
fi


FROM nginx:alpine

# Install additional tools (openssl for SSL, curl for healthcheck)
RUN apk add --no-cache openssl curl

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf || true

# Copy custom configurations
COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/ /etc/nginx/conf.d/

# Copy SSL certificate directory (optional in production)
COPY ssl/ /etc/nginx/ssl/

# Add pre-start hook to enable/disable SSL config depending on certificate presence
COPY docker-entrypoint.d/ /docker-entrypoint.d/
RUN chmod +x /docker-entrypoint.d/*.sh || true

# Create directory for media files
RUN mkdir -p /media

# Health check via curl
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]

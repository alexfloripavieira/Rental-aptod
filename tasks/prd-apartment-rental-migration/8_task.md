---
status: pending
parallelizable: true
blocked_by: ["6.0", "2.0"]
unblocks: ["9.0"]
---

<task_context>
<domain>infra/proxy</domain>
<type>implementation</type>
<scope>configuration</scope>
<complexity>medium</complexity>
<dependencies>http_server</dependencies>
</task_context>

# Tarefa 8.0: Configuração Nginx Proxy e Media Serving

## Visão Geral

Configurar Nginx como proxy reverso para servir aplicação React SPA, rotear APIs para Django backend, servir media files eficientemente, e implementar configurações de segurança, cache e SSL para produção.

<requirements>
- Nginx configurado como proxy reverso
- Serving estático React SPA otimizado
- Proxy pass para APIs Django (/api/* → backend:8000)
- Media files serving eficiente (/media/* → volumes)
- Configurações de cache apropriadas
- Headers de segurança implementados
- SSL/HTTPS configurado para produção
- Gzip compression habilitado
- Rate limiting implementado
</requirements>

## Subtarefas

- [ ] 8.1 Configurar Nginx proxy reverso básico
- [ ] 8.2 Implementar serving de arquivos estáticos React
- [ ] 8.3 Configurar proxy pass para APIs Django
- [ ] 8.4 Implementar serving eficiente de media files
- [ ] 8.5 Configurar headers de cache e compressão
- [ ] 8.6 Implementar headers de segurança
- [ ] 8.7 Configurar SSL/HTTPS para produção
- [ ] 8.8 Implementar rate limiting e monitoring

## Detalhes de Implementação

### Nginx Main Configuration:

```nginx
# nginx/nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging format
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" '
                    '$request_time $upstream_response_time';

    access_log /var/log/nginx/access.log main;

    # Basic settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json
        image/svg+xml;

    # Rate limiting zones
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=static:10m rate=50r/s;

    # Upstream backend
    upstream django_backend {
        server backend:8000;
        keepalive 32;
    }

    # Include server configurations
    include /etc/nginx/conf.d/*.conf;
}
```

### Main Server Configuration:

```nginx
# nginx/conf.d/default.conf
server {
    listen 80;
    server_name localhost;
    client_max_body_size 100M;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;" always;

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # API routes - proxy to Django backend
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://django_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeout settings
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        
        # Disable buffering for real-time responses
        proxy_buffering off;
        proxy_request_buffering off;
    }

    # Django Admin routes
    location /admin/ {
        limit_req zone=api burst=10 nodelay;
        
        proxy_pass http://django_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Media files - serve from volume
    location /media/ {
        alias /media/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Vary "Accept-Encoding";
        
        # Enable CORS for media files
        add_header Access-Control-Allow-Origin "*";
        add_header Access-Control-Allow-Methods "GET, HEAD, OPTIONS";
        
        # Security for uploaded files
        location ~* \.(php|php5|phtml|pl|py|jsp|asp|sh|cgi)$ {
            return 403;
        }
        
        # Optimize image serving
        location ~* \.(jpg|jpeg|png|gif|ico|svg|webp)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            try_files $uri =404;
        }
        
        # Video files
        location ~* \.(mp4|webm|ogg|avi|mov)$ {
            expires 1w;
            add_header Cache-Control "public";
            
            # Enable range requests for video
            add_header Accept-Ranges bytes;
        }
    }

    # Static files - serve React build
    location /static/ {
        limit_req zone=static burst=100 nodelay;
        
        alias /usr/share/nginx/html/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        gzip_static on;
        
        # Precompressed files
        location ~* \.(js|css)$ {
            try_files $uri.gz $uri =404;
            add_header Content-Encoding gzip;
            add_header Vary "Accept-Encoding";
        }
    }

    # React SPA - serve index.html for all routes
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache control for HTML
        location ~* \.(html)$ {
            expires -1;
            add_header Cache-Control "no-cache, no-store, must-revalidate";
            add_header Pragma "no-cache";
        }
        
        # Cache for assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Block access to sensitive files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    location ~ ~$ {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

### SSL/HTTPS Production Configuration:

```nginx
# nginx/conf.d/ssl.conf
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL configuration
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    # SSL optimization
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_session_tickets off;
    
    # SSL security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    
    # Include main server configuration
    include /etc/nginx/conf.d/server-common.conf;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

### Dockerfile para Nginx:

```dockerfile
# nginx/Dockerfile
FROM nginx:alpine

# Install additional tools
RUN apk add --no-cache openssl

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom configurations
COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/ /etc/nginx/conf.d/

# Copy SSL certificate (in production)
COPY ssl/ /etc/nginx/ssl/

# Create directory for media files
RUN mkdir -p /media

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose Integration:

```yaml
# docker-compose.nginx.yml
version: '3.8'

services:
  nginx:
    build: 
      context: ./nginx
      dockerfile: Dockerfile
    container_name: aptos-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - frontend
      - backend
    volumes:
      - media_volume:/media:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./nginx/logs:/var/log/nginx
    environment:
      - NGINX_WORKER_PROCESSES=auto
      - NGINX_WORKER_CONNECTIONS=1024
    networks:
      - aptos-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  media_volume:

networks:
  aptos-network:
    driver: bridge
```

### Performance Monitoring Configuration:

```nginx
# nginx/conf.d/monitoring.conf
# Status page for monitoring
server {
    listen 8080;
    server_name localhost;
    
    location /nginx_status {
        stub_status on;
        access_log off;
        allow 127.0.0.1;
        allow 172.0.0.0/8;  # Docker networks
        deny all;
    }
}
```

### Log Rotation Configuration:

```bash
# nginx/logrotate.conf
/var/log/nginx/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0644 nginx nginx
    sharedscripts
    prerotate
        if [ -f /var/run/nginx.pid ]; then
            kill -USR1 `cat /var/run/nginx.pid`
        fi
    endscript
}
```

### Build Script para Production:

```bash
#!/bin/bash
# nginx/build-production.sh

set -e

echo "Building Nginx configuration for production..."

# Generate SSL certificate if not exists (self-signed for dev)
if [ ! -f "./ssl/cert.pem" ]; then
    echo "Generating self-signed SSL certificate..."
    mkdir -p ./ssl
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout ./ssl/key.pem \
        -out ./ssl/cert.pem \
        -subj "/C=BR/ST=SP/L=SaoPaulo/O=AptosSystem/CN=localhost"
fi

# Test Nginx configuration
echo "Testing Nginx configuration..."
docker run --rm -v $(pwd):/etc/nginx/test nginx:alpine nginx -t -c /etc/nginx/test/nginx.conf

echo "Nginx configuration is valid!"
```

## Critérios de Sucesso

- Nginx servindo React SPA corretamente em todas as rotas
- Proxy pass funcionando para APIs Django (/api/*)
- Media files servidos eficientemente (/media/*)
- Django Admin acessível via proxy (/admin/)
- Headers de cache configurados adequadamente
- Gzip compression funcionando (>50% reduction)
- Headers de segurança implementados
- SSL/HTTPS funcionando em produção
- Rate limiting funcionando (API: 10req/s, Static: 50req/s)
- Health checks funcionando (/health endpoint)
- Logs estruturados e rotation configurada
- Performance: static files <100ms, API proxy <50ms overhead
- Error pages customizadas para 404/500
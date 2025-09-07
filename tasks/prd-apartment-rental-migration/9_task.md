---
status: pending
parallelizable: false
blocked_by: ["8.0", "2.0"]
unblocks: ["12.0"]
---

<task_context>
<domain>infra/deployment</domain>
<type>implementation</type>
<scope>configuration</scope>
<complexity>high</complexity>
<dependencies>docker</dependencies>
</task_context>

# Tarefa 9.0: Implementação Estratégia Blue-Green Deployment

## Visão Geral

Implementar estratégia de deployment blue-green para garantir zero downtime durante atualizações do sistema, incluindo scripts automatizados, health checks, rollback automático, e monitoramento de deployment.

<requirements>
- Deployment blue-green automatizado
- Health checks robustos para validação
- Rollback automático em caso de falha
- Zero downtime garantido durante deploys
- Scripts de deployment automatizados
- Monitoramento de deploy em tempo real
- Backup automático antes de deploys
- Validação pós-deploy automatizada
- Load balancer switching automático
</requirements>

## Subtarefas

- [ ] 9.1 Configurar ambiente blue-green com Docker Compose
- [ ] 9.2 Implementar health checks robustos
- [ ] 9.3 Criar scripts de deployment automatizados
- [ ] 9.4 Implementar rollback automático
- [ ] 9.5 Configurar monitoramento de deployment
- [ ] 9.6 Implementar backup pré-deploy
- [ ] 9.7 Criar validação pós-deploy
- [ ] 9.8 Configurar notifications e alertas

## Detalhes de Implementação

### Blue-Green Docker Compose Configuration:

```yaml
# docker-compose.blue-green.yml
version: '3.8'

services:
  # Blue Environment
  frontend-blue:
    build: 
      context: ./frontend
      dockerfile: Dockerfile.prod
    container_name: aptos-frontend-blue
    networks:
      - aptos-blue
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 30s
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M

  backend-blue:
    build: 
      context: .
      dockerfile: Dockerfile
    container_name: aptos-backend-blue
    depends_on:
      db:
        condition: service_healthy
    environment:
      - DATABASE_URL=postgresql://aptos_user:${POSTGRES_PASSWORD}@db:5432/aptos
      - DJANGO_SECRET_KEY=${DJANGO_SECRET_KEY}
      - ENVIRONMENT=blue
    volumes:
      - media_volume:/app/media
    networks:
      - aptos-blue
      - aptos-db
    healthcheck:
      test: ["CMD", "python", "manage.py", "check", "--deploy"]
      interval: 15s
      timeout: 10s
      retries: 3
      start_period: 60s

  # Green Environment
  frontend-green:
    build: 
      context: ./frontend
      dockerfile: Dockerfile.prod
    container_name: aptos-frontend-green
    networks:
      - aptos-green
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 30s
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M

  backend-green:
    build: 
      context: .
      dockerfile: Dockerfile
    container_name: aptos-backend-green
    depends_on:
      db:
        condition: service_healthy
    environment:
      - DATABASE_URL=postgresql://aptos_user:${POSTGRES_PASSWORD}@db:5432/aptos
      - DJANGO_SECRET_KEY=${DJANGO_SECRET_KEY}
      - ENVIRONMENT=green
    volumes:
      - media_volume:/app/media
    networks:
      - aptos-green
      - aptos-db
    healthcheck:
      test: ["CMD", "python", "manage.py", "check", "--deploy"]
      interval: 15s
      timeout: 10s
      retries: 3
      start_period: 60s

  # Shared Database
  db:
    image: postgres:15-alpine
    container_name: aptos-db
    environment:
      POSTGRES_DB: aptos
      POSTGRES_USER: aptos_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    networks:
      - aptos-db
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U aptos_user -d aptos"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Load Balancer (HAProxy)
  loadbalancer:
    image: haproxy:2.6-alpine
    container_name: aptos-lb
    ports:
      - "80:80"
      - "443:443"
      - "8404:8404"  # Stats page
    volumes:
      - ./haproxy:/usr/local/etc/haproxy:ro
      - ./ssl:/etc/ssl/certs:ro
    networks:
      - aptos-blue
      - aptos-green
    depends_on:
      - backend-blue
      - frontend-blue
    command: haproxy -f /usr/local/etc/haproxy/haproxy.cfg

volumes:
  postgres_data:
  media_volume:

networks:
  aptos-blue:
    driver: bridge
  aptos-green:
    driver: bridge
  aptos-db:
    driver: bridge
```

### HAProxy Configuration for Blue-Green:

```haproxy
# haproxy/haproxy.cfg
global
    daemon
    maxconn 4096
    log stdout local0 info

defaults
    mode http
    timeout connect 5000ms
    timeout client 50000ms
    timeout server 50000ms
    option httplog
    option dontlognull
    option redispatch
    retries 3

# Stats page
stats enable
stats uri /stats
stats refresh 10s
stats admin if TRUE

# Health check endpoint
frontend health_check
    bind *:8404
    http-request return status 200 content-type text/plain string "OK" if { path /health }

# Frontend for HTTPS
frontend https_frontend
    bind *:443 ssl crt /etc/ssl/certs/cert.pem
    redirect scheme https if !{ ssl_fc }
    
    # Determine active environment from file
    http-request set-var(req.active_env) str(blue) if { -f /usr/local/etc/haproxy/active_blue }
    http-request set-var(req.active_env) str(green) if { -f /usr/local/etc/haproxy/active_green }
    
    # Route to active environment
    use_backend backend_blue if { var(req.active_env) -m str blue }
    use_backend backend_green if { var(req.active_env) -m str green }
    
    default_backend backend_blue

# Redirect HTTP to HTTPS
frontend http_frontend
    bind *:80
    redirect scheme https code 301

# Blue environment backend
backend backend_blue
    balance roundrobin
    option httpchk GET /api/v1/health
    http-check expect status 200
    
    server backend-blue aptos-backend-blue:8000 check inter 10s fall 3 rise 2
    server frontend-blue aptos-frontend-blue:3000 check inter 10s fall 3 rise 2 backup

# Green environment backend  
backend backend_green
    balance roundrobin
    option httpchk GET /api/v1/health
    http-check expect status 200
    
    server backend-green aptos-backend-green:8000 check inter 10s fall 3 rise 2
    server frontend-green aptos-frontend-green:3000 check inter 10s fall 3 rise 2 backup
```

### Deployment Script:

```bash
#!/bin/bash
# deploy.sh - Blue-Green Deployment Script

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
COMPOSE_FILE="docker-compose.blue-green.yml"
BACKUP_DIR="./backups"
LOG_FILE="/var/log/deployment.log"
HEALTH_CHECK_TIMEOUT=300  # 5 minutes
ROLLBACK_TIMEOUT=180      # 3 minutes

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${1}" | tee -a "${LOG_FILE}"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - ${1//\\033\[*([0-9;])m/}" >> "${LOG_FILE}"
}

# Error handling
error_exit() {
    log "${RED}ERROR: ${1}${NC}"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    log "${BLUE}Checking prerequisites...${NC}"
    
    command -v docker >/dev/null 2>&1 || error_exit "Docker is not installed"
    command -v docker-compose >/dev/null 2>&1 || error_exit "Docker Compose is not installed"
    
    if [ ! -f "${COMPOSE_FILE}" ]; then
        error_exit "Docker Compose file ${COMPOSE_FILE} not found"
    fi
    
    log "${GREEN}Prerequisites check passed${NC}"
}

# Determine current and target environments
determine_environments() {
    if [ -f "./haproxy/active_blue" ]; then
        CURRENT_ENV="blue"
        TARGET_ENV="green"
    elif [ -f "./haproxy/active_green" ]; then
        CURRENT_ENV="green"  
        TARGET_ENV="blue"
    else
        # First deployment
        CURRENT_ENV="none"
        TARGET_ENV="blue"
    fi
    
    log "${BLUE}Current environment: ${CURRENT_ENV}${NC}"
    log "${BLUE}Target environment: ${TARGET_ENV}${NC}"
}

# Create database backup
create_backup() {
    log "${BLUE}Creating database backup...${NC}"
    
    mkdir -p "${BACKUP_DIR}"
    BACKUP_FILE="${BACKUP_DIR}/backup_$(date +%Y%m%d_%H%M%S).sql"
    
    docker exec aptos-db pg_dump -U aptos_user aptos > "${BACKUP_FILE}" || error_exit "Failed to create database backup"
    
    # Compress backup
    gzip "${BACKUP_FILE}"
    BACKUP_FILE="${BACKUP_FILE}.gz"
    
    log "${GREEN}Backup created: ${BACKUP_FILE}${NC}"
    
    # Keep only last 10 backups
    find "${BACKUP_DIR}" -name "backup_*.sql.gz" -type f | sort | head -n -10 | xargs -r rm
}

# Health check function
health_check() {
    local env=$1
    local timeout=$2
    local start_time=$(date +%s)
    
    log "${BLUE}Performing health check for ${env} environment...${NC}"
    
    while [ $(($(date +%s) - start_time)) -lt $timeout ]; do
        # Check backend health
        if docker exec "aptos-backend-${env}" python manage.py check --deploy > /dev/null 2>&1; then
            # Check if backend is responding to HTTP requests
            if curl -f "http://localhost:8000/api/v1/health" > /dev/null 2>&1; then
                log "${GREEN}${env} environment is healthy${NC}"
                return 0
            fi
        fi
        
        log "${YELLOW}Waiting for ${env} environment to be ready...${NC}"
        sleep 10
    done
    
    error_exit "${env} environment failed health check after ${timeout} seconds"
}

# Run smoke tests
run_smoke_tests() {
    local env=$1
    log "${BLUE}Running smoke tests for ${env} environment...${NC}"
    
    # Test API endpoints
    local backend_url="http://aptos-backend-${env}:8000"
    
    # Test apartments endpoint
    if ! docker run --rm --network aptos-${env} curlimages/curl:latest \
        curl -f "${backend_url}/api/v1/aptos/" > /dev/null 2>&1; then
        error_exit "Apartments API endpoint failed smoke test"
    fi
    
    # Test builders endpoint  
    if ! docker run --rm --network aptos-${env} curlimages/curl:latest \
        curl -f "${backend_url}/api/v1/builders/" > /dev/null 2>&1; then
        error_exit "Builders API endpoint failed smoke test"
    fi
    
    # Test admin access
    if ! docker run --rm --network aptos-${env} curlimages/curl:latest \
        curl -f "${backend_url}/admin/" > /dev/null 2>&1; then
        error_exit "Admin endpoint failed smoke test"
    fi
    
    log "${GREEN}Smoke tests passed for ${env} environment${NC}"
}

# Switch load balancer to target environment
switch_traffic() {
    local target=$1
    
    log "${BLUE}Switching traffic to ${target} environment...${NC}"
    
    # Remove old active file
    rm -f "./haproxy/active_blue" "./haproxy/active_green"
    
    # Create new active file
    touch "./haproxy/active_${target}"
    
    # Reload HAProxy configuration
    docker exec aptos-lb kill -HUP 1 || error_exit "Failed to reload HAProxy configuration"
    
    # Wait for switch to take effect
    sleep 5
    
    # Verify switch
    local active_env
    if [ -f "./haproxy/active_blue" ]; then
        active_env="blue"
    elif [ -f "./haproxy/active_green" ]; then
        active_env="green"
    else
        error_exit "Failed to determine active environment after switch"
    fi
    
    if [ "${active_env}" != "${target}" ]; then
        error_exit "Traffic switch verification failed"
    fi
    
    log "${GREEN}Traffic successfully switched to ${target} environment${NC}"
}

# Rollback function
rollback() {
    local target=$1
    
    log "${YELLOW}Initiating rollback to ${target} environment...${NC}"
    
    # Switch traffic back
    switch_traffic "${target}"
    
    # Verify rollback
    health_check "${target}" "${ROLLBACK_TIMEOUT}"
    run_smoke_tests "${target}"
    
    log "${GREEN}Rollback completed successfully${NC}"
}

# Main deployment function
deploy() {
    log "${BLUE}Starting deployment process...${NC}"
    
    # Check prerequisites
    check_prerequisites
    
    # Determine environments
    determine_environments
    
    # Create backup
    create_backup
    
    # Build and start target environment
    log "${BLUE}Building and starting ${TARGET_ENV} environment...${NC}"
    docker-compose -f "${COMPOSE_FILE}" up -d "frontend-${TARGET_ENV}" "backend-${TARGET_ENV}"
    
    # Wait for services to be ready
    sleep 30
    
    # Health check target environment
    if ! health_check "${TARGET_ENV}" "${HEALTH_CHECK_TIMEOUT}"; then
        log "${RED}Health check failed for ${TARGET_ENV} environment${NC}"
        
        # Stop failed environment
        docker-compose -f "${COMPOSE_FILE}" stop "frontend-${TARGET_ENV}" "backend-${TARGET_ENV}"
        
        error_exit "Deployment failed - target environment unhealthy"
    fi
    
    # Run smoke tests
    if ! run_smoke_tests "${TARGET_ENV}"; then
        log "${RED}Smoke tests failed for ${TARGET_ENV} environment${NC}"
        
        # Stop failed environment
        docker-compose -f "${COMPOSE_FILE}" stop "frontend-${TARGET_ENV}" "backend-${TARGET_ENV}"
        
        error_exit "Deployment failed - smoke tests failed"
    fi
    
    # Switch traffic to target environment
    switch_traffic "${TARGET_ENV}"
    
    # Final verification after traffic switch
    sleep 30
    if ! health_check "${TARGET_ENV}" 60; then
        log "${RED}Post-switch health check failed${NC}"
        rollback "${CURRENT_ENV}"
        error_exit "Deployment failed - post-switch verification failed"
    fi
    
    # Stop old environment
    if [ "${CURRENT_ENV}" != "none" ]; then
        log "${BLUE}Stopping old ${CURRENT_ENV} environment...${NC}"
        docker-compose -f "${COMPOSE_FILE}" stop "frontend-${CURRENT_ENV}" "backend-${CURRENT_ENV}"
    fi
    
    log "${GREEN}Deployment completed successfully!${NC}"
    log "${GREEN}Active environment: ${TARGET_ENV}${NC}"
}

# Script execution
case "${1:-deploy}" in
    "deploy")
        deploy
        ;;
    "rollback")
        determine_environments
        if [ "${CURRENT_ENV}" = "blue" ]; then
            rollback "green"
        else
            rollback "blue"
        fi
        ;;
    "status")
        determine_environments
        echo "Current active environment: ${CURRENT_ENV}"
        ;;
    "health-check")
        determine_environments
        health_check "${CURRENT_ENV}" 30
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|status|health-check}"
        exit 1
        ;;
esac
```

### Monitoring and Alerting Configuration:

```yaml
# monitoring/docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana-dashboard.json:/etc/grafana/provisioning/dashboards/deployment-dashboard.json

  alertmanager:
    image: prom/alertmanager:latest
    container_name: alertmanager
    ports:
      - "9093:9093"
    volumes:
      - ./monitoring/alertmanager.yml:/etc/alertmanager/alertmanager.yml

volumes:
  grafana_data:
```

### Post-Deploy Validation Script:

```bash
#!/bin/bash
# post-deploy-validation.sh

set -e

VALIDATION_URL="${1:-http://localhost}"
MAX_RETRIES=10
RETRY_DELAY=10

validate_endpoint() {
    local endpoint=$1
    local expected_status=${2:-200}
    local description=$3
    
    echo "Validating ${description}..."
    
    local status_code
    status_code=$(curl -s -o /dev/null -w "%{http_code}" "${VALIDATION_URL}${endpoint}" || echo "000")
    
    if [ "${status_code}" -eq "${expected_status}" ]; then
        echo "✅ ${description} - OK (${status_code})"
        return 0
    else
        echo "❌ ${description} - FAILED (${status_code})"
        return 1
    fi
}

main() {
    echo "Starting post-deployment validation..."
    echo "Target URL: ${VALIDATION_URL}"
    
    local failed=0
    
    # Validate main endpoints
    validate_endpoint "/" 200 "Home page" || ((failed++))
    validate_endpoint "/aptos" 200 "Apartments page" || ((failed++))
    validate_endpoint "/builders" 200 "Builders page" || ((failed++))
    validate_endpoint "/api/v1/aptos/" 200 "Apartments API" || ((failed++))
    validate_endpoint "/api/v1/builders/" 200 "Builders API" || ((failed++))
    validate_endpoint "/admin/" 200 "Django Admin" || ((failed++))
    validate_endpoint "/health" 200 "Health endpoint" || ((failed++))
    
    # Performance validation
    echo "Validating performance..."
    local response_time
    response_time=$(curl -s -w "%{time_total}" -o /dev/null "${VALIDATION_URL}/api/v1/aptos/")
    
    if (( $(echo "${response_time} < 0.5" | bc -l) )); then
        echo "✅ API Response time - OK (${response_time}s)"
    else
        echo "❌ API Response time - SLOW (${response_time}s)"
        ((failed++))
    fi
    
    if [ ${failed} -eq 0 ]; then
        echo "🎉 All validations passed!"
        exit 0
    else
        echo "💥 ${failed} validation(s) failed!"
        exit 1
    fi
}

main
```

## Critérios de Sucesso

- Blue-green deployment funcionando com zero downtime
- Health checks validando todos os serviços críticos
- Rollback automático funcionando em <3 minutos
- Load balancer switching funcionando automaticamente
- Backup automático criado antes de cada deploy
- Smoke tests validando endpoints críticos
- Monitoramento em tempo real durante deploy
- Logs estruturados para troubleshooting
- Notificações de sucesso/falha funcionando
- Performance mantida durante switch (<100ms overhead)
- Database migrations executadas sem downtime
- SSL/HTTPS funcionando em ambos ambientes
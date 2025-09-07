# Especificação Técnica - Migração Sistema de Aluguel de Apartamentos

## Resumo Executivo

Esta especificação técnica define a migração completa do sistema de gerenciamento de aluguel de apartamentos de uma arquitetura Django monolítica (templates HTML + SQLite3) para uma arquitetura moderna baseada em ReactJS SPA + Django REST API + PostgreSQL + Docker. A abordagem preserva 100% dos dados existentes e funcionalidades enquanto moderniza a stack tecnológica para melhorar performance, escalabilidade e experiência do usuário. A estratégia utiliza Django REST Framework para expor APIs RESTful, mantém Django Admin para gerenciamento de conteúdo, e implementa uma SPA React com Tailwind CSS para o frontend público.

## Arquitetura do Sistema

### Visão Geral dos Componentes

**Arquitetura Atual:**
- Django 5.2 + SQLite3 + Templates HTML
- Media files em filesystem local
- Django Admin para CRUD
- Páginas: `/aptos/`, `/builders/`

**Arquitetura Proposta:**
- **Frontend React SPA**: Interface responsiva com Tailwind CSS
- **Backend Django API**: Django REST Framework expondo APIs RESTful
- **Banco PostgreSQL**: Migração completa de dados SQLite → PostgreSQL
- **Django Admin**: Mantido para gerenciamento de uploads e administração
- **Nginx Proxy**: Servindo arquivos estáticos React + proxy reverso para API
- **Docker Compose**: Orquestração completa dos serviços

**Fluxo de Dados:**
```
Frontend React ↔ Nginx Proxy ↔ Django REST API ↔ PostgreSQL
                      ↓
                Django Admin (gerenciamento)
                      ↓
               Media Files (filesystem)
```

## Design de Implementação

### Interfaces Principais

**API REST Endpoints:**

```python
# Django REST Framework Serializers
class BuildersSerializer(serializers.ModelSerializer):
    builder_fotos = BuilderFotoSerializer(many=True, read_only=True)
    class Meta:
        model = Builders
        fields = '__all__'

class AptosSerializer(serializers.ModelSerializer):
    fotos = FotoSerializer(many=True, read_only=True)
    building_name = BuildersSerializer(read_only=True)
    class Meta:
        model = Aptos
        fields = '__all__'

# API ViewSets
class BuildersViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Builders.objects.prefetch_related('builder_fotos')
    serializer_class = BuildersSerializer

class AptosViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Aptos.objects.select_related('building_name').prefetch_related('fotos')
    serializer_class = AptosSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['is_available', 'is_furnished', 'number_of_bedrooms']
    search_fields = ['unit_number', 'description', 'building_name__name']
```

### Modelos de Dados

**Estrutura PostgreSQL (migrada de SQLite):**

```sql
-- Preserva estrutura existente com otimizações
CREATE TABLE aptos_builders (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    street VARCHAR(100) NOT NULL,
    neighborhood VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    video VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE aptos_aptos (
    id SERIAL PRIMARY KEY,
    unit_number VARCHAR(10) NOT NULL,
    floor VARCHAR(20),
    building_name_id INTEGER REFERENCES aptos_builders(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    rental_price DECIMAL(10,2) DEFAULT 0.0,
    is_available BOOLEAN DEFAULT true,
    is_furnished BOOLEAN DEFAULT false,
    is_pets_allowed BOOLEAN DEFAULT false,
    has_laundry BOOLEAN DEFAULT false,
    has_parking BOOLEAN DEFAULT false,
    has_internet BOOLEAN DEFAULT false,
    has_air_conditioning BOOLEAN DEFAULT false,
    number_of_bedrooms INTEGER NOT NULL,
    number_of_bathrooms INTEGER NOT NULL,
    square_footage INTEGER NOT NULL,
    video VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

-- Índices otimizados
CREATE INDEX idx_aptos_available ON aptos_aptos(is_available);
CREATE INDEX idx_aptos_bedrooms ON aptos_aptos(number_of_bedrooms);
CREATE INDEX idx_aptos_building ON aptos_aptos(building_name_id);
CREATE INDEX idx_builders_name ON aptos_builders(name);
```

**React TypeScript Interfaces:**

```typescript
interface Builder {
  id: number;
  name: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  video?: string;
  builder_fotos: BuilderFoto[];
  created_at: string;
  updated_at: string;
}

interface Apartment {
  id: number;
  unit_number: string;
  floor?: string;
  building_name: Builder;
  description: string;
  rental_price: number;
  is_available: boolean;
  is_furnished: boolean;
  is_pets_allowed: boolean;
  has_laundry: boolean;
  has_parking: boolean;
  has_internet: boolean;
  has_air_conditioning: boolean;
  number_of_bedrooms: number;
  number_of_bathrooms: number;
  square_footage: number;
  video?: string;
  fotos: Photo[];
  created_at: string;
  updated_at: string;
}
```

### Endpoints de API

**API REST Endpoints:**

- `GET /api/v1/aptos/` - Lista apartamentos com filtros e busca
  - Query params: `?is_available=true&bedrooms=2&search=centro`
  - Response: Paginação + lista de apartamentos com fotos e builder info

- `GET /api/v1/aptos/{id}/` - Detalhes de apartamento específico
  - Response: Apartamento completo com todas as fotos e vídeo

- `GET /api/v1/builders/` - Lista construtoras
  - Response: Lista de construtoras com fotos

- `GET /api/v1/builders/{id}/` - Detalhes da construtora
  - Response: Construtora completa com apartamentos relacionados

**React API Client:**

```typescript
// API service usando axios
class ApartmentAPI {
  private baseURL = '/api/v1';

  async getApartments(filters?: ApartmentFilters): Promise<PaginatedResponse<Apartment>> {
    const params = new URLSearchParams(filters);
    return axios.get(`${this.baseURL}/aptos/?${params}`);
  }

  async getBuilders(): Promise<Builder[]> {
    return axios.get(`${this.baseURL}/builders/`);
  }
}
```

## Pontos de Integração

### Django Admin + React Coexistência

**Estratégia de Integração:**

1. **Django Admin Preservado**: Mantém interface admin atual para upload de mídias e CRUD
2. **CSRF Token Sharing**: Django fornece CSRF tokens para requests React se necessário
3. **Session Authentication**: React usa mesma sessão Django para admin access
4. **Media Serving**: Nginx serve media files de ambos Django Admin e React

**Configuração Django:**

```python
# settings/production.py
CORS_ALLOWED_ORIGINS = ['http://localhost:3000', 'https://yourdomain.com']
CORS_ALLOW_CREDENTIALS = True

# REST Framework config
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
    ]
}
```

### Container Architecture

**Docker Compose Services:**

```yaml
version: '3.8'

services:
  frontend:
    build: 
      context: ./frontend
      dockerfile: Dockerfile.prod
    container_name: aptos-frontend
    depends_on:
      - backend

  backend:
    build: 
      context: .
      dockerfile: Dockerfile
    container_name: aptos-backend
    depends_on:
      - db
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/aptos
    volumes:
      - media_volume:/app/media

  db:
    image: postgres:15-alpine
    container_name: aptos-db
    environment:
      POSTGRES_DB: aptos
      POSTGRES_USER: aptos_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  nginx:
    build: ./nginx
    container_name: aptos-nginx
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - frontend
      - backend
    volumes:
      - media_volume:/media

volumes:
  postgres_data:
  media_volume:
```

## Análise de Impacto

| Componente Afetado | Tipo de Impacto | Descrição & Nível de Risco | Ação Requerida |
|-------------------|------------------|----------------------------|------------------|
| Base de Dados SQLite | Migração Completa | Migração para PostgreSQL. Alto risco de perda de dados se mal executada. | Script migração + validação + backup completo |
| Templates Django | Substituição Total | Remoção de templates HTML, substituição por React SPA. Risco médio de funcionalidades perdidas. | Mapeamento 1:1 funcionalidades + testes E2E |
| URLs `/aptos/`, `/builders/` | Mudança de Backend | URLs servirão JSON ao invés de HTML. Risco baixo com proxy correto. | Configuração Nginx proxy + redirects se necessário |
| Admin Django | Modificação Leve | Adicionar REST Framework. Baixo risco, funcionalidade preservada. | Configuração DRF + testes admin |
| Media Files | Reestruturação | Nginx servirá arquivos estáticos. Risco baixo com configuração correta. | Configuração Nginx + migração paths |
| Deploy Process | Mudança Completa | De deploy simples Django para Docker Compose. Risco médio de downtime. | Blue-green deploy + rollback plan |

**Componentes de Alto Risco:**
- **Migração PostgreSQL**: Requer backup completo, script testado e validação de integridade
- **React Routing**: Garantir que todas as rotas atuais funcionem no SPA
- **Media File Handling**: Preservar estrutura de diretórios e acessibilidade

## Abordagem de Testes

### Testes Unitários

**Django API Tests:**
```python
# tests/test_api.py
class AptosAPITestCase(TestCase):
    def setUp(self):
        self.builder = Builders.objects.create(name="Test Builder", city="São Paulo")
        self.apto = Aptos.objects.create(
            unit_number="101",
            building_name=self.builder,
            description="Test apartment",
            rental_price=1500.00,
            number_of_bedrooms=2,
            number_of_bathrooms=1,
            square_footage=80
        )

    def test_list_aptos_endpoint(self):
        response = self.client.get('/api/v1/aptos/')
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Test apartment")

    def test_aptos_filtering_by_bedrooms(self):
        response = self.client.get('/api/v1/aptos/?number_of_bedrooms=2')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()['results']), 1)
```

**React Component Tests:**
```typescript
// src/components/__tests__/ApartmentCard.test.tsx
describe('ApartmentCard', () => {
  const mockApartment: Apartment = {
    id: 1,
    unit_number: '101',
    description: 'Beautiful apartment',
    rental_price: 1500,
    number_of_bedrooms: 2,
    // ... outros campos
  };

  it('renders apartment information correctly', () => {
    render(<ApartmentCard apartment={mockApartment} />);
    expect(screen.getByText('Apartamento 101')).toBeInTheDocument();
    expect(screen.getByText('R$ 1.500,00')).toBeInTheDocument();
    expect(screen.getByText('2 quartos')).toBeInTheDocument();
  });

  it('handles photo gallery interactions', () => {
    render(<ApartmentCard apartment={mockApartment} />);
    const photoThumbnail = screen.getByAltText('Foto do apartamento');
    fireEvent.click(photoThumbnail);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
```

### Testes de Integração

**Database Migration Tests:**
```python
# tests/test_migration.py
class MigrationTestCase(TransactionTestCase):
    def test_sqlite_to_postgresql_data_integrity(self):
        # Verifica se todos os dados foram migrados corretamente
        sqlite_count = self.get_sqlite_record_count()
        postgres_count = Aptos.objects.count() + Builders.objects.count()
        self.assertEqual(sqlite_count, postgres_count)

    def test_foreign_key_relationships_preserved(self):
        # Verifica se todas as FKs foram preservadas
        for apto in Aptos.objects.all():
            self.assertIsNotNone(apto.building_name)
            self.assertIsInstance(apto.building_name, Builders)
```

**End-to-End Tests (Playwright):**
```typescript
// tests/e2e/apartment-listing.spec.ts
test.describe('Apartment Listing', () => {
  test('should display apartments and allow filtering', async ({ page }) => {
    await page.goto('/aptos/');
    
    // Verifica se apartamentos são carregados
    await expect(page.locator('[data-testid="apartment-card"]')).toHaveCount.greaterThan(0);
    
    // Testa filtro por quartos
    await page.selectOption('[data-testid="bedrooms-filter"]', '2');
    await page.waitForLoadState('networkidle');
    
    const apartmentCards = page.locator('[data-testid="apartment-card"]');
    const firstCard = apartmentCards.first();
    await expect(firstCard.locator('[data-testid="bedrooms-count"]')).toContainText('2');
  });

  test('should open photo gallery modal', async ({ page }) => {
    await page.goto('/aptos/');
    
    const firstPhoto = page.locator('[data-testid="apartment-photo"]').first();
    await firstPhoto.click();
    
    await expect(page.locator('[data-testid="photo-modal"]')).toBeVisible();
    
    // Testa navegação entre fotos
    await page.click('[data-testid="next-photo"]');
    await expect(page.locator('[data-testid="photo-counter"]')).toContainText('2 de');
  });
});
```

## Sequenciamento de Desenvolvimento

### Ordem de Construção

1. **Setup PostgreSQL + Migration Scripts** (Semana 1)
   - Configurar PostgreSQL local e produção
   - Criar script de migração SQLite → PostgreSQL
   - Validar integridade de dados migrados
   - **Por que primeiro**: Base crítica, bloqueia tudo mais

2. **Django REST API Implementation** (Semana 2)
   - Implementar Django REST Framework
   - Criar serializers para Builders e Aptos
   - Implementar ViewSets com filtros e paginação
   - Configurar CORS e autenticação
   - **Dependência**: PostgreSQL configurado

3. **React SPA Foundation** (Semana 3)
   - Setup projeto React com TypeScript
   - Configurar Tailwind CSS
   - Implementar routing (React Router)
   - Criar API client service
   - **Dependência**: API endpoints funcionais

4. **React Components Development** (Semana 4)
   - Implementar componentes de listagem (apartamentos/construtoras)
   - Desenvolver modal de galeria de fotos
   - Implementar filtros e busca
   - Adicionar responsividade mobile
   - **Dependência**: Foundation React + APIs

5. **Docker + Nginx Configuration** (Semana 5)
   - Criar Dockerfiles para cada serviço
   - Configurar Docker Compose
   - Setup Nginx proxy reverso
   - Configurar serving de media files
   - **Dependência**: Todos componentes funcionais

6. **Testing & Deployment Strategy** (Semana 6)
   - Implementar testes unitários e E2E
   - Configurar CI/CD pipeline
   - Implementar blue-green deployment
   - Documentação deploy
   - **Dependência**: Sistema completo funcionando

### Dependências Técnicas

**Infraestrutura Requerida:**
- PostgreSQL 15+ server (local + produção)
- Docker & Docker Compose instalados
- Node.js 18+ para build React
- Nginx para proxy reverso
- Certificado SSL para HTTPS (produção)

**Dependências Externas:**
- Django REST Framework 3.14+
- React 18+ com TypeScript
- Tailwind CSS 3+
- Axios para HTTP client
- Playwright para testes E2E

**Entregas de Equipe:**
- Design System: cores, tipografia, componentes base Tailwind
- Media files backup: backup completo antes migração
- DNS/Infraestrutura: configuração domínio produção

## Monitoramento e Observabilidade

### Métricas de Sistema

**PostgreSQL Metrics (expostas via prometheus):**
```yaml
# docker-compose.monitoring.yml
postgres_exporter:
  image: prometheuscommunity/postgres-exporter
  environment:
    DATA_SOURCE_NAME: "postgresql://user:pass@db:5432/aptos?sslmode=disable"
  expose:
    - "9187"
```

**Django Metrics:**
```python
# metrics.py
from prometheus_client import Counter, Histogram, Gauge

api_requests_total = Counter('django_api_requests_total', 'Total API requests', ['method', 'endpoint'])
response_time = Histogram('django_response_time_seconds', 'Response time')
active_connections = Gauge('django_db_connections', 'Active DB connections')

class PrometheusMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path.startswith('/api/'):
            api_requests_total.labels(method=request.method, endpoint=request.path).inc()
        
        with response_time.time():
            response = self.get_response(request)
        return response
```

### Logs Principais

**Structured Logging (JSON format):**
```python
# logging_config.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'json': {
            'format': '{"timestamp": "%(asctime)s", "level": "%(levelname)s", "module": "%(name)s", "message": "%(message)s"}',
            'datefmt': '%Y-%m-%d %H:%M:%S'
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': '/app/logs/django.log',
            'maxBytes': 1024*1024*10,  # 10MB
            'backupCount': 5,
            'formatter': 'json',
        },
    },
    'loggers': {
        'aptos.api': {'level': 'INFO', 'handlers': ['file']},
        'aptos.migration': {'level': 'DEBUG', 'handlers': ['file']},
    },
}
```

**React Error Monitoring:**
```typescript
// src/utils/monitoring.ts
class ErrorMonitor {
  static logError(error: Error, context: string) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      context: context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    // Log to console for development
    console.error('React Error:', errorData);
    
    // Send to logging service in production
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/v1/logs/frontend-error/', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(errorData)
      });
    }
  }
}
```

## Considerações Técnicas

### Decisões Principais

**1. Django REST Framework vs GraphQL:**
- **Escolhido**: Django REST Framework
- **Justificativa**: Menor curva de aprendizado, integração natural com Django Admin, ecosystem maduro
- **Trade-off**: Menos flexibilidade de query que GraphQL, mas adequado para CRUD simples

**2. React SPA vs Server-Side Rendering:**
- **Escolhido**: Client-Side Rendering (SPA)
- **Justificativa**: Melhor UX, desenvolvimento mais simples, admin e público separados
- **Trade-off**: SEO menos otimizado, mas aceitável para portal interno

**3. PostgreSQL Deployment:**
- **Escolhido**: Container PostgreSQL com volumes persistentes
- **Justificativa**: Consistência dev/prod, facilita backup/restore
- **Trade-off**: Slightly mais overhead que managed database, mas maior controle

**4. State Management React:**
- **Escolhido**: useState + React Query para server state
- **Justificativa**: Scope CRUD simples não justifica Redux/Zustand
- **Alternativa rejeitada**: Redux (overkill), Context API (não otimizado para async)

### Riscos Conhecidos

**1. Data Migration Risk (Alto)**
- **Risco**: Perda ou corrupção de dados durante migração SQLite → PostgreSQL
- **Mitigação**: 
  - Backup completo antes migração
  - Script de validação pós-migração
  - Teste em ambiente staging idêntico
  - Rollback plan documentado

**2. Performance Risk (Médio)**
- **Risco**: React SPA pode ter loading time alto na primeira visita
- **Mitigação**:
  - Code splitting por rota
  - Service Worker para cache
  - Otimização bundle size (<500KB)
  - CDN para assets estáticos

**3. Session Management Risk (Médio)**
- **Risco**: Complexidade Django Admin + React sessions
- **Mitigação**:
  - Usar SessionAuthentication padrão
  - CSRF tokens adequados
  - Documentar fluxo auth claramente

### Requisitos Especiais

**Performance Targets:**
- Initial Load Time: <3 segundos (95th percentile)
- API Response Time: <500ms (95th percentile)  
- Database Query Time: <100ms média
- React Bundle Size: <500KB gzipped

**Acessibilidade (WCAG 2.1 AA):**
```typescript
// Exemplo implementação acessibilidade
const ApartmentCard: React.FC<{apartment: Apartment}> = ({apartment}) => {
  return (
    <article role="article" tabIndex={0}>
      <h2 id={`apartment-${apartment.id}`}>
        Apartamento {apartment.unit_number}
      </h2>
      <img 
        src={apartment.fotos[0]?.photos} 
        alt={`Foto do apartamento ${apartment.unit_number}`}
        role="img"
      />
      <button 
        aria-describedby={`apartment-${apartment.id}`}
        onClick={() => openModal()}
      >
        Ver detalhes
      </button>
    </article>
  );
};
```

**Security Requirements:**
- HTTPS obrigatório em produção
- CSRF protection em todas APIs
- File upload validation (tipos, tamanhos)
- Rate limiting em APIs públicas
- Security headers via Nginx

### Conformidade com Padrões

**Django Best Practices:**
- Models seguem Django conventions (snake_case)
- REST API segue Richardson Maturity Model Level 2
- Admin preserva interface padrão Django
- Migrations atômicas e reversíveis

**React Best Practices:**
- TypeScript strict mode ativado
- ESLint + Prettier configurados
- Componentes funcionais com hooks
- Error boundaries implementados
- Acessibilidade como first-class concern

**Docker Best Practices:**
- Multi-stage builds para otimização
- Non-root users nos containers  
- Health checks em todos serviços
- Secrets via environment variables
- Volume persistence para dados críticos

**Testing Standards:**
- Mínimo 80% coverage para Django API
- Mínimo 70% coverage para React components
- E2E tests para fluxos críticos
- Integration tests para database operations
- Performance tests para APIs
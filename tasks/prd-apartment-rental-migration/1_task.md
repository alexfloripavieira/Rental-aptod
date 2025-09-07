---
status: pending
parallelizable: false
blocked_by: []
unblocks: ["3.0", "2.0"]
---

<task_context>
<domain>infra/database</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>high</complexity>
<dependencies>database</dependencies>
</task_context>

# Tarefa 1.0: Setup PostgreSQL e Scripts de Migração

## Visão Geral

Configurar PostgreSQL como novo banco de dados e criar scripts automatizados para migração completa de dados do SQLite atual para PostgreSQL, garantindo zero perda de dados e preservação de todas as relações entre entidades.

<requirements>
- PostgreSQL 15+ configurado localmente e para produção
- Script de migração SQLite → PostgreSQL 100% funcional
- Backup completo do banco SQLite atual
- Validação automática de integridade pós-migração
- Documentação detalhada do processo de migração
- Rollback plan documentado e testado
</requirements>

## Subtarefas

- [ ] 1.1 Configurar PostgreSQL local e produção
- [ ] 1.2 Criar backup completo do banco SQLite atual
- [ ] 1.3 Desenvolver script de migração automatizada
- [ ] 1.4 Implementar validação de integridade de dados
- [ ] 1.5 Testar processo completo em ambiente staging
- [ ] 1.6 Criar índices otimizados para PostgreSQL
- [ ] 1.7 Documentar processo e rollback plan

## Detalhes de Implementação

### PostgreSQL Schema (conforme techspec.md):

```sql
-- Estrutura otimizada com índices
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

### Script de Migração:
- Utilizar Django management command para migração
- Validação registro por registro
- Logging detalhado de todo o processo
- Verificação de foreign keys e relacionamentos
- Preservação de media files structure

### Validação Pós-Migração:
- Count de registros SQLite vs PostgreSQL
- Verificação de foreign key integrity
- Validação de campos nullable/not null
- Teste de queries utilizadas pelo Django Admin atual

## Critérios de Sucesso

- PostgreSQL configurado e acessível localmente e produção
- 100% dos dados migrados sem perda (verificado por count e sampling)
- Todas as foreign keys preservadas e funcionais
- Backup SQLite completo e testado para rollback
- Performance queries PostgreSQL >= performance SQLite
- Django Admin funciona 100% com novo banco
- Documentação completa permite migração em produção
- Rollback testado e funcional
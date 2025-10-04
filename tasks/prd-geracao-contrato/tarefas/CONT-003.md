# CONT-003: Qualidade e Deploy

## Metadata
- **Status**: Pendente
- **Prioridade**: Alta
- **Estimativa**: ~5 dias úteis
- **Complexidade**: Baixa-Média
- **Dependências**: CONT-001 (Backend), CONT-002 (Frontend)
- **Desbloqueia**: Produção

## Visão Geral

Realizar validação final de qualidade, garantir cobertura de testes ≥85%, executar testes E2E (opcional), realizar code review completo, deploy em staging, validações finais e deploy em produção com documentação mínima de uso.

## Objetivos

1. Garantir cobertura de testes ≥85% (backend + frontend)
2. Realizar code review completo com checklist de qualidade
3. Executar testes E2E para validar fluxo end-to-end (opcional)
4. Validar performance, acessibilidade e bundle size
5. Deploy em ambiente de staging
6. Testes de aceitação com stakeholders
7. Deploy em produção via blue-green deployment
8. Criar documentação mínima de uso

## Subtarefas Detalhadas

### 1. Validação de Cobertura de Testes (1 dia)

**Backend** (`aptos/contratos/`):

**Atividades**:
- [ ] Executar testes com coverage: `coverage run --source='aptos.contratos' manage.py test aptos.contratos`
- [ ] Gerar relatório: `coverage report -m`
- [ ] Validar cobertura ≥85%
- [ ] Identificar gaps de cobertura e criar testes adicionais se necessário

**Comandos**:
```bash
# Backend (no diretório raiz do projeto)
source venv/bin/activate
coverage run --source='aptos.contratos' manage.py test aptos.contratos
coverage report -m
coverage html  # Gera relatório HTML em htmlcov/
```

**Critérios**:
- [ ] `views.py`: ≥90% cobertura
- [ ] `serializers.py`: ≥90% cobertura
- [ ] `pdf_generator.py`: ≥85% cobertura
- [ ] `validators.py`: 100% cobertura
- [ ] `permissions.py`: 100% cobertura
- [ ] Cobertura total do módulo: ≥85%

---

**Frontend** (`frontend/src/components/contratos/` e `frontend/src/hooks/`):

**Atividades**:
- [ ] Executar testes com coverage: `npm run test:coverage`
- [ ] Validar cobertura ≥85% nos novos componentes
- [ ] Identificar gaps e criar testes adicionais

**Comandos**:
```bash
# Frontend
cd frontend
npm run test:coverage
```

**Critérios**:
- [ ] `useGerarContrato.ts`: 100% cobertura
- [ ] `GerarContratoButton.tsx`: 100% cobertura
- [ ] `FormularioContrato.tsx`: ≥85% cobertura
- [ ] `GerarContratoModal.tsx`: ≥85% cobertura
- [ ] `ContratoSucessoModal.tsx`: 100% cobertura
- [ ] Cobertura total de novos componentes: ≥85%

---

### 2. Code Review Completo (1 dia)

**Checklist de Code Review**:

**Backend**:
- [ ] Seguir padrões de código definidos em `rules/code-standards.md`
- [ ] Imports no topo dos arquivos (nunca dentro de classes/métodos)
- [ ] Nomenclatura: snake_case para variáveis/funções, PascalCase para classes
- [ ] Métodos com no máximo 50 linhas, classes com no máximo 300 linhas
- [ ] Early returns ao invés de nested if/else
- [ ] Docstrings em todas as funções públicas
- [ ] Validações robustas em serializers
- [ ] Logs de auditoria seguros (CPF hasheado)
- [ ] Tratamento de exceções adequado
- [ ] Nenhum dado sensível em logs

**Frontend**:
- [ ] Seguir padrões de código definidos em `rules/code-standards.md`
- [ ] Imports no topo dos arquivos
- [ ] Nomenclatura: camelCase para funções/variáveis, PascalCase para componentes
- [ ] Componentes com no máximo 300 linhas
- [ ] Props tipadas com TypeScript
- [ ] Validações Yup completas
- [ ] Acessibilidade (ARIA labels, navegação por teclado)
- [ ] Responsividade (mobile/tablet/desktop)
- [ ] Tratamento de erros de API

**Ferramentas**:
```bash
# Backend
source venv/bin/activate
ruff check .  # Linting
mypy .        # Type checking (se configurado)

# Frontend
cd frontend
npm run lint
npm run type-check
```

**Critérios de Aprovação**:
- [ ] Zero erros de lint
- [ ] Zero erros de type checking
- [ ] Todos os itens do checklist verificados
- [ ] Aprovação de pelo menos 1 desenvolvedor sênior

---

### 3. Testes E2E (Opcional - 1 dia)

**Nota**: Testes E2E com Playwright estão atualmente desabilitados no projeto. Esta subtarefa é opcional.

**Se decidir implementar**:

**Arquivo**: `frontend/e2e/gerarContrato.spec.ts`

**Cenários de Teste**:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Geração de Contrato E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login como super admin
    await page.goto('/login');
    await page.fill('input[name="username"]', 'superadmin');
    await page.fill('input[name="password"]', 'senha123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/inquilinos');
  });

  test('Deve gerar contrato com sucesso', async ({ page }) => {
    // Abrir modal
    await page.click('button:has-text("Gerar Contrato")');
    await expect(page.locator('h2:has-text("Gerar Contrato de Locação")')).toBeVisible();

    // Preencher formulário
    await page.fill('input[name="locador.nomeCompleto"]', 'ALEXSANDER VIEIRA');
    await page.fill('input[name="locador.cpf"]', '908.833.149-91');
    // ... preencher todos os campos

    // Submeter
    await page.click('button:has-text("Gerar Contrato")');

    // Aguardar sucesso
    await expect(page.locator('text=Contrato Gerado com Sucesso')).toBeVisible({ timeout: 10000 });

    // Validar botões de ação
    await expect(page.locator('button:has-text("Baixar PDF")')).toBeVisible();
    await expect(page.locator('button:has-text("Imprimir")')).toBeVisible();
  });

  test('Deve exibir erros de validação', async ({ page }) => {
    await page.click('button:has-text("Gerar Contrato")');
    await page.click('button:has-text("Gerar Contrato")'); // Tentar submeter vazio

    // Validar mensagens de erro
    await expect(page.locator('text=Campo obrigatório').first()).toBeVisible();
  });

  test('Usuário comum não deve ver botão', async ({ page }) => {
    // Logout e login como usuário comum
    await page.click('button[aria-label="User menu"]');
    await page.click('text=Sair');

    await page.goto('/login');
    await page.fill('input[name="username"]', 'usuario_comum');
    await page.fill('input[name="password"]', 'senha123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/inquilinos');

    // Validar que botão não aparece
    await expect(page.locator('button:has-text("Gerar Contrato")')).not.toBeVisible();
  });
});
```

**Executar Testes E2E**:
```bash
cd frontend
npx playwright test
```

**Critérios** (se implementado):
- [ ] Todos os cenários E2E passando
- [ ] Cobertura de fluxo happy path
- [ ] Cobertura de erros de validação
- [ ] Cobertura de permissões

---

### 4. Validação de Performance, Acessibilidade e Bundle (1 dia)

**Performance**:

**Atividades**:
- [ ] Testar tempo de geração de PDF (deve ser < 5 segundos)
- [ ] Testar tempo de resposta do endpoint (p95 < 6 segundos)
- [ ] Executar load testing (opcional)

**Comandos**:
```bash
# Load testing com k6 (se disponível)
make load-test
```

**Critérios**:
- [ ] PDF gerado em < 5 segundos (p95)
- [ ] Endpoint responde em < 6 segundos total (p95)
- [ ] Modal abre em < 500ms
- [ ] Formulário responsivo sem lag

---

**Acessibilidade**:

**Atividades**:
- [ ] Executar Lighthouse (Chrome DevTools)
- [ ] Executar axe DevTools ou similar
- [ ] Validação manual de navegação por teclado
- [ ] Validação manual de screen reader

**Comandos**:
```bash
# Lighthouse via CLI (opcional)
npm install -g lighthouse
lighthouse http://localhost:3000/inquilinos --view
```

**Critérios**:
- [ ] Lighthouse Accessibility Score ≥ 90
- [ ] Contraste WCAG AA (mínimo 4.5:1)
- [ ] Todos os campos com labels/aria-labels
- [ ] Navegação por teclado funcional
- [ ] Mensagens de erro anunciadas por screen readers

---

**Bundle Size**:

**Atividades**:
- [ ] Executar análise de bundle: `npm run build && npm run analyze` (se configurado)
- [ ] Validar que novos componentes não aumentam bundle excessivamente

**Comandos**:
```bash
cd frontend
npm run build
npm run analyze  # Se disponível
```

**Critérios**:
- [ ] Aumento de bundle < 50KB (gzip)
- [ ] Componentes de contrato em chunk separado (code splitting)

---

### 5. Deploy em Staging e Testes de Aceitação (1 dia)

**Deploy em Staging**:

**Atividades**:
- [ ] Atualizar branch de staging: `git checkout staging && git merge main`
- [ ] Build de frontend: `make build-frontend`
- [ ] Deploy: `make up-prod` (ou comando específico de staging)
- [ ] Executar migrations: `docker compose exec backend python manage.py migrate`
- [ ] Validar health check: `curl http://staging.aptos.local/health/`

**Comandos**:
```bash
# Exemplo de deploy staging
git checkout staging
git merge main
make build-frontend
make up-prod  # ou docker compose -f docker-compose.staging.yml up -d
docker compose exec backend python manage.py migrate
curl http://staging.aptos.local/health/
```

---

**Testes de Aceitação com Stakeholders**:

**Checklist de Validação**:
- [ ] Super admin consegue logar
- [ ] Botão "Gerar Contrato" aparece apenas para super admin
- [ ] Modal abre corretamente
- [ ] Todos os campos do formulário estão presentes
- [ ] Validações funcionam (CPF inválido, campos vazios, etc.)
- [ ] PDF é gerado em < 5 segundos
- [ ] PDF possui 4 páginas
- [ ] Todos os campos variáveis estão preenchidos corretamente
- [ ] Formatação idêntica ao contrato padrão
- [ ] Download funciona
- [ ] Impressão funciona
- [ ] Modal fecha corretamente

**Stakeholders**:
- [ ] Aprovação do PO/Product Manager
- [ ] Aprovação de pelo menos 1 super admin real (usuário final)

---

### 6. Deploy em Produção (1 dia)

**Pré-Deploy**:

**Atividades**:
- [ ] Criar tag de release: `git tag -a v1.0.0-geracao-contratos -m "Release: Geração de Contratos"`
- [ ] Push da tag: `git push origin v1.0.0-geracao-contratos`
- [ ] Backup do banco de dados (se aplicável)

---

**Deploy via Blue-Green**:

**Atividades**:
- [ ] Executar deploy blue-green: `make bg-deploy`
- [ ] Validar ambiente alternativo: `make bg-validate`
- [ ] Switch de tráfego: Alterar HAProxy config
- [ ] Monitorar logs: `docker compose logs -f backend`
- [ ] Validar health checks
- [ ] Rollback disponível em caso de falha

**Comandos**:
```bash
# Deploy blue-green
make bg-deploy
make bg-validate

# Monitorar logs
docker compose logs -f backend

# Health check
curl https://aptos.com.br/health/
```

**Critérios de Sucesso**:
- [ ] Deploy bem-sucedido sem downtime
- [ ] Health checks passando
- [ ] Logs sem erros críticos
- [ ] Funcionalidade testada manualmente em produção
- [ ] Zero erros reportados nos primeiros 30 minutos

---

**Pós-Deploy**:

**Atividades**:
- [ ] Monitoramento de logs por 2 horas
- [ ] Validar métricas de erro (deve ser 0%)
- [ ] Testar geração de contrato real em produção (com super admin)
- [ ] Comunicar lançamento aos super admins

---

### 7. Documentação Mínima (Integrado)

**README de Uso** (para super admins):

**Arquivo**: `docs/geracao-contratos-uso.md`

**Conteúdo**:
```markdown
# Geração de Contratos de Locação - Guia de Uso

## Requisitos
- Permissão de super administrador (`is_superuser`)

## Como Gerar um Contrato

1. Acesse a página de **Inquilinos** (`/inquilinos`)
2. Clique no botão **"Gerar Contrato"** (visível apenas para super admins)
3. Preencha todos os campos obrigatórios (marcados com asterisco vermelho):

### Dados do Locador
- Nome completo
- Nacionalidade (ex: brasileiro)
- Estado civil (ex: casado, solteiro)
- Profissão
- CPF (formato: XXX.XXX.XXX-XX)
- Endereço completo (rua, número, bairro, cidade, UF, CEP)

### Dados do Locatário
- Nome completo
- Nacionalidade
- Profissão
- CPF (formato: XXX.XXX.XXX-XX)
- RG e órgão emissor (ex: 6.505.0271 SSP/SC)
- Endereço completo
- Telefone (formato: (XX) XXXXX-XXXX)
- Email

### Detalhes do Contrato
- Data de início (deve ser futura)
- Valor da caução (em R$)
- Cláusula segunda (acordo de pagamento) - mínimo 50 caracteres

### Inventário de Móveis
- Descrição detalhada dos móveis inclusos (mínimo 20 caracteres)

4. Clique em **"Gerar Contrato"**
5. Aguarde a geração (2-5 segundos)
6. No modal de sucesso, escolha:
   - **Baixar PDF**: Download do arquivo
   - **Imprimir**: Abrir diálogo de impressão
   - **Fechar**: Retornar à listagem

## Nome do Arquivo Gerado
`contrato_locacao_{CPF_LOCATARIO}_{DATA_INICIO}.pdf`

Exemplo: `contrato_locacao_06385740994_2025-08-05.pdf`

## Dúvidas e Suporte
- Erros de validação: Verifique os campos destacados em vermelho
- CPF inválido: Certifique-se de digitar um CPF válido com dígitos verificadores corretos
- Suporte técnico: contato@aptos.com.br
```

---

**Documentação Técnica** (para desenvolvedores):

**Arquivo**: `docs/geracao-contratos-tecnico.md`

**Conteúdo** (resumido):
```markdown
# Geração de Contratos - Documentação Técnica

## Arquitetura
- **Backend**: Django REST Framework (endpoint `/api/v1/contratos/gerar/`)
- **Frontend**: React + TypeScript + Yup
- **PDF**: WeasyPrint (HTML → PDF)

## Módulos
- `aptos/contratos/` - Backend completo
- `frontend/src/components/contratos/` - Componentes React
- `frontend/src/hooks/useGerarContrato.ts` - Hook de API

## API Endpoint
**POST** `/api/v1/contratos/gerar/`
- **Permissão**: `IsSuperAdminUser`
- **Request**: JSON com dados de locador, locatário, contrato e inventário
- **Response**: PDF binário (`application/pdf`)

## Testes
```bash
# Backend
source venv/bin/activate
python manage.py test aptos.contratos

# Frontend
cd frontend
npm run test:coverage
```

## Logs de Auditoria
Logs em `logs/contratos.log` com:
- Usuário que gerou
- Timestamp
- CPF locatário (hasheado)
- Status (sucesso/falha)
```

---

## Arquivos Afetados

### Novos Arquivos
- `docs/geracao-contratos-uso.md`
- `docs/geracao-contratos-tecnico.md`
- `frontend/e2e/gerarContrato.spec.ts` (se E2E implementado)

### Arquivos Modificados
- Nenhum (apenas validações e deploy)

---

## Critérios de Aceitação

### Cobertura de Testes
- [ ] Backend: ≥85% cobertura em `aptos/contratos/`
- [ ] Frontend: ≥85% cobertura em novos componentes
- [ ] Todos os testes passando (0 falhas)

### Code Review
- [ ] Zero erros de lint (ruff/ESLint)
- [ ] Zero erros de type checking (mypy/TypeScript)
- [ ] Aprovação de code review
- [ ] Conformidade com `rules/code-standards.md`

### Performance
- [ ] PDF gerado em < 5 segundos (p95)
- [ ] Endpoint responde em < 6 segundos (p95)
- [ ] Modal abre em < 500ms

### Acessibilidade
- [ ] Lighthouse Accessibility Score ≥ 90
- [ ] Navegação por teclado funcional
- [ ] Screen reader friendly

### Deploy
- [ ] Deploy em staging bem-sucedido
- [ ] Testes de aceitação aprovados
- [ ] Deploy em produção bem-sucedido via blue-green
- [ ] Zero downtime
- [ ] Zero erros nos primeiros 30 minutos pós-deploy

### Documentação
- [ ] Guia de uso para super admins criado
- [ ] Documentação técnica criada
- [ ] README atualizado (se necessário)

---

## Riscos e Mitigações

### Risco 1: Falha em Produção
- **Mitigação**: Blue-green deployment com rollback imediato disponível

### Risco 2: Baixa Cobertura de Testes
- **Mitigação**: Criar testes adicionais antes de aprovar para produção

### Risco 3: Performance Abaixo do Esperado
- **Mitigação**: Otimizações no template HTML, cache de configurações

---

## Definição de Pronto (DoD)

- [ ] Cobertura de testes ≥ 85% (backend + frontend)
- [ ] Code review aprovado
- [ ] Testes E2E passando (se implementado)
- [ ] Validações de performance, acessibilidade e bundle aprovadas
- [ ] Deploy em staging bem-sucedido
- [ ] Testes de aceitação com stakeholders aprovados
- [ ] Deploy em produção bem-sucedido
- [ ] Monitoramento pós-deploy sem erros (2 horas)
- [ ] Documentação criada e revisada
- [ ] Comunicação aos usuários finais enviada

---

## Próximos Passos (Pós-Implementação)

1. Monitorar métricas de uso:
   - Contratos gerados por semana
   - Tempo médio de geração
   - Taxa de erro

2. Coletar feedback de super admins (NPS)

3. Planejar melhorias futuras:
   - Persistência de contratos no banco (Fase 2)
   - Assinatura eletrônica (Fase 3)
   - Templates múltiplos (Fase 4)

---

**Feature Completa e Pronta para Produção!**

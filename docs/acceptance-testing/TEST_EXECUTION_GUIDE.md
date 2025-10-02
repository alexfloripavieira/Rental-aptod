# Guia de Execução de Testes - Sistema de Gestão de Inquilinos

Este guia fornece instruções detalhadas para executar todos os testes do sistema.

---

## 1. Pré-requisitos

### 1.1 Ambiente de Desenvolvimento

```bash
# Verificar que os serviços estão rodando
make ps

# Serviços necessários:
# - backend (Django)
# - db (PostgreSQL)
# - redis
# - nginx (opcional)
```

### 1.2 Dependências de Teste

#### Backend
```bash
# Já instalado no container
docker compose exec backend pip list | grep -E "pytest|selenium|axe"
```

#### Frontend
```bash
cd frontend
npm install
```

---

## 2. Testes Backend

### 2.1 Testes Unitários e de Integração

#### Executar todos os testes
```bash
docker compose exec backend python -m pytest aptos/tests/ -v
```

#### Executar com cobertura
```bash
docker compose exec backend python -m pytest aptos/tests/ \
    --cov=aptos \
    --cov-report=term-missing \
    --cov-report=html
```

#### Visualizar relatório de cobertura
```bash
# O relatório HTML está em: htmlcov/index.html
xdg-open htmlcov/index.html  # Linux
open htmlcov/index.html      # macOS
```

#### Executar testes específicos
```bash
# Apenas testes de modelos
docker compose exec backend python -m pytest aptos/tests/test_inquilino_models.py -v

# Apenas testes de API
docker compose exec backend python -m pytest aptos/tests/test_inquilino_api.py -v

# Apenas testes de validadores
docker compose exec backend python -m pytest aptos/tests/test_validators.py -v
```

#### Executar teste individual
```bash
docker compose exec backend python -m pytest \
    aptos/tests/test_inquilino_models.py::TestInquilinoModel::test_create_inquilino_pf_valido -v
```

---

## 3. Testes End-to-End (E2E)

### 3.1 Configuração

#### Instalar Selenium e dependências
```bash
pip install selenium requests
```

#### Instalar ChromeDriver
```bash
# Linux
wget https://chromedriver.storage.googleapis.com/LATEST_RELEASE
VERSION=$(cat LATEST_RELEASE)
wget https://chromedriver.storage.googleapis.com/$VERSION/chromedriver_linux64.zip
unzip chromedriver_linux64.zip
sudo mv chromedriver /usr/local/bin/

# macOS
brew install chromedriver
```

### 3.2 Executar Testes E2E

```bash
# Todos os testes E2E
pytest tests/e2e/test_acceptance_inquilinos.py -v

# Apenas testes de cadastro
pytest tests/e2e/test_acceptance_inquilinos.py::TestCadastroInquilinosPF -v

# Apenas testes de busca
pytest tests/e2e/test_acceptance_inquilinos.py::TestBuscaEFiltros -v

# Com saída detalhada
pytest tests/e2e/test_acceptance_inquilinos.py -v -s --tb=short
```

### 3.3 Configurar Autenticação

Os testes E2E requerem um usuário admin. Criar se necessário:

```bash
docker compose exec backend python manage.py createsuperuser
# Username: admin
# Email: admin@example.com
# Password: admin
```

---

## 4. Testes de Performance

### 4.1 Teste Rápido

```bash
# Teste de listagem (50 requisições, 5 concorrentes)
python3 tests/performance/load_test_inquilinos.py \
    --test list \
    --requests 50 \
    --concurrent 5
```

### 4.2 Teste Completo

```bash
# Suite completa de testes de performance
python3 tests/performance/load_test_inquilinos.py --test full
```

### 4.3 Testes Individuais

```bash
# Teste de listagem
python3 tests/performance/load_test_inquilinos.py --test list --requests 100 --concurrent 10

# Teste de busca
python3 tests/performance/load_test_inquilinos.py --test search --requests 100 --concurrent 10

# Teste de criação
python3 tests/performance/load_test_inquilinos.py --test create --requests 50 --concurrent 5

# Teste de detalhes
python3 tests/performance/load_test_inquilinos.py --test detail --requests 100 --concurrent 10
```

### 4.4 Testes com Autenticação

Para testes autenticados, criar um token ou usar session:

```bash
# Obter token de autenticação
curl -X POST http://localhost:8000/api/v1/auth/login/ \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin"}'
```

---

## 5. Testes de Acessibilidade

### 5.1 Instalação de Dependências

```bash
pip install selenium axe-selenium-python
```

### 5.2 Executar Testes de Acessibilidade

```bash
# Todos os testes de acessibilidade
pytest tests/accessibility/test_wcag_compliance.py -v

# Apenas navegação por teclado
pytest tests/accessibility/test_wcag_compliance.py::TestKeyboardNavigation -v

# Apenas ARIA labels
pytest tests/accessibility/test_wcag_compliance.py::TestARIALabels -v

# Teste com axe-core
pytest tests/accessibility/test_wcag_compliance.py::TestAxeCore -v
```

### 5.3 Relatório de Acessibilidade

```bash
pytest tests/accessibility/test_wcag_compliance.py -v --html=accessibility_report.html
```

---

## 6. Testes Frontend

### 6.1 Testes com Vitest

```bash
cd frontend

# Executar testes
npm run test

# Executar com cobertura
npm run test:coverage

# Executar em modo watch
npm run test -- --watch

# Executar testes específicos
npm run test -- InquilinoForm
```

### 6.2 Relatório de Cobertura Frontend

```bash
cd frontend
npm run test:coverage

# Abrir relatório
xdg-open coverage/index.html  # Linux
open coverage/index.html      # macOS
```

---

## 7. Testes de Integração Contínua (CI)

### 7.1 GitHub Actions

Os testes são executados automaticamente no GitHub Actions em:
- Push para `main` ou `develop`
- Pull Requests

Ver status em: `.github/workflows/tests.yml`

### 7.2 Executar Localmente (Simular CI)

```bash
# Simular ambiente CI
docker compose -f docker-compose.yml -f docker-compose.test.yml up -d
docker compose exec backend python -m pytest aptos/tests/ --cov=aptos
docker compose down
```

---

## 8. Testes Manuais

### 8.1 Checklist de Testes Manuais

Seguir o documento: `docs/acceptance-testing/ACCEPTANCE_TEST_PLAN.md`

#### Cenários Principais:
1. **Cadastro de Inquilino PF** (3 min)
2. **Cadastro de Inquilino PJ** (3 min)
3. **Busca e Filtros** (2 min)
4. **Associação com Apartamento** (2 min)
5. **Gestão de Status** (1 min)
6. **Upload de Documentos** (2 min)
7. **Relatórios** (2 min)
8. **Responsividade Mobile** (5 min)

**Tempo Total Estimado**: 20 minutos

### 8.2 Preparação do Ambiente de Teste

```bash
# Criar dados de teste
docker compose exec backend python manage.py shell

from aptos.tests.factories import InquilinoFactory, AptosFactory
InquilinoFactory.create_batch(50)
AptosFactory.create_batch(20)
```

---

## 9. Testes de Regressão

### 9.1 Suite Completa

Executar antes de cada release:

```bash
#!/bin/bash
# regression_test.sh

echo "🧪 Iniciando Suite de Testes de Regressão..."

echo "\n📦 1. Testes Backend"
docker compose exec backend python -m pytest aptos/tests/ -v --cov=aptos

echo "\n🌐 2. Testes Frontend"
cd frontend && npm run test

echo "\n🤖 3. Testes E2E"
pytest tests/e2e/test_acceptance_inquilinos.py -v

echo "\n⚡ 4. Testes de Performance"
python3 tests/performance/load_test_inquilinos.py --test full

echo "\n♿ 5. Testes de Acessibilidade"
pytest tests/accessibility/test_wcag_compliance.py -v

echo "\n✅ Suite de Regressão Completa!"
```

### 9.2 Executar

```bash
chmod +x regression_test.sh
./regression_test.sh
```

---

## 10. Debugging de Testes

### 10.1 Modo Verbose

```bash
# Pytest com output detalhado
pytest tests/ -vv -s

# Mostrar print statements
pytest tests/ -s

# Parar no primeiro erro
pytest tests/ -x
```

### 10.2 Debugging Interativo

```bash
# Usar pdb no código de teste
import pdb; pdb.set_trace()

# Executar com pdb
pytest tests/e2e/test_acceptance_inquilinos.py --pdb
```

### 10.3 Screenshots em Falhas (E2E)

Adicionar ao código de teste:

```python
def test_example(driver):
    try:
        # Teste aqui
        pass
    except Exception as e:
        driver.save_screenshot('screenshot_failure.png')
        raise
```

---

## 11. Métricas e Relatórios

### 11.1 Gerar Relatório HTML de Testes

```bash
# Instalar pytest-html
pip install pytest-html

# Gerar relatório
pytest tests/ --html=test_report.html --self-contained-html
```

### 11.2 Métricas de Cobertura

```bash
# Backend
docker compose exec backend python -m pytest \
    --cov=aptos \
    --cov-report=xml \
    --cov-report=term

# Frontend
cd frontend
npm run test:coverage -- --reporter=json --reporter=html
```

### 11.3 Análise de Duração de Testes

```bash
# Mostrar 10 testes mais lentos
pytest tests/ --durations=10
```

---

## 12. Troubleshooting

### 12.1 Problemas Comuns

#### "Module not found"
```bash
# Reinstalar dependências
docker compose exec backend pip install -r requirements.txt
```

#### "Database errors"
```bash
# Resetar banco de dados de teste
docker compose exec backend python manage.py migrate --run-syncdb
```

#### "Selenium ChromeDriver"
```bash
# Atualizar ChromeDriver
# Ver: https://chromedriver.chromium.org/downloads
```

#### "Port already in use"
```bash
# Verificar portas
docker compose ps
lsof -i :8000
lsof -i :3000
```

### 12.2 Logs de Debug

```bash
# Logs do backend durante testes
docker compose logs -f backend

# Logs de teste específicos
pytest tests/ --log-cli-level=DEBUG
```

---

## 13. Boas Práticas

### 13.1 Antes de Commit

```bash
# 1. Executar testes unitários
docker compose exec backend python -m pytest aptos/tests/

# 2. Verificar cobertura
docker compose exec backend python -m pytest --cov=aptos --cov-report=term

# 3. Executar linter
docker compose exec backend flake8 aptos/
cd frontend && npm run lint
```

### 13.2 Antes de Pull Request

```bash
# 1. Suite completa de testes
./regression_test.sh

# 2. Verificar build
make build-frontend
docker compose build backend

# 3. Executar testes E2E principais
pytest tests/e2e/ -k "test_cadastro or test_busca"
```

### 13.3 Antes de Deploy

```bash
# 1. Testes de regressão completos
./regression_test.sh

# 2. Testes de performance
python3 tests/performance/load_test_inquilinos.py --test full

# 3. Smoke tests em staging
curl -f http://staging-url/api/v1/health/ || exit 1
```

---

## 14. Recursos Adicionais

### 14.1 Documentação

- **Pytest**: https://docs.pytest.org/
- **Selenium**: https://selenium-python.readthedocs.io/
- **Vitest**: https://vitest.dev/
- **WCAG 2.1**: https://www.w3.org/WAI/WCAG21/quickref/

### 14.2 Arquivos de Referência

- Plano de Testes: `docs/acceptance-testing/ACCEPTANCE_TEST_PLAN.md`
- Relatório de Testes: `docs/acceptance-testing/ACCEPTANCE_TEST_REPORT.md`
- Checklist LGPD: `docs/acceptance-testing/LGPD_COMPLIANCE_CHECKLIST.md`

---

## 15. Contatos

**Dúvidas sobre testes**:
- Tech Lead: ___________________________
- QA Lead: ___________________________
- DevOps: ___________________________

---

**Última atualização**: 2025-10-02

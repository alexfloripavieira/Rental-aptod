# Suite de Testes - Sistema de Gestão de Inquilinos

Este diretório contém a suite completa de testes automatizados para o sistema de gestão de inquilinos.

## Estrutura de Testes

```
aptos/tests/
├── __init__.py                      # Inicializador do pacote de testes
├── conftest.py                      # Fixtures globais pytest
├── factories.py                     # Factories (factory_boy) para geração de dados de teste
├── test_validators.py               # Testes de validação CPF/CNPJ
├── test_inquilino_models.py         # Testes do modelo Inquilino
├── test_inquilino_apartamento.py    # Testes do modelo InquilinoApartamento
└── test_inquilino_api.py            # Testes de API REST
```

## Executando os Testes

### Todos os Testes
```bash
# Via Docker
docker compose exec backend pytest aptos/tests/

# Localmente
pytest aptos/tests/
```

### Testes Específicos
```bash
# Testes de modelos apenas
pytest aptos/tests/test_inquilino_models.py

# Testes de API apenas
pytest aptos/tests/test_inquilino_api.py

# Testes de validação apenas
pytest aptos/tests/test_validators.py

# Teste específico
pytest aptos/tests/test_inquilino_models.py::TestInquilinoModel::test_create_inquilino_pf_valido
```

### Com Cobertura
```bash
# Gerar relatório de cobertura
pytest --cov=aptos --cov-report=html --cov-report=term-missing

# Ver relatório HTML (gerado em htmlcov/index.html)
open htmlcov/index.html
```

### Opções Úteis
```bash
# Verbose (mostra cada teste)
pytest -v

# Parar no primeiro erro
pytest -x

# Rodar testes em paralelo (mais rápido)
pytest -n auto

# Rodar apenas testes marcados
pytest -m unit
pytest -m api
```

## Marcadores (Markers)

Os testes são organizados com marcadores pytest:

- `@pytest.mark.unit` - Testes unitários
- `@pytest.mark.api` - Testes de API
- `@pytest.mark.integration` - Testes de integração
- `@pytest.mark.slow` - Testes lentos (podem ser pulados em dev)

## Factories

As factories (em `factories.py`) facilitam a criação de objetos de teste:

```python
from aptos.tests.factories import InquilinoPFFactory, AptosFactory

# Criar inquilino pessoa física
inquilino = InquilinoPFFactory.create()

# Criar múltiplos inquilinos
inquilinos = InquilinoPFFactory.create_batch(5)

# Criar com atributos específicos
inquilino = InquilinoPFFactory.create(
    nome_completo='João Silva',
    status='ATIVO'
)
```

## Fixtures

Fixtures globais disponíveis (em `conftest.py`):

```python
def test_exemplo(authenticated_client, inquilino_pf, apartamento):
    """Teste usando fixtures."""
    # authenticated_client - Cliente API autenticado
    # inquilino_pf - Inquilino PF pré-criado
    # apartamento - Apartamento pré-criado
    pass
```

Fixtures disponíveis:
- `api_client` - Cliente API não autenticado
- `authenticated_client` - Cliente API autenticado
- `test_user` - Usuário de teste
- `admin_user` - Usuário administrador
- `inquilino_pf` - Inquilino pessoa física
- `inquilino_pj` - Inquilino pessoa jurídica
- `apartamento` - Apartamento
- `builder` - Builder/Edifício
- `associacao_ativa` - Associação ativa inquilino-apartamento

## Cobertura de Código

Meta: **>85%** de cobertura de código

Áreas cobertas:
- ✅ Modelos (Inquilino, InquilinoApartamento)
- ✅ Validadores (CPF/CNPJ)
- ✅ API REST (CRUD completo)
- ✅ Regras de negócio
- ✅ Constraints de banco de dados

## Dados de Teste

### CPFs Válidos para Testes
- `11144477735`
- `52998224725`

### CNPJs Válidos para Testes
- `11222333000181`
- `11444777000161`
- `06990590000123`

## CI/CD

Os testes são executados automaticamente no GitHub Actions em:
- Push para branches `main` e `develop`
- Pull Requests para `main`

Workflow: `.github/workflows/test.yml`

## Troubleshooting

### Erro: "Apps aren't loaded yet"
```bash
# Certifique-se de que DJANGO_SETTINGS_MODULE está configurado
export DJANGO_SETTINGS_MODULE=app.settings
```

### Testes falhando com CPF/CNPJ duplicado
```bash
# Limpe o banco de dados de teste
pytest --create-db
```

### Cobertura baixa
```bash
# Veja quais linhas não estão cobertas
pytest --cov=aptos --cov-report=term-missing
```

## Manutenção

### Adicionando Novos Testes

1. Crie o arquivo de teste em `aptos/tests/`
2. Use factories para criar dados de teste
3. Use fixtures para setup comum
4. Marque o teste apropriadamente
5. Execute os testes para validar

### Atualizando Factories

Se você adicionar novos campos aos modelos, atualize as factories em `factories.py`.

## Recursos

- [Pytest Documentation](https://docs.pytest.org/)
- [Factory Boy Documentation](https://factoryboy.readthedocs.io/)
- [Django Testing Tools](https://docs.djangoproject.com/en/stable/topics/testing/)
- [Coverage.py](https://coverage.readthedocs.io/)

---
status: pending
parallelizable: true
blocked_by: []
---

<task_context>
<domain>testing/quality</domain>
<type>testing</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>database,http_server</dependencies>
<unblocks>17.0</unblocks>
</task_context>

# Tarefa 14.0: Configurar testes automatizados (unitários e integração)

## Visão Geral
Desenvolver suite completa de testes automatizados para o sistema de gestão de inquilinos, incluindo testes unitários, de integração, e2e, e testes de conformidade LGPD. Configurar CI/CD com cobertura de testes e qualidade de código.

## Requisitos
- Testes unitários para todos os modelos Django
- Testes de API para todos os endpoints
- Testes de integração frontend-backend
- Testes de validação CPF/CNPJ
- Testes de conformidade LGPD
- Testes de upload de documentos
- Cobertura de código > 90%
- Integração com CI/CD pipeline

## Subtarefas
- [ ] 14.1 Configurar ambiente de testes
- [ ] 14.2 Criar testes unitários para modelos
- [ ] 14.3 Implementar testes de API (Django REST)
- [ ] 14.4 Desenvolver testes de validação
- [ ] 14.5 Criar testes de compliance LGPD
- [ ] 14.6 Implementar testes frontend (React)
- [ ] 14.7 Configurar testes de integração
- [ ] 14.8 Configurar CI/CD e relatórios de cobertura

## Sequenciamento
- Bloqueado por: Nenhuma (pode iniciar desde o começo)
- Desbloqueia: 17.0 (Testes de aceitação)
- Paralelizável: Sim (incremental durante desenvolvimento)

## Detalhes de Implementação

### Configuração Base de Testes
```python
# tests/settings.py
from app.settings import *

# Configurações específicas para testes
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Desabilitar migrações desnecessárias
class DisableMigrations:
    def __contains__(self, item):
        return True

    def __getitem__(self, item):
        return None

MIGRATION_MODULES = DisableMigrations()

# Configurações para testes
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'
CELERY_TASK_ALWAYS_EAGER = True
MEDIA_ROOT = '/tmp/test_media'

# Desabilitar logs durante testes
LOGGING = {
    'version': 1,
    'disable_existing_loggers': True,
    'handlers': {
        'null': {
            'class': 'logging.NullHandler',
        },
    },
    'root': {
        'handlers': ['null'],
    },
}

# Configurar chave de criptografia para testes
ENCRYPTION_KEY = b'test_key_for_testing_only_not_secure='
```

### Testes de Modelos
```python
# tests/test_models.py
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.db.utils import IntegrityError
from aptos.models import Inquilino, InquilinoApartamento, Builders, Aptos
from datetime import date, timedelta

class InquilinoModelTest(TestCase):
    def setUp(self):
        self.inquilino_pf_data = {
            'tipo': 'PF',
            'nome_completo': 'João Silva',
            'cpf': '12345678901',
            'email': 'joao@example.com',
            'telefone': '11999999999',
        }

        self.inquilino_pj_data = {
            'tipo': 'PJ',
            'razao_social': 'Empresa XYZ Ltda',
            'cnpj': '12345678000190',
            'email': 'contato@empresa.com',
            'telefone': '11888888888',
        }

    def test_create_inquilino_pf(self):
        """Teste criação de inquilino pessoa física"""
        inquilino = Inquilino.objects.create(**self.inquilino_pf_data)
        self.assertEqual(inquilino.tipo, 'PF')
        self.assertEqual(inquilino.nome_completo, 'João Silva')
        self.assertEqual(inquilino.status, 'ATIVO')

    def test_create_inquilino_pj(self):
        """Teste criação de inquilino pessoa jurídica"""
        inquilino = Inquilino.objects.create(**self.inquilino_pj_data)
        self.assertEqual(inquilino.tipo, 'PJ')
        self.assertEqual(inquilino.razao_social, 'Empresa XYZ Ltda')

    def test_unique_email_constraint(self):
        """Teste constraint de email único"""
        Inquilino.objects.create(**self.inquilino_pf_data)

        with self.assertRaises(IntegrityError):
            Inquilino.objects.create(
                tipo='PJ',
                razao_social='Outra Empresa',
                cnpj='98765432000100',
                email='joao@example.com',  # Email duplicado
                telefone='11777777777',
            )

    def test_unique_cpf_constraint(self):
        """Teste constraint de CPF único"""
        Inquilino.objects.create(**self.inquilino_pf_data)

        with self.assertRaises(IntegrityError):
            Inquilino.objects.create(
                tipo='PF',
                nome_completo='Outro João',
                cpf='12345678901',  # CPF duplicado
                email='outro@example.com',
                telefone='11666666666',
            )

    def test_str_method(self):
        """Teste método __str__"""
        inquilino_pf = Inquilino.objects.create(**self.inquilino_pf_data)
        inquilino_pj = Inquilino.objects.create(**self.inquilino_pj_data)

        self.assertIn('João Silva', str(inquilino_pf))
        self.assertIn('Empresa XYZ', str(inquilino_pj))

class InquilinoApartamentoModelTest(TestCase):
    def setUp(self):
        # Criar builder e apartamento
        self.builder = Builders.objects.create(
            name='Edifício Teste',
            street='Rua Teste',
            neighborhood='Bairro Teste',
            city='São Paulo',
            state='SP',
            zip_code='01000-000',
            country='Brasil'
        )

        self.apartamento = Aptos.objects.create(
            unit_number='101',
            building_name=self.builder,
            description='Apartamento teste',
            number_of_bedrooms=2,
            number_of_bathrooms=1,
            square_footage=60
        )

        self.inquilino = Inquilino.objects.create(
            tipo='PF',
            nome_completo='João Silva',
            cpf='12345678901',
            email='joao@example.com',
            telefone='11999999999'
        )

    def test_create_associacao(self):
        """Teste criação de associação inquilino-apartamento"""
        associacao = InquilinoApartamento.objects.create(
            inquilino=self.inquilino,
            apartamento=self.apartamento,
            data_inicio=date.today()
        )

        self.assertTrue(associacao.esta_ativo)
        self.assertEqual(associacao.inquilino, self.inquilino)
        self.assertEqual(associacao.apartamento, self.apartamento)

    def test_validacao_data_fim_anterior_inicio(self):
        """Teste validação de data fim anterior ao início"""
        with self.assertRaises(ValidationError):
            associacao = InquilinoApartamento(
                inquilino=self.inquilino,
                apartamento=self.apartamento,
                data_inicio=date.today(),
                data_fim=date.today() - timedelta(days=1)
            )
            associacao.full_clean()

    def test_validacao_sobreposicao_periodo(self):
        """Teste validação de sobreposição de períodos"""
        # Criar primeira associação
        InquilinoApartamento.objects.create(
            inquilino=self.inquilino,
            apartamento=self.apartamento,
            data_inicio=date.today(),
            data_fim=date.today() + timedelta(days=30)
        )

        # Tentar criar associação sobreposta
        with self.assertRaises(ValidationError):
            associacao = InquilinoApartamento(
                inquilino=self.inquilino,
                apartamento=self.apartamento,
                data_inicio=date.today() + timedelta(days=15),
                data_fim=date.today() + timedelta(days=45)
            )
            associacao.full_clean()

    def test_calculo_duracao_dias(self):
        """Teste cálculo de duração em dias"""
        associacao = InquilinoApartamento.objects.create(
            inquilino=self.inquilino,
            apartamento=self.apartamento,
            data_inicio=date.today() - timedelta(days=30),
            data_fim=date.today()
        )

        self.assertEqual(associacao.duracao_dias, 30)

    def test_calculo_duracao_meses(self):
        """Teste cálculo de duração em meses"""
        associacao = InquilinoApartamento.objects.create(
            inquilino=self.inquilino,
            apartamento=self.apartamento,
            data_inicio=date.today() - timedelta(days=60),
            data_fim=date.today()
        )

        # 60 dias / 30.44 ≈ 2.0 meses
        self.assertAlmostEqual(associacao.duracao_meses, 2.0, places=1)

    def test_finalizar_associacao(self):
        """Teste finalização de associação"""
        associacao = InquilinoApartamento.objects.create(
            inquilino=self.inquilino,
            apartamento=self.apartamento,
            data_inicio=date.today() - timedelta(days=30)
        )

        self.assertTrue(associacao.esta_ativo)

        associacao.finalizar_associacao()

        self.assertFalse(associacao.ativo)
        self.assertEqual(associacao.data_fim, date.today())
        self.assertFalse(associacao.esta_ativo)
```

### Testes de API
```python
# tests/test_api.py
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from aptos.models import Inquilino

class InquilinoAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)

        self.inquilino_data = {
            'tipo': 'PF',
            'nome_completo': 'João Silva',
            'cpf': '12345678901',
            'email': 'joao@example.com',
            'telefone': '11999999999'
        }

    def test_create_inquilino_api(self):
        """Teste criação de inquilino via API"""
        response = self.client.post('/api/v1/inquilinos/', self.inquilino_data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Inquilino.objects.count(), 1)

        inquilino = Inquilino.objects.first()
        self.assertEqual(inquilino.nome_completo, 'João Silva')

    def test_list_inquilinos_api(self):
        """Teste listagem de inquilinos via API"""
        Inquilino.objects.create(**self.inquilino_data)

        response = self.client.get('/api/v1/inquilinos/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_get_inquilino_detail_api(self):
        """Teste detalhes de inquilino via API"""
        inquilino = Inquilino.objects.create(**self.inquilino_data)

        response = self.client.get(f'/api/v1/inquilinos/{inquilino.id}/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['nome_completo'], 'João Silva')

    def test_update_inquilino_api(self):
        """Teste atualização de inquilino via API"""
        inquilino = Inquilino.objects.create(**self.inquilino_data)

        update_data = {'telefone': '11888888888'}
        response = self.client.patch(
            f'/api/v1/inquilinos/{inquilino.id}/',
            update_data
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        inquilino.refresh_from_db()
        self.assertEqual(inquilino.telefone, '11888888888')

    def test_delete_inquilino_api(self):
        """Teste exclusão de inquilino via API"""
        inquilino = Inquilino.objects.create(**self.inquilino_data)

        response = self.client.delete(f'/api/v1/inquilinos/{inquilino.id}/')

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Inquilino.objects.count(), 0)

    def test_search_inquilinos_api(self):
        """Teste busca de inquilinos via API"""
        Inquilino.objects.create(**self.inquilino_data)
        Inquilino.objects.create(
            tipo='PF',
            nome_completo='Maria Santos',
            cpf='98765432100',
            email='maria@example.com',
            telefone='11777777777'
        )

        response = self.client.get('/api/v1/inquilinos/?search=João')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['nome_completo'], 'João Silva')

    def test_filter_inquilinos_by_status_api(self):
        """Teste filtro por status via API"""
        inquilino = Inquilino.objects.create(**self.inquilino_data)
        inquilino.status = 'INATIVO'
        inquilino.save()

        Inquilino.objects.create(
            tipo='PF',
            nome_completo='Maria Santos',
            cpf='98765432100',
            email='maria@example.com',
            telefone='11777777777'
        )  # Status padrão: ATIVO

        response = self.client.get('/api/v1/inquilinos/?status=ATIVO')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['nome_completo'], 'Maria Santos')

    def test_alterar_status_api(self):
        """Teste alteração de status via API"""
        inquilino = Inquilino.objects.create(**self.inquilino_data)

        response = self.client.post(
            f'/api/v1/inquilinos/{inquilino.id}/alterar_status/',
            {'status': 'INADIMPLENTE', 'motivo': 'Teste de mudança de status'}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        inquilino.refresh_from_db()
        self.assertEqual(inquilino.status, 'INADIMPLENTE')

    def test_validation_errors_api(self):
        """Teste erros de validação via API"""
        invalid_data = {
            'tipo': 'PF',
            # nome_completo ausente (obrigatório para PF)
            'cpf': 'invalid_cpf',
            'email': 'invalid_email',
            'telefone': '11999999999'
        }

        response = self.client.post('/api/v1/inquilinos/', invalid_data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('nome_completo', response.data)
        self.assertIn('cpf', response.data)
        self.assertIn('email', response.data)

    def test_authentication_required(self):
        """Teste autenticação obrigatória"""
        self.client.force_authenticate(user=None)

        response = self.client.get('/api/v1/inquilinos/')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
```

### Testes de Validação
```python
# tests/test_validation.py
from django.test import TestCase
from django.core.exceptions import ValidationError
from aptos.validators import validar_cpf, validar_cnpj
from aptos.utils import formatar_cpf, formatar_cnpj

class ValidationTest(TestCase):
    def test_cpf_valido(self):
        """Teste validação de CPF válido"""
        cpfs_validos = [
            '11144477735',
            '12345678909',
            '00000000191'
        ]

        for cpf in cpfs_validos:
            try:
                resultado = validar_cpf(cpf)
                self.assertEqual(resultado, cpf)
            except ValidationError:
                self.fail(f"CPF {cpf} deveria ser válido")

    def test_cpf_invalido(self):
        """Teste validação de CPF inválido"""
        cpfs_invalidos = [
            '11111111111',  # Sequência igual
            '12345678901',  # Dígitos verificadores incorretos
            '123456789',    # Muito curto
            '123456789012', # Muito longo
            'abcdefghijk',  # Não numérico
        ]

        for cpf in cpfs_invalidos:
            with self.assertRaises(ValidationError):
                validar_cpf(cpf)

    def test_cnpj_valido(self):
        """Teste validação de CNPJ válido"""
        cnpjs_validos = [
            '11222333000181',
            '12345678000195'
        ]

        for cnpj in cnpjs_validos:
            try:
                resultado = validar_cnpj(cnpj)
                self.assertEqual(resultado, cnpj)
            except ValidationError:
                self.fail(f"CNPJ {cnpj} deveria ser válido")

    def test_cnpj_invalido(self):
        """Teste validação de CNPJ inválido"""
        cnpjs_invalidos = [
            '11111111111111',  # Sequência igual
            '12345678000100',  # Dígitos verificadores incorretos
            '1234567800019',   # Muito curto
            '123456780001950', # Muito longo
        ]

        for cnpj in cnpjs_invalidos:
            with self.assertRaises(ValidationError):
                validar_cnpj(cnpj)

    def test_formatacao_cpf(self):
        """Teste formatação de CPF"""
        self.assertEqual(formatar_cpf('12345678901'), '123.456.789-01')
        self.assertEqual(formatar_cpf('123.456.789-01'), '123.456.789-01')

    def test_formatacao_cnpj(self):
        """Teste formatação de CNPJ"""
        self.assertEqual(formatar_cnpj('12345678000195'), '12.345.678/0001-95')
        self.assertEqual(formatar_cnpj('12.345.678/0001-95'), '12.345.678/0001-95')
```

### Configuração pytest
```python
# pytest.ini
[tool:pytest]
DJANGO_SETTINGS_MODULE = tests.settings
python_files = tests.py test_*.py *_tests.py
addopts =
    --verbose
    --tb=short
    --cov=aptos
    --cov-report=html
    --cov-report=term-missing
    --cov-fail-under=90
    --reuse-db
```

### GitHub Actions CI
```yaml
# .github/workflows/tests.yml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3

    - name: Set up Python
      uses: actions/setup-python@v3
      with:
        python-version: '3.9'

    - name: Cache dependencies
      uses: actions/cache@v3
      with:
        path: ~/.cache/pip
        key: ${{ runner.os }}-pip-${{ hashFiles('**/requirements.txt') }}

    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
        pip install pytest pytest-django pytest-cov

    - name: Run tests
      env:
        DATABASE_URL: postgres://postgres:postgres@localhost/test_db
      run: |
        pytest

    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage.xml
        fail_ci_if_error: true
```

## Critérios de Sucesso
- [ ] Testes unitários cobrindo todos os modelos
- [ ] Testes de API para todos os endpoints
- [ ] Testes de validação CPF/CNPJ funcionando
- [ ] Cobertura de código > 90%
- [ ] CI/CD configurado e funcionando
- [ ] Testes de performance básicos
- [ ] Testes de conformidade LGPD
- [ ] Relatórios de cobertura gerados
- [ ] Todos os testes passando consistentemente
- [ ] Tempo de execução da suite < 5 minutos
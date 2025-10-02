"""
Configurações e fixtures globais para testes com pytest.

Este arquivo é carregado automaticamente pelo pytest e fornece
fixtures compartilhadas entre todos os testes.
"""
import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient


@pytest.fixture
def api_client():
    """Fixture que fornece um cliente de API."""
    return APIClient()


@pytest.fixture
def authenticated_client(db):
    """Fixture que fornece um cliente de API autenticado."""
    user = User.objects.create_user(
        username='testuser',
        password='testpass123',
        email='test@example.com'
    )

    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def test_user(db):
    """Fixture que fornece um usuário de teste."""
    return User.objects.create_user(
        username='testuser',
        password='testpass123',
        email='test@example.com'
    )


@pytest.fixture
def admin_user(db):
    """Fixture que fornece um usuário administrador."""
    return User.objects.create_superuser(
        username='admin',
        password='admin123',
        email='admin@example.com'
    )


@pytest.fixture
def inquilino_pf(db):
    """Fixture que fornece um inquilino pessoa física."""
    from aptos.tests.factories import InquilinoPFFactory
    return InquilinoPFFactory.create()


@pytest.fixture
def inquilino_pj(db):
    """Fixture que fornece um inquilino pessoa jurídica."""
    from aptos.tests.factories import InquilinoPJFactory
    return InquilinoPJFactory.create()


@pytest.fixture
def apartamento(db):
    """Fixture que fornece um apartamento."""
    from aptos.tests.factories import AptosFactory
    return AptosFactory.create()


@pytest.fixture
def builder(db):
    """Fixture que fornece um builder/edifício."""
    from aptos.tests.factories import BuilderFactory
    return BuilderFactory.create()


@pytest.fixture
def associacao_ativa(db, inquilino_pf, apartamento):
    """Fixture que fornece uma associação ativa."""
    from aptos.tests.factories import InquilinoApartamentoFactory
    return InquilinoApartamentoFactory.create(
        inquilino=inquilino_pf,
        apartamento=apartamento,
        ativo=True
    )


@pytest.fixture(autouse=True)
def enable_db_access_for_all_tests(db):
    """
    Habilita acesso ao banco de dados para todos os testes.

    Esta fixture é executada automaticamente (autouse=True) para
    garantir que todos os testes tenham acesso ao banco de dados.
    """
    pass


@pytest.fixture
def sample_inquilinos(db):
    """Fixture que cria múltiplos inquilinos de exemplo."""
    from aptos.tests.factories import InquilinoPFFactory, InquilinoPJFactory

    pf_inquilinos = InquilinoPFFactory.create_batch(3)
    pj_inquilinos = InquilinoPJFactory.create_batch(2)

    return {
        'pf': pf_inquilinos,
        'pj': pj_inquilinos,
        'all': pf_inquilinos + pj_inquilinos
    }


@pytest.fixture
def sample_apartamentos(db):
    """Fixture que cria múltiplos apartamentos de exemplo."""
    from aptos.tests.factories import AptosFactory

    return AptosFactory.create_batch(5)


def pytest_configure(config):
    """Configuração customizada do pytest."""
    # Configurar markers customizados
    config.addinivalue_line(
        "markers", "slow: marca testes como lentos"
    )
    config.addinivalue_line(
        "markers", "integration: marca testes de integração"
    )
    config.addinivalue_line(
        "markers", "unit: marca testes unitários"
    )
    config.addinivalue_line(
        "markers", "api: marca testes de API"
    )

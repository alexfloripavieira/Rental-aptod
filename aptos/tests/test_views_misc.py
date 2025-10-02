import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth.models import User

from aptos.tests.factories import (
    AptosFactory,
    BuilderFactory,
    InquilinoPFFactory,
    InquilinoApartamentoFactory,
    HistoricoStatusFactory,
)


@pytest.mark.django_db
def test_aptos_available_and_stats():
    # cria dois aptos, um disponível
    AptosFactory.create(is_available=True)
    AptosFactory.create(is_available=False)

    client = APIClient()

    # available
    url = reverse("aptos-available")
    r = client.get(url)
    assert r.status_code == status.HTTP_200_OK
    assert isinstance(r.json(), list)
    assert len(r.json()) == 1

    # stats
    url = reverse("aptos-stats")
    r = client.get(url)
    assert r.status_code == status.HTTP_200_OK
    data = r.json()
    assert "total" in data
    assert "average_price" in data


@pytest.mark.django_db
def test_builders_list_and_apartments():
    builder = BuilderFactory.create()
    # vincula aptos a este builder via factory
    AptosFactory.create(building_name=builder)

    client = APIClient()

    # list
    url = reverse("builders-list")
    r = client.get(url)
    assert r.status_code == status.HTTP_200_OK
    assert r.json()["count"] >= 1

    # apartments action
    url = reverse("builders-apartments", kwargs={"pk": builder.id})
    r = client.get(url)
    assert r.status_code == status.HTTP_200_OK
    assert isinstance(r.json(), list)
    assert len(r.json()) >= 1


@pytest.mark.django_db
def test_inquilinos_estatisticas_requires_admin():
    user = User.objects.create_superuser("admin", "admin@example.com", "pass")
    client = APIClient()
    client.force_authenticate(user=user)

    # cria alguns inquilinos e associações para alimentar métricas
    InquilinoPFFactory.create_batch(2)
    InquilinoApartamentoFactory.create()

    url = reverse("inquilinos-estatisticas")
    r = client.get(url)
    assert r.status_code == status.HTTP_200_OK
    data = r.json()
    assert "total_inquilinos" in data
    assert "taxa_ocupacao" in data


@pytest.mark.django_db
def test_status_historico_inquilino_query():
    hist = HistoricoStatusFactory.create()
    client = APIClient()

    url = reverse("status-historico-inquilino")
    r = client.get(url, {"inquilino_id": hist.inquilino.id})
    assert r.status_code == status.HTTP_200_OK
    assert isinstance(r.json(), list)


@pytest.mark.django_db
def test_relatorios_basic_json(monkeypatch):
    # autenticação exigida (IsAdminUser)
    user = User.objects.create_superuser("admin", "admin@example.com", "pass")
    client = APIClient()
    client.force_authenticate(user=user)

    # mocks para relatorio_service
    class DummyService:
        def gerar_relatorio_inquilinos_ativos(self, data_inicio=None, data_fim=None):
            return {"itens": []}

        def gerar_relatorio_ocupacao(self, data_inicio=None, data_fim=None):
            return {"resumo": {}, "historico": []}

        def gerar_relatorio_inadimplentes(self):
            return {"itens": []}

        def exportar_para_pdf(self, dados, titulo):
            import io
            return io.BytesIO(b"pdf")

        def exportar_para_excel(self, dados, titulo):
            import io
            return io.BytesIO(b"xlsx")

    import aptos.views as views_module

    monkeypatch.setattr(views_module, "relatorio_service", DummyService())

    # inquilinos_ativos
    url = reverse("relatorios-inquilinos-ativos")
    r = client.get(url)
    assert r.status_code == status.HTTP_200_OK
    assert "itens" in r.json()

    # ocupacao (json)
    url = reverse("relatorios-ocupacao")
    r = client.get(url)
    assert r.status_code == status.HTTP_200_OK

    # inadimplentes (json)
    url = reverse("relatorios-inadimplentes")
    r = client.get(url)
    assert r.status_code == status.HTTP_200_OK

    # métricas dashboard
    # criar dados mínimos
    AptosFactory.create()
    InquilinoPFFactory.create()
    url = reverse("relatorios-metricas-dashboard")
    r = client.get(url)
    assert r.status_code == status.HTTP_200_OK

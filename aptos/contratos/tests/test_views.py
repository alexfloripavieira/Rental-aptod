"""
Testes para as views de geracao de contratos.
"""
import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status as http_status

User = get_user_model()


@pytest.fixture
def api_client():
    """Cliente da API REST."""
    return APIClient()


@pytest.fixture
def usuario_comum(db):
    """Usuario comum (nao superuser)."""
    return User.objects.create_user(
        username='comum',
        password='senha123',
        is_superuser=False
    )


@pytest.fixture
def superuser(db):
    """Usuario superuser."""
    return User.objects.create_user(
        username='admin',
        password='senha123',
        is_superuser=True
    )


@pytest.fixture
def payload_contrato():
    """Payload de contrato valido."""
    return {
        'locador': {
            'nomeCompleto': 'Alexsander Vieira',
            'nacionalidade': 'brasileiro',
            'estadoCivil': 'casado',
            'profissao': 'analista de sistemas',
            'cpf': '908.833.149-91',
            'endereco': {
                'rua': 'Rua Bento Gonçalves',
                'numero': '183',
                'bairro': 'Centro',
                'cidade': 'Florianopolis',
                'estado': 'SC',
                'cep': '88010-080',
            }
        },
        'locatario': {
            'nomeCompleto': 'Felipe Nascimento',
            'nacionalidade': 'brasileiro',
            'profissao': 'assistente',
            'cpf': '063.857.409-94',
            'rg': '6.505.0271',
            'rgOrgao': 'SSP/SC',
            'enderecoCompleto': 'Avenida Max Schramm, 2700',
            'telefone': '(48) 99811-3393',
            'email': 'teste@gmail.com',
        },
        'contrato': {
            'dataInicio': '2025-08-05',
            'valorCaucao': '1700.00',
            'clausulaSegunda': 'O aluguel convencionado e de R$ 1.700,00 (Hum mil e setecentos reais) mensais, devendo ser pago ate o dia dez do mes vincendo, diretamente ao locador.',
        },
        'inventarioMoveis': 'armario de pia com tampo em granito, guarda-roupa, fogao eletrico Fischer duas bocas, geladeira',
    }


@pytest.mark.django_db
class TestGerarContratoView:
    """Testes para GerarContratoView."""

    def test_acesso_sem_autenticacao(self, api_client, payload_contrato):
        """Testa acesso sem autenticacao (deve retornar 403)."""
        url = reverse('gerar-contrato')
        response = api_client.post(url, payload_contrato, format='json')
        assert response.status_code == http_status.HTTP_403_FORBIDDEN

    def test_acesso_usuario_comum(self, api_client, usuario_comum, payload_contrato):
        """Testa acesso com usuario comum (deve retornar 403)."""
        api_client.force_authenticate(user=usuario_comum)
        url = reverse('gerar-contrato')
        response = api_client.post(url, payload_contrato, format='json')
        assert response.status_code == http_status.HTTP_403_FORBIDDEN

    def test_acesso_superuser_payload_valido(self, api_client, superuser, payload_contrato):
        """Testa acesso com superuser e payload valido (deve retornar 200 com PDF)."""
        api_client.force_authenticate(user=superuser)
        url = reverse('gerar-contrato')
        response = api_client.post(url, payload_contrato, format='json')

        assert response.status_code == http_status.HTTP_200_OK
        assert response['Content-Type'] == 'application/pdf'
        assert 'Content-Disposition' in response
        assert 'attachment' in response['Content-Disposition']
        assert 'contrato_locacao' in response['Content-Disposition']

    def test_payload_invalido_cpf(self, api_client, superuser, payload_contrato):
        """Testa payload com CPF invalido (deve retornar 400)."""
        api_client.force_authenticate(user=superuser)
        payload_contrato['locatario']['cpf'] = '000.000.000-00'

        url = reverse('gerar-contrato')
        response = api_client.post(url, payload_contrato, format='json')

        assert response.status_code == http_status.HTTP_400_BAD_REQUEST
        assert 'errors' in response.data

    def test_payload_campo_obrigatorio_faltando(self, api_client, superuser, payload_contrato):
        """Testa payload com campo obrigatorio faltando (deve retornar 400)."""
        api_client.force_authenticate(user=superuser)
        del payload_contrato['inventarioMoveis']

        url = reverse('gerar-contrato')
        response = api_client.post(url, payload_contrato, format='json')

        assert response.status_code == http_status.HTTP_400_BAD_REQUEST
        assert 'errors' in response.data
        assert 'inventarioMoveis' in response.data['errors']

    def test_nome_arquivo_pdf_correto(self, api_client, superuser, payload_contrato):
        """Testa se o nome do arquivo PDF e gerado corretamente."""
        api_client.force_authenticate(user=superuser)
        url = reverse('gerar-contrato')
        response = api_client.post(url, payload_contrato, format='json')

        assert response.status_code == http_status.HTTP_200_OK
        content_disposition = response['Content-Disposition']
        assert 'contrato_locacao_06385740994_2025-08-05.pdf' in content_disposition

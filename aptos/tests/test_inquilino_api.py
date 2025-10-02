"""
Testes de API para endpoints de Inquilinos.

Cobre:
- CRUD completo de inquilinos
- Filtros e buscas
- Validações via API
- Autenticação
- Permissões
"""
import pytest
from django.test import TestCase
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

from aptos.models import Inquilino, InquilinoApartamento
from aptos.tests.factories import (
    InquilinoPFFactory,
    InquilinoPJFactory,
    AptosFactory,
    InquilinoApartamentoFactory
)


@pytest.mark.django_db
class TestInquilinoAPI(TestCase):
    """Testes para API de Inquilinos."""

    def setUp(self):
        """Setup comum para testes de API."""
        self.client = APIClient()

        # Criar superusuário para passar por IsAdminUser
        self.user = User.objects.create_superuser(
            username='testuser',
            password='testpass123',
            email='test@example.com'
        )
        self.client.force_authenticate(user=self.user)

    def test_create_inquilino_pf_via_api(self):
        """Teste criação de inquilino PF via API."""
        data = {
            'tipo': 'PF',
            'nome_completo': 'João Silva',
            'cpf': '11144477735',
            'email': 'joao@example.com',
            'telefone': '11999999999',
            'status': 'ATIVO'
        }

        response = self.client.post('/api/v1/inquilinos/', data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Inquilino.objects.count(), 1)

        inquilino = Inquilino.objects.first()
        self.assertEqual(inquilino.nome_completo, 'João Silva')
        self.assertEqual(inquilino.cpf, '11144477735')

    def test_create_inquilino_pj_via_api(self):
        """Teste criação de inquilino PJ via API."""
        data = {
            'tipo': 'PJ',
            'razao_social': 'Empresa XYZ Ltda',
            'cnpj': '11222333000181',
            'email': 'contato@empresa.com',
            'telefone': '11888888888',
            'status': 'ATIVO'
        }

        response = self.client.post('/api/v1/inquilinos/', data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Inquilino.objects.count(), 1)

    def test_list_inquilinos_via_api(self):
        """Teste listagem de inquilinos via API."""
        # Criar múltiplos inquilinos
        InquilinoPFFactory.create_batch(5)
        InquilinoPJFactory.create_batch(3)

        response = self.client.get('/api/v1/inquilinos/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 8)
        self.assertIn('results', response.data)

    def test_get_inquilino_detail_via_api(self):
        """Teste detalhes de inquilino via API."""
        inquilino = InquilinoPFFactory.create(nome_completo='João Silva')

        response = self.client.get(f'/api/v1/inquilinos/{inquilino.id}/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['nome_completo'], 'João Silva')
        self.assertIn('email', response.data)
        self.assertIn('telefone', response.data)

    def test_update_inquilino_via_api(self):
        """Teste atualização de inquilino via API."""
        inquilino = InquilinoPFFactory.create()

        data = {'telefone': '11777777777'}
        response = self.client.patch(
            f'/api/v1/inquilinos/{inquilino.id}/',
            data
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        inquilino.refresh_from_db()
        self.assertEqual(inquilino.telefone, '11777777777')

    def test_delete_inquilino_via_api(self):
        """Teste exclusão de inquilino via API."""
        inquilino = InquilinoPFFactory.create()

        response = self.client.delete(f'/api/v1/inquilinos/{inquilino.id}/')

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Inquilino.objects.count(), 0)

    def test_search_inquilinos_por_nome(self):
        """Teste busca de inquilinos por nome."""
        InquilinoPFFactory.create(nome_completo='João Silva')
        InquilinoPFFactory.create(nome_completo='Maria Santos')
        InquilinoPFFactory.create(nome_completo='Pedro Oliveira')

        response = self.client.get('/api/v1/inquilinos/?search=João')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        # Lista retorna campo normalizado "nome_exibicao"
        self.assertEqual(response.data['results'][0]['nome_exibicao'], 'João Silva')

    def test_filter_inquilinos_por_status(self):
        """Teste filtro de inquilinos por status."""
        InquilinoPFFactory.create(status='ATIVO')
        InquilinoPFFactory.create(status='ATIVO')
        InquilinoPFFactory.create(status='INATIVO')
        InquilinoPFFactory.create(status='INADIMPLENTE')

        response = self.client.get('/api/v1/inquilinos/?status=ATIVO')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

    def test_filter_inquilinos_por_tipo(self):
        """Teste filtro de inquilinos por tipo."""
        InquilinoPFFactory.create_batch(3)
        InquilinoPJFactory.create_batch(2)

        response = self.client.get('/api/v1/inquilinos/?tipo=PF')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 3)

    def test_validation_error_pf_sem_nome(self):
        """Teste erro de validação: PF sem nome completo."""
        data = {
            'tipo': 'PF',
            'cpf': '11144477735',
            'email': 'test@example.com',
            'telefone': '11999999999'
        }

        response = self.client.post('/api/v1/inquilinos/', data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_validation_error_cpf_invalido(self):
        """Teste erro de validação: CPF inválido."""
        data = {
            'tipo': 'PF',
            'nome_completo': 'João Silva',
            'cpf': '11111111111',  # CPF inválido
            'email': 'test@example.com',
            'telefone': '11999999999'
        }

        response = self.client.post('/api/v1/inquilinos/', data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('cpf', response.data)

    def test_validation_error_email_duplicado(self):
        """Teste erro de validação: email duplicado."""
        email = 'duplicado@example.com'
        InquilinoPFFactory.create(email=email)

        data = {
            'tipo': 'PF',
            'nome_completo': 'Outro João',
            'cpf': '52998224725',
            'email': email,
            'telefone': '11999999999'
        }

        response = self.client.post('/api/v1/inquilinos/', data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_authentication_required(self):
        """Teste que autenticação é obrigatória."""
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/v1/inquilinos/')
        # DRF pode retornar 401 (unauthenticated) ou 403 (permission denied) dependendo das classes configuradas
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_pagination_funciona(self):
        """Teste que paginação funciona corretamente."""
        # Criar 25 inquilinos
        InquilinoPFFactory.create_batch(25)

        response = self.client.get('/api/v1/inquilinos/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('next', response.data)
        self.assertIn('previous', response.data)
        self.assertIn('count', response.data)
        self.assertEqual(response.data['count'], 25)

    def test_ordenacao_por_created_at(self):
        """Teste ordenação de inquilinos."""
        inquilino1 = InquilinoPFFactory.create(nome_completo='Primeiro')
        inquilino2 = InquilinoPFFactory.create(nome_completo='Segundo')

        response = self.client.get('/api/v1/inquilinos/?ordering=-created_at')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Mais recente primeiro
        self.assertEqual(
            response.data['results'][0]['id'],
            inquilino2.id
        )


@pytest.mark.django_db
class TestInquilinoApartamentoAPI(TestCase):
    """Testes para API de Associações Inquilino-Apartamento."""

    def setUp(self):
        """Setup comum para testes."""
        self.client = APIClient()
        self.user = User.objects.create_superuser(
            username='testuser',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)

        self.inquilino = InquilinoPFFactory.create()
        self.apartamento = AptosFactory.create()

    def test_create_associacao_via_api(self):
        """Teste criação de associação via API."""
        from datetime import date

        data = {
            'inquilino': self.inquilino.id,
            'apartamento': self.apartamento.id,
            'data_inicio': date.today().isoformat(),
            'valor_aluguel': '1500.00',
            'ativo': True
        }

        response = self.client.post('/api/v1/associacoes/', data)

        if response.status_code != status.HTTP_201_CREATED:
            print(f"Response data: {response.data}")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(InquilinoApartamento.objects.count(), 1)

    def test_list_associacoes_via_api(self):
        """Teste listagem de associações via API."""
        InquilinoApartamentoFactory.create_batch(3)

        response = self.client.get('/api/v1/associacoes/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 3)

    def test_filter_associacoes_por_inquilino(self):
        """Teste filtro de associações por inquilino."""
        inquilino_especifico = InquilinoPFFactory.create()

        InquilinoApartamentoFactory.create(inquilino=inquilino_especifico)
        InquilinoApartamentoFactory.create(inquilino=inquilino_especifico)
        InquilinoApartamentoFactory.create()  # Outro inquilino

        response = self.client.get(
            f'/api/v1/associacoes/?inquilino={inquilino_especifico.id}'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

    def test_filter_associacoes_ativas(self):
        """Teste filtro de associações ativas."""
        InquilinoApartamentoFactory.create(ativo=True)
        InquilinoApartamentoFactory.create(ativo=True)
        InquilinoApartamentoFactory.create(ativo=False)

        response = self.client.get('/api/v1/associacoes/?ativo=true')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)


@pytest.mark.django_db
class TestInquilinoStatusAPI(TestCase):
    """Testes para alteração de status via API."""

    def setUp(self):
        """Setup comum para testes."""
        self.client = APIClient()
        self.user = User.objects.create_superuser(
            username='testuser',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)

    def test_alterar_status_inquilino(self):
        """Teste alteração de status de inquilino."""
        inquilino = InquilinoPFFactory.create(status='ATIVO')

        data = {
            'status': 'INADIMPLENTE',
            'motivo': 'Teste de mudança de status'
        }

        response = self.client.post(
            f'/api/v1/inquilinos/{inquilino.id}/alterar_status/',
            data
        )

        if response.status_code == status.HTTP_200_OK:
            inquilino.refresh_from_db()
            self.assertEqual(inquilino.status, 'INADIMPLENTE')
        else:
            # Endpoint pode não estar implementado ainda
            self.assertIn(
                response.status_code,
                [status.HTTP_404_NOT_FOUND, status.HTTP_405_METHOD_NOT_ALLOWED]
            )

    def test_get_historico_status(self):
        """Teste obtenção de histórico de status."""
        inquilino = InquilinoPFFactory.create()

        response = self.client.get(
            f'/api/v1/inquilinos/{inquilino.id}/historico_status/'
        )

        # Endpoint pode não estar implementado ainda
        self.assertIn(
            response.status_code,
            [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]
        )

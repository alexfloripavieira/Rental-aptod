"""
Testes para o sistema de gestão de status de inquilinos
"""
from django.test import TestCase
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from rest_framework.test import APIClient
from rest_framework import status
from .models import Inquilino, HistoricoStatus, StatusInquilino, RegraStatus


class StatusManagementTestCase(TestCase):
    """Testes para gestão de status de inquilinos"""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

        self.inquilino = Inquilino.objects.create(
            tipo='PF',
            nome_completo='João Silva',
            cpf='11144477735',  # CPF válido para testes
            email='joao@example.com',
            telefone='11999999999',
            status='ATIVO'
        )

    def test_transition_valid_status(self):
        """Testa transição válida de status"""
        status_manager = StatusInquilino.objects

        # Transição de ATIVO para INADIMPLENTE deve ser válida
        resultado = status_manager.transition_to(
            inquilino=self.inquilino,
            novo_status='INADIMPLENTE',
            motivo='Teste de transição',
            usuario=self.user
        )

        self.assertEqual(resultado.status, 'INADIMPLENTE')

        # Verificar se histórico foi criado
        historico = HistoricoStatus.objects.filter(inquilino=self.inquilino).first()
        self.assertIsNotNone(historico)
        self.assertEqual(historico.status_anterior, 'ATIVO')
        self.assertEqual(historico.status_novo, 'INADIMPLENTE')

    def test_transition_invalid_status(self):
        """Testa transição inválida de status"""
        status_manager = StatusInquilino.objects

        # Transição de ATIVO para ATIVO deve ser inválida
        with self.assertRaises(ValueError):
            status_manager.transition_to(
                inquilino=self.inquilino,
                novo_status='ATIVO',  # Mesmo status atual
                motivo='Teste inválido',
                usuario=self.user
            )

    def test_can_transition_rules(self):
        """Testa regras de transição de status"""
        status_manager = StatusInquilino.objects

        # Testes de transições válidas
        self.assertTrue(status_manager.can_transition('ATIVO', 'INADIMPLENTE'))
        self.assertTrue(status_manager.can_transition('ATIVO', 'BLOQUEADO'))
        self.assertTrue(status_manager.can_transition('INADIMPLENTE', 'ATIVO'))

        # Testes de transições inválidas
        self.assertFalse(status_manager.can_transition('ATIVO', 'ATIVO'))
        self.assertFalse(status_manager.can_transition('BLOQUEADO', 'INADIMPLENTE'))

    def test_regra_status_creation(self):
        """Testa criação de regra de status"""
        regra = RegraStatus.objects.create(
            nome='Teste Inadimplência',
            descricao='Regra de teste para inadimplência',
            criterio='DIAS_SEM_PAGAMENTO',
            parametros={'dias_limite': 30},
            acao='INADIMPLENTE',
            ativa=True,
            automatica=True
        )

        self.assertEqual(regra.nome, 'Teste Inadimplência')
        self.assertTrue(regra.ativa)
        self.assertTrue(regra.automatica)

    def test_historico_status_serializer_fields(self):
        """Testa se o modelo HistoricoStatus tem todos os campos necessários"""
        # Criar histórico
        historico = HistoricoStatus.objects.create(
            inquilino=self.inquilino,
            status_anterior='ATIVO',
            status_novo='INADIMPLENTE',
            motivo='Teste',
            categoria_motivo='MANUAL',
            usuario=self.user,
            ip_address='127.0.0.1',
            user_agent='Test Agent'
        )

        # Verificar se todos os campos foram salvos
        self.assertEqual(historico.status_anterior, 'ATIVO')
        self.assertEqual(historico.status_novo, 'INADIMPLENTE')
        self.assertEqual(historico.categoria_motivo, 'MANUAL')
        self.assertEqual(historico.ip_address, '127.0.0.1')
        self.assertEqual(historico.user_agent, 'Test Agent')
        self.assertIsNotNone(historico.timestamp)


class StatusAPITestCase(TestCase):
    """Testes para API de gestão de status"""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

        self.inquilino = Inquilino.objects.create(
            tipo='PF',
            nome_completo='João Silva',
            cpf='11144477735',  # CPF válido para testes
            email='joao@example.com',
            telefone='11999999999',
            status='ATIVO'
        )

        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_historico_inquilino_endpoint(self):
        """Testa endpoint de histórico de inquilino"""
        # Criar um histórico
        HistoricoStatus.objects.create(
            inquilino=self.inquilino,
            status_anterior='ATIVO',
            status_novo='INADIMPLENTE',
            motivo='Teste API',
            usuario=self.user
        )

        response = self.client.get(f'/api/v1/status/historico_inquilino/?inquilino_id={self.inquilino.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_relatorio_status_endpoint(self):
        """Testa endpoint de relatório de status"""
        response = self.client.get('/api/v1/status/relatorio_status/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verificar se retorna as chaves esperadas
        expected_keys = ['distribuicao_atual', 'mudancas_ultimo_mes', 'top_motivos', 'total_inquilinos', 'ativos', 'inadimplentes']
        for key in expected_keys:
            self.assertIn(key, response.data)
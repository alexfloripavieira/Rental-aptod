"""
Testes para modelo InquilinoApartamento.

Cobre:
- Criação de associações
- Validações de períodos
- Sobreposição de períodos
- Sincronização de disponibilidade
- Métodos de duração
"""
import pytest
from django.test import TestCase
from django.core.exceptions import ValidationError
from datetime import date, timedelta

from aptos.models import InquilinoApartamento
from aptos.tests.factories import (
    InquilinoPFFactory,
    AptosFactory,
    InquilinoApartamentoFactory
)


@pytest.mark.django_db
class TestInquilinoApartamentoModel(TestCase):
    """Testes para modelo InquilinoApartamento."""

    def setUp(self):
        """Setup comum para testes."""
        self.inquilino = InquilinoPFFactory.create()
        self.apartamento = AptosFactory.create()

    def test_create_associacao_valida(self):
        """Teste criação de associação válida."""
        associacao = InquilinoApartamento.objects.create(
            inquilino=self.inquilino,
            apartamento=self.apartamento,
            data_inicio=date.today(),
            valor_aluguel=1500.00
        )

        self.assertEqual(associacao.inquilino, self.inquilino)
        self.assertEqual(associacao.apartamento, self.apartamento)
        self.assertTrue(associacao.ativo)
        self.assertTrue(associacao.esta_ativo)

    def test_data_fim_anterior_inicio_invalida(self):
        """Teste validação: data fim não pode ser anterior ao início."""
        with self.assertRaises(ValidationError) as context:
            associacao = InquilinoApartamento(
                inquilino=self.inquilino,
                apartamento=self.apartamento,
                data_inicio=date.today(),
                data_fim=date.today() - timedelta(days=1)
            )
            associacao.full_clean()

        self.assertIn('Data de início deve ser anterior', str(context.exception))

    def test_data_inicio_muito_futura_invalida(self):
        """Teste validação: data início não pode ser muito distante no futuro."""
        with self.assertRaises(ValidationError) as context:
            associacao = InquilinoApartamento(
                inquilino=self.inquilino,
                apartamento=self.apartamento,
                data_inicio=date.today() + timedelta(days=400)
            )
            associacao.full_clean()

        self.assertIn('não pode ser superior a 1 ano', str(context.exception))

    def test_sobreposicao_periodo_invalida(self):
        """Teste validação: não pode sobrepor períodos ativos."""
        # Criar primeira associação
        InquilinoApartamento.objects.create(
            inquilino=self.inquilino,
            apartamento=self.apartamento,
            data_inicio=date.today(),
            data_fim=date.today() + timedelta(days=30),
            ativo=True
        )

        # Tentar criar associação sobreposta
        with self.assertRaises(ValidationError) as context:
            associacao = InquilinoApartamento(
                inquilino=InquilinoPFFactory.create(),
                apartamento=self.apartamento,
                data_inicio=date.today() + timedelta(days=15),
                data_fim=date.today() + timedelta(days=45),
                ativo=True
            )
            associacao.full_clean()

        self.assertIn('Período conflita', str(context.exception))

    def test_associacao_inquilino_bloqueado_invalida(self):
        """Teste validação: inquilino bloqueado não pode ser associado."""
        inquilino_bloqueado = InquilinoPFFactory.create(status='BLOQUEADO')

        with self.assertRaises(ValidationError) as context:
            associacao = InquilinoApartamento(
                inquilino=inquilino_bloqueado,
                apartamento=self.apartamento,
                data_inicio=date.today()
            )
            associacao.full_clean()

        self.assertIn('bloqueado não pode ser associado', str(context.exception))

    def test_property_duracao_dias(self):
        """Teste cálculo de duração em dias."""
        associacao = InquilinoApartamento.objects.create(
            inquilino=self.inquilino,
            apartamento=self.apartamento,
            data_inicio=date.today() - timedelta(days=30),
            data_fim=date.today()
        )

        self.assertEqual(associacao.duracao_dias, 30)

    def test_property_duracao_dias_sem_fim(self):
        """Teste duração em dias para associação sem data fim."""
        dias_passados = 45
        associacao = InquilinoApartamento.objects.create(
            inquilino=self.inquilino,
            apartamento=self.apartamento,
            data_inicio=date.today() - timedelta(days=dias_passados)
        )

        self.assertEqual(associacao.duracao_dias, dias_passados)

    def test_property_duracao_meses(self):
        """Teste cálculo de duração em meses."""
        associacao = InquilinoApartamento.objects.create(
            inquilino=self.inquilino,
            apartamento=self.apartamento,
            data_inicio=date.today() - timedelta(days=60),
            data_fim=date.today()
        )

        # 60 dias / 30.44 ≈ 2.0 meses
        self.assertAlmostEqual(associacao.duracao_meses, 2.0, places=1)

    def test_property_esta_ativo_true(self):
        """Teste property esta_ativo para associação ativa."""
        associacao = InquilinoApartamento.objects.create(
            inquilino=self.inquilino,
            apartamento=self.apartamento,
            data_inicio=date.today() - timedelta(days=10),
            ativo=True
        )

        self.assertTrue(associacao.esta_ativo)

    def test_property_esta_ativo_false_data_fim(self):
        """Teste property esta_ativo para associação com data fim passada."""
        associacao = InquilinoApartamento.objects.create(
            inquilino=self.inquilino,
            apartamento=self.apartamento,
            data_inicio=date.today() - timedelta(days=60),
            data_fim=date.today() - timedelta(days=1),
            ativo=True
        )

        self.assertFalse(associacao.esta_ativo)

    def test_property_esta_ativo_false_futuro(self):
        """Teste property esta_ativo para associação futura."""
        associacao = InquilinoApartamento.objects.create(
            inquilino=self.inquilino,
            apartamento=self.apartamento,
            data_inicio=date.today() + timedelta(days=10),
            ativo=True
        )

        self.assertFalse(associacao.esta_ativo)

    def test_finalizar_associacao(self):
        """Teste método finalizar_associacao."""
        associacao = InquilinoApartamento.objects.create(
            inquilino=self.inquilino,
            apartamento=self.apartamento,
            data_inicio=date.today() - timedelta(days=30)
        )

        self.assertTrue(associacao.esta_ativo)
        self.assertTrue(associacao.ativo)

        associacao.finalizar_associacao()

        self.assertFalse(associacao.ativo)
        self.assertEqual(associacao.data_fim, date.today())
        self.assertFalse(associacao.esta_ativo)

    def test_finalizar_associacao_com_data_especifica(self):
        """Teste finalizar associação com data específica."""
        associacao = InquilinoApartamento.objects.create(
            inquilino=self.inquilino,
            apartamento=self.apartamento,
            data_inicio=date.today() - timedelta(days=30)
        )

        data_fim_custom = date.today() - timedelta(days=5)
        associacao.finalizar_associacao(data_fim=data_fim_custom)

        self.assertEqual(associacao.data_fim, data_fim_custom)
        self.assertFalse(associacao.ativo)

    def test_sync_apartamento_disponibilidade_ocupado(self):
        """Teste sincronização de disponibilidade: apartamento ocupado."""
        # Apartamento inicia disponível
        self.assertTrue(self.apartamento.is_available)

        # Criar associação ativa
        InquilinoApartamento.objects.create(
            inquilino=self.inquilino,
            apartamento=self.apartamento,
            data_inicio=date.today(),
            ativo=True
        )

        # Recarregar apartamento
        self.apartamento.refresh_from_db()

        # Apartamento deve ficar indisponível
        self.assertFalse(self.apartamento.is_available)

    def test_sync_apartamento_disponibilidade_desocupado(self):
        """Teste sincronização: apartamento volta a ficar disponível."""
        # Criar associação ativa
        associacao = InquilinoApartamento.objects.create(
            inquilino=self.inquilino,
            apartamento=self.apartamento,
            data_inicio=date.today(),
            ativo=True
        )

        self.apartamento.refresh_from_db()
        self.assertFalse(self.apartamento.is_available)

        # Finalizar associação
        associacao.finalizar_associacao()

        self.apartamento.refresh_from_db()
        # Apartamento deve voltar a ficar disponível
        self.assertTrue(self.apartamento.is_available)

    def test_str_method(self):
        """Teste método __str__."""
        associacao = InquilinoApartamento.objects.create(
            inquilino=self.inquilino,
            apartamento=self.apartamento,
            data_inicio=date.today()
        )

        str_repr = str(associacao)
        self.assertIn('Ativo', str_repr)

        associacao.finalizar_associacao()
        str_repr = str(associacao)
        self.assertIn('Finalizado', str_repr)

    def test_constraint_unico_apartamento_ativo(self):
        """Teste constraint: apenas uma associação ativa por apartamento."""
        # Criar primeira associação ativa
        InquilinoApartamento.objects.create(
            inquilino=self.inquilino,
            apartamento=self.apartamento,
            data_inicio=date.today(),
            ativo=True
        )

        # Tentar criar segunda associação ativa no mesmo apartamento
        outro_inquilino = InquilinoPFFactory.create()

        with self.assertRaises(ValidationError):
            associacao2 = InquilinoApartamento(
                inquilino=outro_inquilino,
                apartamento=self.apartamento,
                data_inicio=date.today(),
                ativo=True
            )
            associacao2.full_clean()

    def test_multiplas_associacoes_inativas_permitidas(self):
        """Teste: múltiplas associações inativas são permitidas."""
        # Criar duas associações inativas
        InquilinoApartamento.objects.create(
            inquilino=self.inquilino,
            apartamento=self.apartamento,
            data_inicio=date.today() - timedelta(days=60),
            data_fim=date.today() - timedelta(days=30),
            ativo=False
        )

        outro_inquilino = InquilinoPFFactory.create()
        InquilinoApartamento.objects.create(
            inquilino=outro_inquilino,
            apartamento=self.apartamento,
            data_inicio=date.today() - timedelta(days=30),
            data_fim=date.today(),
            ativo=False
        )

        # Não deve lançar exceção
        associacoes = InquilinoApartamento.objects.filter(
            apartamento=self.apartamento,
            ativo=False
        )
        self.assertEqual(associacoes.count(), 2)

    def test_auditoria_timestamps(self):
        """Teste campos de auditoria."""
        associacao = InquilinoApartamentoFactory.create()

        self.assertIsNotNone(associacao.created_at)
        self.assertIsNotNone(associacao.updated_at)
        self.assertEqual(associacao.created_at.date(), date.today())

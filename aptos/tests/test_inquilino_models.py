"""
Testes unitários para modelos do sistema de Inquilinos.

Cobre:
- Modelo Inquilino (PF e PJ)
- Validações de CPF/CNPJ
- Constraints de unicidade
- Métodos e properties
"""
import pytest
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.db.utils import IntegrityError
from datetime import date

from aptos.models import Inquilino
from aptos.tests.factories import InquilinoPFFactory, InquilinoPJFactory, BuilderFactory, AptosFactory


@pytest.mark.django_db
class TestInquilinoModel(TestCase):
    """Testes para modelo Inquilino."""

    def test_create_inquilino_pf_valido(self):
        """Teste criação de inquilino pessoa física válido."""
        inquilino = InquilinoPFFactory.create()

        self.assertEqual(inquilino.tipo, 'PF')
        self.assertIsNotNone(inquilino.nome_completo)
        self.assertIsNotNone(inquilino.cpf)
        self.assertEqual(inquilino.status, 'ATIVO')
        self.assertIsNotNone(inquilino.email)

    def test_create_inquilino_pj_valido(self):
        """Teste criação de inquilino pessoa jurídica válido."""
        inquilino = InquilinoPJFactory.create()

        self.assertEqual(inquilino.tipo, 'PJ')
        self.assertIsNotNone(inquilino.razao_social)
        self.assertIsNotNone(inquilino.cnpj)
        self.assertEqual(inquilino.status, 'ATIVO')

    def test_inquilino_pf_sem_nome_completo_invalido(self):
        """Teste validação: PF deve ter nome completo."""
        with self.assertRaises(ValidationError) as context:
            inquilino = Inquilino(
                tipo='PF',
                cpf='11144477735',
                email='test@example.com',
                telefone='11999999999'
            )
            inquilino.full_clean()

        self.assertIn('Nome completo é obrigatório', str(context.exception))

    def test_inquilino_pf_sem_cpf_invalido(self):
        """Teste validação: PF deve ter CPF."""
        with self.assertRaises(ValidationError) as context:
            inquilino = Inquilino(
                tipo='PF',
                nome_completo='João Silva',
                email='test@example.com',
                telefone='11999999999'
            )
            inquilino.full_clean()

        self.assertIn('CPF é obrigatório', str(context.exception))

    def test_inquilino_pj_sem_razao_social_invalido(self):
        """Teste validação: PJ deve ter razão social."""
        with self.assertRaises(ValidationError) as context:
            inquilino = Inquilino(
                tipo='PJ',
                cnpj='11222333000181',
                email='test@example.com',
                telefone='11999999999'
            )
            inquilino.full_clean()

        self.assertIn('Razão social é obrigatória', str(context.exception))

    def test_inquilino_pj_sem_cnpj_invalido(self):
        """Teste validação: PJ deve ter CNPJ."""
        with self.assertRaises(ValidationError) as context:
            inquilino = Inquilino(
                tipo='PJ',
                razao_social='Empresa XYZ Ltda',
                email='test@example.com',
                telefone='11999999999'
            )
            inquilino.full_clean()

        self.assertIn('CNPJ é obrigatório', str(context.exception))

    def test_email_unico(self):
        """Teste constraint de email único."""
        email_duplicado = 'duplicado_unique_test@example.com'

        Inquilino.objects.create(
            tipo='PF',
            nome_completo='Primeiro Inquilino',
            cpf='11144477735',
            email=email_duplicado,
            telefone='11999999999'
        )

        # full_clean() no modelo levanta ValidationError antes do save()
        with self.assertRaises((IntegrityError, ValidationError)):
            Inquilino.objects.create(
                tipo='PJ',
                razao_social='Segunda Empresa',
                cnpj='11222333000181',
                email=email_duplicado,
                telefone='11888888888'
            )

    def test_cpf_unico(self):
        """Teste constraint de CPF único."""
        cpf_duplicado = '52998224725'

        Inquilino.objects.create(
            tipo='PF',
            nome_completo='Primeiro João',
            cpf=cpf_duplicado,
            email='primeiro_cpf_test@example.com',
            telefone='11999999991'
        )

        # full_clean() no modelo levanta ValidationError antes do save()
        with self.assertRaises((IntegrityError, ValidationError)):
            Inquilino.objects.create(
                tipo='PF',
                nome_completo='Outro João',
                cpf=cpf_duplicado,
                email='segundo_cpf_test@example.com',
                telefone='11888888888'
            )

    def test_cnpj_unico(self):
        """Teste constraint de CNPJ único."""
        cnpj_duplicado = '06990590000123'

        Inquilino.objects.create(
            tipo='PJ',
            razao_social='Primeira Empresa',
            cnpj=cnpj_duplicado,
            email='primeira_empresa_test@example.com',
            telefone='11999999992'
        )

        # full_clean() no modelo levanta ValidationError antes do save()
        with self.assertRaises((IntegrityError, ValidationError)):
            Inquilino.objects.create(
                tipo='PJ',
                razao_social='Outra Empresa',
                cnpj=cnpj_duplicado,
                email='segunda_empresa_test@example.com',
                telefone='11888888888'
            )

    def test_str_method_pf(self):
        """Teste método __str__ para PF."""
        inquilino = InquilinoPFFactory.create(
            nome_completo='João Silva',
            cpf='11144477735'
        )

        self.assertIn('João Silva', str(inquilino))
        self.assertIn('11144477735', str(inquilino))

    def test_str_method_pj(self):
        """Teste método __str__ para PJ."""
        inquilino = InquilinoPJFactory.create(
            razao_social='Empresa XYZ Ltda',
            cnpj='11222333000181'
        )

        self.assertIn('Empresa XYZ', str(inquilino))
        self.assertIn('11222333000181', str(inquilino))

    def test_property_identificacao_pf(self):
        """Teste property identificacao para PF."""
        inquilino = InquilinoPFFactory.create(cpf='11144477735')
        self.assertEqual(inquilino.identificacao, '11144477735')

    def test_property_identificacao_pj(self):
        """Teste property identificacao para PJ."""
        inquilino = InquilinoPJFactory.create(cnpj='11222333000181')
        self.assertEqual(inquilino.identificacao, '11222333000181')

    def test_property_nome_principal_pf(self):
        """Teste property nome_principal para PF."""
        inquilino = InquilinoPFFactory.create(nome_completo='João Silva')
        self.assertEqual(inquilino.nome_principal, 'João Silva')

    def test_property_nome_principal_pj(self):
        """Teste property nome_principal para PJ."""
        inquilino = InquilinoPJFactory.create(razao_social='Empresa XYZ Ltda')
        self.assertEqual(inquilino.nome_principal, 'Empresa XYZ Ltda')

    def test_cpf_formatado(self):
        """Teste formatação de CPF."""
        inquilino = InquilinoPFFactory.create(cpf='11144477735')
        # Limpar documento armazena sem formatação, property formata
        self.assertEqual(inquilino.cpf, '11144477735')

    def test_get_apartamentos_ativos(self):
        """Teste método get_apartamentos_ativos."""
        from aptos.tests.factories import InquilinoApartamentoFactory

        inquilino = InquilinoPFFactory.create()

        # Criar associação ativa
        associacao_ativa = InquilinoApartamentoFactory.create(
            inquilino=inquilino,
            ativo=True,
            data_fim=None
        )

        # Criar associação inativa
        InquilinoApartamentoFactory.create(
            inquilino=inquilino,
            ativo=False,
            data_fim=date.today()
        )

        apartamentos_ativos = inquilino.get_apartamentos_ativos()
        self.assertEqual(apartamentos_ativos.count(), 1)
        self.assertEqual(apartamentos_ativos.first(), associacao_ativa.apartamento)

    def test_get_historico_locacoes(self):
        """Teste método get_historico_locacoes."""
        from aptos.tests.factories import InquilinoApartamentoFactory

        inquilino = InquilinoPFFactory.create()

        # Criar 3 associações
        for _ in range(3):
            InquilinoApartamentoFactory.create(inquilino=inquilino)

        historico = inquilino.get_historico_locacoes()
        self.assertEqual(historico.count(), 3)
        # Verifica ordenação por data_inicio (decrescente)
        self.assertGreaterEqual(
            historico[0].data_inicio,
            historico[1].data_inicio
        )

    def test_status_choices(self):
        """Teste diferentes status de inquilino."""
        status_options = ['ATIVO', 'INATIVO']  # Testar com 2 status usando os 2 CPFs válidos

        for i, status in enumerate(status_options):
            inquilino = InquilinoPFFactory.create(
                status=status,
                cpf=['11144477735', '52998224725'][i],
                email=f'status_test_unique_{i}@example.com'
            )
            self.assertEqual(inquilino.status, status)

        # Testar os outros status também
        inq_inadimplente = InquilinoPJFactory.create(status='INADIMPLENTE', cnpj='11222333000181', email='inadimplente@test.com')
        self.assertEqual(inq_inadimplente.status, 'INADIMPLENTE')

        inq_bloqueado = InquilinoPJFactory.create(status='BLOQUEADO', cnpj='06990590000123', email='bloqueado@test.com')
        self.assertEqual(inq_bloqueado.status, 'BLOQUEADO')

    def test_campos_opcionais_pf(self):
        """Teste campos opcionais de pessoa física."""
        inquilino = InquilinoPFFactory.create(
            rg='123456789',
            estado_civil='Solteiro',
            profissao='Engenheiro',
            renda=5000.00,
            observacoes='Teste de observações'
        )

        self.assertEqual(inquilino.rg, '123456789')
        self.assertEqual(inquilino.estado_civil, 'Solteiro')
        self.assertEqual(inquilino.profissao, 'Engenheiro')
        self.assertEqual(float(inquilino.renda), 5000.00)
        self.assertEqual(inquilino.observacoes, 'Teste de observações')

    def test_campos_opcionais_pj(self):
        """Teste campos opcionais de pessoa jurídica."""
        inquilino = InquilinoPJFactory.create(
            nome_fantasia='Empresa ABC',
            inscricao_estadual='123456789',
            responsavel_legal='João Silva',
            observacoes='Teste PJ'
        )

        self.assertEqual(inquilino.nome_fantasia, 'Empresa ABC')
        self.assertEqual(inquilino.inscricao_estadual, '123456789')
        self.assertEqual(inquilino.responsavel_legal, 'João Silva')

    def test_auditoria_timestamps(self):
        """Teste campos de auditoria."""
        inquilino = InquilinoPFFactory.create()

        self.assertIsNotNone(inquilino.created_at)
        self.assertIsNotNone(inquilino.updated_at)
        self.assertEqual(inquilino.created_at.date(), date.today())

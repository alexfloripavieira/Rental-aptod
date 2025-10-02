"""
Testes para validadores de CPF e CNPJ.

Cobre:
- Validação de CPF válido/inválido
- Validação de CNPJ válido/inválido
- Formatação de documentos
- Limpeza de documentos
"""
import pytest
from django.test import TestCase
from django.core.exceptions import ValidationError

from aptos.validators import (
    validar_cpf,
    validar_cnpj,
    validar_cpf_django,
    validar_cnpj_django,
    limpar_documento
)
from aptos.utils import formatar_cpf, formatar_cnpj


class TestValidadorCPF(TestCase):
    """Testes para validador de CPF."""

    def test_cpf_valido(self):
        """Teste validação de CPFs válidos."""
        cpfs_validos = [
            '11144477735',
            '111.444.777-35',
            '529.982.247-25',
            '52998224725',
        ]

        for cpf in cpfs_validos:
            try:
                resultado = validar_cpf(cpf)
                # Deve retornar CPF limpo (apenas números)
                self.assertEqual(len(resultado), 11)
                self.assertTrue(resultado.isdigit())
            except ValidationError:
                self.fail(f"CPF {cpf} deveria ser válido")

    def test_cpf_invalido_sequencia_iguais(self):
        """Teste rejeição de CPFs com todos os dígitos iguais."""
        cpfs_invalidos = [
            '11111111111',
            '00000000000',
            '99999999999',
            '22222222222',
        ]

        for cpf in cpfs_invalidos:
            with self.assertRaises(ValidationError):
                validar_cpf(cpf)

    def test_cpf_invalido_digito_verificador(self):
        """Teste rejeição de CPFs com dígitos verificadores incorretos."""
        cpfs_invalidos = [
            '12345678901',
            '11144477700',
            '52998224700',
        ]

        for cpf in cpfs_invalidos:
            with self.assertRaises(ValidationError):
                validar_cpf(cpf)

    def test_cpf_invalido_tamanho(self):
        """Teste rejeição de CPFs com tamanho incorreto."""
        cpfs_invalidos = [
            '123456789',      # Muito curto
            '123456789012',   # Muito longo
            '1234567890',     # 10 dígitos
        ]

        for cpf in cpfs_invalidos:
            with self.assertRaises(ValidationError):
                validar_cpf(cpf)

    def test_cpf_invalido_nao_numerico(self):
        """Teste rejeição de CPFs com caracteres não numéricos."""
        cpfs_invalidos = [
            'abcdefghijk',
            '111.444.777-XX',
            'CPF12345678',
        ]

        for cpf in cpfs_invalidos:
            with self.assertRaises(ValidationError):
                validar_cpf(cpf)

    def test_cpf_vazio(self):
        """Teste rejeição de CPF vazio."""
        with self.assertRaises(ValidationError):
            validar_cpf('')

        with self.assertRaises(ValidationError):
            validar_cpf(None)

    def test_validador_django_cpf(self):
        """Teste validador Django para CPF."""
        # CPF válido não deve lançar exceção
        try:
            validar_cpf_django('11144477735')
        except ValidationError:
            self.fail("Validador Django rejeitou CPF válido")

        # CPF inválido deve lançar exceção
        with self.assertRaises(ValidationError):
            validar_cpf_django('11111111111')

        # None/vazio não deve lançar exceção (campo opcional)
        validar_cpf_django(None)
        validar_cpf_django('')


class TestValidadorCNPJ(TestCase):
    """Testes para validador de CNPJ."""

    def test_cnpj_valido(self):
        """Teste validação de CNPJs válidos."""
        cnpjs_validos = [
            '11222333000181',
            '11.222.333/0001-81',
            '06990590000123',
            '06.990.590/0001-23',
        ]

        for cnpj in cnpjs_validos:
            try:
                resultado = validar_cnpj(cnpj)
                # Deve retornar CNPJ limpo (apenas números)
                self.assertEqual(len(resultado), 14)
                self.assertTrue(resultado.isdigit())
            except ValidationError:
                self.fail(f"CNPJ {cnpj} deveria ser válido")

    def test_cnpj_invalido_sequencia_iguais(self):
        """Teste rejeição de CNPJs com todos os dígitos iguais."""
        cnpjs_invalidos = [
            '11111111111111',
            '00000000000000',
            '99999999999999',
        ]

        for cnpj in cnpjs_invalidos:
            with self.assertRaises(ValidationError):
                validar_cnpj(cnpj)

    def test_cnpj_invalido_digito_verificador(self):
        """Teste rejeição de CNPJs com dígitos verificadores incorretos."""
        cnpjs_invalidos = [
            '11222333000100',
            '06990590000100',
            '12345678000100',
        ]

        for cnpj in cnpjs_invalidos:
            with self.assertRaises(ValidationError):
                validar_cnpj(cnpj)

    def test_cnpj_invalido_tamanho(self):
        """Teste rejeição de CNPJs com tamanho incorreto."""
        cnpjs_invalidos = [
            '1122233300018',    # Muito curto
            '112223330001811',  # Muito longo
            '112223330001',     # Muito curto
        ]

        for cnpj in cnpjs_invalidos:
            with self.assertRaises(ValidationError):
                validar_cnpj(cnpj)

    def test_cnpj_vazio(self):
        """Teste rejeição de CNPJ vazio."""
        with self.assertRaises(ValidationError):
            validar_cnpj('')

        with self.assertRaises(ValidationError):
            validar_cnpj(None)

    def test_validador_django_cnpj(self):
        """Teste validador Django para CNPJ."""
        # CNPJ válido não deve lançar exceção
        try:
            validar_cnpj_django('11222333000181')
        except ValidationError:
            self.fail("Validador Django rejeitou CNPJ válido")

        # CNPJ inválido deve lançar exceção
        with self.assertRaises(ValidationError):
            validar_cnpj_django('11111111111111')

        # None/vazio não deve lançar exceção (campo opcional)
        validar_cnpj_django(None)
        validar_cnpj_django('')


class TestLimpezaFormatacao(TestCase):
    """Testes para funções de limpeza e formatação."""

    def test_limpar_documento_cpf(self):
        """Teste limpeza de formatação de CPF."""
        self.assertEqual(limpar_documento('111.444.777-35'), '11144477735')
        self.assertEqual(limpar_documento('11144477735'), '11144477735')
        self.assertEqual(limpar_documento('111-444-777-35'), '11144477735')

    def test_limpar_documento_cnpj(self):
        """Teste limpeza de formatação de CNPJ."""
        self.assertEqual(limpar_documento('11.222.333/0001-81'), '11222333000181')
        self.assertEqual(limpar_documento('11222333000181'), '11222333000181')

    def test_limpar_documento_vazio(self):
        """Teste limpeza de documento vazio."""
        self.assertEqual(limpar_documento(''), '')
        self.assertEqual(limpar_documento(None), '')

    def test_formatar_cpf(self):
        """Teste formatação de CPF."""
        self.assertEqual(formatar_cpf('11144477735'), '111.444.777-35')
        self.assertEqual(formatar_cpf('111.444.777-35'), '111.444.777-35')

    def test_formatar_cnpj(self):
        """Teste formatação de CNPJ."""
        self.assertEqual(formatar_cnpj('11222333000181'), '11.222.333/0001-81')
        self.assertEqual(formatar_cnpj('11.222.333/0001-81'), '11.222.333/0001-81')

    def test_formatar_documento_vazio(self):
        """Teste formatação de documento vazio."""
        self.assertEqual(formatar_cpf(''), '')
        self.assertEqual(formatar_cnpj(''), '')
        self.assertEqual(formatar_cpf(None), '')
        self.assertEqual(formatar_cnpj(None), '')


class TestCasosEspeciaisCPF(TestCase):
    """Testes para casos especiais de CPF."""

    def test_cpf_com_zeros_esquerda(self):
        """Teste CPF que inicia com zeros."""
        # CPF 000.000.001-91 é válido
        cpf_valido = '00000000191'
        try:
            resultado = validar_cpf(cpf_valido)
            self.assertEqual(resultado, '00000000191')
        except ValidationError:
            self.fail(f"CPF {cpf_valido} deveria ser válido")

    def test_cpf_formatado_com_espacos(self):
        """Teste CPF com espaços extras."""
        cpf_com_espacos = ' 111.444.777-35 '
        resultado = validar_cpf(cpf_com_espacos)
        self.assertEqual(resultado, '11144477735')


class TestCasosEspeciaisCNPJ(TestCase):
    """Testes para casos especiais de CNPJ."""

    def test_cnpj_com_zeros_esquerda(self):
        """Teste CNPJ que inicia com zeros."""
        cnpj_valido = '06990590000123'
        try:
            resultado = validar_cnpj(cnpj_valido)
            self.assertEqual(resultado, '06990590000123')
        except ValidationError:
            self.fail(f"CNPJ {cnpj_valido} deveria ser válido")

    def test_cnpj_formatado_com_espacos(self):
        """Teste CNPJ com espaços extras."""
        cnpj_com_espacos = ' 11.222.333/0001-81 '
        resultado = validar_cnpj(cnpj_com_espacos)
        self.assertEqual(resultado, '11222333000181')

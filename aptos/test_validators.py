"""
Testes para validadores de CPF e CNPJ.

Este módulo testa os algoritmos de validação de documentos brasileiros,
formatação, e APIs de validação em tempo real.
"""

import json
from django.test import TestCase, Client
from django.urls import reverse
from django.core.exceptions import ValidationError
from rest_framework.test import APITestCase
from rest_framework import status

from .validators import (
    validar_cpf, validar_cnpj, validar_cpf_django, validar_cnpj_django,
    limpar_documento, CPFS_INVALIDOS, CNPJS_INVALIDOS
)
from .utils import (
    formatar_cpf, formatar_cnpj, gerar_cpfs_teste, gerar_cnpjs_teste,
    mascarar_documento, capitalizar_nome
)
from .models import Inquilino


class CPFValidatorTestCase(TestCase):
    """Testes para validação de CPF"""

    def test_cpf_valido(self):
        """Testa CPFs válidos"""
        cpfs_validos = [
            '11144477735',
            '111.444.777-35',
            '22233366638',
            '222.333.666-38',
        ]

        for cpf in cpfs_validos:
            with self.subTest(cpf=cpf):
                try:
                    resultado = validar_cpf(cpf)
                    self.assertEqual(len(resultado), 11)
                    self.assertTrue(resultado.isdigit())
                except ValidationError:
                    self.fail(f"CPF {cpf} deveria ser válido")

    def test_cpf_invalido(self):
        """Testa CPFs inválidos"""
        cpfs_invalidos = [
            '11111111111',  # Sequência igual
            '12345678901',  # Dígito verificador incorreto
            '123456789',    # Menos de 11 dígitos
            '123456789012', # Mais de 11 dígitos
            '',             # Vazio
            'abc',          # Não numérico
        ]

        for cpf in cpfs_invalidos:
            with self.subTest(cpf=cpf):
                with self.assertRaises(ValidationError):
                    validar_cpf(cpf)

    def test_cpf_sequencias_invalidas(self):
        """Testa CPFs com sequências de números iguais"""
        for cpf in CPFS_INVALIDOS:
            with self.subTest(cpf=cpf):
                with self.assertRaises(ValidationError):
                    validar_cpf(cpf)

    def test_validador_django_cpf(self):
        """Testa validador Django para CPF"""
        # CPF válido não deve gerar erro
        try:
            validar_cpf_django('11144477735')
        except ValidationError:
            self.fail("Validador Django falhou com CPF válido")

        # CPF inválido deve gerar erro
        with self.assertRaises(ValidationError):
            validar_cpf_django('11111111111')


class CNPJValidatorTestCase(TestCase):
    """Testes para validação de CNPJ"""

    def test_cnpj_valido(self):
        """Testa CNPJs válidos"""
        cnpjs_validos = [
            '11222333000181',
            '11.222.333/0001-81',
            '11444777000161',
            '11.444.777/0001-61',
        ]

        for cnpj in cnpjs_validos:
            with self.subTest(cnpj=cnpj):
                try:
                    resultado = validar_cnpj(cnpj)
                    self.assertEqual(len(resultado), 14)
                    self.assertTrue(resultado.isdigit())
                except ValidationError:
                    self.fail(f"CNPJ {cnpj} deveria ser válido")

    def test_cnpj_invalido(self):
        """Testa CNPJs inválidos"""
        cnpjs_invalidos = [
            '11111111111111',    # Sequência igual
            '12345678000195',    # Dígito verificador incorreto
            '1234567800019',     # Menos de 14 dígitos
            '123456780001950',   # Mais de 14 dígitos
            '',                  # Vazio
            'abcd',              # Não numérico
        ]

        for cnpj in cnpjs_invalidos:
            with self.subTest(cnpj=cnpj):
                with self.assertRaises(ValidationError):
                    validar_cnpj(cnpj)

    def test_cnpj_sequencias_invalidas(self):
        """Testa CNPJs com sequências de números iguais"""
        for cnpj in CNPJS_INVALIDOS:
            with self.subTest(cnpj=cnpj):
                with self.assertRaises(ValidationError):
                    validar_cnpj(cnpj)

    def test_validador_django_cnpj(self):
        """Testa validador Django para CNPJ"""
        # CNPJ válido não deve gerar erro
        try:
            validar_cnpj_django('11222333000181')
        except ValidationError:
            self.fail("Validador Django falhou com CNPJ válido")

        # CNPJ inválido deve gerar erro
        with self.assertRaises(ValidationError):
            validar_cnpj_django('11111111111111')


class FormatadorTestCase(TestCase):
    """Testes para formatadores de documentos"""

    def test_formatar_cpf(self):
        """Testa formatação de CPF"""
        casos = [
            ('11144477735', '111.444.777-35'),
            ('111.444.777-35', '111.444.777-35'),
            ('111 444 777 35', '111.444.777-35'),
            ('', ''),
            ('123', '123'),  # Inválido retorna original
        ]

        for entrada, esperado in casos:
            with self.subTest(entrada=entrada):
                resultado = formatar_cpf(entrada)
                self.assertEqual(resultado, esperado)

    def test_formatar_cnpj(self):
        """Testa formatação de CNPJ"""
        casos = [
            ('11222333000181', '11.222.333/0001-81'),
            ('11.222.333/0001-81', '11.222.333/0001-81'),
            ('11 222 333 0001 81', '11.222.333/0001-81'),
            ('', ''),
            ('123', '123'),  # Inválido retorna original
        ]

        for entrada, esperado in casos:
            with self.subTest(entrada=entrada):
                resultado = formatar_cnpj(entrada)
                self.assertEqual(resultado, esperado)

    def test_limpar_documento(self):
        """Testa limpeza de documentos"""
        casos = [
            ('111.444.777-35', '11144477735'),
            ('11.222.333/0001-81', '11222333000181'),
            ('111 444 777 35', '11144477735'),
            ('abc123def456', '123456'),
            ('', ''),
        ]

        for entrada, esperado in casos:
            with self.subTest(entrada=entrada):
                resultado = limpar_documento(entrada)
                self.assertEqual(resultado, esperado)

    def test_mascarar_documento(self):
        """Testa mascaramento de documentos"""
        casos = [
            ('11144477735', 'cpf', '111.444.***-**'),
            ('11222333000181', 'cnpj', '11.222.***/**-**'),
            ('11144477735', 'auto', '111.444.***-**'),
            ('11222333000181', 'auto', '11.222.***/**-**'),
        ]

        for documento, tipo, esperado in casos:
            with self.subTest(documento=documento, tipo=tipo):
                resultado = mascarar_documento(documento, tipo)
                self.assertEqual(resultado, esperado)

    def test_capitalizar_nome(self):
        """Testa capitalização de nomes"""
        casos = [
            ('joão da silva', 'João da Silva'),
            ('MARIA DE OLIVEIRA', 'Maria de Oliveira'),
            ('pedro dos santos', 'Pedro dos Santos'),
            ('ana e carlos', 'Ana e Carlos'),
            ('', ''),
        ]

        for entrada, esperado in casos:
            with self.subTest(entrada=entrada):
                resultado = capitalizar_nome(entrada)
                self.assertEqual(resultado, esperado)


class InquilinoModelTestCase(TestCase):
    """Testes para modelo Inquilino com validações"""

    def test_criar_inquilino_pf_valido(self):
        """Testa criação de inquilino pessoa física válido"""
        inquilino = Inquilino.objects.create(
            tipo='PF',
            nome_completo='João da Silva',
            cpf='11144477735',
            email='joao@email.com',
            telefone='(11) 99999-9999'
        )

        self.assertEqual(inquilino.cpf, '11144477735')
        self.assertEqual(inquilino.cpf_formatado, '111.444.777-35')
        self.assertEqual(inquilino.nome_principal, 'João da Silva')
        self.assertEqual(inquilino.identificacao, '11144477735')

    def test_criar_inquilino_pj_valido(self):
        """Testa criação de inquilino pessoa jurídica válido"""
        inquilino = Inquilino.objects.create(
            tipo='PJ',
            razao_social='Empresa ABC LTDA',
            cnpj='11222333000181',
            email='empresa@abc.com',
            telefone='(11) 3333-3333'
        )

        self.assertEqual(inquilino.cnpj, '11222333000181')
        self.assertEqual(inquilino.cnpj_formatado, '11.222.333/0001-81')
        self.assertEqual(inquilino.nome_principal, 'Empresa ABC LTDA')
        self.assertEqual(inquilino.identificacao, '11222333000181')

    def test_cpf_invalido_modelo(self):
        """Testa que CPF inválido não é aceito no modelo"""
        with self.assertRaises(ValidationError):
            inquilino = Inquilino(
                tipo='PF',
                nome_completo='João da Silva',
                cpf='11111111111',  # CPF inválido
                email='joao@email.com',
                telefone='(11) 99999-9999'
            )
            inquilino.full_clean()

    def test_cnpj_invalido_modelo(self):
        """Testa que CNPJ inválido não é aceito no modelo"""
        with self.assertRaises(ValidationError):
            inquilino = Inquilino(
                tipo='PJ',
                razao_social='Empresa ABC LTDA',
                cnpj='11111111111111',  # CNPJ inválido
                email='empresa@abc.com',
                telefone='(11) 3333-3333'
            )
            inquilino.full_clean()

    def test_formatacao_automatica(self):
        """Testa formatação automática de documentos"""
        inquilino = Inquilino.objects.create(
            tipo='PF',
            nome_completo='João da Silva',
            cpf='111.444.777-35',  # CPF formatado
            email='joao@email.com',
            telefone='(11) 99999-9999'
        )

        # Deve ser salvo limpo
        self.assertEqual(inquilino.cpf, '11144477735')


class APIValidacaoTestCase(APITestCase):
    """Testes para APIs de validação em tempo real"""

    def setUp(self):
        """Configuração inicial dos testes"""
        self.client = Client()

    def test_validar_cpf_api_valido(self):
        """Testa API de validação de CPF válido"""
        url = reverse('validar_cpf')
        data = {
            'cpf': '111.444.777-35'
        }

        response = self.client.post(
            url,
            data=json.dumps(data),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertTrue(response_data['valid'])
        self.assertEqual(response_data['cpf_formatado'], '111.444.777-35')
        self.assertEqual(response_data['cpf_limpo'], '11144477735')

    def test_validar_cpf_api_invalido(self):
        """Testa API de validação de CPF inválido"""
        url = reverse('validar_cpf')
        data = {
            'cpf': '111.111.111-11'
        }

        response = self.client.post(
            url,
            data=json.dumps(data),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertFalse(response_data['valid'])
        self.assertIn('error', response_data)

    def test_validar_cnpj_api_valido(self):
        """Testa API de validação de CNPJ válido"""
        url = reverse('validar_cnpj')
        data = {
            'cnpj': '11.444.777/0001-61'
        }

        response = self.client.post(
            url,
            data=json.dumps(data),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertTrue(response_data['valid'])
        self.assertEqual(response_data['cnpj_formatado'], '11.444.777/0001-61')
        self.assertEqual(response_data['cnpj_limpo'], '11444777000161')

    def test_validar_documento_api_generic(self):
        """Testa API genérica de validação de documento"""
        url = reverse('validar_documento')

        # Teste CPF
        data = {
            'documento': '111.444.777-35',
            'tipo': 'CPF'
        }

        response = self.client.post(
            url,
            data=json.dumps(data),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertTrue(response_data['valid'])

        # Teste CNPJ
        data = {
            'documento': '11.222.333/0001-81',
            'tipo': 'CNPJ'
        }

        response = self.client.post(
            url,
            data=json.dumps(data),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertTrue(response_data['valid'])

    def test_verificar_unicidade_api(self):
        """Testa verificação de unicidade na API"""
        # Criar inquilino
        inquilino = Inquilino.objects.create(
            tipo='PF',
            nome_completo='João da Silva',
            cpf='11144477735',
            email='joao@email.com',
            telefone='(11) 99999-9999'
        )

        # Testar CPF que já existe
        url = reverse('validar_cpf')
        data = {
            'cpf': '111.444.777-35'
        }

        response = self.client.post(
            url,
            data=json.dumps(data),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertTrue(response_data['valid'])
        self.assertTrue(response_data['exists'])

    def test_documentos_teste_api(self):
        """Testa API de documentos para teste"""
        url = reverse('documentos_teste')
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertIn('cpfs_validos', response_data)
        self.assertIn('cnpjs_validos', response_data)
        self.assertGreater(len(response_data['cpfs_validos']), 0)
        self.assertGreater(len(response_data['cnpjs_validos']), 0)


class PerformanceTestCase(TestCase):
    """Testes de performance para validações"""

    def test_performance_validacao_cpf(self):
        """Testa performance da validação de CPF"""
        import time

        cpf = '11144477735'
        start_time = time.time()

        for _ in range(1000):
            validar_cpf(cpf)

        end_time = time.time()
        tempo_total = end_time - start_time

        # Deve processar 1000 CPFs em menos de 1 segundo
        self.assertLess(tempo_total, 1.0)

    def test_performance_validacao_cnpj(self):
        """Testa performance da validação de CNPJ"""
        import time

        cnpj = '11222333000181'
        start_time = time.time()

        for _ in range(1000):
            validar_cnpj(cnpj)

        end_time = time.time()
        tempo_total = end_time - start_time

        # Deve processar 1000 CNPJs em menos de 1 segundo
        self.assertLess(tempo_total, 1.0)
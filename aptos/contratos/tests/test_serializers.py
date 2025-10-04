"""
Testes para os serializers de contratos.
"""
import pytest
from datetime import date
from decimal import Decimal
from rest_framework.exceptions import ValidationError
from aptos.contratos.serializers import (
    EnderecoLocadorSerializer,
    LocadorSerializer,
    LocatarioSerializer,
    ContratoDetalhesSerializer,
    ContratoSerializer,
)


class TestEnderecoLocadorSerializer:
    """Testes para EnderecoLocadorSerializer."""

    def test_endereco_valido(self):
        """Testa endereco valido."""
        dados = {
            'rua': 'Rua Bento Gonçalves',
            'numero': '183',
            'bairro': 'Centro',
            'cidade': 'Florianopolis',
            'estado': 'SC',
            'cep': '88010-080',
        }
        serializer = EnderecoLocadorSerializer(data=dados)
        assert serializer.is_valid()

    def test_cep_invalido(self):
        """Testa CEP invalido."""
        dados = {
            'rua': 'Rua Teste',
            'numero': '100',
            'bairro': 'Centro',
            'cidade': 'Florianopolis',
            'estado': 'SC',
            'cep': '123',
        }
        serializer = EnderecoLocadorSerializer(data=dados)
        assert not serializer.is_valid()
        assert 'cep' in serializer.errors


class TestLocadorSerializer:
    """Testes para LocadorSerializer."""

    def test_locador_valido(self):
        """Testa dados de locador validos."""
        dados = {
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
        }
        serializer = LocadorSerializer(data=dados)
        assert serializer.is_valid()

    def test_cpf_invalido(self):
        """Testa CPF invalido."""
        dados = {
            'nomeCompleto': 'Teste',
            'nacionalidade': 'brasileiro',
            'estadoCivil': 'solteiro',
            'profissao': 'teste',
            'cpf': '000.000.000-00',
            'endereco': {
                'rua': 'Rua Teste',
                'numero': '1',
                'bairro': 'Centro',
                'cidade': 'Cidade',
                'estado': 'SC',
                'cep': '88010-080',
            }
        }
        serializer = LocadorSerializer(data=dados)
        assert not serializer.is_valid()
        assert 'cpf' in serializer.errors


class TestLocatarioSerializer:
    """Testes para LocatarioSerializer."""

    def test_locatario_valido(self):
        """Testa dados de locatario validos."""
        dados = {
            'nomeCompleto': 'Felipe Nascimento',
            'nacionalidade': 'brasileiro',
            'profissao': 'assistente',
            'cpf': '063.857.409-94',
            'rg': '6.505.0271',
            'rgOrgao': 'SSP/SC',
            'enderecoCompleto': 'Avenida Max Schramm, 2700, Florianopolis',
            'telefone': '(48) 99811-3393',
            'email': 'teste@gmail.com',
        }
        serializer = LocatarioSerializer(data=dados)
        assert serializer.is_valid()

    def test_telefone_invalido(self):
        """Testa telefone invalido."""
        dados = {
            'nomeCompleto': 'Teste',
            'nacionalidade': 'brasileiro',
            'profissao': 'teste',
            'cpf': '063.857.409-94',
            'rg': '1234567',
            'rgOrgao': 'SSP/SC',
            'enderecoCompleto': 'Rua Teste',
            'telefone': '123',
            'email': 'teste@test.com',
        }
        serializer = LocatarioSerializer(data=dados)
        assert not serializer.is_valid()
        assert 'telefone' in serializer.errors


class TestContratoDetalhesSerializer:
    """Testes para ContratoDetalhesSerializer."""

    def test_contrato_valido(self):
        """Testa detalhes de contrato validos."""
        dados = {
            'dataInicio': '2025-08-05',
            'valorCaucao': '1700.00',
            'clausulaSegunda': 'O aluguel convencionado e de R$ 1.700,00 mensais, ' * 5,
        }
        serializer = ContratoDetalhesSerializer(data=dados)
        assert serializer.is_valid()

    def test_valor_caucao_negativo(self):
        """Testa valor de caucao negativo."""
        dados = {
            'dataInicio': '2025-08-05',
            'valorCaucao': '-100.00',
            'clausulaSegunda': 'Texto da clausula segunda com mais de 50 caracteres aqui',
        }
        serializer = ContratoDetalhesSerializer(data=dados)
        assert not serializer.is_valid()
        assert 'valorCaucao' in serializer.errors

    def test_clausula_muito_curta(self):
        """Testa clausula segunda muito curta."""
        dados = {
            'dataInicio': '2025-08-05',
            'valorCaucao': '1700.00',
            'clausulaSegunda': 'Muito curto',
        }
        serializer = ContratoDetalhesSerializer(data=dados)
        assert not serializer.is_valid()
        assert 'clausulaSegunda' in serializer.errors


class TestContratoSerializer:
    """Testes para ContratoSerializer completo."""

    @pytest.fixture
    def payload_valido(self):
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
                'clausulaSegunda': 'O aluguel convencionado e de R$ 1.700,00 (Hum mil e setecentos reais) mensais, devendo ser pago ate o dia dez do mes vincendo.',
            },
            'inventarioMoveis': 'armario de pia com tampo em granito, guarda-roupa, fogao eletrico',
        }

    def test_contrato_completo_valido(self, payload_valido):
        """Testa payload completo de contrato valido."""
        serializer = ContratoSerializer(data=payload_valido)
        assert serializer.is_valid()

    def test_contrato_campo_obrigatorio_faltando(self, payload_valido):
        """Testa campo obrigatorio faltando."""
        del payload_valido['inventarioMoveis']
        serializer = ContratoSerializer(data=payload_valido)
        assert not serializer.is_valid()
        assert 'inventarioMoveis' in serializer.errors

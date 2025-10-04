"""
Testes para os validadores de documentos brasileiros.
"""
import pytest
from aptos.contratos.validators import (
    validarCpf,
    validarRg,
    validarTelefone,
    validarCep,
    validarEmail,
)


class TestValidarCpf:
    """Testes para validacao de CPF."""

    def test_cpf_valido_com_mascara(self):
        """Testa CPF valido com formatacao."""
        assert validarCpf('012.345.678-90') is True

    def test_cpf_valido_sem_mascara(self):
        """Testa CPF valido sem formatacao."""
        assert validarCpf('01234567890') is True

    def test_cpf_invalido_digito_incorreto(self):
        """Testa CPF com digito verificador incorreto."""
        assert validarCpf('012.345.678-91') is False

    def test_cpf_vazio(self):
        """Testa CPF vazio."""
        assert validarCpf('') is False

    def test_cpf_none(self):
        """Testa CPF None."""
        assert validarCpf(None) is False


class TestValidarRg:
    """Testes para validacao de RG."""

    def test_rg_valido(self):
        """Testa RG valido."""
        assert validarRg('6.505.0271') is True

    def test_rg_valido_com_orgao(self):
        """Testa RG valido com orgao emissor."""
        assert validarRg('6.505.0271', 'SSP/SC') is True

    def test_rg_muito_curto(self):
        """Testa RG muito curto."""
        assert validarRg('1234') is False

    def test_rg_muito_longo(self):
        """Testa RG muito longo."""
        assert validarRg('1234567890123456') is False

    def test_rg_vazio(self):
        """Testa RG vazio."""
        assert validarRg('') is False

    def test_rg_com_orgao_invalido(self):
        """Testa RG com formato de orgao emissor invalido."""
        assert validarRg('6.505.0271', 'SSP') is False


class TestValidarTelefone:
    """Testes para validacao de telefone brasileiro."""

    def test_telefone_celular_valido(self):
        """Testa telefone celular com mascara."""
        assert validarTelefone('(48) 99811-3393') is True

    def test_telefone_fixo_valido(self):
        """Testa telefone fixo."""
        assert validarTelefone('(48) 3333-4444') is True

    def test_telefone_sem_mascara(self):
        """Testa telefone sem mascara."""
        assert validarTelefone('48998113393') is True

    def test_telefone_invalido(self):
        """Testa telefone com formato invalido."""
        assert validarTelefone('123-456') is False

    def test_telefone_vazio(self):
        """Testa telefone vazio."""
        assert validarTelefone('') is False


class TestValidarCep:
    """Testes para validacao de CEP."""

    def test_cep_valido_com_mascara(self):
        """Testa CEP valido com mascara."""
        assert validarCep('88010-080') is True

    def test_cep_valido_sem_mascara(self):
        """Testa CEP valido sem mascara."""
        assert validarCep('88010080') is True

    def test_cep_invalido(self):
        """Testa CEP com formato invalido."""
        assert validarCep('123') is False

    def test_cep_vazio(self):
        """Testa CEP vazio."""
        assert validarCep('') is False


class TestValidarEmail:
    """Testes para validacao de email."""

    def test_email_valido(self):
        """Testa email valido."""
        assert validarEmail('teste@example.com') is True

    def test_email_valido_com_subdomain(self):
        """Testa email com subdominio."""
        assert validarEmail('user@mail.example.com') is True

    def test_email_invalido_sem_arroba(self):
        """Testa email sem @."""
        assert validarEmail('invalido.com') is False

    def test_email_invalido_sem_dominio(self):
        """Testa email sem dominio."""
        assert validarEmail('user@') is False

    def test_email_vazio(self):
        """Testa email vazio."""
        assert validarEmail('') is False

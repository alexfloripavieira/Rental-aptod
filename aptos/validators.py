"""
Validadores customizados para documentos brasileiros (CPF e CNPJ).

Este módulo implementa os algoritmos oficiais da Receita Federal para
validação de CPF e CNPJ, incluindo formatação e verificação de unicidade.
"""

import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


def limpar_documento(documento):
    """Remove formatação de documento, mantendo apenas números."""
    if not documento:
        return ""
    return re.sub(r'[^0-9]', '', str(documento))


def validar_cpf(cpf):
    """
    Valida CPF usando algoritmo oficial da Receita Federal.

    Args:
        cpf (str): CPF com ou sem formatação

    Returns:
        str: CPF limpo (apenas números)

    Raises:
        ValidationError: Se CPF for inválido
    """
    if not cpf:
        raise ValidationError(_('CPF é obrigatório.'))

    # Remove formatação
    cpf_limpo = limpar_documento(cpf)

    # Verifica se tem 11 dígitos
    if len(cpf_limpo) != 11:
        raise ValidationError(_('CPF deve ter 11 dígitos.'))

    # Verifica se não é uma sequência de números iguais
    if cpf_limpo == cpf_limpo[0] * 11:
        raise ValidationError(_('CPF inválido.'))

    # Calcula primeiro dígito verificador
    soma = sum(int(cpf_limpo[i]) * (10 - i) for i in range(9))
    resto = soma % 11
    dv1 = 0 if resto < 2 else 11 - resto

    # Calcula segundo dígito verificador
    soma = sum(int(cpf_limpo[i]) * (11 - i) for i in range(10))
    resto = soma % 11
    dv2 = 0 if resto < 2 else 11 - resto

    # Verifica dígitos verificadores
    if cpf_limpo[-2:] != f"{dv1}{dv2}":
        raise ValidationError(_('CPF inválido.'))

    return cpf_limpo


def validar_cnpj(cnpj):
    """
    Valida CNPJ usando algoritmo oficial da Receita Federal.

    Args:
        cnpj (str): CNPJ com ou sem formatação

    Returns:
        str: CNPJ limpo (apenas números)

    Raises:
        ValidationError: Se CNPJ for inválido
    """
    if not cnpj:
        raise ValidationError(_('CNPJ é obrigatório.'))

    # Remove formatação
    cnpj_limpo = limpar_documento(cnpj)

    # Verifica se tem 14 dígitos
    if len(cnpj_limpo) != 14:
        raise ValidationError(_('CNPJ deve ter 14 dígitos.'))

    # Verifica se não é uma sequência de números iguais
    if cnpj_limpo == cnpj_limpo[0] * 14:
        raise ValidationError(_('CNPJ inválido.'))

    # Sequência de multiplicadores para primeiro dígito
    multiplicadores1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

    # Calcula primeiro dígito verificador
    soma = sum(int(cnpj_limpo[i]) * multiplicadores1[i] for i in range(12))
    resto = soma % 11
    dv1 = 0 if resto < 2 else 11 - resto

    # Sequência de multiplicadores para segundo dígito
    multiplicadores2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

    # Calcula segundo dígito verificador
    soma = sum(int(cnpj_limpo[i]) * multiplicadores2[i] for i in range(13))
    resto = soma % 11
    dv2 = 0 if resto < 2 else 11 - resto

    # Verifica dígitos verificadores
    if cnpj_limpo[-2:] != f"{dv1}{dv2}":
        raise ValidationError(_('CNPJ inválido.'))

    return cnpj_limpo


def validar_cpf_django(value):
    """
    Validador Django para campo CPF.

    Args:
        value (str): Valor do campo CPF

    Raises:
        ValidationError: Se CPF for inválido
    """
    if value:
        validar_cpf(value)


def validar_cnpj_django(value):
    """
    Validador Django para campo CNPJ.

    Args:
        value (str): Valor do campo CNPJ

    Raises:
        ValidationError: Se CNPJ for inválido
    """
    if value:
        validar_cnpj(value)


def validar_cpf_unico(value, instance=None):
    """
    Valida se CPF é único na base de dados.

    Args:
        value (str): CPF para verificar
        instance: Instância atual (para excluir na edição)

    Raises:
        ValidationError: Se CPF já existe
    """
    if not value:
        return

    from .models import Inquilino

    cpf_limpo = limpar_documento(value)
    queryset = Inquilino.objects.filter(cpf=cpf_limpo)

    if instance and instance.pk:
        queryset = queryset.exclude(pk=instance.pk)

    if queryset.exists():
        raise ValidationError(_('Já existe um inquilino com este CPF.'))


def validar_cnpj_unico(value, instance=None):
    """
    Valida se CNPJ é único na base de dados.

    Args:
        value (str): CNPJ para verificar
        instance: Instância atual (para excluir na edição)

    Raises:
        ValidationError: Se CNPJ já existe
    """
    if not value:
        return

    from .models import Inquilino

    cnpj_limpo = limpar_documento(value)
    queryset = Inquilino.objects.filter(cnpj=cnpj_limpo)

    if instance and instance.pk:
        queryset = queryset.exclude(pk=instance.pk)

    if queryset.exists():
        raise ValidationError(_('Já existe um inquilino com este CNPJ.'))


# Lista de CPFs inválidos conhecidos (para testes)
CPFS_INVALIDOS = [
    '00000000000', '11111111111', '22222222222', '33333333333',
    '44444444444', '55555555555', '66666666666', '77777777777',
    '88888888888', '99999999999', '12345678901'
]

# Lista de CNPJs inválidos conhecidos (para testes)
CNPJS_INVALIDOS = [
    '00000000000000', '11111111111111', '22222222222222', '33333333333333',
    '44444444444444', '55555555555555', '66666666666666', '77777777777777',
    '88888888888888', '99999999999999'
]
"""
Validadores customizados para dados brasileiros.
"""
import re
from typing import Optional
from validate_docbr import CPF


def validarCpf(cpf: str) -> bool:
    """
    Valida CPF brasileiro com digitos verificadores.
    Formato esperado: XXX.XXX.XXX-XX ou XXXXXXXXXXX

    Args:
        cpf: String contendo o CPF a ser validado

    Returns:
        bool: True se valido, False caso contrario
    """
    if not cpf:
        return False

    validador = CPF()
    return validador.validate(cpf)


def validarRg(rg: str, orgao: Optional[str] = None) -> bool:
    """
    Valida RG brasileiro.
    Formato esperado: numeros + orgao emissor (SSP/UF)

    Args:
        rg: String contendo o RG
        orgao: Orgao emissor (opcional)

    Returns:
        bool: True se valido, False caso contrario
    """
    if not rg:
        return False

    # Remove espacos e caracteres especiais
    rg_limpo = re.sub(r'[^0-9a-zA-Z]', '', rg)

    # RG deve ter entre 5 e 15 caracteres
    if len(rg_limpo) < 5 or len(rg_limpo) > 15:
        return False

    # Validar orgao emissor se fornecido
    if orgao:
        # Orgao deve ter formato SSP/UF ou similar
        if not re.match(r'^[A-Z]{3,}/[A-Z]{2}$', orgao.upper()):
            return False

    return True


def validarTelefone(telefone: str) -> bool:
    """
    Valida telefone brasileiro.
    Formato esperado: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX

    Args:
        telefone: String contendo o telefone

    Returns:
        bool: True se valido, False caso contrario
    """
    if not telefone:
        return False

    # Aceita formatos:
    # (XX) XXXXX-XXXX  -> celular com 9
    # (XX) XXXX-XXXX   -> telefone fixo
    # Permite também variações sem parênteses/traço
    padrao = r'^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$'

    return bool(re.match(padrao, telefone))


def validarCep(cep: str) -> bool:
    """
    Valida CEP brasileiro.
    Formato esperado: XXXXX-XXX

    Args:
        cep: String contendo o CEP

    Returns:
        bool: True se valido, False caso contrario
    """
    if not cep:
        return False

    # Padrao: XXXXX-XXX ou XXXXXXXX
    padrao = r'^\d{5}-?\d{3}$'

    return bool(re.match(padrao, cep))


def validarEmail(email: str) -> bool:
    """
    Valida formato de email com regex padrao.

    Args:
        email: String contendo o email

    Returns:
        bool: True se valido, False caso contrario
    """
    if not email:
        return False

    # Padrao de email RFC 5322 simplificado
    padrao = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

    return bool(re.match(padrao, email))

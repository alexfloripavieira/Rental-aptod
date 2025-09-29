"""
Utilitários para o sistema de gestão de inquilinos.

Este módulo contém funções auxiliares para formatação de documentos,
manipulação de dados e outras operações utilitárias.
"""

import re
from typing import Optional


def limpar_documento(documento: str) -> str:
    """
    Remove formatação de documento, mantendo apenas números.

    Args:
        documento (str): Documento com ou sem formatação

    Returns:
        str: Documento limpo (apenas números)
    """
    if not documento:
        return ""
    return re.sub(r'[^0-9]', '', str(documento))


def formatar_cpf(cpf: str) -> str:
    """
    Formata CPF para o padrão XXX.XXX.XXX-XX.

    Args:
        cpf (str): CPF com ou sem formatação

    Returns:
        str: CPF formatado ou string vazia se inválido

    Example:
        >>> formatar_cpf('12345678901')
        '123.456.789-01'
    """
    if not cpf:
        return ""

    cpf_limpo = limpar_documento(cpf)

    if len(cpf_limpo) != 11:
        return cpf  # Retorna original se não tiver 11 dígitos

    return f"{cpf_limpo[:3]}.{cpf_limpo[3:6]}.{cpf_limpo[6:9]}-{cpf_limpo[9:]}"


def formatar_cnpj(cnpj: str) -> str:
    """
    Formata CNPJ para o padrão XX.XXX.XXX/XXXX-XX.

    Args:
        cnpj (str): CNPJ com ou sem formatação

    Returns:
        str: CNPJ formatado ou string vazia se inválido

    Example:
        >>> formatar_cnpj('12345678000195')
        '12.345.678/0001-95'
    """
    if not cnpj:
        return ""

    cnpj_limpo = limpar_documento(cnpj)

    if len(cnpj_limpo) != 14:
        return cnpj  # Retorna original se não tiver 14 dígitos

    return f"{cnpj_limpo[:2]}.{cnpj_limpo[2:5]}.{cnpj_limpo[5:8]}/{cnpj_limpo[8:12]}-{cnpj_limpo[12:]}"


def formatar_telefone(telefone: str) -> str:
    """
    Formata telefone brasileiro.

    Args:
        telefone (str): Telefone com ou sem formatação

    Returns:
        str: Telefone formatado

    Example:
        >>> formatar_telefone('11999999999')
        '(11) 99999-9999'
    """
    if not telefone:
        return ""

    telefone_limpo = limpar_documento(telefone)

    # Telefone com DDD (11 dígitos)
    if len(telefone_limpo) == 11:
        return f"({telefone_limpo[:2]}) {telefone_limpo[2:7]}-{telefone_limpo[7:]}"

    # Telefone com DDD (10 dígitos - linha fixa)
    elif len(telefone_limpo) == 10:
        return f"({telefone_limpo[:2]}) {telefone_limpo[2:6]}-{telefone_limpo[6:]}"

    # Retorna original se não seguir padrão
    return telefone


def desformatar_documento(documento: str) -> str:
    """
    Alias para limpar_documento (manter compatibilidade).

    Args:
        documento (str): Documento formatado

    Returns:
        str: Documento apenas com números
    """
    return limpar_documento(documento)


def validar_email_simples(email: str) -> bool:
    """
    Validação simples de email.

    Args:
        email (str): Email para validar

    Returns:
        bool: True se email for válido
    """
    if not email:
        return False

    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def mascarar_documento(documento: str, tipo: str = 'auto') -> str:
    """
    Mascara documento para exibição (proteção de dados).

    Args:
        documento (str): Documento a ser mascarado
        tipo (str): Tipo do documento ('cpf', 'cnpj', 'auto')

    Returns:
        str: Documento mascarado

    Example:
        >>> mascarar_documento('12345678901', 'cpf')
        '123.456.***-**'
    """
    if not documento:
        return ""

    documento_limpo = limpar_documento(documento)

    # Determinar tipo automaticamente
    if tipo == 'auto':
        if len(documento_limpo) == 11:
            tipo = 'cpf'
        elif len(documento_limpo) == 14:
            tipo = 'cnpj'
        else:
            return documento  # Retorna original se não conseguir determinar

    if tipo == 'cpf' and len(documento_limpo) == 11:
        return f"{documento_limpo[:3]}.{documento_limpo[3:6]}.***-**"

    elif tipo == 'cnpj' and len(documento_limpo) == 14:
        return f"{documento_limpo[:2]}.{documento_limpo[2:5]}.***/**-**"

    return documento


def formatar_moeda_brasileira(valor: float) -> str:
    """
    Formata valor monetário para padrão brasileiro.

    Args:
        valor (float): Valor a ser formatado

    Returns:
        str: Valor formatado em reais

    Example:
        >>> formatar_moeda_brasileira(1234.56)
        'R$ 1.234,56'
    """
    if valor is None:
        return "R$ 0,00"

    # Formatar com separadores brasileiros
    valor_str = f"{valor:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')

    return f"R$ {valor_str}"


def extrair_numeros(texto: str) -> str:
    """
    Extrai apenas números de uma string.

    Args:
        texto (str): Texto original

    Returns:
        str: Apenas os números encontrados
    """
    if not texto:
        return ""
    return re.sub(r'[^0-9]', '', str(texto))


def capitalizar_nome(nome: str) -> str:
    """
    Capitaliza nome próprio corretamente.

    Args:
        nome (str): Nome a ser capitalizado

    Returns:
        str: Nome capitalizado

    Example:
        >>> capitalizar_nome('joão da silva')
        'João da Silva'
    """
    if not nome:
        return ""

    # Palavras que devem ficar em minúsculo
    preposicoes = ['da', 'de', 'do', 'das', 'dos', 'e', 'em', 'na', 'no', 'para']

    palavras = nome.strip().lower().split()
    resultado = []

    for i, palavra in enumerate(palavras):
        if i == 0 or palavra not in preposicoes:
            resultado.append(palavra.capitalize())
        else:
            resultado.append(palavra)

    return ' '.join(resultado)


def gerar_cpfs_teste() -> list:
    """
    Gera lista de CPFs válidos para testes.

    Returns:
        list: Lista de CPFs válidos
    """
    return [
        '11144477735',  # CPF válido para testes
        '22233366638',  # CPF válido para testes
        '33322299991',  # CPF válido para testes
    ]


def gerar_cnpjs_teste() -> list:
    """
    Gera lista de CNPJs válidos para testes.

    Returns:
        list: Lista de CNPJs válidos
    """
    return [
        '11222333000181',  # CNPJ válido para testes
        '11444777000161',  # CNPJ válido para testes
        '11222333000172',  # CNPJ válido para testes
    ]
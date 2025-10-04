"""
Funcoes utilitarias para o modulo de contratos.
"""
import hashlib
from datetime import datetime
from decimal import Decimal


def hashCpf(cpf: str) -> str:
    """
    Retorna hash SHA256 do CPF para logs seguros.

    Args:
        cpf: CPF a ser hasheado

    Returns:
        str: Hash SHA256 truncado (16 caracteres)
    """
    return hashlib.sha256(cpf.encode()).hexdigest()[:16]


def formatarData(data: datetime) -> str:
    """
    Formata data como 'DD de mes_extenso de YYYY'.

    Args:
        data: Objeto datetime a ser formatado

    Returns:
        str: Data formatada
    """
    meses = {
        1: 'janeiro',
        2: 'fevereiro',
        3: 'marco',
        4: 'abril',
        5: 'maio',
        6: 'junho',
        7: 'julho',
        8: 'agosto',
        9: 'setembro',
        10: 'outubro',
        11: 'novembro',
        12: 'dezembro'
    }

    dia = data.day
    mes = meses[data.month]
    ano = data.year

    return f"{dia} de {mes} de {ano}"


def formatarValor(valor: Decimal) -> str:
    """
    Formata valor como 'R$ X.XXX,XX'.

    Args:
        valor: Valor decimal a ser formatado

    Returns:
        str: Valor formatado em reais
    """
    valor_str = f"{valor:,.2f}"
    # Trocar separador de milhar e decimal para padrao BR
    valor_str = valor_str.replace(',', 'TEMP')
    valor_str = valor_str.replace('.', ',')
    valor_str = valor_str.replace('TEMP', '.')

    return f"R$ {valor_str}"

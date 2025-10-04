"""
Gerador de PDFs de contratos de locacao.
"""
from weasyprint import HTML
from django.template.loader import render_to_string
from datetime import datetime
from decimal import Decimal
from .utils import formatarData, formatarValor


def gerarContratoPdf(dadosValidados: dict) -> bytes:
    """
    Gera PDF do contrato a partir de dados validados.

    Args:
        dadosValidados: Dict com dados validados do ContratoSerializer

    Returns:
        bytes: PDF gerado

    Raises:
        Exception: Se houver erro na geracao do PDF
    """
    # Preparar contexto para template
    locador = dadosValidados['locador']
    locatario = dadosValidados['locatario']
    contrato = dadosValidados['contrato']
    inventarioMoveis = dadosValidados['inventarioMoveis']

    # Calcular data fim (12 meses apos inicio)
    dataInicio = contrato['dataInicio']
    anoFim = dataInicio.year + 1
    mesFim = dataInicio.month
    if mesFim == 2 and dataInicio.day == 29:
        diaFim = 28
    else:
        diaFim = dataInicio.day

    dataFim = datetime(anoFim, mesFim, diaFim).date()

    # Montar descricao do objeto (imovel)
    objetoDescricao = (
        f"A UNIDADE RESIDENCIAL conforme especificado, "
        f"com suas benfeitorias e instalacoes."
    )

    # Email do locador para contato
    emailLocador = locador.get('email', 'alexsandervieira@hotmail.com')

    contexto = {
        'locador': {
            'nomeCompleto': locador['nomeCompleto'],
            'nacionalidade': locador['nacionalidade'],
            'estadoCivil': locador['estadoCivil'],
            'profissao': locador['profissao'],
            'cpf': locador['cpf'],
            'email': emailLocador,
            'endereco': {
                'rua': locador['endereco']['rua'],
                'numero': locador['endereco']['numero'],
                'bairro': locador['endereco']['bairro'],
                'cidade': locador['endereco']['cidade'],
                'estado': locador['endereco']['estado'],
                'cep': locador['endereco']['cep'],
            }
        },
        'locatario': {
            'nomeCompleto': locatario['nomeCompleto'],
            'nacionalidade': locatario['nacionalidade'],
            'profissao': locatario['profissao'],
            'cpf': locatario['cpf'],
            'rg': locatario['rg'],
            'rgOrgao': locatario['rgOrgao'],
            'enderecoCompleto': locatario['enderecoCompleto'],
            'telefone': locatario['telefone'],
            'email': locatario['email'],
        },
        'contrato': {
            'dataInicioFormatada': formatarData(dataInicio),
            'dataFimFormatada': formatarData(dataFim),
            'valorCaucaoFormatado': formatarValor(contrato['valorCaucao']),
            'clausulaSegunda': contrato['clausulaSegunda'],
        },
        'inventarioMoveis': inventarioMoveis,
        'objeto_descricao': objetoDescricao,
        'dataAssinatura': formatarData(datetime.now()),
    }

    # Renderizar template HTML
    htmlString = render_to_string('contrato_locacao.html', contexto)

    # Gerar PDF
    pdfBytes = HTML(string=htmlString).write_pdf()

    return pdfBytes

"""
Views para geracao de contratos de locacao.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import HttpResponse
from .serializers import ContratoSerializer
from .pdf_generator import gerarContratoPdf
from .permissions import IsSuperAdminUser
from .utils import hashCpf
import logging

logger = logging.getLogger(__name__)


class GerarContratoView(APIView):
    """
    Endpoint para gerar contrato de locacao em PDF.
    """

    permission_classes = [IsSuperAdminUser]

    def post(self, request):
        """
        Gera contrato de locacao em PDF.

        Request Body: JSON com dados de locador, locatario, contrato e inventario
        Response: PDF binario (application/pdf)

        Returns:
            HttpResponse: PDF gerado ou erro de validacao
        """
        serializer = ContratoSerializer(data=request.data)

        if not serializer.is_valid():
            logger.warning("Contrato inválido: %s", serializer.errors)
            return Response(
                {'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        dadosValidados = serializer.validated_data

        try:
            # Gerar PDF
            pdfBytes = gerarContratoPdf(dadosValidados)

            # Log de auditoria (CPF hasheado para seguranca)
            cpfLocatario = dadosValidados['locatario']['cpf']
            logger.info(
                f"Contrato gerado por {request.user.username} - "
                f"CPF Locatario (hash): {hashCpf(cpfLocatario)}"
            )

            # Nome do arquivo
            cpfSanitizado = cpfLocatario.replace('.', '').replace('-', '')
            dataInicio = dadosValidados['contrato']['dataInicio']
            dataInicioStr = dataInicio.strftime('%Y-%m-%d')
            nomeArquivo = f"contrato_locacao_{cpfSanitizado}_{dataInicioStr}.pdf"

            # Response com PDF
            response = HttpResponse(pdfBytes, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{nomeArquivo}"'

            return response

        except Exception as e:
            logger.error(f"Erro ao gerar contrato: {str(e)}", exc_info=True)
            return Response(
                {'detail': 'Erro ao gerar contrato. Tente novamente.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

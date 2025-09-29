"""
Tasks periódicas para gestão de status de inquilinos
"""
from celery import shared_task
from .models import RegraStatus, Inquilino, HistoricoStatus
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


@shared_task
def aplicar_regras_status_automaticas():
    """Task para aplicar regras de status automaticamente"""
    regras_ativas = RegraStatus.objects.filter(ativa=True, automatica=True)
    total_alteracoes = 0

    for regra in regras_ativas:
        logger.info(f"Aplicando regra: {regra.nome}")
        alteracoes_regra = 0

        inquilinos = Inquilino.objects.all()
        for inquilino in inquilinos:
            try:
                if regra.avaliar_inquilino(inquilino):
                    regra.executar_acao(inquilino)
                    alteracoes_regra += 1
                    logger.info(f"Regra {regra.nome} aplicada ao inquilino {inquilino.id}")

            except Exception as e:
                logger.error(f"Erro ao aplicar regra {regra.nome} ao inquilino {inquilino.id}: {e}")

        total_alteracoes += alteracoes_regra
        logger.info(f"Regra {regra.nome}: {alteracoes_regra} alterações")

    logger.info(f"Total de alterações automáticas: {total_alteracoes}")
    return total_alteracoes


@shared_task
def notificar_mudancas_status_criticas():
    """Notifica sobre mudanças de status críticas"""
    # Buscar mudanças para INADIMPLENTE ou BLOQUEADO nas últimas 24h
    ultimo_dia = timezone.now() - timedelta(days=1)
    mudancas_criticas = HistoricoStatus.objects.filter(
        timestamp__gte=ultimo_dia,
        status_novo__in=['INADIMPLENTE', 'BLOQUEADO']
    ).select_related('inquilino')

    if mudancas_criticas.exists():
        # Implementar notificação (email, Slack, etc.)
        logger.warning(f"{mudancas_criticas.count()} mudanças de status críticas nas últimas 24h")

    return mudancas_criticas.count()


@shared_task
def gerar_relatorio_status_semanal():
    """Gera relatório semanal de status dos inquilinos"""
    from django.db.models import Count

    # Distribuição atual de status
    distribuicao = Inquilino.objects.values('status').annotate(
        count=Count('id')
    ).order_by('status')

    # Mudanças na última semana
    ultima_semana = timezone.now() - timedelta(days=7)
    mudancas_semana = HistoricoStatus.objects.filter(
        timestamp__gte=ultima_semana
    ).values('status_novo').annotate(
        count=Count('id')
    ).order_by('status_novo')

    relatorio = {
        'periodo': f"{ultima_semana.date()} a {timezone.now().date()}",
        'distribuicao_atual': list(distribuicao),
        'mudancas_semana': list(mudancas_semana),
        'total_inquilinos': Inquilino.objects.count(),
        'total_mudancas': HistoricoStatus.objects.filter(timestamp__gte=ultima_semana).count()
    }

    logger.info(f"Relatório semanal gerado: {relatorio}")
    return relatorio


@shared_task
def limpar_historico_antigo():
    """Remove histórico de status muito antigo conforme política de retenção"""
    # Manter apenas os últimos 2 anos de histórico
    data_limite = timezone.now() - timedelta(days=730)

    historicos_antigos = HistoricoStatus.objects.filter(timestamp__lt=data_limite)
    count = historicos_antigos.count()

    if count > 0:
        historicos_antigos.delete()
        logger.info(f"Removidos {count} registros de histórico antigos")

    return count
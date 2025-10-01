---
status: pending
parallelizable: false
blocked_by: ["1.0", "4.0"]
---

<task_context>
<domain>backend/business-logic</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>database</dependencies>
<unblocks>6.0</unblocks>
</task_context>

# Tarefa 5.0: Desenvolver sistema de gestão de status e histórico

## Visão Geral
Implementar sistema completo de gestão de status de inquilinos com transições automatizadas, regras de negócio, histórico completo de mudanças, e notificações. Sistema fundamental para controle operacional e compliance.

## Requisitos
- Estados bem definidos: Ativo, Inativo, Inadimplente, Bloqueado
- Transições de status com validações de negócio
- Histórico completo com auditoria
- Regras automatizadas baseadas em critérios
- API endpoints para alteração de status
- Notificações de mudanças de status
- Relatórios de status por período
- Integração com sistema de associações

## Subtarefas
- [ ] 5.1 Definir máquina de estados e transições válidas
- [ ] 5.2 Implementar validações de mudança de status
- [ ] 5.3 Criar sistema de histórico detalhado
- [ ] 5.4 Desenvolver regras automatizadas de status
- [ ] 5.5 Implementar API endpoints de gestão
- [ ] 5.6 Criar sistema de notificações
- [ ] 5.7 Desenvolver relatórios de status
- [ ] 5.8 Integrar com sistema de associações

## Sequenciamento
- Bloqueado por: 1.0 (Modelo base), 4.0 (API base)
- Desbloqueia: 6.0 (Associações avançadas)
- Paralelizável: Não (base para associações)

## Detalhes de Implementação

### Sistema de Estados
```python
# aptos/models.py (extensão)
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

class StatusManager(models.Manager):
    """Manager customizado para operações de status"""

    def transition_to(self, inquilino, novo_status, motivo, usuario=None):
        """Executa transição de status com validações"""
        if not self.can_transition(inquilino.status, novo_status):
            raise ValueError(f"Transição inválida: {inquilino.status} -> {novo_status}")

        # Registrar histórico antes da mudança
        HistoricoStatus.objects.create(
            inquilino=inquilino,
            status_anterior=inquilino.status,
            status_novo=novo_status,
            motivo=motivo,
            usuario=usuario
        )

        # Executar ações específicas da transição
        self._execute_transition_actions(inquilino, inquilino.status, novo_status)

        # Atualizar status
        inquilino.status = novo_status
        inquilino.save()

        return inquilino

    def can_transition(self, status_atual, novo_status):
        """Verifica se a transição é válida"""
        transicoes_validas = {
            'ATIVO': ['INATIVO', 'INADIMPLENTE', 'BLOQUEADO'],
            'INATIVO': ['ATIVO'],
            'INADIMPLENTE': ['ATIVO', 'BLOQUEADO'],
            'BLOQUEADO': ['ATIVO', 'INATIVO'],
        }

        return novo_status in transicoes_validas.get(status_atual, [])

    def _execute_transition_actions(self, inquilino, status_anterior, novo_status):
        """Executa ações específicas da transição"""
        if novo_status == 'BLOQUEADO':
            # Finalizar associações ativas
            inquilino.associacoes_apartamento.filter(ativo=True).update(
                ativo=False,
                data_fim=timezone.now().date()
            )

        elif novo_status == 'INADIMPLENTE':
            # Notificar administradores
            self._notify_inadimplencia(inquilino)

        elif status_anterior in ['BLOQUEADO', 'INADIMPLENTE'] and novo_status == 'ATIVO':
            # Log de reativação
            logger.info(f"Inquilino {inquilino.id} reativado: {status_anterior} -> {novo_status}")

    def _notify_inadimplencia(self, inquilino):
        """Notifica sobre inadimplência"""
        # Implementar sistema de notificações
        pass

class StatusInquilino(models.Model):
    """Modelo estendido para gestão de status"""
    objects = StatusManager()

    class Meta:
        proxy = True
        verbose_name = "Status de Inquilino"

class HistoricoStatus(models.Model):
    """Histórico detalhado de mudanças de status"""
    MOTIVO_CHOICES = [
        ('MANUAL', 'Alteração Manual'),
        ('AUTOMATICO', 'Alteração Automática'),
        ('INADIMPLENCIA', 'Inadimplência Detectada'),
        ('PAGAMENTO', 'Pagamento Recebido'),
        ('VIOLACAO_CONTRATO', 'Violação de Contrato'),
        ('TERMINO_LOCACAO', 'Término de Locação'),
        ('REATIVACAO', 'Reativação'),
    ]

    inquilino = models.ForeignKey(
        Inquilino,
        on_delete=models.CASCADE,
        related_name='historico_status'
    )
    status_anterior = models.CharField(max_length=15, choices=Inquilino.STATUS_CHOICES)
    status_novo = models.CharField(max_length=15, choices=Inquilino.STATUS_CHOICES)
    motivo = models.TextField()
    categoria_motivo = models.CharField(
        max_length=20,
        choices=MOTIVO_CHOICES,
        default='MANUAL'
    )
    usuario = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    metadata = models.JSONField(default=dict)  # Dados adicionais
    timestamp = models.DateTimeField(auto_now_add=True)

    # Campos para auditoria
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['inquilino', 'timestamp']),
            models.Index(fields=['status_novo', 'timestamp']),
        ]

    def __str__(self):
        return f"{self.inquilino} - {self.status_anterior} → {self.status_novo}"

class RegraStatus(models.Model):
    """Regras automatizadas para mudança de status"""
    CRITERIO_CHOICES = [
        ('DIAS_SEM_PAGAMENTO', 'Dias sem Pagamento'),
        ('TEMPO_INATIVO', 'Tempo Inativo'),
        ('VIOLACAO_CONTRATO', 'Violação de Contrato'),
        ('TERMINO_ASSOCIACAO', 'Término de Associação'),
    ]

    ACTION_CHOICES = [
        ('INADIMPLENTE', 'Marcar como Inadimplente'),
        ('BLOQUEADO', 'Bloquear Inquilino'),
        ('INATIVO', 'Marcar como Inativo'),
        ('NOTIFICAR', 'Apenas Notificar'),
    ]

    nome = models.CharField(max_length=100)
    descricao = models.TextField()
    criterio = models.CharField(max_length=30, choices=CRITERIO_CHOICES)
    parametros = models.JSONField(default=dict)
    acao = models.CharField(max_length=20, choices=ACTION_CHOICES)
    ativa = models.BooleanField(default=True)
    automatica = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def avaliar_inquilino(self, inquilino):
        """Avalia se a regra se aplica ao inquilino"""
        if not self.ativa:
            return False

        if self.criterio == 'DIAS_SEM_PAGAMENTO':
            return self._avaliar_dias_sem_pagamento(inquilino)
        elif self.criterio == 'TEMPO_INATIVO':
            return self._avaliar_tempo_inativo(inquilino)
        # Implementar outros critérios...

        return False

    def _avaliar_dias_sem_pagamento(self, inquilino):
        """Avalia critério de dias sem pagamento"""
        dias_limite = self.parametros.get('dias_limite', 30)
        # Implementar lógica de verificação de pagamentos
        # Esta implementação dependeria de um sistema de pagamentos
        return False

    def _avaliar_tempo_inativo(self, inquilino):
        """Avalia critério de tempo inativo"""
        dias_limite = self.parametros.get('dias_limite', 90)
        if inquilino.status != 'INATIVO':
            return False

        # Verificar última atividade
        ultimo_historico = inquilino.historico_status.filter(
            status_novo='INATIVO'
        ).first()

        if ultimo_historico:
            dias_inativo = (timezone.now().date() - ultimo_historico.timestamp.date()).days
            return dias_inativo >= dias_limite

        return False

    def executar_acao(self, inquilino, usuario=None):
        """Executa a ação da regra"""
        if self.acao in ['INADIMPLENTE', 'BLOQUEADO', 'INATIVO']:
            StatusInquilino.objects.transition_to(
                inquilino=inquilino,
                novo_status=self.acao,
                motivo=f"Regra automática: {self.nome}",
                usuario=usuario
            )
        elif self.acao == 'NOTIFICAR':
            self._enviar_notificacao(inquilino)

    def _enviar_notificacao(self, inquilino):
        """Envia notificação sobre o inquilino"""
        # Implementar sistema de notificações
        pass
```

### API para Gestão de Status
```python
# aptos/views.py (extensão)
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from .models import StatusInquilino, HistoricoStatus, RegraStatus

class StatusViewSet(viewsets.ModelViewSet):
    """ViewSet para gestão de status"""
    queryset = HistoricoStatus.objects.all()
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'])
    def alterar_status_inquilino(self, request):
        """Altera status de um inquilino"""
        inquilino_id = request.data.get('inquilino_id')
        novo_status = request.data.get('status')
        motivo = request.data.get('motivo', '')
        categoria = request.data.get('categoria', 'MANUAL')

        try:
            inquilino = Inquilino.objects.get(id=inquilino_id)

            # Verificar permissões
            if not self._can_change_status(request.user, inquilino, novo_status):
                return Response(
                    {'error': 'Sem permissão para alterar este status'},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Executar transição
            StatusInquilino.objects.transition_to(
                inquilino=inquilino,
                novo_status=novo_status,
                motivo=motivo,
                usuario=request.user
            )

            # Registrar metadados da requisição
            historico = HistoricoStatus.objects.filter(
                inquilino=inquilino
            ).first()

            if historico:
                historico.ip_address = self._get_client_ip(request)
                historico.user_agent = request.META.get('HTTP_USER_AGENT', '')
                historico.categoria_motivo = categoria
                historico.save()

            return Response({
                'success': True,
                'message': f'Status alterado para {novo_status}',
                'status_anterior': inquilino.status,
                'status_novo': novo_status
            })

        except Inquilino.DoesNotExist:
            return Response(
                {'error': 'Inquilino não encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def historico_inquilino(self, request):
        """Retorna histórico de status de um inquilino"""
        inquilino_id = request.query_params.get('inquilino_id')

        if not inquilino_id:
            return Response(
                {'error': 'inquilino_id é obrigatório'},
                status=status.HTTP_400_BAD_REQUEST
            )

        historico = HistoricoStatus.objects.filter(
            inquilino_id=inquilino_id
        ).select_related('usuario')

        serializer = HistoricoStatusSerializer(historico, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def relatorio_status(self, request):
        """Relatório de distribuição de status"""
        from django.db.models import Count

        # Distribuição atual
        distribuicao = Inquilino.objects.values('status').annotate(
            count=Count('id')
        ).order_by('status')

        # Mudanças no último mês
        ultimo_mes = timezone.now() - timedelta(days=30)
        mudancas_recentes = HistoricoStatus.objects.filter(
            timestamp__gte=ultimo_mes
        ).values('status_novo').annotate(
            count=Count('id')
        ).order_by('status_novo')

        # Top motivos de mudança
        top_motivos = HistoricoStatus.objects.filter(
            timestamp__gte=ultimo_mes
        ).values('categoria_motivo').annotate(
            count=Count('id')
        ).order_by('-count')[:5]

        return Response({
            'distribuicao_atual': list(distribuicao),
            'mudancas_ultimo_mes': list(mudancas_recentes),
            'top_motivos': list(top_motivos),
            'total_inquilinos': Inquilino.objects.count(),
            'ativos': Inquilino.objects.filter(status='ATIVO').count(),
            'inadimplentes': Inquilino.objects.filter(status='INADIMPLENTE').count(),
        })

    @action(detail=False, methods=['post'])
    def aplicar_regras_automaticas(self, request):
        """Aplica regras automatizadas de status"""
        regras_ativas = RegraStatus.objects.filter(ativa=True, automatica=True)
        inquilinos_processados = 0
        alteracoes_realizadas = 0

        for regra in regras_ativas:
            inquilinos = Inquilino.objects.all()

            for inquilino in inquilinos:
                inquilinos_processados += 1

                if regra.avaliar_inquilino(inquilino):
                    regra.executar_acao(inquilino, request.user)
                    alteracoes_realizadas += 1

        return Response({
            'inquilinos_processados': inquilinos_processados,
            'alteracoes_realizadas': alteracoes_realizadas,
            'regras_aplicadas': regras_ativas.count()
        })

    def _can_change_status(self, user, inquilino, novo_status):
        """Verifica se usuário pode alterar status"""
        # Implementar lógica de permissões
        # Por exemplo: apenas administradores podem bloquear
        if novo_status == 'BLOQUEADO':
            return user.has_perm('aptos.can_block_inquilino')

        return user.has_perm('aptos.change_inquilino')

    def _get_client_ip(self, request):
        """Obtém IP do cliente"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

# Serializers
class HistoricoStatusSerializer(serializers.ModelSerializer):
    usuario_nome = serializers.CharField(source='usuario.get_full_name', read_only=True)
    tempo_decorrido = serializers.SerializerMethodField()

    class Meta:
        model = HistoricoStatus
        fields = [
            'id', 'status_anterior', 'status_novo', 'motivo',
            'categoria_motivo', 'usuario_nome', 'timestamp',
            'tempo_decorrido', 'metadata'
        ]

    def get_tempo_decorrido(self, obj):
        """Calcula tempo decorrido desde a mudança"""
        delta = timezone.now() - obj.timestamp
        if delta.days > 0:
            return f"{delta.days} dias atrás"
        elif delta.seconds > 3600:
            horas = delta.seconds // 3600
            return f"{horas} horas atrás"
        else:
            minutos = delta.seconds // 60
            return f"{minutos} minutos atrás"
```

### Task Periódica para Regras Automáticas
```python
# aptos/tasks.py
from celery import shared_task
from .models import RegraStatus, Inquilino
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
    from datetime import timedelta

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
```

## Critérios de Sucesso
- [ ] Máquina de estados implementada com transições válidas
- [ ] Histórico completo de mudanças registrado
- [ ] Regras automatizadas funcionando
- [ ] API endpoints para gestão de status
- [ ] Validações de negócio implementadas
- [ ] Sistema de notificações funcionando
- [ ] Relatórios de status gerados
- [ ] Integração com associações funcionando
- [ ] Tasks automáticas configuradas
- [ ] Auditoria completa de mudanças
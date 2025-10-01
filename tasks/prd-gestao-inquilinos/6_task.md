---
status: pending
parallelizable: false
blocked_by: ["4.0", "5.0"]
---

<task_context>
<domain>backend/business-logic</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>high</complexity>
<dependencies>database</dependencies>
<unblocks>12.0</unblocks>
</task_context>

# Tarefa 6.0: Implementar associações Inquilino-Apartamento com controle de períodos

## Visão Geral
Desenvolver sistema completo de gestão de associações entre inquilinos e apartamentos, incluindo controle de períodos de locação, histórico completo, validações de negócio e APIs para manipulação das associações. Sistema deve suportar co-locação e multi-propriedade.

## Requisitos
- Associações many-to-many com controle temporal
- Validações de sobreposição de períodos
- Histórico completo de todas as associações
- Cálculo automático de duração de locações
- APIs para gestão de associações
- Suporte a co-locação (múltiplos inquilinos por apartamento)
- Suporte a multi-propriedade (inquilino em múltiplos apartamentos)
- Regras de negócio baseadas em status

## Subtarefas
- [ ] 6.1 Expandir modelo InquilinoApartamento com campos necessários
- [ ] 6.2 Implementar validações de período e sobreposição
- [ ] 6.3 Criar métodos de negócio para associações
- [ ] 6.4 Desenvolver APIs REST para gestão de associações
- [ ] 6.5 Implementar cálculos automáticos (duração, ocupação)
- [ ] 6.6 Criar sistema de histórico e auditoria
- [ ] 6.7 Adicionar validações de status de inquilino
- [ ] 6.8 Implementar relatórios de ocupação

## Sequenciamento
- Bloqueado por: 4.0 (API base), 5.0 (Sistema de status)
- Desbloqueia: 12.0 (Interface de associações)
- Paralelizável: Não (depende do sistema de status)

## Detalhes de Implementação

### Modelo Expandido
```python
# aptos/models.py (expansão)
from django.core.exceptions import ValidationError
from django.db.models import Q
from datetime import date, timedelta

class InquilinoApartamento(models.Model):
    inquilino = models.ForeignKey(
        Inquilino,
        on_delete=models.CASCADE,
        related_name='associacoes_apartamento'
    )
    apartamento = models.ForeignKey(
        'Aptos',
        on_delete=models.CASCADE,
        related_name='associacoes_inquilino'
    )
    data_inicio = models.DateField()
    data_fim = models.DateField(blank=True, null=True)
    valor_aluguel = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True
    )
    ativo = models.BooleanField(default=True)
    observacoes = models.TextField(blank=True, null=True)

    # Auditoria
    created_by = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='associacoes_criadas'
    )
    updated_by = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='associacoes_atualizadas'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['inquilino', 'apartamento', 'data_inicio']
        ordering = ['-data_inicio']

    def clean(self):
        """Validações customizadas"""
        if self.data_fim and self.data_inicio > self.data_fim:
            raise ValidationError('Data de início deve ser anterior à data de fim.')

        if self.data_inicio > date.today():
            # Permitir datas futuras, mas validar se não é muito distante
            max_future = date.today() + timedelta(days=365)
            if self.data_inicio > max_future:
                raise ValidationError('Data de início não pode ser superior a 1 ano no futuro.')

        # Validar sobreposição de períodos para o mesmo apartamento
        self._validar_sobreposicao()

        # Validar status do inquilino
        self._validar_status_inquilino()

    def _validar_sobreposicao(self):
        """Valida se não há sobreposição de períodos ativos"""
        conflitos = InquilinoApartamento.objects.filter(
            apartamento=self.apartamento,
            ativo=True
        ).exclude(pk=self.pk)

        for conflito in conflitos:
            # Se conflito não tem data_fim, está ativo indefinidamente
            if not conflito.data_fim:
                if not self.data_fim or self.data_inicio <= conflito.data_inicio:
                    raise ValidationError(
                        f'Conflito com associação ativa de {conflito.inquilino} '
                        f'iniciada em {conflito.data_inicio}'
                    )
            else:
                # Verificar sobreposição de períodos
                if (self.data_inicio <= conflito.data_fim and
                    (not self.data_fim or self.data_fim >= conflito.data_inicio)):
                    raise ValidationError(
                        f'Período conflita com associação de {conflito.inquilino} '
                        f'({conflito.data_inicio} a {conflito.data_fim})'
                    )

    def _validar_status_inquilino(self):
        """Valida se inquilino pode ser associado baseado no status"""
        if self.inquilino.status == 'BLOQUEADO':
            raise ValidationError('Inquilino bloqueado não pode ser associado a apartamentos.')

    @property
    def duracao_dias(self):
        """Calcula duração da locação em dias"""
        fim = self.data_fim or date.today()
        return (fim - self.data_inicio).days

    @property
    def duracao_meses(self):
        """Calcula duração aproximada em meses"""
        return round(self.duracao_dias / 30.44, 1)  # Média de dias por mês

    @property
    def esta_ativo(self):
        """Verifica se a associação está ativa atualmente"""
        if not self.ativo:
            return False
        if self.data_inicio > date.today():
            return False
        if self.data_fim and self.data_fim < date.today():
            return False
        return True

    def finalizar_associacao(self, data_fim=None, user=None):
        """Finaliza a associação"""
        self.data_fim = data_fim or date.today()
        self.ativo = False
        if user:
            self.updated_by = user
        self.save()

    def __str__(self):
        status = "Ativo" if self.esta_ativo else "Finalizado"
        return f"{self.inquilino} - {self.apartamento} ({status})"

class HistoricoAssociacao(models.Model):
    """Histórico de mudanças nas associações"""
    ACAO_CHOICES = [
        ('CRIADA', 'Criada'),
        ('ATUALIZADA', 'Atualizada'),
        ('FINALIZADA', 'Finalizada'),
        ('REATIVADA', 'Reativada'),
    ]

    associacao = models.ForeignKey(
        InquilinoApartamento,
        on_delete=models.CASCADE,
        related_name='historico'
    )
    acao = models.CharField(max_length=20, choices=ACAO_CHOICES)
    detalhes = models.JSONField(default=dict)  # Armazena dados anteriores/novos
    observacoes = models.TextField(blank=True, null=True)
    usuario = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True
    )
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
```

### Serializers para API
```python
# aptos/serializers.py (adição)
class AssociacaoSerializer(serializers.ModelSerializer):
    inquilino_nome = serializers.SerializerMethodField()
    apartamento_info = serializers.SerializerMethodField()
    duracao_meses = serializers.ReadOnlyField()
    esta_ativo = serializers.ReadOnlyField()

    class Meta:
        model = InquilinoApartamento
        fields = [
            'id', 'inquilino', 'apartamento', 'data_inicio', 'data_fim',
            'valor_aluguel', 'ativo', 'observacoes', 'inquilino_nome',
            'apartamento_info', 'duracao_meses', 'esta_ativo',
            'created_at', 'updated_at'
        ]

    def get_inquilino_nome(self, obj):
        if obj.inquilino.tipo == 'PF':
            return obj.inquilino.nome_completo
        return obj.inquilino.razao_social

    def get_apartamento_info(self, obj):
        return {
            'unit_number': obj.apartamento.unit_number,
            'building_name': obj.apartamento.building_name.name,
            'floor': obj.apartamento.floor,
        }

    def validate(self, data):
        """Validação customizada"""
        inquilino = data.get('inquilino')

        # Verificar status do inquilino
        if inquilino and inquilino.status == 'BLOQUEADO':
            raise serializers.ValidationError(
                'Inquilino bloqueado não pode ser associado a apartamentos.'
            )

        return data

class AssociacaoListSerializer(serializers.ModelSerializer):
    """Serializer otimizado para listagem"""
    inquilino_nome = serializers.SerializerMethodField()
    apartamento_numero = serializers.CharField(source='apartamento.unit_number')
    edificio_nome = serializers.CharField(source='apartamento.building_name.name')
    status_inquilino = serializers.CharField(source='inquilino.status')

    class Meta:
        model = InquilinoApartamento
        fields = [
            'id', 'inquilino_nome', 'apartamento_numero', 'edificio_nome',
            'data_inicio', 'data_fim', 'valor_aluguel', 'ativo',
            'status_inquilino', 'esta_ativo'
        ]

    def get_inquilino_nome(self, obj):
        if obj.inquilino.tipo == 'PF':
            return obj.inquilino.nome_completo
        return obj.inquilino.razao_social
```

### ViewSet para Associações
```python
# aptos/views.py (adição)
class AssociacaoViewSet(viewsets.ModelViewSet):
    queryset = InquilinoApartamento.objects.select_related(
        'inquilino', 'apartamento', 'apartamento__building_name'
    ).all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['ativo', 'inquilino', 'apartamento']
    ordering_fields = ['data_inicio', 'data_fim', 'created_at']
    ordering = ['-data_inicio']

    def get_serializer_class(self):
        if self.action == 'list':
            return AssociacaoListSerializer
        return AssociacaoSerializer

    def perform_create(self, serializer):
        associacao = serializer.save(created_by=self.request.user)

        # Registrar no histórico
        HistoricoAssociacao.objects.create(
            associacao=associacao,
            acao='CRIADA',
            detalhes={
                'data_inicio': str(associacao.data_inicio),
                'data_fim': str(associacao.data_fim) if associacao.data_fim else None,
                'valor_aluguel': str(associacao.valor_aluguel) if associacao.valor_aluguel else None,
            },
            usuario=self.request.user
        )

    def perform_update(self, serializer):
        associacao_anterior = self.get_object()
        dados_anteriores = {
            'data_inicio': str(associacao_anterior.data_inicio),
            'data_fim': str(associacao_anterior.data_fim) if associacao_anterior.data_fim else None,
            'valor_aluguel': str(associacao_anterior.valor_aluguel) if associacao_anterior.valor_aluguel else None,
            'ativo': associacao_anterior.ativo,
        }

        associacao = serializer.save(updated_by=self.request.user)

        # Registrar no histórico
        HistoricoAssociacao.objects.create(
            associacao=associacao,
            acao='ATUALIZADA',
            detalhes={
                'anterior': dados_anteriores,
                'novo': {
                    'data_inicio': str(associacao.data_inicio),
                    'data_fim': str(associacao.data_fim) if associacao.data_fim else None,
                    'valor_aluguel': str(associacao.valor_aluguel) if associacao.valor_aluguel else None,
                    'ativo': associacao.ativo,
                }
            },
            usuario=self.request.user
        )

    @action(detail=True, methods=['post'])
    def finalizar(self, request, pk=None):
        """Finaliza uma associação"""
        associacao = self.get_object()
        data_fim = request.data.get('data_fim', date.today().isoformat())
        observacoes = request.data.get('observacoes', '')

        try:
            associacao.finalizar_associacao(
                data_fim=datetime.strptime(data_fim, '%Y-%m-%d').date(),
                user=request.user
            )

            # Registrar no histórico
            HistoricoAssociacao.objects.create(
                associacao=associacao,
                acao='FINALIZADA',
                detalhes={'data_fim': data_fim},
                observacoes=observacoes,
                usuario=request.user
            )

            return Response({
                'success': True,
                'message': 'Associação finalizada com sucesso'
            })

        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def relatorio_ocupacao(self, request):
        """Relatório de ocupação de apartamentos"""
        apartamentos_ocupados = self.get_queryset().filter(
            ativo=True,
            data_inicio__lte=date.today(),
            Q(data_fim__isnull=True) | Q(data_fim__gte=date.today())
        ).values('apartamento').distinct().count()

        total_apartamentos = Aptos.objects.count()

        ocupacao_por_mes = []
        for i in range(12):
            data_ref = date.today() - timedelta(days=30 * i)
            ocupadas = self.get_queryset().filter(
                data_inicio__lte=data_ref,
                Q(data_fim__isnull=True) | Q(data_fim__gte=data_ref),
                ativo=True
            ).count()

            ocupacao_por_mes.append({
                'mes': data_ref.strftime('%Y-%m'),
                'ocupadas': ocupadas,
                'percentual': round((ocupadas / total_apartamentos) * 100, 1) if total_apartamentos > 0 else 0
            })

        return Response({
            'resumo': {
                'apartamentos_ocupados': apartamentos_ocupados,
                'total_apartamentos': total_apartamentos,
                'taxa_ocupacao': round((apartamentos_ocupados / total_apartamentos) * 100, 1) if total_apartamentos > 0 else 0
            },
            'historico_ocupacao': list(reversed(ocupacao_por_mes))
        })
```

## Critérios de Sucesso
- [ ] Modelo InquilinoApartamento funcionando com todas as validações
- [ ] Validações de sobreposição de períodos implementadas
- [ ] Sistema de histórico registrando todas as mudanças
- [ ] APIs REST funcionando para todas as operações
- [ ] Cálculos automáticos (duração, ocupação) corretos
- [ ] Suporte a co-locação e multi-propriedade
- [ ] Validações de status integradas
- [ ] Relatórios de ocupação funcionando
- [ ] Testes unitários cobrindo cenários complexos
- [ ] Performance otimizada para queries grandes
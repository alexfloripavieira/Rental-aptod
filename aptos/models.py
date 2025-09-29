from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.utils import timezone
from .validators import validar_cpf_django, validar_cnpj_django
from .utils import formatar_cpf, formatar_cnpj, limpar_documento


class Builders(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    street = models.CharField(max_length=100)
    neighborhood = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    zip_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100)
    video = models.FileField(
        upload_to="builders/builders_videos", blank=True, null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Aptos(models.Model):
    id = models.AutoField(primary_key=True)
    unit_number = models.CharField(max_length=10)
    floor = models.CharField(max_length=20, blank=True, null=True)
    building_name = models.ForeignKey(
        Builders, on_delete=models.CASCADE, related_name="aptos_building_name"
    )
    description = models.TextField()
    rental_price = models.FloatField(default=0.0)
    is_available = models.BooleanField(default=True)
    is_furnished = models.BooleanField(default=False)
    is_pets_allowed = models.BooleanField(default=False)
    has_laundry = models.BooleanField(default=False)
    has_parking = models.BooleanField(default=False)
    has_internet = models.BooleanField(default=False)
    has_air_conditioning = models.BooleanField(default=False)
    number_of_bedrooms = models.IntegerField()
    number_of_bathrooms = models.IntegerField()
    square_footage = models.IntegerField()
    video = models.FileField(upload_to="aptos/aptos_videos", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.unit_number


class Foto(models.Model):
    apto = models.ForeignKey(Aptos, related_name="fotos", on_delete=models.CASCADE)
    description = models.CharField(max_length=10, blank=True, null=True)
    photos = models.ImageField(upload_to="aptos/aptos_photos", blank=True, null=True)

    def __str__(self):
        return self.apto.unit_number


class BuilderFoto(models.Model):
    builder = models.ForeignKey(
        Builders, related_name="builder_fotos", on_delete=models.CASCADE
    )
    description = models.CharField(max_length=10, blank=True, null=True)
    photos = models.ImageField(
        upload_to="builders/builders_photos", blank=True, null=True
    )

    def __str__(self):
        return self.builder.name


class Inquilino(models.Model):
    TIPO_CHOICES = [
        ('PF', 'Pessoa Física'),
        ('PJ', 'Pessoa Jurídica'),
    ]

    STATUS_CHOICES = [
        ('ATIVO', 'Ativo'),
        ('INATIVO', 'Inativo'),
        ('INADIMPLENTE', 'Inadimplente'),
        ('BLOQUEADO', 'Bloqueado'),
    ]

    # Campos comuns
    id = models.AutoField(primary_key=True)
    tipo = models.CharField(max_length=2, choices=TIPO_CHOICES)
    email = models.EmailField(unique=True)
    telefone = models.CharField(max_length=20)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='ATIVO')
    observacoes = models.TextField(blank=True, null=True)

    # Campos Pessoa Física
    nome_completo = models.CharField(max_length=200, blank=True, null=True)
    cpf = models.CharField(
        max_length=14,
        blank=True,
        null=True,
        unique=True,
        validators=[validar_cpf_django],
        help_text="Formato: XXX.XXX.XXX-XX"
    )
    rg = models.CharField(max_length=20, blank=True, null=True)
    data_nascimento = models.DateField(blank=True, null=True)
    estado_civil = models.CharField(max_length=50, blank=True, null=True)
    profissao = models.CharField(max_length=100, blank=True, null=True)
    renda = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)

    # Campos Pessoa Jurídica
    razao_social = models.CharField(max_length=200, blank=True, null=True)
    nome_fantasia = models.CharField(max_length=200, blank=True, null=True)
    cnpj = models.CharField(
        max_length=18,
        blank=True,
        null=True,
        unique=True,
        validators=[validar_cnpj_django],
        help_text="Formato: XX.XXX.XXX/XXXX-XX"
    )
    inscricao_estadual = models.CharField(max_length=30, blank=True, null=True)
    responsavel_legal = models.CharField(max_length=200, blank=True, null=True)

    # Endereço (opcional)
    endereco_completo = models.TextField(blank=True, null=True)

    # Relacionamentos
    apartamentos = models.ManyToManyField(
        'Aptos',
        through='InquilinoApartamento',
        related_name='inquilinos'
    )

    # Auditoria
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Inquilino'
        verbose_name_plural = 'Inquilinos'

    def clean(self):
        if self.tipo == 'PF':
            if not self.nome_completo:
                raise ValidationError('Nome completo é obrigatório para Pessoa Física')
            if not self.cpf:
                raise ValidationError('CPF é obrigatório para Pessoa Física')
        elif self.tipo == 'PJ':
            if not self.razao_social:
                raise ValidationError('Razão social é obrigatória para Pessoa Jurídica')
            if not self.cnpj:
                raise ValidationError('CNPJ é obrigatório para Pessoa Jurídica')

    def save(self, *args, **kwargs):
        # Limpar e formatar documentos antes de salvar
        if self.cpf:
            self.cpf = limpar_documento(self.cpf)
        if self.cnpj:
            self.cnpj = limpar_documento(self.cnpj)

        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        if self.tipo == 'PF':
            return f"{self.nome_completo} (CPF: {self.cpf})"
        else:
            return f"{self.razao_social} (CNPJ: {self.cnpj})"

    @property
    def identificacao(self):
        return self.cpf if self.tipo == 'PF' else self.cnpj

    @property
    def identificacao_formatada(self):
        if self.tipo == 'PF' and self.cpf:
            return formatar_cpf(self.cpf)
        elif self.tipo == 'PJ' and self.cnpj:
            return formatar_cnpj(self.cnpj)
        return ''

    @property
    def nome_principal(self):
        return self.nome_completo if self.tipo == 'PF' else self.razao_social

    @property
    def cpf_formatado(self):
        return formatar_cpf(self.cpf) if self.cpf else ''

    @property
    def cnpj_formatado(self):
        return formatar_cnpj(self.cnpj) if self.cnpj else ''

    def get_apartamentos_ativos(self):
        return self.apartamentos.filter(
            associacoes_inquilino__ativo=True,
            associacoes_inquilino__data_fim__isnull=True
        )

    def get_historico_locacoes(self):
        return InquilinoApartamento.objects.filter(inquilino=self).order_by('-data_inicio')


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
        verbose_name = 'Associação Inquilino-Apartamento'
        verbose_name_plural = 'Associações Inquilino-Apartamento'
        ordering = ['-data_inicio']
        constraints = [
            models.UniqueConstraint(
                fields=['apartamento'],
                condition=models.Q(ativo=True),
                name='unique_apartamento_associacao_ativa'
            )
        ]

    def clean(self):
        """Validações customizadas"""
        from datetime import date, timedelta
        
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
        from datetime import date
        fim = self.data_fim or date.today()
        return (fim - self.data_inicio).days

    @property
    def duracao_meses(self):
        """Calcula duração aproximada em meses"""
        return round(self.duracao_dias / 30.44, 1)  # Média de dias por mês

    @property
    def esta_ativo(self):
        """Verifica se a associação está ativa atualmente"""
        from datetime import date
        if not self.ativo:
            return False
        if self.data_inicio > date.today():
            return False
        if self.data_fim and self.data_fim < date.today():
            return False
        return True

    def save(self, *args, **kwargs):
        self.full_clean(exclude=['created_by', 'updated_by'])
        super().save(*args, **kwargs)
        self._sync_apartamento_disponibilidade()

    def delete(self, *args, **kwargs):
        apartamento = self.apartamento
        super().delete(*args, **kwargs)
        self._sync_apartamento_disponibilidade(apartamento)

    def _sync_apartamento_disponibilidade(self, apartamento=None):
        apartamento = apartamento or self.apartamento
        if apartamento is None:
            return

        has_active = apartamento.associacoes_inquilino.filter(
            ativo=True
        ).exists()

        should_be_available = not has_active
        if apartamento.is_available != should_be_available:
            apartamento.is_available = should_be_available
            apartamento.save(update_fields=['is_available', 'updated_at'])

    def finalizar_associacao(self, data_fim=None, user=None):
        """Finaliza a associação"""
        from datetime import date
        self.data_fim = data_fim or date.today()
        self.ativo = False
        if user:
            self.updated_by = user
        self.save(update_fields=['data_fim', 'ativo', 'updated_by', 'updated_at'])

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
        verbose_name = 'Histórico de Associação'
        verbose_name_plural = 'Históricos de Associações'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.associacao} - {self.get_acao_display()} em {self.timestamp.strftime('%d/%m/%Y %H:%M')}"



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
        from django.utils import timezone
        import logging
        
        logger = logging.getLogger(__name__)
        
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


class StatusInquilino(Inquilino):
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
    motivo = models.TextField(default='Alteração de status')
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
        verbose_name = 'Histórico de Status'
        verbose_name_plural = 'Históricos de Status'
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

    class Meta:
        verbose_name = 'Regra de Status'
        verbose_name_plural = 'Regras de Status'

    def __str__(self):
        return f"{self.nome} ({'Ativa' if self.ativa else 'Inativa'})"

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
        from django.utils import timezone
        
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


class DocumentoInquilino(models.Model):
    class TipoDocumento(models.TextChoices):
        RG = 'RG', 'RG'
        CNH = 'CNH', 'CNH'
        COMPROVANTE_RENDA = 'COMPROVANTE_RENDA', 'Comprovante de Renda'
        COMPROVANTE_RESIDENCIA = 'COMPROVANTE_RESIDENCIA', 'Comprovante de Residência'
        OUTROS = 'OUTROS', 'Outros'

    inquilino = models.ForeignKey(
        Inquilino,
        on_delete=models.CASCADE,
        related_name='documentos'
    )
    tipo_documento = models.CharField(
        max_length=30,
        choices=TipoDocumento.choices,
        default=TipoDocumento.OUTROS
    )
    arquivo = models.FileField(
        upload_to='inquilinos/documentos/'
    )
    nome_original = models.CharField(max_length=255, blank=True, null=True)
    versao = models.PositiveIntegerField(default=1)
    tamanho = models.PositiveIntegerField(blank=True, null=True)  # em bytes
    mime_type = models.CharField(max_length=100, blank=True, null=True)
    uploaded_by = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    ativo = models.BooleanField(default=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['inquilino', 'tipo_documento', 'versao']
        ordering = ['-uploaded_at']
        verbose_name = 'Documento do Inquilino'
        verbose_name_plural = 'Documentos dos Inquilinos'

    def save(self, *args, **kwargs):
        if self.arquivo:
            if not self.tamanho:
                self.tamanho = self.arquivo.size
            if not self.nome_original:
                self.nome_original = self.arquivo.name
            
            # Auto-incrementar versão se necessário
            if not self.versao or self.versao == 1:
                ultima_versao = DocumentoInquilino.objects.filter(
                    inquilino=self.inquilino,
                    tipo_documento=self.tipo_documento
                ).aggregate(max_versao=models.Max('versao'))['max_versao'] or 0
                self.versao = ultima_versao + 1
        
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.inquilino.nome_principal} - {self.get_tipo_documento_display()} v{self.versao}"

    def get_tamanho_formatado(self):
        """Retorna tamanho do arquivo formatado"""
        if not self.tamanho:
            return "N/A"
        if self.tamanho < 1024:
            return f"{self.tamanho} bytes"
        elif self.tamanho < 1024 * 1024:
            return f"{self.tamanho / 1024:.1f} KB"
        else:
            return f"{self.tamanho / (1024 * 1024):.1f} MB"

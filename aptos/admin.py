from django.contrib import admin
from django.db import models
from django.core.exceptions import FieldError
from django.http import HttpResponseRedirect, QueryDict
from django.contrib.admin.views.main import ChangeList

from .models import (
    Aptos, BuilderFoto, Builders, Foto,
    Inquilino, InquilinoApartamento, HistoricoStatus, DocumentoInquilino, HistoricoAssociacao,
    Locador
)


class BuilderFotoInline(admin.TabularInline):
    model = BuilderFoto
    extra = 3
    max_num = 10
    min_num = 0
    fields = ('photos', 'description', 'photo_preview')
    readonly_fields = ('photo_preview',)
    
    def photo_preview(self, obj):
        if obj.photos:
            from django.utils.html import format_html
            return format_html(
                '<img src="{}" style="width: 50px; height: 30px; object-fit: cover; border-radius: 4px;" />',
                obj.photos.url
            )
        return "Sem foto"
    photo_preview.short_description = "Preview"


class BuildersAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "city",
        "state",
        "neighborhood",
        "created_at",
        "apartment_count",
        "photo_count",
    )
    list_filter = (
        "city",
        "state", 
        "created_at",
    )
    search_fields = ("name", "city", "neighborhood", "street")
    # Make previews readonly so they can be referenced in fieldsets (incl. add view)
    readonly_fields = ('created_at', 'updated_at', 'photo_preview', 'video_preview')
    inlines = [BuilderFotoInline]
    list_per_page = 25
    
    # Otimização de queries para PostgreSQL
    def get_queryset(self, request):
        from django.db.models import Count, Prefetch
        return super().get_queryset(request).prefetch_related(
            Prefetch('builder_fotos', queryset=BuilderFoto.objects.only('id', 'photos')),
            'aptos_building_name'
        ).annotate(
            apartment_count=Count('aptos_building_name', distinct=True),
            photo_count=Count('builder_fotos', distinct=True)
        )
    
    def apartment_count(self, obj):
        """Mostra quantos apartamentos a construtora tem"""
        return getattr(obj, 'apartment_count', 0)
    apartment_count.short_description = "Apartamentos"
    apartment_count.admin_order_field = 'apartment_count'
    
    def photo_count(self, obj):
        """Contador de fotos otimizado"""
        return getattr(obj, 'photo_count', 0)
    photo_count.short_description = "Fotos"
    photo_count.admin_order_field = 'photo_count'
    
    # Previews are always readonly; no need to override get_readonly_fields
    
    def photo_preview(self, obj):
        """Preview das fotos no admin com loading lazy"""
        if not obj or not obj.pk:
            return "Salve primeiro para ver fotos"

        if not hasattr(obj, 'builder_fotos'):
            return "Sem fotos"

        fotos = obj.builder_fotos.all()[:3]  # Limita a 3 fotos
        if not fotos:
            return "Sem fotos"
            
        from django.utils.html import format_html
        from django.utils.safestring import mark_safe
        
        photos_html = '<div style="display: flex; gap: 4px; flex-wrap: wrap;">'
        for foto in fotos:
            if foto.photos:
                photos_html += format_html(
                    '<img src="{}" loading="lazy" style="width: 100px; height: 60px; '
                    'object-fit: cover; border-radius: 4px; border: 1px solid #ddd;" '
                    'alt="Foto {}"/>',
                    foto.photos.url, foto.id
                )
        photos_html += '</div>'
        
        if obj.builder_fotos.count() > 3:
            photos_html += format_html(
                '<small style="color: #666;">+{} fotos</small>',
                obj.builder_fotos.count() - 3
            )
        
        return mark_safe(photos_html)
    photo_preview.short_description = "Preview Fotos"

    def video_preview(self, obj):
        """Preview do vídeo no admin"""
        if not obj or not obj.pk:
            return "Salve primeiro para ver vídeo"

        if not obj.video:
            return "Sem vídeo"

        from django.utils.html import format_html
        return format_html(
            '<video width="200" height="120" controls preload="none" '
            'style="border-radius: 4px; border: 1px solid #ddd;">'
            '<source src="{}" type="video/mp4">'
            'Seu navegador não suporta vídeo HTML5.'
            '</video>',
            obj.video.url
        )
    video_preview.short_description = "Preview Vídeo"

    def changelist_view(self, request, extra_context=None):
        """Add statistics to changelist view"""
        extra_context = extra_context or {}
        if request.user.has_perm('aptos.view_builders'):
            qs = self.get_queryset(request)
            extra_context.update({
                'total_builders': qs.count(),
                'builders_with_aptos': qs.filter(apartment_count__gt=0).count(),
            })
        return super().changelist_view(request, extra_context)
    
    fieldsets = (
        ('Informações da Construtora', {
            'fields': ('name',)
        }),
        ('Endereço', {
            'fields': (
                'street',
                ('neighborhood', 'city'),
                ('state', 'zip_code'),
                'country'
            )
        }),
        ('Mídia', {
            'fields': ('video', 'photo_preview', 'video_preview'),
            'classes': ('collapse',)
        }),
        ('Datas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


class FotoInline(admin.TabularInline):
    model = Foto
    extra = 3
    max_num = 10
    min_num = 0
    fields = ('photos', 'description', 'photo_preview')
    readonly_fields = ('photo_preview',)
    
    def photo_preview(self, obj):
        if obj.photos:
            from django.utils.html import format_html
            return format_html(
                '<img src="{}" style="width: 50px; height: 30px; object-fit: cover; border-radius: 4px;" />',
                obj.photos.url
            )
        return "Sem foto"
    photo_preview.short_description = "Preview"

class AptosAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'unit_number',
        'building_name',
        'rental_price',
        'is_available',
        'number_of_bedrooms',
        'number_of_bathrooms',
        'created_at',
        'photo_count',
    )
    list_filter = (
        'is_available',
        'is_furnished',
        'number_of_bedrooms',
        'number_of_bathrooms',
        'has_parking',
        'has_air_conditioning',
        'created_at',
        'building_name__city',
        'building_name__state',
    )
    search_fields = (
        'unit_number',
        'description',
        'building_name__name',
        'building_name__neighborhood',
    )
    # Previews must be marked readonly to be included in fieldsets safely
    readonly_fields = ('created_at', 'updated_at', 'photo_preview', 'video_preview')
    inlines = [FotoInline]
    list_per_page = 25
    list_select_related = ['building_name']  # PostgreSQL optimization
    
    # Otimização de queries para PostgreSQL
    def get_queryset(self, request):
        from django.db.models import Count, Prefetch
        return super().get_queryset(request).select_related(
            'building_name'
        ).prefetch_related(
            Prefetch('fotos', queryset=Foto.objects.only('id', 'photos'))
        ).annotate(
            photo_count=Count('fotos')
        )
    
    def photo_count(self, obj):
        """Contador de fotos otimizado"""
        return getattr(obj, 'photo_count', 0)
    photo_count.short_description = "Fotos"
    photo_count.admin_order_field = 'photo_count'
    
    # Previews are always readonly; no need for conditional override

    def photo_preview(self, obj):
        """Preview das fotos no admin com loading lazy"""
        if not obj or not obj.pk:
            return "Salve primeiro para ver fotos"

        if not hasattr(obj, 'fotos'):
            return "Sem fotos"

        fotos = obj.fotos.all()[:3]  # Limita a 3 fotos
        if not fotos:
            return "Sem fotos"
            
        from django.utils.html import format_html
        from django.utils.safestring import mark_safe
        
        photos_html = '<div style="display: flex; gap: 4px; flex-wrap: wrap;">'
        for foto in fotos:
            if foto.photos:
                photos_html += format_html(
                    '<img src="{}" loading="lazy" style="width: 100px; height: 60px; '
                    'object-fit: cover; border-radius: 4px; border: 1px solid #ddd;" '
                    'alt="Foto {}"/>',
                    foto.photos.url, foto.id
                )
        photos_html += '</div>'
        
        if obj.fotos.count() > 3:
            photos_html += format_html(
                '<small style="color: #666;">+{} fotos</small>',
                obj.fotos.count() - 3
            )
        
        return mark_safe(photos_html)
    photo_preview.short_description = "Preview Fotos"

    def video_preview(self, obj):
        """Preview do vídeo no admin"""
        if not obj or not obj.pk:
            return "Salve primeiro para ver vídeo"

        if not obj.video:
            return "Sem vídeo"

        from django.utils.html import format_html
        return format_html(
            '<video width="200" height="120" controls preload="none" '
            'style="border-radius: 4px; border: 1px solid #ddd;">'
            '<source src="{}" type="video/mp4">'
            'Seu navegador não suporta vídeo HTML5.'
            '</video>',
            obj.video.url
        )
    video_preview.short_description = "Preview Vídeo"

    def changelist_view(self, request, extra_context=None):
        """Add statistics to changelist view"""
        extra_context = extra_context or {}
        if request.user.has_perm('aptos.view_aptos'):
            qs = self.get_queryset(request)
            extra_context.update({
                'total_aptos': qs.count(),
                'available_aptos': qs.filter(is_available=True).count(),
                'occupied_aptos': qs.filter(is_available=False).count(),
            })
        return super().changelist_view(request, extra_context)
    
    fieldsets = (
        ('Informações Básicas', {
            'fields': ('unit_number', 'floor', 'building_name')
        }),
        ('Detalhes do Apartamento', {
            'fields': ('description', 'rental_price', 'square_footage')
        }),
        ('Características', {
            'fields': (
                ('number_of_bedrooms', 'number_of_bathrooms'),
                ('is_available', 'is_furnished'),
                ('is_pets_allowed', 'has_laundry'),
                ('has_parking', 'has_internet', 'has_air_conditioning')
            )
        }),
        ('Mídia', {
            'fields': ('video', 'photo_preview', 'video_preview'),
            'classes': ('collapse',)
        }),
        ('Datas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

admin.site.register(Builders, BuildersAdmin)
admin.site.register(Aptos, AptosAdmin)


# ===== CONFIGURAÇÃO ADMIN PARA INQUILINOS =====

class DocumentoInquilinoInline(admin.TabularInline):
    model = DocumentoInquilino
    extra = 1
    max_num = 10
    fields = ('tipo_documento', 'arquivo', 'versao', 'ativo', 'uploaded_at', 'uploaded_by')
    readonly_fields = ('uploaded_at', 'uploaded_by', 'versao')
    
    def save_model(self, request, obj, form, change):
        if not change:  # Se é um novo documento
            obj.uploaded_by = request.user
        super().save_model(request, obj, form, change)


class HistoricoStatusInline(admin.TabularInline):
    model = HistoricoStatus
    extra = 0
    max_num = 20
    fields = ('status_anterior', 'status_novo', 'motivo', 'usuario', 'timestamp')
    readonly_fields = ('timestamp', 'usuario')
    ordering = ['-timestamp']

    def has_add_permission(self, request, obj=None):
        return False  # Histórico é criado automaticamente

    def has_delete_permission(self, request, obj=None):
        return False  # Não permitir deletar histórico


class InquilinoApartamentoInline(admin.TabularInline):
    model = InquilinoApartamento
    extra = 1
    max_num = 10
    fields = ('apartamento', 'data_inicio', 'data_fim', 'ativo', 'observacoes')
    readonly_fields = ('created_at', 'updated_at')


class InquilinoAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'nome_principal',
        'tipo',
        'identificacao',
        'email',
        'telefone',
        'status',
        'apartamentos_ativos_count',
        'created_at',
    )

    list_filter = (
        'tipo',
        'status',
        'created_at',
        'updated_at',
    )

    search_fields = (
        'nome_completo',
        'razao_social',
        'cpf',
        'cnpj',
        'email',
        'telefone',
    )

    readonly_fields = ('created_at', 'updated_at', 'apartamentos_ativos_display')
    inlines = [InquilinoApartamentoInline, DocumentoInquilinoInline, HistoricoStatusInline]
    list_per_page = 25

    # Helpers ausentes para evitar erros no system check
    def apartamentos_ativos_count(self, obj):
        try:
            return obj.apartamentos.filter(associacoes_inquilino__ativo=True).count()
        except Exception:
            return 0
    apartamentos_ativos_count.short_description = 'Aptos ativos'

    def apartamentos_ativos_display(self, obj):
        try:
            ativos = obj.apartamentos.filter(associacoes_inquilino__ativo=True).values_list('unit_number', flat=True)
            return ", ".join(list(ativos)[:10]) or "—"
        except Exception:
            return "—"

class LocadorChangeList(ChangeList):
    def get_filters_params(self, params=None):
        params = super().get_filters_params(params)
        params.pop('status', None)
        params.pop('status__exact', None)
        return params


@admin.register(Locador)
class LocadorAdmin(admin.ModelAdmin):
    preserve_filters = False
    list_display = ("nome_completo", "cpf", "email", "telefone", "updated_at")
    search_fields = ("nome_completo", "cpf", "email")
    list_filter = ("estado_civil", "endereco_cidade", "endereco_estado")
    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        ("Dados do Locador", {
            'fields': (
                'nome_completo',
                ('nacionalidade', 'estado_civil'),
                ('profissao', 'cpf')
            )
        }),
        ("Contato", {
            'fields': ('email', 'telefone')
        }),
        ("Endereço", {
            'fields': (
                'endereco_rua',
                ('endereco_numero', 'endereco_bairro'),
                ('endereco_cidade', 'endereco_estado'),
                'endereco_cep'
            )
        }),
        ("Auditoria", {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    def _clean_params(self, params):
        allowed_filters = set(f if isinstance(f, str) else f[0] for f in (self.list_filter or ()))
        allowed_params = {'q', 'p', 'o', 'ot', 'is_popup', 'to_field'}
        cleaned = params.copy()
        removed = False

        for key in list(cleaned.keys()):
            base_key = key.split('__', 1)[0]
            if key in allowed_params:
                continue
            if base_key in allowed_filters:
                continue
            cleaned.pop(key, None)
            removed = True

        return cleaned, removed

    def changelist_view(self, request, extra_context=None):
        query = request.GET.copy()
        cleaned, removed = self._clean_params(query)

        filters_param = cleaned.get('_changelist_filters')
        if filters_param:
            filters_qd = QueryDict(filters_param, mutable=True)
            filters_clean, filters_removed = self._clean_params(filters_qd)
            if filters_removed:
                removed = True
                if filters_clean:
                    cleaned['_changelist_filters'] = filters_clean.urlencode()
                else:
                    cleaned.pop('_changelist_filters', None)

        if removed:
            query = cleaned.urlencode()
            url = f"{request.path}?{query}" if query else request.path
            return HttpResponseRedirect(url)

        return super().changelist_view(request, extra_context=extra_context)

    def get_preserved_filters(self, request):
        preserved = super().get_preserved_filters(request)
        if not preserved:
            return preserved

        qdict = QueryDict(preserved, mutable=True)
        cleaned, removed = self._clean_params(qdict)
        if '_changelist_filters' in cleaned:
            filters_qd = QueryDict(cleaned['_changelist_filters'], mutable=True)
            filters_clean, filters_removed = self._clean_params(filters_qd)
            if filters_removed:
                cleaned['_changelist_filters'] = filters_clean.urlencode()
                removed = True
        return cleaned.urlencode() if removed else preserved

    def get_changelist(self, request, **kwargs):
        return LocadorChangeList


class HistoricoAssociacaoInline(admin.TabularInline):
    """Inline para histórico de associações"""
    model = HistoricoAssociacao
    extra = 0
    readonly_fields = ['acao', 'detalhes', 'observacoes', 'usuario', 'timestamp']
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False

class InquilinoApartamentoAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'inquilino',
        'apartamento',
        'data_inicio',
        'data_fim',
        'valor_aluguel',
        'ativo',
        'esta_ativo',
        'duracao_meses',
        'created_by',
        'created_at'
    )

    list_filter = (
        'ativo',
        'data_inicio',
        'data_fim',
        'apartamento__building_name',
        'created_by',
        'created_at'
    )

    search_fields = (
        'inquilino__nome_completo',
        'inquilino__razao_social',
        'inquilino__cpf',
        'inquilino__cnpj',
        'apartamento__unit_number',
        'apartamento__building_name__name'
    )

    readonly_fields = ('created_at', 'updated_at', 'duracao_dias', 'duracao_meses', 'esta_ativo')
    list_select_related = ['inquilino', 'apartamento', 'apartamento__building_name', 'created_by', 'updated_by']
    date_hierarchy = 'data_inicio'
    inlines = [HistoricoAssociacaoInline]

    fieldsets = (
        ('Associação', {
            'fields': ('inquilino', 'apartamento')
        }),
        ('Período', {
            'fields': (
                'data_inicio',
                'data_fim',
                'ativo',
                'esta_ativo',
                'duracao_dias',
                'duracao_meses'
            )
        }),
        ('Informações Financeiras', {
            'fields': ('valor_aluguel',),
            'classes': ('collapse',)
        }),
        ('Observações', {
            'fields': ('observacoes',),
            'classes': ('collapse',)
        }),
        ('Auditoria', {
            'fields': ('created_by', 'updated_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    actions = ['finalizar_associacoes_selecionadas']

    def finalizar_associacoes_selecionadas(self, request, queryset):
        """Ação para finalizar múltiplas associações"""
        count = 0
        for associacao in queryset.filter(ativo=True):
            associacao.finalizar_associacao(user=request.user)
            count += 1
        
        self.message_user(request, f'{count} associações finalizadas com sucesso.')
    
    finalizar_associacoes_selecionadas.short_description = "Finalizar associações selecionadas"

    def save_model(self, request, obj, form, change):
        if not change:  # Se é uma nova associação
            obj.created_by = request.user
        else:
            obj.updated_by = request.user
        super().save_model(request, obj, form, change)


class HistoricoStatusAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'inquilino',
        'status_anterior',
        'status_novo',
        'usuario',
        'timestamp'
    )

    list_filter = (
        'status_anterior',
        'status_novo',
        'timestamp',
        'usuario'
    )

    search_fields = (
        'inquilino__nome_completo',
        'inquilino__razao_social',
        'inquilino__cpf',
        'inquilino__cnpj',
        'motivo'
    )

    readonly_fields = ('timestamp',)
    list_select_related = ['inquilino', 'usuario']
    date_hierarchy = 'timestamp'

    def has_add_permission(self, request):
        return False  # Histórico é criado automaticamente

    def has_delete_permission(self, request, obj=None):
        return False  # Não permitir deletar histórico


class DocumentoInquilinoAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'inquilino',
        'tipo_documento',
        'versao',
        'nome_original',
        'get_tamanho_formatado',
        'ativo',
        'uploaded_at',
        'uploaded_by'
    )

    list_filter = (
        'tipo_documento',
        'ativo',
        'versao',
        'uploaded_at',
        'uploaded_by'
    )

    search_fields = (
        'inquilino__nome_completo',
        'inquilino__razao_social',
        'inquilino__cpf',
        'inquilino__cnpj',
        'nome_original',
        'tipo_documento'
    )

    readonly_fields = ('uploaded_at', 'uploaded_by', 'tamanho', 'mime_type', 'nome_original')
    list_select_related = ['inquilino', 'uploaded_by']
    date_hierarchy = 'uploaded_at'
    list_editable = ['ativo']
    
    fieldsets = (
        ('Informações do Documento', {
            'fields': ('inquilino', 'tipo_documento', 'arquivo', 'versao')
        }),
        ('Metadados', {
            'fields': ('nome_original', 'tamanho', 'mime_type', 'ativo'),
            'classes': ('collapse',)
        }),
        ('Auditoria', {
            'fields': ('uploaded_at', 'uploaded_by'),
            'classes': ('collapse',)
        })
    )

    def save_model(self, request, obj, form, change):
        if not change:  # Se é um novo documento
            obj.uploaded_by = request.user
        super().save_model(request, obj, form, change)
    
    def get_tamanho_formatado(self, obj):
        return obj.get_tamanho_formatado()
    get_tamanho_formatado.short_description = 'Tamanho'




class HistoricoAssociacaoAdmin(admin.ModelAdmin):
    """Admin para histórico de associações"""
    list_display = (
        'id',
        'associacao',
        'acao',
        'usuario',
        'timestamp'
    )

    list_filter = (
        'acao',
        'timestamp',
        'usuario'
    )

    search_fields = (
        'associacao__inquilino__nome_completo',
        'associacao__inquilino__razao_social',
        'associacao__apartamento__unit_number',
        'associacao__apartamento__building_name__name'
    )

    readonly_fields = ('timestamp',)
    list_select_related = [
        'associacao',
        'associacao__inquilino',
        'associacao__apartamento',
        'associacao__apartamento__building_name',
        'usuario'
    ]
    date_hierarchy = 'timestamp'

    fieldsets = (
        ('Informações da Ação', {
            'fields': ('associacao', 'acao', 'usuario', 'timestamp')
        }),
        ('Detalhes', {
            'fields': ('detalhes', 'observacoes'),
            'classes': ('collapse',)
        })
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


# Registrar os modelos no admin
admin.site.register(Inquilino, InquilinoAdmin)
admin.site.register(InquilinoApartamento, InquilinoApartamentoAdmin)
admin.site.register(HistoricoStatus, HistoricoStatusAdmin)
admin.site.register(DocumentoInquilino, DocumentoInquilinoAdmin)
admin.site.register(HistoricoAssociacao, HistoricoAssociacaoAdmin)

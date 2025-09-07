---
status: pending
parallelizable: true
blocked_by: ["3.0"]
unblocks: []
---

<task_context>
<domain>backend/admin</domain>
<type>integration</type>
<scope>middleware</scope>
<complexity>low</complexity>
<dependencies>django_admin</dependencies>
</task_context>

# Tarefa 4.0: Integração Django Admin com Nova Arquitetura

## Visão Geral

Manter e otimizar a interface Django Admin existente para funcionar perfeitamente com a nova arquitetura PostgreSQL + Docker, preservando todas as funcionalidades de upload de mídia e gerenciamento de conteúdo.

<requirements>
- Django Admin 100% funcional com PostgreSQL
- Upload de fotos e vídeos funcionando
- Interface admin responsiva e otimizada
- Inline editing preservado para fotos
- Search e filtros mantidos
- Compatibilidade com Docker environment
- Media files serving correto
- Permissions e grupos preservados
</requirements>

## Subtarefas

- [ ] 4.1 Verificar compatibilidade Admin com PostgreSQL
- [ ] 4.2 Testar uploads de mídia em ambiente Docker
- [ ] 4.3 Otimizar queries Admin para PostgreSQL
- [ ] 4.4 Configurar media serving para Docker
- [ ] 4.5 Implementar melhorias UX no Admin
- [ ] 4.6 Configurar backup automático via Admin
- [ ] 4.7 Testar todos fluxos Admin end-to-end

## Detalhes de Implementação

### Admin Configuration Otimizada:

```python
# admin.py - Mantendo configuração existente otimizada
from django.contrib import admin
from .models import Builders, Aptos, Foto, BuilderFoto

class FotoInline(admin.TabularInline):
    model = Foto
    extra = 3
    max_num = 10
    fields = ['photos']

class BuilderFotoInline(admin.TabularInline):
    model = BuilderFoto
    extra = 3
    max_num = 10
    fields = ['photos']

@admin.register(Aptos)
class AptosAdmin(admin.ModelAdmin):
    list_display = [
        'unit_number', 'building_name', 'rental_price', 
        'is_available', 'number_of_bedrooms', 'created_at'
    ]
    list_filter = [
        'is_available', 'is_furnished', 'number_of_bedrooms',
        'has_parking', 'has_air_conditioning', 'created_at'
    ]
    search_fields = ['unit_number', 'description', 'building_name__name']
    inlines = [FotoInline]
    readonly_fields = ['created_at', 'updated_at']
    
    # Otimização para PostgreSQL
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('building_name')

@admin.register(Builders)
class BuildersAdmin(admin.ModelAdmin):
    list_display = ['name', 'city', 'state', 'created_at']
    list_filter = ['city', 'state', 'created_at']
    search_fields = ['name', 'city', 'neighborhood']
    inlines = [BuilderFotoInline]
    readonly_fields = ['created_at', 'updated_at']
```

### Docker Media Configuration:

```python
# settings/docker.py
import os

# Media files configuration for Docker
MEDIA_URL = '/media/'
MEDIA_ROOT = '/app/media/'

# Ensure media directories exist
os.makedirs(os.path.join(MEDIA_ROOT, 'aptos', 'aptos_videos'), exist_ok=True)
os.makedirs(os.path.join(MEDIA_ROOT, 'aptos', 'aptos_photos'), exist_ok=True)
os.makedirs(os.path.join(MEDIA_ROOT, 'builders', 'builders_videos'), exist_ok=True)
os.makedirs(os.path.join(MEDIA_ROOT, 'builders', 'builders_photos'), exist_ok=True)

# File upload settings
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB
```

### Admin Interface Melhorias:

```python
# admin_improvements.py
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe

class AptosAdminImproved(AptosAdmin):
    """
    Admin melhorado com previews de mídia
    """
    
    def get_readonly_fields(self, request, obj=None):
        if obj:  # Editing existing object
            return self.readonly_fields + ('photo_preview', 'video_preview')
        return self.readonly_fields
    
    def photo_preview(self, obj):
        """Preview das fotos no admin"""
        if obj.fotos.exists():
            photos_html = ""
            for foto in obj.fotos.all()[:3]:  # Show first 3 photos
                photos_html += format_html(
                    '<img src="{}" style="width: 100px; height: 60px; object-fit: cover; margin: 2px;" />',
                    foto.photos.url
                )
            return mark_safe(photos_html)
        return "Nenhuma foto"
    photo_preview.short_description = "Preview Fotos"
    
    def video_preview(self, obj):
        """Preview do vídeo no admin"""
        if obj.video:
            return format_html(
                '<video width="200" height="120" controls>'
                '<source src="{}" type="video/mp4">'
                '</video>',
                obj.video.url
            )
        return "Sem vídeo"
    video_preview.short_description = "Preview Vídeo"
```

### PostgreSQL Specific Optimizations:

```python
# admin_queries.py
from django.contrib import admin
from django.db.models import Prefetch

class OptimizedAptosAdmin(admin.ModelAdmin):
    """
    Admin otimizado para PostgreSQL com queries eficientes
    """
    
    def get_queryset(self, request):
        # Otimização específica PostgreSQL
        return super().get_queryset(request).select_related(
            'building_name'
        ).prefetch_related(
            Prefetch('fotos', queryset=Foto.objects.only('photos'))
        )
    
    def changelist_view(self, request, extra_context=None):
        # Cache count queries para melhor performance
        extra_context = extra_context or {}
        extra_context['total_aptos'] = self.get_queryset(request).count()
        extra_context['available_aptos'] = self.get_queryset(request).filter(is_available=True).count()
        return super().changelist_view(request, extra_context)
```

## Critérios de Sucesso

- Django Admin carrega sem erros com PostgreSQL
- Todos uploads de mídia funcionando (fotos/vídeos)
- Interface admin responsiva em tablets/mobile
- Search e filtros funcionando com performance adequada
- Inline editing de fotos funcional (adicionar/remover)
- Preview de mídia funcionando no admin
- Media files servidos corretamente via Nginx
- Queries admin otimizadas (<200ms loading time)
- Backup/restore funcionando via admin commands
- Permissions Django preservadas e funcionais
- Admin acessível via URL `/admin/` no Docker
- SSL/HTTPS funcionando em produção para admin
from django.contrib import admin

from .models import Aptos, BuilderFoto, Builders, Foto


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
        if not obj or not hasattr(obj, 'builder_fotos'):
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
        if not obj or not obj.video:
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
    
    class Media:
        css = {
            'all': ('admin/css/custom_admin.css',)
        }


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
        if not obj or not hasattr(obj, 'fotos'):
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
        if not obj or not obj.video:
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
    
    class Media:
        css = {
            'all': ('admin/css/custom_admin.css',)
        }

admin.site.register(Builders, BuildersAdmin)
admin.site.register(Aptos, AptosAdmin)

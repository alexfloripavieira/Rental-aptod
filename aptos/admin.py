from django.contrib import admin

from .models import Aptos, Builders, Foto


class BuildersAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "street",
        "neighborhood",
        "city",
        "state",
        "zip_code",
        "country",
    )
    search_fields = ("name",)


class FotoInline(admin.TabularInline):
    model = Foto
    extra = 10
    max_num = 10
    min_num = 0


class AptosAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'unit_number',
        'floor',
        'building_name',
        'description',
        'rental_price',
        'is_available',
        'is_furnished',
        'is_pets_allowed',
        'has_laundry',
        'has_parking',
        'has_internet',
        'has_air_conditioning',
        'number_of_bedrooms',
        'number_of_bathrooms',
        'square_footage',
    )
    search_fields = (
        'unit_number',
    )
    inlines = [FotoInline]

admin.site.register(Builders, BuildersAdmin)
admin.site.register(Aptos, AptosAdmin)

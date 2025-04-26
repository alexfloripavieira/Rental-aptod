from django.contrib import admin

from .models import Aptos


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

admin.site.register(Aptos, AptosAdmin)

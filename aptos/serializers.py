from rest_framework import serializers
from .models import Builders, Aptos, Foto, BuilderFoto


class FotoSerializer(serializers.ModelSerializer):
    """Serializer para fotos dos apartamentos"""
    
    class Meta:
        model = Foto
        fields = ['id', 'photos', 'description']


class BuilderFotoSerializer(serializers.ModelSerializer):
    """Serializer para fotos das construtoras"""
    
    class Meta:
        model = BuilderFoto
        fields = ['id', 'photos', 'description']


class BuildersSerializer(serializers.ModelSerializer):
    """Serializer para construtoras com fotos relacionadas"""
    builder_fotos = BuilderFotoSerializer(many=True, read_only=True)
    
    class Meta:
        model = Builders
        fields = [
            'id', 'name', 'street', 'neighborhood', 'city', 'state', 
            'zip_code', 'country', 'video', 'created_at', 'updated_at',
            'builder_fotos'
        ]


class BuildersListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para lista de construtoras (sem fotos para performance)"""
    
    class Meta:
        model = Builders
        fields = ['id', 'name', 'city', 'state']


class AptosSerializer(serializers.ModelSerializer):
    """Serializer completo para apartamentos com construtora e fotos"""
    fotos = FotoSerializer(many=True, read_only=True)
    building_name = BuildersListSerializer(read_only=True)
    
    # Campos computados para facilitar frontend
    building_full_address = serializers.SerializerMethodField()
    photo_count = serializers.SerializerMethodField()
    has_video = serializers.SerializerMethodField()
    
    class Meta:
        model = Aptos
        fields = [
            'id', 'unit_number', 'floor', 'building_name', 'description',
            'rental_price', 'is_available', 'is_furnished', 'is_pets_allowed',
            'has_laundry', 'has_parking', 'has_internet', 'has_air_conditioning',
            'number_of_bedrooms', 'number_of_bathrooms', 'square_footage',
            'video', 'created_at', 'updated_at', 'fotos', 'building_full_address',
            'photo_count', 'has_video'
        ]
    
    def get_building_full_address(self, obj):
        """Retorna endereço completo da construtora"""
        if obj.building_name:
            return f"{obj.building_name.street}, {obj.building_name.neighborhood}, {obj.building_name.city} - {obj.building_name.state}"
        return None
    
    def get_photo_count(self, obj):
        """Retorna quantidade de fotos do apartamento"""
        return obj.fotos.count()
    
    def get_has_video(self, obj):
        """Retorna se o apartamento tem vídeo"""
        return bool(obj.video)


class AptosListSerializer(serializers.ModelSerializer):
    """Serializer otimizado para listagem de apartamentos (sem fotos completas)"""
    building_name = BuildersListSerializer(read_only=True)
    photo_count = serializers.SerializerMethodField()
    main_photo = serializers.SerializerMethodField()
    
    class Meta:
        model = Aptos
        fields = [
            'id', 'unit_number', 'building_name', 'rental_price', 'is_available',
            'number_of_bedrooms', 'number_of_bathrooms', 'square_footage',
            'photo_count', 'main_photo'
        ]
    
    def get_photo_count(self, obj):
        """Retorna quantidade de fotos"""
        return obj.fotos.count()
    
    def get_main_photo(self, obj):
        """Retorna primeira foto como foto principal"""
        first_photo = obj.fotos.first()
        if first_photo and first_photo.photos:
            return self.context['request'].build_absolute_uri(first_photo.photos.url)
        return None
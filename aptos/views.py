from django.shortcuts import render
from django.db import models
from rest_framework import viewsets, filters, status
from rest_framework.decorators import api_view
from django.http import JsonResponse
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view

from .models import Aptos, Builders
from .serializers import (
    AptosSerializer, AptosListSerializer, 
    BuildersSerializer, BuilderFotoSerializer, FotoSerializer
)


def lista_aptos(request):
    aptos = Aptos.objects.select_related("building_name").prefetch_related("fotos")
    return render(request, "aptos/aptos_lista.html", {"aptos": aptos})


def listar_builders(request):
    builders = Builders.objects.prefetch_related("builder_fotos").all()
    return render(request, "aptos/builders_lista.html", {"builders": builders})


# API ViewSets

@extend_schema_view(
    list=extend_schema(
        summary="Lista todos os apartamentos",
        description="Retorna lista paginada de apartamentos com filtros disponíveis"
    ),
    retrieve=extend_schema(
        summary="Detalhes do apartamento",
        description="Retorna detalhes completos de um apartamento específico incluindo fotos"
    )
)
class AptosViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para apartamentos com filtros, busca e paginação.
    
    Filtros disponíveis:
    - is_available: filtrar por disponibilidade
    - is_furnished: filtrar por apartamentos mobiliados
    - number_of_bedrooms: filtrar por número de quartos
    - number_of_bathrooms: filtrar por número de banheiros
    - has_parking: filtrar por vaga de estacionamento
    - has_air_conditioning: filtrar por ar condicionado
    - rental_price_min: preço mínimo de aluguel
    - rental_price_max: preço máximo de aluguel
    
    Busca:
    - Busca em unit_number, description, building_name__name
    
    Ordenação:
    - rental_price, number_of_bedrooms, created_at
    """
    
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = {
        'is_available': ['exact'],
        'is_furnished': ['exact'],
        'number_of_bedrooms': ['exact', 'gte', 'lte'],
        'number_of_bathrooms': ['exact', 'gte', 'lte'],
        'has_parking': ['exact'],
        'has_air_conditioning': ['exact'],
        'has_laundry': ['exact'],
        'has_internet': ['exact'],
        'is_pets_allowed': ['exact'],
        'rental_price': ['gte', 'lte'],
    }
    search_fields = ['unit_number', 'description', 'building_name__name', 'building_name__neighborhood']
    ordering_fields = ['rental_price', 'number_of_bedrooms', 'created_at', 'updated_at']
    ordering = ['-created_at']  # Ordenação padrão
    
    def get_queryset(self):
        """
        Otimiza queries com select_related e prefetch_related
        """
        return Aptos.objects.select_related('building_name').prefetch_related(
            'fotos',
            'building_name__builder_fotos'
        )
    
    def get_serializer_class(self):
        """
        Usa serializer otimizado para listagem e completo para detalhes
        """
        if self.action == 'list':
            return AptosListSerializer
        return AptosSerializer
    
    @extend_schema(
        summary="Apartamentos disponíveis",
        description="Retorna apenas apartamentos disponíveis para aluguel"
    )
    @action(detail=False, methods=['get'])
    def available(self, request):
        """Endpoint para listar apenas apartamentos disponíveis"""
        queryset = self.get_queryset().filter(is_available=True)
        serializer = AptosListSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)
    
    @extend_schema(
        summary="Estatísticas de apartamentos",
        description="Retorna estatísticas gerais dos apartamentos"
    )
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Endpoint para estatísticas dos apartamentos"""
        queryset = self.get_queryset()
        
        stats = {
            'total': queryset.count(),
            'available': queryset.filter(is_available=True).count(),
            'furnished': queryset.filter(is_furnished=True).count(),
            'with_parking': queryset.filter(has_parking=True).count(),
            'average_price': queryset.aggregate(
                avg_price=models.Avg('rental_price')
            )['avg_price'],
            'bedrooms_distribution': list(
                queryset.values('number_of_bedrooms')
                .annotate(count=models.Count('id'))
                .order_by('number_of_bedrooms')
            )
        }
        
        return Response(stats)


@extend_schema_view(
    list=extend_schema(
        summary="Lista todas as construtoras",
        description="Retorna lista de construtoras com suas fotos"
    ),
    retrieve=extend_schema(
        summary="Detalhes da construtora",
        description="Retorna detalhes completos de uma construtora específica"
    )
)
class BuildersViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para construtoras.
    
    Filtros disponíveis:
    - city: filtrar por cidade
    - state: filtrar por estado
    
    Busca:
    - Busca em name, city, neighborhood, street
    """
    
    serializer_class = BuildersSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['city', 'state', 'neighborhood']
    search_fields = ['name', 'city', 'neighborhood', 'street']
    ordering_fields = ['name', 'city', 'created_at']
    ordering = ['name']
    
    def get_queryset(self):
        """
        Otimiza queries com prefetch_related para fotos
        """
        return Builders.objects.prefetch_related('builder_fotos', 'aptos_building_name')
    
    @extend_schema(
        summary="Apartamentos da construtora",
        description="Retorna todos os apartamentos de uma construtora específica"
    )
    @action(detail=True, methods=['get'])
    def apartments(self, request, pk=None):
        """Endpoint para listar apartamentos de uma construtora específica"""
        builder = self.get_object()
        apartments = builder.aptos_building_name.select_related('building_name').prefetch_related('fotos')
        serializer = AptosListSerializer(apartments, many=True, context={'request': request})
        return Response(serializer.data)


@api_view(['GET'])
def health(request):
    """Lightweight health endpoint for load balancers and deploy checks."""
    return JsonResponse({
        'status': 'ok',
        'service': 'aptos',
        'timestamp': request._request.META.get('REQUEST_TIME', None)
    })

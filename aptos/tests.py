from django.test import TestCase
from django.urls import reverse
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from .models import Builders, Aptos, Foto, BuilderFoto


class BuildersAPITestCase(APITestCase):
    """Testes para API de Empreendimentos"""
    
    def setUp(self):
        """Configuração inicial dos testes"""
        self.client = APIClient()
        
        # Criar Empreendimentos de teste
        self.builder1 = Builders.objects.create(
            name="Construtora A",
            street="Rua das Flores, 123",
            neighborhood="Centro",
            city="São Paulo",
            state="SP",
            zip_code="01234-567",
            country="Brasil"
        )
        
        self.builder2 = Builders.objects.create(
            name="Construtora B",
            street="Avenida Paulista, 456",
            neighborhood="Bela Vista",
            city="São Paulo",
            state="SP",
            zip_code="01310-000",
            country="Brasil"
        )
        
        # URLs da API
        self.builders_list_url = reverse('builders-list')
    
    def test_list_builders(self):
        """Testa listagem de Empreendimentos"""
        response = self.client.get(self.builders_list_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
        self.assertEqual(response.data['results'][0]['name'], "Construtora A")
    
    def test_retrieve_builder(self):
        """Testa busca de construtora específica"""
        builder_detail_url = reverse('builders-detail', kwargs={'pk': self.builder1.pk})
        response = self.client.get(builder_detail_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], "Construtora A")
        self.assertEqual(response.data['city'], "São Paulo")
    
    def test_filter_builders_by_city(self):
        """Testa filtro por cidade"""
        # Criar construtora de outra cidade
        Builders.objects.create(
            name="Construtora C",
            street="Rua do Rio, 789",
            neighborhood="Copacabana",
            city="Rio de Janeiro",
            state="RJ",
            zip_code="22070-002",
            country="Brasil"
        )
        
        response = self.client.get(self.builders_list_url, {'city': 'São Paulo'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)  # Apenas as de São Paulo
    
    def test_search_builders(self):
        """Testa busca por nome"""
        response = self.client.get(self.builders_list_url, {'search': 'Construtora A'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # A busca pode retornar "Construtora A" e "Construtora B" porque ambos contêm "Construtora"
        # Vamos buscar por algo mais específico
        
        # Teste com busca mais específica
        response = self.client.get(self.builders_list_url, {'search': 'Rua das Flores'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], "Construtora A")


class AptosAPITestCase(APITestCase):
    """Testes para API de Apartamentos"""
    
    def setUp(self):
        """Configuração inicial dos testes"""
        self.client = APIClient()
        
        # Criar construtora
        self.builder = Builders.objects.create(
            name="Edifício Teste",
            street="Rua Teste, 100",
            neighborhood="Bairro Teste",
            city="São Paulo",
            state="SP",
            zip_code="01000-000",
            country="Brasil"
        )
        
        # Criar apartamentos de teste
        self.apto1 = Aptos.objects.create(
            unit_number="101",
            floor="1º Andar",
            building_name=self.builder,
            description="Apartamento de 2 quartos com vista para o parque",
            rental_price=1500.00,
            is_available=True,
            is_furnished=True,
            number_of_bedrooms=2,
            number_of_bathrooms=1,
            square_footage=80,
            has_parking=True,
            has_air_conditioning=True
        )
        
        self.apto2 = Aptos.objects.create(
            unit_number="102",
            floor="1º Andar",
            building_name=self.builder,
            description="Apartamento de 3 quartos com sacada",
            rental_price=2000.00,
            is_available=False,
            is_furnished=False,
            number_of_bedrooms=3,
            number_of_bathrooms=2,
            square_footage=120,
            has_parking=True,
            has_air_conditioning=False
        )
        
        # Criar fotos de teste
        self.foto1 = Foto.objects.create(
            apto=self.apto1,
            description="Sala"
        )
        
        # URLs da API
        self.aptos_list_url = reverse('aptos-list')
    
    def test_list_aptos(self):
        """Testa listagem de apartamentos"""
        response = self.client.get(self.aptos_list_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
    
    def test_retrieve_apto(self):
        """Testa busca de apartamento específico"""
        apto_detail_url = reverse('aptos-detail', kwargs={'pk': self.apto1.pk})
        response = self.client.get(apto_detail_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['unit_number'], "101")
        self.assertEqual(response.data['rental_price'], 1500.00)
        self.assertTrue(response.data['is_available'])
    
    def test_filter_available_aptos(self):
        """Testa filtro por disponibilidade"""
        response = self.client.get(self.aptos_list_url, {'is_available': 'true'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['unit_number'], "101")
    
    def test_filter_by_bedrooms(self):
        """Testa filtro por número de quartos"""
        response = self.client.get(self.aptos_list_url, {'number_of_bedrooms': '2'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['number_of_bedrooms'], 2)
    
    def test_filter_by_price_range(self):
        """Testa filtro por faixa de preço"""
        response = self.client.get(self.aptos_list_url, {
            'rental_price__gte': '1000',
            'rental_price__lte': '1800'
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['rental_price'], 1500.00)
    
    def test_search_aptos(self):
        """Testa busca por descrição"""
        response = self.client.get(self.aptos_list_url, {'search': 'vista para o parque'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['unit_number'], "101")
    
    def test_aptos_available_endpoint(self):
        """Testa endpoint específico para apartamentos disponíveis"""
        available_url = reverse('aptos-available')
        response = self.client.get(available_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertTrue(response.data[0]['is_available'])
    
    def test_aptos_stats_endpoint(self):
        """Testa endpoint de estatísticas"""
        stats_url = reverse('aptos-stats')
        response = self.client.get(stats_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total'], 2)
        self.assertEqual(response.data['available'], 1)
        self.assertEqual(response.data['furnished'], 1)
        self.assertEqual(response.data['with_parking'], 2)
        self.assertAlmostEqual(response.data['average_price'], 1750.00)
    
    def test_ordering_by_price(self):
        """Testa ordenação por preço"""
        response = self.client.get(self.aptos_list_url, {'ordering': 'rental_price'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(results[0]['rental_price'], 1500.00)  # Menor preço primeiro
        self.assertEqual(results[1]['rental_price'], 2000.00)
    
    def test_pagination(self):
        """Testa paginação"""
        # Criar mais apartamentos para testar paginação
        for i in range(25):
            Aptos.objects.create(
                unit_number=f"20{i}",
                building_name=self.builder,
                description=f"Apartamento {i}",
                rental_price=1000.00 + i * 100,
                number_of_bedrooms=2,
                number_of_bathrooms=1,
                square_footage=70
            )
        
        response = self.client.get(self.aptos_list_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('count', response.data)
        self.assertIn('next', response.data)
        self.assertEqual(len(response.data['results']), 20)  # PAGE_SIZE = 20


class SerializersTestCase(TestCase):
    """Testes para Serializers"""
    
    def setUp(self):
        """Configuração inicial"""
        self.builder = Builders.objects.create(
            name="Teste Builder",
            street="Rua Teste",
            neighborhood="Centro",
            city="São Paulo",
            state="SP",
            zip_code="01000-000",
            country="Brasil"
        )
        
        self.apto = Aptos.objects.create(
            unit_number="101",
            building_name=self.builder,
            description="Apartamento teste",
            rental_price=1500.00,
            number_of_bedrooms=2,
            number_of_bathrooms=1,
            square_footage=80
        )
    
    def test_apto_serializer_computed_fields(self):
        """Testa campos computados do AptosSerializer"""
        from .serializers import AptosSerializer
        
        serializer = AptosSerializer(self.apto)
        data = serializer.data
        
        self.assertIn('building_full_address', data)
        self.assertIn('photo_count', data)
        self.assertIn('has_video', data)
        self.assertEqual(data['photo_count'], 0)  # Nenhuma foto criada
        self.assertFalse(data['has_video'])  # Nenhum vídeo
    
    def test_builders_serializer_with_photos(self):
        """Testa BuildersSerializer com fotos"""
        from .serializers import BuildersSerializer
        
        # Criar foto para o builder
        BuilderFoto.objects.create(
            builder=self.builder,
            description="Fachada"
        )
        
        serializer = BuildersSerializer(self.builder)
        data = serializer.data
        
        self.assertIn('builder_fotos', data)
        self.assertEqual(len(data['builder_fotos']), 1)

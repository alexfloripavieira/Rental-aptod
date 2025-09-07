---
status: pending
parallelizable: true
blocked_by: ["6.0"]
unblocks: ["11.0"]
---

<task_context>
<domain>testing/automation</domain>
<type>testing</type>
<scope>core_feature</scope>
<complexity>high</complexity>
<dependencies>external_apis</dependencies>
</task_context>

# Tarefa 10.0: Implementação Suite de Testes Completa

## Visão Geral

Implementar suite completa de testes automatizados incluindo testes unitários Django, testes de componentes React, testes de integração de APIs, testes end-to-end com Playwright, e configuração de CI/CD para execução automática.

<requirements>
- Testes unitários Django (>80% coverage)
- Testes de componentes React (>70% coverage)
- Testes de integração de APIs
- Testes end-to-end com Playwright
- Testes de performance básicos
- Configuração CI/CD automatizada
- Reports de coverage automáticos
- Testes de migração de dados
- Testes de acessibilidade
</requirements>

## Subtarefas

- [ ] 10.1 Configurar testes unitários Django com coverage
- [ ] 10.2 Implementar testes de componentes React
- [ ] 10.3 Criar testes de integração de APIs
- [ ] 10.4 Configurar testes end-to-end com Playwright
- [ ] 10.5 Implementar testes de migração de dados
- [ ] 10.6 Configurar testes de performance
- [ ] 10.7 Configurar testes de acessibilidade
- [ ] 10.8 Setup CI/CD pipeline com GitHub Actions

## Detalhes de Implementação

### Django Unit Tests Configuration:

```python
# tests/test_models.py
from django.test import TestCase
from django.core.exceptions import ValidationError
from decimal import Decimal
from aptos.models import Builders, Aptos, Foto, BuilderFoto

class BuildersModelTest(TestCase):
    def setUp(self):
        self.builder = Builders.objects.create(
            name="Test Builder",
            street="Test Street, 123",
            neighborhood="Test Neighborhood",
            city="São Paulo",
            state="SP",
            zip_code="01234-567",
            country="Brasil"
        )

    def test_builder_creation(self):
        """Test builder model creation"""
        self.assertEqual(self.builder.name, "Test Builder")
        self.assertEqual(self.builder.city, "São Paulo")
        self.assertEqual(str(self.builder), "Test Builder")

    def test_builder_address_fields(self):
        """Test all address fields are properly saved"""
        self.assertEqual(self.builder.street, "Test Street, 123")
        self.assertEqual(self.builder.neighborhood, "Test Neighborhood")
        self.assertEqual(self.builder.state, "SP")
        self.assertEqual(self.builder.zip_code, "01234-567")

    def test_builder_required_fields(self):
        """Test that required fields cannot be empty"""
        with self.assertRaises(ValidationError):
            builder = Builders(name="")
            builder.full_clean()

class AptosModelTest(TestCase):
    def setUp(self):
        self.builder = Builders.objects.create(
            name="Test Builder",
            street="Test Street, 123",
            neighborhood="Test Neighborhood", 
            city="São Paulo",
            state="SP",
            zip_code="01234-567",
            country="Brasil"
        )
        
        self.apto = Aptos.objects.create(
            unit_number="101",
            building_name=self.builder,
            description="Beautiful apartment with great view",
            rental_price=Decimal('1500.00'),
            is_available=True,
            number_of_bedrooms=2,
            number_of_bathrooms=1,
            square_footage=80
        )

    def test_apto_creation(self):
        """Test apartment creation"""
        self.assertEqual(self.apto.unit_number, "101")
        self.assertEqual(self.apto.building_name, self.builder)
        self.assertEqual(self.apto.rental_price, Decimal('1500.00'))

    def test_apto_default_values(self):
        """Test apartment default values"""
        self.assertTrue(self.apto.is_available)
        self.assertFalse(self.apto.is_furnished)
        self.assertFalse(self.apto.is_pets_allowed)

    def test_apto_str_representation(self):
        """Test apartment string representation"""
        expected = f"Apartamento {self.apto.unit_number} - {self.builder.name}"
        self.assertEqual(str(self.apto), expected)

    def test_foreign_key_relationship(self):
        """Test foreign key relationship with builder"""
        self.assertEqual(self.apto.building_name.name, "Test Builder")
        self.assertIn(self.apto, self.builder.aptos_set.all())

class FotoModelTest(TestCase):
    def setUp(self):
        self.builder = Builders.objects.create(
            name="Test Builder",
            city="São Paulo",
            state="SP",
            street="Test St",
            neighborhood="Test",
            zip_code="12345",
            country="Brasil"
        )
        
        self.apto = Aptos.objects.create(
            unit_number="101",
            building_name=self.builder,
            description="Test apartment",
            number_of_bedrooms=2,
            number_of_bathrooms=1,
            square_footage=80
        )

    def test_foto_creation(self):
        """Test photo creation and relationship"""
        foto = Foto.objects.create(
            apto=self.apto,
            photos="test_photo.jpg"
        )
        
        self.assertEqual(foto.apto, self.apto)
        self.assertIn(foto, self.apto.fotos.all())
```

### Django API Tests:

```python
# tests/test_api.py
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from decimal import Decimal
import json
from aptos.models import Builders, Aptos, Foto

class AptosAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create test data
        self.builder = Builders.objects.create(
            name="Test Builder",
            street="Test Street, 123",
            neighborhood="Test Neighborhood",
            city="São Paulo", 
            state="SP",
            zip_code="01234-567",
            country="Brasil"
        )
        
        self.apto1 = Aptos.objects.create(
            unit_number="101",
            building_name=self.builder,
            description="Beautiful 2-bedroom apartment",
            rental_price=Decimal('1500.00'),
            is_available=True,
            number_of_bedrooms=2,
            number_of_bathrooms=1,
            square_footage=80,
            has_parking=True
        )
        
        self.apto2 = Aptos.objects.create(
            unit_number="102", 
            building_name=self.builder,
            description="Cozy 1-bedroom apartment",
            rental_price=Decimal('1200.00'),
            is_available=False,
            number_of_bedrooms=1,
            number_of_bathrooms=1,
            square_footage=60
        )

    def test_list_aptos_endpoint(self):
        """Test apartments list endpoint"""
        url = reverse('aptos-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        self.assertIn('results', data)
        self.assertEqual(len(data['results']), 2)
        self.assertIn('count', data)
        self.assertEqual(data['count'], 2)

    def test_aptos_filtering_by_availability(self):
        """Test filtering apartments by availability"""
        url = reverse('aptos-list')
        response = self.client.get(url, {'is_available': True})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        self.assertEqual(len(data['results']), 1)
        self.assertTrue(data['results'][0]['is_available'])

    def test_aptos_filtering_by_bedrooms(self):
        """Test filtering apartments by number of bedrooms"""
        url = reverse('aptos-list')
        response = self.client.get(url, {'number_of_bedrooms': 2})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        self.assertEqual(len(data['results']), 1)
        self.assertEqual(data['results'][0]['number_of_bedrooms'], 2)

    def test_aptos_search_functionality(self):
        """Test search functionality"""
        url = reverse('aptos-list')
        response = self.client.get(url, {'search': 'beautiful'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        self.assertEqual(len(data['results']), 1)
        self.assertIn('Beautiful', data['results'][0]['description'])

    def test_apto_detail_endpoint(self):
        """Test apartment detail endpoint"""
        url = reverse('aptos-detail', kwargs={'pk': self.apto1.pk})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        self.assertEqual(data['id'], self.apto1.id)
        self.assertEqual(data['unit_number'], '101')
        self.assertEqual(float(data['rental_price']), 1500.00)

    def test_builders_endpoint(self):
        """Test builders list endpoint"""
        url = reverse('builders-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        self.assertIn('results', data)
        self.assertEqual(len(data['results']), 1)
        self.assertEqual(data['results'][0]['name'], 'Test Builder')

    def test_api_performance(self):
        """Test API response time"""
        import time
        
        url = reverse('aptos-list')
        start_time = time.time()
        response = self.client.get(url)
        end_time = time.time()
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_time = end_time - start_time
        self.assertLess(response_time, 0.5, "API response should be under 500ms")
```

### React Component Tests:

```typescript
// src/components/__tests__/ApartmentCard.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ApartmentCard } from '../apartments/ApartmentCard';
import type { Apartment } from '../../types/api';

const mockApartment: Apartment = {
  id: 1,
  unit_number: '101',
  floor: '1',
  building_name: {
    id: 1,
    name: 'Test Building',
    street: 'Test Street',
    neighborhood: 'Test Neighborhood',
    city: 'São Paulo',
    state: 'SP',
    zip_code: '01234-567',
    country: 'Brasil',
    builder_fotos: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  description: 'Beautiful apartment with great view',
  rental_price: 1500.00,
  is_available: true,
  is_furnished: false,
  is_pets_allowed: true,
  has_laundry: false,
  has_parking: true,
  has_internet: true,
  has_air_conditioning: false,
  number_of_bedrooms: 2,
  number_of_bathrooms: 1,
  square_footage: 80,
  fotos: [
    { id: 1, photos: '/media/test-photo.jpg' }
  ],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

describe('ApartmentCard', () => {
  it('renders apartment information correctly', () => {
    render(<ApartmentCard apartment={mockApartment} />);
    
    expect(screen.getByText('Apartamento 101')).toBeInTheDocument();
    expect(screen.getByText(/Test Building - Test Neighborhood/)).toBeInTheDocument();
    expect(screen.getByText(/R\$ 1\.500,00/)).toBeInTheDocument();
    expect(screen.getByText('2 quartos')).toBeInTheDocument();
    expect(screen.getByText('1 banheiros')).toBeInTheDocument();
    expect(screen.getByText('80m²')).toBeInTheDocument();
  });

  it('displays availability status correctly', () => {
    render(<ApartmentCard apartment={mockApartment} />);
    
    const availabilityBadge = screen.getByText('Disponível');
    expect(availabilityBadge).toBeInTheDocument();
    expect(availabilityBadge).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('shows amenities correctly', () => {
    render(<ApartmentCard apartment={mockApartment} />);
    
    expect(screen.getByText('Pets OK')).toBeInTheDocument();
    expect(screen.getByText('Garagem')).toBeInTheDocument();
    expect(screen.queryByText('Mobiliado')).not.toBeInTheDocument();
    expect(screen.queryByText('Ar condicionado')).not.toBeInTheDocument();
  });

  it('opens photo gallery when photo is clicked', async () => {
    render(<ApartmentCard apartment={mockApartment} />);
    
    const photoImg = screen.getByAltText('Foto do apartamento 101');
    fireEvent.click(photoImg);
    
    await waitFor(() => {
      expect(screen.getByTestId('photo-modal')).toBeInTheDocument();
    });
  });

  it('opens photo gallery when "Ver Fotos" button is clicked', async () => {
    render(<ApartmentCard apartment={mockApartment} />);
    
    const viewPhotosButton = screen.getByText('Ver Fotos (1)');
    fireEvent.click(viewPhotosButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('photo-modal')).toBeInTheDocument();
    });
  });

  it('handles apartment without photos', () => {
    const apartmentWithoutPhotos = { ...mockApartment, fotos: [] };
    render(<ApartmentCard apartment={apartmentWithoutPhotos} />);
    
    expect(screen.getByText('Sem foto')).toBeInTheDocument();
    expect(screen.queryByText(/Ver Fotos/)).not.toBeInTheDocument();
  });

  it('is accessible via keyboard navigation', () => {
    render(<ApartmentCard apartment={mockApartment} />);
    
    const card = screen.getByRole('article');
    expect(card).toHaveAttribute('tabIndex', '0');
    
    const viewPhotosButton = screen.getByText('Ver Fotos (1)');
    expect(viewPhotosButton).toHaveAttribute('aria-describedby');
  });
});
```

### Playwright E2E Tests:

```typescript
// tests/e2e/apartment-listing.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Apartment Listing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/aptos');
  });

  test('should display apartments grid', async ({ page }) => {
    // Wait for apartments to load
    await page.waitForSelector('[data-testid="apartment-card"]', { timeout: 10000 });
    
    // Check if apartments are displayed
    const apartmentCards = page.locator('[data-testid="apartment-card"]');
    await expect(apartmentCards).toHaveCountGreaterThan(0);
    
    // Check if first card has essential information
    const firstCard = apartmentCards.first();
    await expect(firstCard.locator('h2')).toContainText('Apartamento');
    await expect(firstCard.locator('[data-testid="price"]')).toBeVisible();
    await expect(firstCard.locator('[data-testid="bedrooms-count"]')).toBeVisible();
  });

  test('should filter apartments by bedrooms', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Select 2 bedrooms filter
    await page.selectOption('[data-testid="bedrooms-filter"]', '2');
    
    // Wait for filtered results
    await page.waitForLoadState('networkidle');
    
    // Check if all visible apartments have 2 bedrooms
    const bedroomCounts = page.locator('[data-testid="bedrooms-count"]');
    const count = await bedroomCounts.count();
    
    for (let i = 0; i < count; i++) {
      await expect(bedroomCounts.nth(i)).toContainText('2');
    }
  });

  test('should search apartments by text', async ({ page }) => {
    // Enter search term
    await page.fill('[data-testid="search-input"]', 'centro');
    
    // Wait for search results
    await page.waitForLoadState('networkidle');
    
    // Check if results contain search term
    const descriptions = page.locator('[data-testid="apartment-description"]');
    const count = await descriptions.count();
    
    if (count > 0) {
      const firstDescription = await descriptions.first().textContent();
      expect(firstDescription?.toLowerCase()).toContain('centro');
    }
  });

  test('should open photo gallery modal', async ({ page }) => {
    // Wait for apartments to load
    await page.waitForSelector('[data-testid="apartment-card"]');
    
    // Click on first photo
    const firstPhoto = page.locator('[data-testid="apartment-photo"]').first();
    await firstPhoto.click();
    
    // Check if modal opens
    await expect(page.locator('[data-testid="photo-modal"]')).toBeVisible();
    
    // Check if modal has navigation
    await expect(page.locator('[data-testid="photo-counter"]')).toBeVisible();
    
    // Test navigation
    const nextButton = page.locator('[data-testid="next-photo"]');
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await expect(page.locator('[data-testid="photo-counter"]')).toContainText('2 de');
    }
    
    // Close modal
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="photo-modal"]')).not.toBeVisible();
  });

  test('should be mobile responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Wait for page to adapt
    await page.waitForLoadState('networkidle');
    
    // Check if mobile layout is applied
    const apartmentsGrid = page.locator('[data-testid="apartments-grid"]');
    await expect(apartmentsGrid).toHaveCSS('grid-template-columns', 'repeat(1, minmax(0, 1fr))');
    
    // Check if filters are collapsible on mobile
    const filtersSection = page.locator('[data-testid="filters-section"]');
    await expect(filtersSection).toBeVisible();
  });

  test('should maintain performance standards', async ({ page }) => {
    const startTime = Date.now();
    
    // Navigate to page and wait for load
    await page.goto('/aptos');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Check if page loads within acceptable time (3 seconds)
    expect(loadTime).toBeLessThan(3000);
    
    // Check if API responses are fast
    const apiStart = Date.now();
    await page.reload();
    await page.waitForLoadState('networkidle');
    const apiTime = Date.now() - apiStart;
    
    expect(apiTime).toBeLessThan(2000);
  });
});
```

### Data Migration Tests:

```python
# tests/test_migration.py
from django.test import TransactionTestCase, TestCase
from django.db import connections
from django.core.management import call_command
import tempfile
import os
from decimal import Decimal

class DataMigrationTestCase(TestCase):
    def test_sqlite_data_integrity_after_migration(self):
        """Test that all data is preserved after SQLite to PostgreSQL migration"""
        
        # This would be run with actual migration script
        # For now, test basic data integrity
        from aptos.models import Builders, Aptos
        
        # Create test data similar to SQLite structure
        builder = Builders.objects.create(
            name="Migration Test Builder",
            street="Test Street",
            neighborhood="Test Neighborhood", 
            city="São Paulo",
            state="SP",
            zip_code="12345-678",
            country="Brasil"
        )
        
        apto = Aptos.objects.create(
            unit_number="101",
            building_name=builder,
            description="Migration test apartment",
            rental_price=Decimal('1500.00'),
            number_of_bedrooms=2,
            number_of_bathrooms=1,
            square_footage=80
        )
        
        # Verify relationships are maintained
        self.assertEqual(apto.building_name, builder)
        self.assertIn(apto, builder.aptos_set.all())
        
        # Verify data types
        self.assertIsInstance(apto.rental_price, Decimal)
        self.assertIsInstance(apto.is_available, bool)

    def test_foreign_key_constraints(self):
        """Test that foreign key constraints are properly maintained"""
        from aptos.models import Builders, Aptos
        from django.db import IntegrityError
        
        # Test that apartment cannot be created without builder
        with self.assertRaises(IntegrityError):
            Aptos.objects.create(
                unit_number="999",
                building_name_id=99999,  # Non-existent builder
                description="Test",
                number_of_bedrooms=1,
                number_of_bathrooms=1,
                square_footage=50
            )
```

### Accessibility Tests:

```typescript
// tests/e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/aptos');
    await page.waitForLoadState('networkidle');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should be navigable via keyboard', async ({ page }) => {
    await page.goto('/aptos');
    await page.waitForLoadState('networkidle');
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    let focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Continue tabbing through interactive elements
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      focusedElement = await page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    }
  });

  test('should have proper ARIA labels and roles', async ({ page }) => {
    await page.goto('/aptos');
    await page.waitForLoadState('networkidle');
    
    // Check for proper heading structure
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    
    // Check for proper article roles
    const articles = page.locator('[role="article"]');
    await expect(articles.first()).toBeVisible();
    
    // Check for proper image alt texts
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt).toBeTruthy();
      expect(alt?.length).toBeGreaterThan(0);
    }
  });
});
```

### CI/CD Configuration:

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_aptos
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v4
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
        pip install coverage
    
    - name: Run Django tests
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost/test_aptos
      run: |
        coverage run --source='.' manage.py test
        coverage report --minimum=80
        coverage xml
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3

  frontend-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json
    
    - name: Install dependencies
      run: |
        cd frontend
        npm ci
    
    - name: Run React tests
      run: |
        cd frontend
        npm run test:coverage
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        directory: frontend/coverage

  e2e-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up Docker
      uses: docker/setup-buildx-action@v2
    
    - name: Build and start services
      run: |
        docker-compose -f docker-compose.test.yml up -d
        docker-compose -f docker-compose.test.yml exec -T backend python manage.py migrate
    
    - name: Set up Node.js for Playwright
      uses: actions/setup-node@v4
      with:
        node-version: '18'
    
    - name: Install Playwright
      run: |
        npm install @playwright/test
        npx playwright install
    
    - name: Run E2E tests
      run: npx playwright test
    
    - name: Upload Playwright report
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: playwright-report
        path: playwright-report/
```

## Critérios de Sucesso

- Django unit tests com >80% coverage executando
- React component tests com >70% coverage funcionando
- API integration tests validando todos endpoints
- E2E tests cobrindo fluxos críticos com Playwright
- Accessibility tests passando (zero violations)
- Performance tests validando <3s load time
- Data migration tests validando integridade 100%
- CI/CD pipeline executando todos testes automaticamente
- Coverage reports gerados e enviados para Codecov
- Testes executando em <5 minutos total no CI
- Rollback funcionando quando testes falham
- Test reports acessíveis e informativos
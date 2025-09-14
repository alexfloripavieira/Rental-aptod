from decimal import Decimal
from django.core.exceptions import ValidationError
from django.test import TestCase

from aptos.models import Builders, Aptos


class BuildersModelTest(TestCase):
    def setUp(self):
        self.builder = Builders.objects.create(
            name="Test Builder",
            street="Test Street, 123",
            neighborhood="Test Neighborhood",
            city="São Paulo",
            state="SP",
            zip_code="01234-567",
            country="Brasil",
        )

    def test_builder_creation(self):
        self.assertEqual(self.builder.name, "Test Builder")
        self.assertEqual(str(self.builder), "Test Builder")

    def test_builder_required_fields(self):
        with self.assertRaises(ValidationError):
            Builders(name="").full_clean()


class AptosModelTest(TestCase):
    def setUp(self):
        self.builder = Builders.objects.create(
            name="Test Builder",
            street="Test Street, 123",
            neighborhood="Test Neighborhood",
            city="São Paulo",
            state="SP",
            zip_code="01234-567",
            country="Brasil",
        )
        self.apto = Aptos.objects.create(
            unit_number="101",
            building_name=self.builder,
            description="Beautiful apartment with great view",
            rental_price=Decimal("1500.00"),
            is_available=True,
            number_of_bedrooms=2,
            number_of_bathrooms=1,
            square_footage=80,
        )

    def test_apto_creation(self):
        self.assertEqual(self.apto.unit_number, "101")
        self.assertEqual(self.apto.building_name, self.builder)
        self.assertEqual(self.apto.rental_price, Decimal("1500.00"))

    def test_apto_defaults(self):
        self.assertTrue(self.apto.is_available)
        self.assertFalse(self.apto.is_furnished)

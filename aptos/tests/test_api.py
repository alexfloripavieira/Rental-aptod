from decimal import Decimal
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from aptos.models import Builders, Aptos


class AptosAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.builder = Builders.objects.create(
            name="Test Builder",
            street="Test Street, 123",
            neighborhood="Test Neighborhood",
            city="São Paulo",
            state="SP",
            zip_code="01234-567",
            country="Brasil",
        )
        self.apto1 = Aptos.objects.create(
            unit_number="101",
            building_name=self.builder,
            description="Beautiful 2-bedroom apartment",
            rental_price=Decimal("1500.00"),
            is_available=True,
            number_of_bedrooms=2,
            number_of_bathrooms=1,
            square_footage=80,
            has_parking=True,
        )
        self.apto2 = Aptos.objects.create(
            unit_number="102",
            building_name=self.builder,
            description="Cozy 1-bedroom apartment",
            rental_price=Decimal("1200.00"),
            is_available=False,
            number_of_bedrooms=1,
            number_of_bathrooms=1,
            square_footage=60,
        )

    def test_list(self):
        url = reverse("aptos-list")
        r = self.client.get(url)
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        data = r.json()
        self.assertIn("results", data)
        self.assertEqual(data["count"], 2)

    def test_filter_available(self):
        url = reverse("aptos-list")
        r = self.client.get(url, {"is_available": True})
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(len(r.json()["results"]), 1)

    def test_detail(self):
        url = reverse("aptos-detail", kwargs={"pk": self.apto1.pk})
        r = self.client.get(url)
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.json()["unit_number"], "101")

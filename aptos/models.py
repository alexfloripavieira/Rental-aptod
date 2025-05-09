from django.db import models


class Builders(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    street = models.CharField(max_length=100)
    neighborhood = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    zip_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100)
    video = models.FileField(
        upload_to="builders/builders_videos", blank=True, null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Aptos(models.Model):
    id = models.AutoField(primary_key=True)
    unit_number = models.CharField(max_length=10)
    floor = models.CharField(max_length=20, blank=True, null=True)
    building_name = models.ForeignKey(
        Builders, on_delete=models.CASCADE, related_name="aptos_building_name"
    )
    description = models.TextField()
    rental_price = models.FloatField(default=0.0)
    is_available = models.BooleanField(default=True)
    is_furnished = models.BooleanField(default=False)
    is_pets_allowed = models.BooleanField(default=False)
    has_laundry = models.BooleanField(default=False)
    has_parking = models.BooleanField(default=False)
    has_internet = models.BooleanField(default=False)
    has_air_conditioning = models.BooleanField(default=False)
    number_of_bedrooms = models.IntegerField()
    number_of_bathrooms = models.IntegerField()
    square_footage = models.IntegerField()
    video = models.FileField(upload_to="aptos/aptos_videos", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.unit_number


class Foto(models.Model):
    apto = models.ForeignKey(Aptos, related_name="fotos", on_delete=models.CASCADE)
    description = models.CharField(max_length=10, blank=True, null=True)
    photos = models.ImageField(upload_to="aptos/aptos_photos", blank=True, null=True)

    def __str__(self):
        return self.apto.unit_number


class BuilderFoto(models.Model):
    builder = models.ForeignKey(
        Builders, related_name="builder_fotos", on_delete=models.CASCADE
    )
    description = models.CharField(max_length=10, blank=True, null=True)
    photos = models.ImageField(
        upload_to="builders/builders_photos", blank=True, null=True
    )

    def __str__(self):
        return self.builder.name

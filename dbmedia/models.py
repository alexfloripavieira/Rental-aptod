from django.db import models


class StoredFile(models.Model):
    path = models.CharField(max_length=512, unique=True)
    content = models.BinaryField()
    size = models.BigIntegerField()
    content_type = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return self.path


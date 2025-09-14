from django.core.files.base import ContentFile
from django.core.files.storage import Storage
from django.db import transaction
from .models import StoredFile


class DatabaseMediaStorage(Storage):
    def _open(self, name, mode='rb'):
        obj = StoredFile.objects.get(path=name)
        return ContentFile(bytes(obj.content), name=name)

    def _save(self, name, content):
        data = content.read()
        size = len(data)
        ct = ''
        fileobj = getattr(content, 'file', None)
        if fileobj is not None:
            ct = getattr(fileobj, 'content_type', '') or ''
        with transaction.atomic():
            StoredFile.objects.update_or_create(
                path=name,
                defaults={
                    'content': data,
                    'size': size,
                    'content_type': ct,
                },
            )
        return name

    def exists(self, name):
        return StoredFile.objects.filter(path=name).exists()

    def delete(self, name):
        StoredFile.objects.filter(path=name).delete()

    def size(self, name):
        try:
            return StoredFile.objects.only('size').get(path=name).size
        except StoredFile.DoesNotExist:
            return 0

    def url(self, name):
        return f"/media/{name}"


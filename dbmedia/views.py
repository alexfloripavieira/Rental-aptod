from django.http import Http404, HttpResponse
from django.views.decorators.http import etag
from .models import StoredFile


def _etag(request, path):
    try:
        obj = StoredFile.objects.only('updated_at').get(path=path)
        return f"dbmedia-{obj.updated_at.timestamp()}"
    except StoredFile.DoesNotExist:
        return None


@etag(_etag)
def serve(request, path: str):
    try:
        obj = StoredFile.objects.get(path=path)
    except StoredFile.DoesNotExist:
        raise Http404
    content_type = obj.content_type or 'application/octet-stream'
    return HttpResponse(bytes(obj.content), content_type=content_type)


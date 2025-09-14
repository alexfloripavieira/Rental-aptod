import mimetypes
import os
from wsgiref.util import FileWrapper
from django.conf import settings
from django.http import FileResponse, Http404, HttpResponse
from django.utils.http import http_date
from django.utils.timezone import now


def serve_media(request, path: str):
    base = settings.MEDIA_ROOT
    full_path = os.path.normpath(os.path.join(base, path))
    if not full_path.startswith(os.path.abspath(base)):
        raise Http404
    if not os.path.exists(full_path):
        raise Http404

    content_type, _ = mimetypes.guess_type(full_path)
    content_type = content_type or 'application/octet-stream'

    file_size = os.path.getsize(full_path)
    range_header = request.headers.get('Range')
    if range_header:
        # Support bytes range requests: Range: bytes=start-end
        try:
            range_value = range_header.strip().split('=')[1]
            start_str, end_str = (range_value.split('-') + [None])[:2]
            start = int(start_str) if start_str else 0
            end = int(end_str) if end_str else file_size - 1
            start = max(0, start)
            end = min(file_size - 1, end)
            length = end - start + 1
            with open(full_path, 'rb') as f:
                f.seek(start)
                data = f.read(length)
            resp = HttpResponse(data, status=206, content_type=content_type)
            resp['Content-Range'] = f'bytes {start}-{end}/{file_size}'
            resp['Accept-Ranges'] = 'bytes'
            resp['Content-Length'] = str(length)
            resp['Last-Modified'] = http_date(os.path.getmtime(full_path))
            return resp
        except Exception:
            pass  # Fallback to full response

    # Full file response
    response = FileResponse(open(full_path, 'rb'), content_type=content_type)
    response['Content-Length'] = str(file_size)
    response['Accept-Ranges'] = 'bytes'
    response['Last-Modified'] = http_date(os.path.getmtime(full_path))
    return response


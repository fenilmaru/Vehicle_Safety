from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse
from django.conf import settings
from django.conf.urls.static import static

def react_home(request, path=None):
    try:
        with open(settings.BASE_DIR + "/frontend/dist/index.html") as f:
            return HttpResponse(f.read(), content_type="text/html")
    except Exception:
        return HttpResponse(
            """<!DOCTYPE html><html><head><title>AAS</title><meta charset="utf-8"></head>
            <body style="background:#04060d;color:#e8eefc;font-family:system-ui;display:grid;place-items:center;min-height:100vh;text-align:center;padding:2rem">
            <h1>Autonomous Activation System</h1>
            <p>React frontend loaded from Next.js on port 3000</p>
            <p><a href="http://localhost:3000" style="color:#22d3ee">Open Dashboard →</a></p>
            <p style="font-size:0.8rem;opacity:0.6">Django API server running on port 8000</p>
            </body></html>""",
            content_type="text/html",
        )

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("aas.api.urls")),
    # SPA catch-all (must be last)
    path("<path:path>", react_home),
    path("", react_home, name="root"),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

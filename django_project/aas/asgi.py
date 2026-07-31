from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from django.conf import settings
import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "aas.settings")

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(URLRouter([
        # routed via urls.py for simplicity; channels 4 supports this
    ])),
})

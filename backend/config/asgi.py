"""
ASGI config for config project.

Supports both:

1. Normal HTTP requests
2. WebSocket connections
"""

import os

from django.core.asgi import get_asgi_application

from channels.routing import (
    ProtocolTypeRouter,
    URLRouter,
)

from apps.messaging.middleware import JWTAuthMiddleware
from apps.messaging.routing import websocket_urlpatterns


os.environ.setdefault(
    'DJANGO_SETTINGS_MODULE',
    'config.settings'
)


# ----------------------------------------------------------
# DJANGO HTTP APPLICATION
# ----------------------------------------------------------

django_asgi_app = get_asgi_application()


# ----------------------------------------------------------
# ASGI APPLICATION
# ----------------------------------------------------------

application = ProtocolTypeRouter({

    # Normal HTTP / REST API requests
    "http": django_asgi_app,

    # WebSocket requests
    "websocket": JWTAuthMiddleware(
        URLRouter(
            websocket_urlpatterns
        )
    ),

})
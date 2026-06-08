"""
ASGI config for backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

HTTP requests are served by the regular Django application; ``websocket``
connections are routed through JWT auth middleware to the terminal-proxy
consumers (see atlas_backend/consumers.py).

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# Initialize Django before importing anything that touches the ORM/models.
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter  # noqa: E402

from atlas_backend.routing import websocket_urlpatterns  # noqa: E402
from atlas_backend.ws_auth import JWTAuthMiddleware  # noqa: E402

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": JWTAuthMiddleware(URLRouter(websocket_urlpatterns)),
    }
)

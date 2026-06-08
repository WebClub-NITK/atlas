"""JWT authentication middleware for WebSocket connections.

Browsers cannot set an ``Authorization`` header on a WebSocket handshake, so
the frontend passes the simplejwt access token as a ``token`` query parameter:

    wss://host/ws/terminal/<challenge_id>/?token=<access>

The middleware validates the token the same way CustomJWTAuthentication does
for HTTP requests and stores the resolved user on ``scope["user"]`` (``None``
when the token is missing or invalid; consumers decide how to reject).
"""

from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from django.db import close_old_connections
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken


@database_sync_to_async
def get_user_from_token(token):
    from .models import User

    # Recycle stale/broken DB connections before hitting the ORM from a
    # long-lived ASGI worker.
    close_old_connections()

    if not token:
        return None
    try:
        validated = AccessToken(token)  # verifies signature and expiry
        return User.objects.select_related("team").get(id=validated["user_id"])
    except (TokenError, KeyError, User.DoesNotExist):
        return None


class JWTAuthMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode()
        token = parse_qs(query_string).get("token", [None])[0]
        scope["user"] = await get_user_from_token(token)
        return await self.app(scope, receive, send)

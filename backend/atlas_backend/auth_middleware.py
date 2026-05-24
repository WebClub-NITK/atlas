from channels.middleware import BaseMiddleware
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth.models import AnonymousUser
from channels.db import database_sync_to_async
from atlas_backend.models import User

@database_sync_to_async
def get_user_from_token(token_string):
    try:
        access_token = AccessToken(token_string)
        user = User.objects.get(id=access_token['user_id'])
        return user
    except (InvalidToken, TokenError, User.DoesNotExist):
        return AnonymousUser()

class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        headers = dict(scope.get("headers", []))
        
        from urllib.parse import parse_qs
        query_string = scope.get("query_string", b"").decode()
        parsed_query = parse_qs(query_string)
        
        token = parsed_query.get("token", [None])[0]
        
        if not token and b'authorization' in headers:
            auth_header = headers[b'authorization'].decode()
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
                
        # Also try sec-websocket-protocol for token
        if not token and b'sec-websocket-protocol' in headers:
            # e.g., Bearer, token-here
            protocols = headers[b'sec-websocket-protocol'].decode().split(',')
            for i, proto in enumerate(protocols):
                if proto.strip() == 'Bearer' and i + 1 < len(protocols):
                    token = protocols[i+1].strip()
        
        if token:
            scope["user"] = await get_user_from_token(token)
        else:
            scope["user"] = AnonymousUser()
            
        return await super().__call__(scope, receive, send)

def JWTAuthMiddlewareStack(inner):
    return JWTAuthMiddleware(inner)

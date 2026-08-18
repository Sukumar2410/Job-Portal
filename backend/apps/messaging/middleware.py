from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware

from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken


User = get_user_model()


class JWTAuthMiddleware(BaseMiddleware):
    """
    Authenticate WebSocket connections using a JWT
    passed through the query string.

    Example:

    ws://127.0.0.1:8000/ws/messaging/1/?token=<ACCESS_TOKEN>
    """

    async def __call__(
        self,
        scope,
        receive,
        send
    ):
        # --------------------------------------------------
        # GET TOKEN FROM QUERY STRING
        # --------------------------------------------------

        query_string = scope.get(
            "query_string",
            b""
        ).decode()

        query_params = parse_qs(
            query_string
        )

        token = query_params.get(
            "token",
            [None]
        )[0]

        # --------------------------------------------------
        # DEFAULT USER
        # --------------------------------------------------

        scope["user"] = AnonymousUser()

        # --------------------------------------------------
        # NO TOKEN
        # --------------------------------------------------

        if not token:
            return await super().__call__(
                scope,
                receive,
                send
            )

        # --------------------------------------------------
        # VALIDATE JWT
        # --------------------------------------------------

        try:

            jwt_authentication = JWTAuthentication()

            validated_token = (
                jwt_authentication.get_validated_token(
                    token
                )
            )

            user = await self.get_user(
                validated_token
            )

            if user:
                scope["user"] = user

        except Exception:
            scope["user"] = AnonymousUser()

        # --------------------------------------------------
        # CONTINUE CONNECTION
        # --------------------------------------------------

        return await super().__call__(
            scope,
            receive,
            send
        )

    @database_sync_to_async
    def get_user(
        self,
        validated_token
    ):
        try:

            jwt_authentication = JWTAuthentication()

            return jwt_authentication.get_user(
                validated_token
            )

        except Exception:
            return None
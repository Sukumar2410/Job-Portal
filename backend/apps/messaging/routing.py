from django.urls import re_path

from .consumers import MessagingConsumer


websocket_urlpatterns = [
    re_path(
        r"ws/messaging/(?P<conversation_id>\d+)/$",
        MessagingConsumer.as_asgi(),
    ),
]
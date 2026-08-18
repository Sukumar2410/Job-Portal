import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer

from .models import Conversation, Message


class MessagingConsumer(
    AsyncJsonWebsocketConsumer
):
    """
    WebSocket consumer for private conversations.

    Each conversation gets its own channel group:

        conversation_<conversation_id>
    """

    async def connect(self):

        self.user = self.scope.get("user")

        self.conversation_id = int(
            self.scope["url_route"]["kwargs"][
                "conversation_id"
            ]
        )

        # --------------------------------------------------
        # AUTHENTICATION
        # --------------------------------------------------

        if not self.user or not self.user.is_authenticated:
            await self.close(
                code=4001
            )
            return

        # --------------------------------------------------
        # CONVERSATION ACCESS
        # --------------------------------------------------

        has_access = await self.user_can_access_conversation()

        if not has_access:
            await self.close(
                code=4003
            )
            return

        # --------------------------------------------------
        # CHANNEL GROUP
        # --------------------------------------------------

        self.room_group_name = (
            f"conversation_{self.conversation_id}"
        )

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        # --------------------------------------------------
        # CONNECTION CONFIRMATION
        # --------------------------------------------------

        await self.send_json({
            "type": "connection",
            "message": "WebSocket connected successfully.",
            "conversation_id": self.conversation_id,
        })


    async def disconnect(self, close_code):

        if hasattr(
            self,
            "room_group_name"
        ):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )


    async def receive_json(
        self,
        content,
        **kwargs
    ):

        message_content = (
            content.get("content", "")
            if isinstance(content, dict)
            else ""
        )

        message_content = message_content.strip()

        if not message_content:
            await self.send_json({
                "type": "error",
                "message": "Message content cannot be empty.",
            })
            return

        # --------------------------------------------------
        # SAVE MESSAGE
        # --------------------------------------------------

        message = await self.create_message(
            message_content
        )

        # --------------------------------------------------
        # BROADCAST MESSAGE
        # --------------------------------------------------

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "message": {
                    "id": message["id"],
                    "conversation": self.conversation_id,
                    "sender_id": message["sender_id"],
                    "sender_name": message["sender_name"],
                    "sender_email": message["sender_email"],
                    "content": message["content"],
                    "is_read": message["is_read"],
                    "created_at": message["created_at"],
                    "updated_at": message["updated_at"],
                },
            }
        )


    async def chat_message(
        self,
        event
    ):

        await self.send_json({
            "type": "message",
            **event["message"],
        })


    @database_sync_to_async
    def user_can_access_conversation(self):

        return Conversation.objects.filter(
            id=self.conversation_id
        ).filter(
            participant_1=self.user
        ).exists() or Conversation.objects.filter(
            id=self.conversation_id
        ).filter(
            participant_2=self.user
        ).exists()


    @database_sync_to_async
    def create_message(
        self,
        content
    ):

        conversation = Conversation.objects.get(
            id=self.conversation_id
        )

        message = Message.objects.create(
            conversation=conversation,
            sender=self.user,
            content=content,
        )

        return {
            "id": message.id,
            "sender_id": message.sender_id,
            "sender_name": message.sender.full_name,
            "sender_email": message.sender.email,
            "content": message.content,
            "is_read": message.is_read,
            "created_at": message.created_at.isoformat(),
            "updated_at": message.updated_at.isoformat(),
        }
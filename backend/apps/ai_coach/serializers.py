from rest_framework import serializers

from .models import (
    Conversation,
    ConversationMessage,
)


# ==========================================================
# AI CHAT
# ==========================================================

class ChatRequestSerializer(serializers.Serializer):

    role = serializers.ChoiceField(
        choices=[
            "CANDIDATE",
            "HR",
            "ADMIN",
        ],
        required=False,
        default="CANDIDATE",
    )

    conversation_id = serializers.IntegerField(
        required=False,
        allow_null=True,
    )

    message = serializers.CharField(
        max_length=4000,
        required=False,
        allow_blank=True,
    )

    file = serializers.FileField(
        required=False,
        allow_null=True,
    )


class ChatResponseSerializer(serializers.Serializer):

    conversation_id = serializers.IntegerField()

    reply = serializers.CharField()


# ==========================================================
# CONVERSATIONS
# ==========================================================

class ConversationCreateSerializer(serializers.ModelSerializer):

    class Meta:
        model = Conversation

        fields = (
            "id",
            "title",
            "role",
            "created_at",
        )

        read_only_fields = (
            "id",
            "created_at",
        )


class ConversationListSerializer(serializers.ModelSerializer):

    message_count = serializers.IntegerField(
        source="messages.count",
        read_only=True,
    )

    class Meta:
        model = Conversation

        fields = (
            "id",
            "title",
            "role",
            "updated_at",
            "message_count",
        )


class ConversationMessageSerializer(serializers.ModelSerializer):

    class Meta:
        model = ConversationMessage

        fields = (
            "id",
            "role",
            "message",
            "created_at",
        )


class ConversationDetailSerializer(serializers.ModelSerializer):

    messages = ConversationMessageSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = Conversation

        fields = (
            "id",
            "title",
            "role",
            "created_at",
            "updated_at",
            "messages",
        )


# ==========================================================
# RESUME REVIEW
# ==========================================================

class ResumeReviewRequestSerializer(serializers.Serializer):
    """
    Candidate doesn't need to send anything.
    Resume is fetched from the logged-in user's profile.
    """

    pass


class ResumeReviewResponseSerializer(serializers.Serializer):

    review = serializers.CharField()
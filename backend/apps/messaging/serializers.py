from django.contrib.auth import get_user_model

from rest_framework import serializers

from .models import Conversation, Message


User = get_user_model()


# ==========================================================
# USER / PARTICIPANT SERIALIZER
# ==========================================================


class MessagingUserSerializer(serializers.ModelSerializer):
    """
    Lightweight user information used inside messaging APIs.
    """

    class Meta:
        model = User
        fields = (
            'id',
            'email',
            'full_name',
            'role',
        )
        read_only_fields = (
            'id',
            'email',
            'full_name',
            'role',
        )


# ==========================================================
# MESSAGE SERIALIZER
# ==========================================================


class MessageSerializer(serializers.ModelSerializer):
    """
    Serializer used for displaying messages and creating messages.
    """

    sender_id = serializers.IntegerField(
        source='sender.id',
        read_only=True
    )

    sender_name = serializers.CharField(
        source='sender.full_name',
        read_only=True
    )

    sender_email = serializers.EmailField(
        source='sender.email',
        read_only=True
    )

    class Meta:
        model = Message

        fields = (
            'id',
            'conversation',
            'sender_id',
            'sender_name',
            'sender_email',
            'content',
            'is_read',
            'created_at',
            'updated_at',
        )

        read_only_fields = (
            'id',
            'conversation',
            'sender_id',
            'sender_name',
            'sender_email',
            'is_read',
            'created_at',
            'updated_at',
        )

    def validate_content(self, value):
        """
        Prevent empty or whitespace-only messages.
        """

        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                'Message content cannot be empty.'
            )

        return value


# ==========================================================
# CONVERSATION CREATE SERIALIZER
# ==========================================================


class ConversationCreateSerializer(serializers.ModelSerializer):
    """
    Serializer used when creating a new conversation.

    The authenticated user becomes participant_1.
    The selected user becomes participant_2.
    """

    participant_2 = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all()
    )

    class Meta:
        model = Conversation

        fields = (
            'id',
            'participant_2',
            'created_at',
            'updated_at',
        )

        read_only_fields = (
            'id',
            'created_at',
            'updated_at',
        )

    def validate_participant_2(self, value):
        """
        Prevent a user from starting a conversation with themselves.
        """

        request = self.context.get('request')

        if request and request.user.is_authenticated:
            if value.id == request.user.id:
                raise serializers.ValidationError(
                    'You cannot start a conversation with yourself.'
                )

        return value


# ==========================================================
# CONVERSATION LIST SERIALIZER
# ==========================================================


class ConversationSerializer(serializers.ModelSerializer):
    """
    Serializer used for displaying conversations in the inbox.
    """

    participant_1 = MessagingUserSerializer(
        read_only=True
    )

    participant_2 = MessagingUserSerializer(
        read_only=True
    )

    last_message = serializers.SerializerMethodField()

    unread_count = serializers.SerializerMethodField()

    other_user = serializers.SerializerMethodField()

    class Meta:
        model = Conversation

        fields = (
            'id',
            'participant_1',
            'participant_2',
            'other_user',
            'last_message',
            'unread_count',
            'created_at',
            'updated_at',
        )

        read_only_fields = (
            'id',
            'participant_1',
            'participant_2',
            'other_user',
            'last_message',
            'unread_count',
            'created_at',
            'updated_at',
        )

    # ------------------------------------------------------
    # OTHER USER
    # ------------------------------------------------------

    def get_other_user(self, obj):
        """
        Return the other participant relative to the
        currently authenticated user.
        """

        request = self.context.get('request')

        if not request or not request.user.is_authenticated:
            return None

        current_user_id = request.user.id

        if obj.participant_1_id == current_user_id:
            other_user = obj.participant_2
        else:
            other_user = obj.participant_1

        return MessagingUserSerializer(
            other_user,
            context=self.context
        ).data

    # ------------------------------------------------------
    # LAST MESSAGE
    # ------------------------------------------------------

    def get_last_message(self, obj):
        """
        Return the most recent message in the conversation.
        """

        message = (
            obj.messages
            .select_related('sender')
            .order_by('-created_at')
            .first()
        )

        if not message:
            return None

        return MessageSerializer(
            message,
            context=self.context
        ).data

    # ------------------------------------------------------
    # UNREAD COUNT
    # ------------------------------------------------------

    def get_unread_count(self, obj):
        """
        Return the number of unread messages sent by
        other users in this conversation.
        """

        request = self.context.get('request')

        if not request or not request.user.is_authenticated:
            return 0

        return obj.messages.filter(
            is_read=False
        ).exclude(
            sender=request.user
        ).count()


# ==========================================================
# CONVERSATION DETAIL SERIALIZER
# ==========================================================


class ConversationDetailSerializer(ConversationSerializer):
    """
    Detailed conversation serializer.

    Includes the complete message history.
    """

    messages = MessageSerializer(
        many=True,
        read_only=True
    )

    class Meta(ConversationSerializer.Meta):
        fields = ConversationSerializer.Meta.fields + (
            'messages',
        )

        read_only_fields = (
            'id',
            'participant_1',
            'participant_2',
            'other_user',
            'last_message',
            'unread_count',
            'messages',
            'created_at',
            'updated_at',
        )
from django.db import transaction
from django.db.models import Q
from django.contrib.auth import get_user_model

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import (
    extend_schema,
    OpenApiParameter,
    OpenApiTypes,
)

from .models import Conversation, Message
from .serializers import (
    ConversationCreateSerializer,
    ConversationDetailSerializer,
    ConversationSerializer,
    MessageSerializer,
    MessagingUserSerializer,
)

User = get_user_model()


class ConversationViewSet(viewsets.ModelViewSet):
    """
    API for one-to-one private conversations.
    """

    permission_classes = [IsAuthenticated]

    # ==========================================================
    # QUERYSET
    # ==========================================================

    def get_queryset(self):
        """
        Return only conversations in which the authenticated
        user participates.
        """

        user = self.request.user

        return (
            Conversation.objects
            .filter(
                Q(participant_1=user) |
                Q(participant_2=user)
            )
            .select_related(
                'participant_1',
                'participant_2',
            )
            .prefetch_related(
                'messages__sender'
            )
            .order_by('-updated_at')
        )

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name='search',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                required=False,
                description='Search users by first name, last name, or email.',
            ),
            OpenApiParameter(
                name='role',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                required=False,
                description='Filter users by role, for example CANDIDATE or HR.',
            ),
        ]
    )
    @action(
        detail=False,
        methods=['get'],
        url_path='users'
    )
    def users(self, request):
        """
        Return users available for starting a new conversation.

        GET /api/messaging/conversations/users/
        """

        current_user = request.user

        queryset = (
            User.objects
            .filter(
                is_active=True
            )
            .exclude(
                id=current_user.id
            )
            .order_by('first_name', 'last_name', 'email')
        )

        search = request.query_params.get('search', '').strip()

        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search)
            )

        role = request.query_params.get('role', '').strip()

        if role:
            queryset = queryset.filter(role=role)

        serializer = MessagingUserSerializer(
            queryset,
            many=True
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    # ==========================================================
    # SERIALIZER
    # ==========================================================

    def get_serializer_class(self):
        """
        Select serializer based on the current action.
        """

        if self.action == 'create':
            return ConversationCreateSerializer

        if self.action == 'retrieve':
            return ConversationDetailSerializer

        return ConversationSerializer

    # ==========================================================
    # CREATE CONVERSATION
    # ==========================================================

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """
        Create or return a conversation between the authenticated
        user and the selected participant.
        """

        serializer = self.get_serializer(
            data=request.data,
            context={'request': request}
        )

        serializer.is_valid(raise_exception=True)

        participant_2 = serializer.validated_data['participant_2']
        current_user = request.user

        # ------------------------------------------------------
        # Normalize participant ordering.
        #
        # This matches the model's save() behavior and ensures
        # A -> B and B -> A represent the same conversation.
        # ------------------------------------------------------

        participant_1_id = min(
            current_user.id,
            participant_2.id
        )

        participant_2_id = max(
            current_user.id,
            participant_2.id
        )

        conversation, created = Conversation.objects.get_or_create(
            participant_1_id=participant_1_id,
            participant_2_id=participant_2_id,
        )

        # ------------------------------------------------------
        # Return the complete conversation representation.
        # ------------------------------------------------------

        response_serializer = ConversationSerializer(
            conversation,
            context={'request': request}
        )

        return Response(
            response_serializer.data,
            status=(
                status.HTTP_201_CREATED
                if created
                else status.HTTP_200_OK
            )
        )

    # ==========================================================
    # GET / SEND MESSAGES
    # ==========================================================

    @extend_schema(
        methods=['GET'],
        responses=MessageSerializer(many=True),
    )
    @extend_schema(
        methods=['POST'],
        request=MessageSerializer,
        responses=MessageSerializer,
    )
    @action(
        detail=True,
        methods=['get', 'post'],
        url_path='messages'
    )
    @transaction.atomic
    def messages(self, request, pk=None):
        """
        Get or send messages for a conversation.

        GET:
            /api/messaging/conversations/{id}/messages/

        POST:
            /api/messaging/conversations/{id}/messages/
        """

        conversation = self.get_object()

        # ======================================================
        # GET MESSAGES
        # ======================================================

        if request.method == 'GET':

            messages = (
                conversation.messages
                .select_related('sender')
                .order_by('created_at')
            )

            serializer = MessageSerializer(
                messages,
                many=True,
                context={'request': request}
            )

            return Response(
                serializer.data,
                status=status.HTTP_200_OK
            )

        # ======================================================
        # POST MESSAGE
        # ======================================================

        if request.method == 'POST':

            serializer = MessageSerializer(
                data=request.data,
                context={'request': request}
            )

            serializer.is_valid(raise_exception=True)

            message = serializer.save(
                conversation=conversation,
                sender=request.user,
                is_read=False,
            )

            # --------------------------------------------------
            # Update conversation timestamp
            # --------------------------------------------------

            conversation.save()

            response_serializer = MessageSerializer(
                message,
                context={'request': request}
            )

            return Response(
                response_serializer.data,
                status=status.HTTP_201_CREATED
            )
    # ==========================================================
    # MARK CONVERSATION AS READ
    # ==========================================================

    @action(
        detail=True,
        methods=['post'],
        url_path='read'
    )
    @transaction.atomic
    def mark_as_read(self, request, pk=None):
        """
        Mark all messages sent by other users in this conversation
        as read.
        """

        conversation = self.get_object()

        updated_count = (
            Message.objects
            .filter(
                conversation=conversation,
                is_read=False,
            )
            .exclude(
                sender=request.user
            )
            .update(
                is_read=True
            )
        )

        return Response(
            {
                'message': 'Conversation marked as read.',
                'updated_count': updated_count,
            },
            status=status.HTTP_200_OK
        )
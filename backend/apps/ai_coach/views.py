from pathlib import Path
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from drf_spectacular.utils import extend_schema

from apps.users.models import CandidateProfile
from apps.payments.models import Subscription, SubscriptionStatus

from .models import Conversation, ConversationMessage
from .document_parser import DocumentParser
from .services import AIService
from .serializers import (
    ChatRequestSerializer,
    ChatResponseSerializer,
    ConversationCreateSerializer,
    ConversationListSerializer,
    ConversationDetailSerializer,
    ResumeReviewRequestSerializer,
    ResumeReviewResponseSerializer,
)
from .prompts import (
    CANDIDATE_PROMPT,
    HR_PROMPT,
    ADMIN_PROMPT,
    RESUME_REVIEW_PROMPT,
)


def has_active_subscription(user):
    """
    Checks if the given user or their associated company has an active/trial subscription.
    - Super Admins bypass subscription checks.
    - HR / Employers are checked against their associated Company subscription.
    - Candidates are checked against their User subscription.
    """
    if user.role == "SUPER_ADMIN" or user.is_superuser:
        return True

    active_statuses = [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL]

    # Check user-level subscription (Candidates)
    user_has_sub = Subscription.objects.filter(
        user=user,
        status__in=active_statuses
    ).exists()

    if user_has_sub:
        return True

    # Check company-level subscription (HR / Employers)
    company = getattr(user, 'company', None) or getattr(user, 'company_profile', None)
    if not company and hasattr(user, 'hr_profile'):
        company = getattr(user.hr_profile, 'company', None)

    if company:
        company_has_sub = Subscription.objects.filter(
            company=company,
            status__in=active_statuses
        ).exists()
        if company_has_sub:
            return True

    return False


@extend_schema(
    request=ChatRequestSerializer,
    responses=ChatResponseSerializer,
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([
    JSONParser,
    MultiPartParser,
    FormParser,
])
def chat(request):
    """
    POST /api/ai-coach/chat/

    Supports:
    - Normal JSON chat
    - Multipart/form-data chat with an uploaded file
    """

    # Check subscription for Candidate, HR, and Admin roles
    if not has_active_subscription(request.user):
        return Response(
            {"detail": "Premium subscription required."},
            status=status.HTTP_403_FORBIDDEN
        )

    serializer = ChatRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    role = serializer.validated_data.get("role", "CANDIDATE")
    user_message = serializer.validated_data.get("message", "").strip()
    conversation_id = serializer.validated_data.get("conversation_id")
    uploaded_file = serializer.validated_data.get("file")

    # Validation
    if not user_message and not uploaded_file:
        return Response(
            {"detail": "Please provide a message or attach a file."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # File Validation
    if uploaded_file:
        allowed_extensions = {
            ".pdf", ".doc", ".docx", ".txt", ".csv",
            ".xls", ".xlsx", ".jpg", ".jpeg", ".png",
        }
        file_name = uploaded_file.name.lower()
        extension = Path(file_name).suffix

        if extension not in allowed_extensions:
            return Response(
                {"detail": "Unsupported file type. Please upload a supported document or image file."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    # Get or Create Conversation
    if conversation_id:
        conversation = get_object_or_404(
            Conversation,
            id=conversation_id,
            user=request.user,
        )
    else:
        conversation = Conversation.objects.create(
            user=request.user,
            role=role,
            title="New Conversation",
        )

    # Auto-generate Title
    if not conversation.title or conversation.title == "New Conversation":
        if user_message:
            conversation.title = user_message[:60]
        elif uploaded_file:
            conversation.title = f"File: {uploaded_file.name[:50]}"
        conversation.save(update_fields=["title"])

    # Save User Message
    stored_message = user_message
    if uploaded_file:
        stored_message = f"📎 {uploaded_file.name}\n\n{stored_message}" if stored_message else f"📎 {uploaded_file.name}"

    ConversationMessage.objects.create(
        conversation=conversation,
        role="user",
        message=stored_message,
    )

    # Prompt Selection
    prompt_map = {
        "CANDIDATE": CANDIDATE_PROMPT,
        "HR": HR_PROMPT,
        "ADMIN": ADMIN_PROMPT,
    }
    system_prompt = prompt_map.get(role, CANDIDATE_PROMPT)

    # Extract File Content
    extracted_text = ""
    if uploaded_file:
        import os
        import tempfile
        temp_file_path = None
        try:
            file_extension = Path(uploaded_file.name).suffix.lower()
            with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
                for chunk in uploaded_file.chunks():
                    temp_file.write(chunk)
                temp_file_path = temp_file.name

            parser = DocumentParser()
            extracted_text = parser.extract_text(temp_file_path)

        except Exception as e:
            return Response(
                {"detail": f"Unable to read the uploaded file. {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        finally:
            if temp_file_path and os.path.exists(temp_file_path):
                os.remove(temp_file_path)

    # Build Prompt
    prompt_parts = [system_prompt]
    if user_message:
        prompt_parts.append(f"\nUser Request:\n\n{user_message}\n")
    if uploaded_file and extracted_text:
        prompt_parts.append(f"\nUploaded File:\nFile Name: {uploaded_file.name}\n\nFile Content:\n\n{extracted_text}\n")

    prompt = "\n".join(prompt_parts)

    # Generate Response
    try:
        ai = AIService()
        reply = ai.generate_response(prompt)

        ConversationMessage.objects.create(
            conversation=conversation,
            role="assistant",
            message=reply,
        )
        conversation.save()

        return Response({
            "conversation_id": conversation.id,
            "reply": reply,
        })

    except Exception as e:
        return Response(
            {"detail": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@extend_schema(
    request=ConversationCreateSerializer,
    responses=ConversationListSerializer(many=True),
)
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def conversations(request):
    if request.method == "GET":
        conversations_qs = Conversation.objects.filter(user=request.user).order_by("-updated_at")
        serializer = ConversationListSerializer(conversations_qs, many=True)
        return Response(serializer.data)

    role = request.data.get("role", "CANDIDATE")
    conversation = Conversation.objects.create(
        user=request.user,
        role=role,
        title="New Conversation"
    )
    serializer = ConversationCreateSerializer(conversation)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@extend_schema(responses=ConversationDetailSerializer)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def conversation_detail(request, pk):
    conversation = get_object_or_404(Conversation, pk=pk, user=request.user)
    serializer = ConversationDetailSerializer(conversation)
    return Response(serializer.data)


@extend_schema(request=None, responses=None)
@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_conversation(request, pk):
    conversation = get_object_or_404(Conversation, pk=pk, user=request.user)
    conversation.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(
    request=None,
    responses=ConversationCreateSerializer,
)
@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_conversation_title(request, pk):
    conversation = get_object_or_404(Conversation, pk=pk, user=request.user)
    title = request.data.get("title", "").strip()

    if title:
        conversation.title = title[:60]
        conversation.save(update_fields=["title"])

    serializer = ConversationCreateSerializer(conversation)
    return Response(serializer.data)


@extend_schema(
    request=ResumeReviewRequestSerializer,
    responses=ResumeReviewResponseSerializer,
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def resume_review(request):
    """
    Analyze the logged-in candidate's uploaded resume.
    """
    try:
        profile = CandidateProfile.objects.get(user=request.user)
    except CandidateProfile.DoesNotExist:
        return Response(
            {"detail": "Candidate profile not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    if not profile.resume:
        return Response(
            {"detail": "No resume uploaded."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check subscription status
    if not has_active_subscription(request.user):
        return Response(
            {"detail": "Premium subscription required."},
            status=status.HTTP_403_FORBIDDEN
        )

    parser = DocumentParser()
    resume_text = parser.extract_text(profile.resume.path)

    prompt = f"""
    {RESUME_REVIEW_PROMPT}

    IMPORTANT INSTRUCTIONS:
    You MUST analyze ONLY the resume provided below.
    Do NOT invent skills.
    Do NOT assume experience.
    Do NOT fabricate projects.
    If something is missing from the resume, explicitly say it is missing.
    If no resume text is available, respond exactly:
    "No resume content could be extracted."

    =========================
    RESUME START
    =========================
    {resume_text}
    =========================
    RESUME END
    =========================

    Analyze ONLY the above resume.
    """

    try:
        ai = AIService()
        review = ai.generate_response(prompt)
        return Response({"review": review})
    except Exception as e:
        return Response(
            {"detail": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
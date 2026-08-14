from rest_framework import status
from rest_framework.generics import (
    CreateAPIView,
    ListAPIView,
    RetrieveAPIView,
    UpdateAPIView,
    DestroyAPIView,
)
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .permissions import IsCandidate
from .serializers import (
    ResumeCreateSerializer,
    ResumeUpdateSerializer,
    ResumeListSerializer,
    ResumeDetailSerializer,
)
from .services import ResumeService


class ResumeUploadView(CreateAPIView):
    """
    Upload a new resume.
    """

    serializer_class = ResumeCreateSerializer    
    permission_classes = [IsAuthenticated, IsCandidate]

    parser_classes = (
        MultiPartParser,
        FormParser,
    )

    def perform_create(self, serializer):
        self.resume = ResumeService.create_resume(
            user=self.request.user,
            validated_data=serializer.validated_data,
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        self.perform_create(serializer)

        response_serializer = ResumeDetailSerializer(self.resume)

        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED,
        )

class ResumeListView(ListAPIView):
    """
    List all resumes of the logged-in candidate.
    """

    serializer_class = ResumeListSerializer
    permission_classes = [IsAuthenticated, IsCandidate]

    def get_queryset(self):
        return (
            self.request.user.resumes
            .all()
            .order_by("-is_default", "-created_at")
        )

class ResumeDetailView(RetrieveAPIView):
    """
    Retrieve a single resume belonging to the logged-in candidate.
    """

    serializer_class = ResumeDetailSerializer
    permission_classes = [IsAuthenticated, IsCandidate]

    lookup_field = "pk"

    def get_queryset(self):
        return self.request.user.resumes.all()

class ResumeUpdateView(UpdateAPIView):
    """
    Update an existing resume belonging to the logged-in candidate.
    """

    serializer_class = ResumeUpdateSerializer
    permission_classes = [IsAuthenticated, IsCandidate]

    parser_classes = (
        MultiPartParser,
        FormParser,
    )

    http_method_names = ["patch"]

    def get_queryset(self):
        return (
            self.request.user.resumes.all()
        )

    def perform_update(self, serializer):
        self.resume = ResumeService.update_resume(
            resume=self.get_object(),
            validated_data=serializer.validated_data,
        )

    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(
            self.get_object(),
            data=request.data,
            partial=True,
        )

        serializer.is_valid(raise_exception=True)

        self.perform_update(serializer)

        response_serializer = ResumeDetailSerializer(self.resume)

        return Response(
            response_serializer.data,
            status=status.HTTP_200_OK,
        )

class ResumeDeleteView(DestroyAPIView):
    """
    Delete a resume belonging to the logged-in candidate.
    """

    permission_classes = [IsAuthenticated, IsCandidate]

    def get_queryset(self):
        return self.request.user.resumes.all()

    def destroy(self, request, *args, **kwargs):
        resume = self.get_object()

        ResumeService.delete_resume(
            resume=resume
        )

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )
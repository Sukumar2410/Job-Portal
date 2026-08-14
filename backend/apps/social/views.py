from django.db.models import Count

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Post, PostLike, PostComment
from .serializers import (
    PostListSerializer,
    PostDetailSerializer,
    PostCommentSerializer,
)


class PostViewSet(viewsets.ModelViewSet):
    """
    API for LinkedIn-style social posts.
    """

    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Post.objects
            .select_related('author')
            .prefetch_related('comments', 'likes')
            .annotate(
                total_likes=Count('likes', distinct=True),
                total_comments=Count('comments', distinct=True),
            )
            .order_by('-created_at')
        )

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return PostDetailSerializer

        return PostListSerializer

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def perform_update(self, serializer):
        post = self.get_object()

        if post.author != self.request.user:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied(
                'You can only edit your own posts.'
            )

        serializer.save()

    def destroy(self, request, *args, **kwargs):
        post = self.get_object()

        if post.author != request.user:
            return Response(
                {
                    'detail': 'You can only delete your own posts.'
                },
                status=status.HTTP_403_FORBIDDEN
            )

        post.delete()

        return Response(
            {
                'message': 'Post deleted successfully.'
            },
            status=status.HTTP_200_OK
        )

    @action(
    detail=True,
    methods=['post', 'delete'],
    url_path='like'
)
    def like(self, request, pk=None):
        """
        Like or unlike a post.

        POST   -> Like the post
        DELETE -> Unlike the post
        """

        post = self.get_object()

        # ==========================================================
        # LIKE
        # ==========================================================

        if request.method == 'POST':

            like, created = PostLike.objects.get_or_create(
                post=post,
                user=request.user
            )

            if not created:
                return Response(
                    {
                        'message': 'You have already liked this post.',
                        'liked': True,
                        'likes_count': PostLike.objects.filter(
                            post=post
                        ).count(),
                    },
                    status=status.HTTP_200_OK
                )

            return Response(
                {
                    'message': 'Post liked successfully.',
                    'liked': True,
                    'likes_count': PostLike.objects.filter(
                        post=post
                    ).count(),
                },
                status=status.HTTP_201_CREATED
            )

        # ==========================================================
        # UNLIKE
        # ==========================================================

        if request.method == 'DELETE':

            deleted_count, _ = PostLike.objects.filter(
                post=post,
                user=request.user
            ).delete()

            if deleted_count == 0:
                return Response(
                    {
                        'message': 'You have not liked this post.',
                        'liked': False,
                        'likes_count': PostLike.objects.filter(
                            post=post
                        ).count(),
                    },
                    status=status.HTTP_200_OK
                )

            return Response(
                {
                    'message': 'Post unliked successfully.',
                    'liked': False,
                    'likes_count': PostLike.objects.filter(
                        post=post
                    ).count(),
                },
                status=status.HTTP_200_OK
            )

    @action(
        detail=True,
        methods=['get', 'post'],
        url_path='comments'
    )
    def comments(self, request, pk=None):
        post = self.get_object()

        if request.method == 'GET':
            comments = (
                post.comments
                .select_related('author')
                .order_by('created_at')
            )

            serializer = PostCommentSerializer(
                comments,
                many=True,
                context={'request': request}
            )

            return Response(serializer.data)

        serializer = PostCommentSerializer(
            data=request.data,
            context={'request': request}
        )

        serializer.is_valid(raise_exception=True)

        comment = serializer.save(
            post=post,
            author=request.user
        )

        return Response(
            PostCommentSerializer(
                comment,
                context={'request': request}
            ).data,
            status=status.HTTP_201_CREATED
        )


class PostCommentViewSet(viewsets.ModelViewSet):
    """
    API for managing individual comments.
    """

    serializer_class = PostCommentSerializer
    permission_classes = [IsAuthenticated]

    http_method_names = [
        'get',
        'delete',
    ]

    def get_queryset(self):
        return (
            PostComment.objects
            .select_related('author', 'post')
            .order_by('created_at')
        )

    def destroy(self, request, *args, **kwargs):
        comment = self.get_object()

        if comment.author != request.user:
            return Response(
                {
                    'detail': 'You can only delete your own comments.'
                },
                status=status.HTTP_403_FORBIDDEN
            )

        comment.delete()

        return Response(
            {
                'message': 'Comment deleted successfully.'
            },
            status=status.HTTP_200_OK
        )
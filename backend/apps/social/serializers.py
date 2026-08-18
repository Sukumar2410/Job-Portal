from rest_framework import serializers

from .models import Post, PostLike, PostComment


class PostAuthorSerializer(serializers.Serializer):
    """
    Lightweight author information for social posts.
    """

    id = serializers.IntegerField()
    email = serializers.EmailField()
    full_name = serializers.CharField()


class PostCommentSerializer(serializers.ModelSerializer):
    """
    Serializer for comments.
    """

    author_id = serializers.IntegerField(
        source='author.id',
        read_only=True
    )

    author_name = serializers.CharField(
        source='author.full_name',
        read_only=True
    )

    author_email = serializers.EmailField(
        source='author.email',
        read_only=True
    )

    class Meta:
        model = PostComment
        fields = (
            'id',
            'post',
            'author_id',
            'author_name',
            'author_email',
            'content',
            'created_at',
            'updated_at',
        )

        read_only_fields = (
            'id',
            'post',
            'author_id',
            'author_name',
            'author_email',
            'created_at',
            'updated_at',
        )


class PostListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer used for the social feed.
    """

    author_id = serializers.IntegerField(
        source='author.id',
        read_only=True
    )

    author_name = serializers.CharField(
        source='author.full_name',
        read_only=True
    )

    author_email = serializers.EmailField(
        source='author.email',
        read_only=True
    )

    likes_count = serializers.IntegerField(
        source='likes.count',
        read_only=True
    )

    comments_count = serializers.IntegerField(
        source='comments.count',
        read_only=True
    )

    is_liked = serializers.SerializerMethodField()

    image = serializers.ImageField(
        required=False,
        allow_null=True,
        write_only=True
    )

    video = serializers.FileField(
        required=False,
        allow_null=True,
        write_only=True
    )

    image_url = serializers.SerializerMethodField()

    video_url = serializers.SerializerMethodField()

    class Meta:
        model = Post

        fields = (
            'id',
            'author_id',
            'author_name',
            'author_email',
            'content',
            'image',
            'video',
            'image_url',
            'video_url',
            'visibility',
            'likes_count',
            'comments_count',
            'is_liked',
            'created_at',
            'updated_at',
        )

        read_only_fields = (
            'id',
            'author_id',
            'author_name',
            'author_email',
            'image_url',
            'video_url',
            'likes_count',
            'comments_count',
            'is_liked',
            'created_at',
            'updated_at',
        )

    def get_is_liked(self, obj):
        request = self.context.get('request')

        if not request or not request.user.is_authenticated:
            return False

        return obj.likes.filter(
            user=request.user
        ).exists()

    def get_image_url(self, obj):
        request = self.context.get('request')

        if not obj.image:
            return None

        url = obj.image.url

        if request:
            return request.build_absolute_uri(url)

        return url

    def get_video_url(self, obj):
        request = self.context.get('request')

        if not obj.video:
            return None

        url = obj.video.url

        if request:
            return request.build_absolute_uri(url)

        return url
        
class PostDetailSerializer(PostListSerializer):
    """
    Detailed post serializer including comments.
    """

    comments = PostCommentSerializer(
        many=True,
        read_only=True
    )

    class Meta(PostListSerializer.Meta):
        fields = PostListSerializer.Meta.fields + (
            'comments',
        )
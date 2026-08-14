from django.conf import settings
from django.db import models


class PostVisibility(models.TextChoices):
    PUBLIC = 'PUBLIC', 'Public'
    PRIVATE = 'PRIVATE', 'Private'
    HR_ONLY = 'HR_ONLY', 'HR Only'
    CANDIDATE_ONLY = 'CANDIDATE_ONLY', 'Candidate only'


class Post(models.Model):
    """
    LinkedIn-style user generated post.
    """

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='social_posts'
    )

    content = models.TextField()

    image = models.ImageField(
        upload_to='social/posts/',
        blank=True,
        null=True
    )

    video = models.FileField(
        upload_to='social/videos/',
        blank=True,
        null=True
    )

    visibility = models.CharField(
        max_length=20,
        choices=PostVisibility.choices,
        default=PostVisibility.PUBLIC
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'social_posts'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['author', '-created_at']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f'{self.author.email} - {self.content[:50]}'


class PostLike(models.Model):
    """
    Records a user's like on a post.
    """

    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name='likes'
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='social_post_likes'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'social_post_likes'
        ordering = ['-created_at']

        constraints = [
            models.UniqueConstraint(
                fields=['post', 'user'],
                name='unique_post_like'
            )
        ]

    def __str__(self):
        return f'{self.user.email} liked post {self.post.id}'


class PostComment(models.Model):
    """
    Comment made by a user on a post.
    """

    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name='comments'
    )

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='social_post_comments'
    )

    content = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'social_post_comments'
        ordering = ['created_at']

        indexes = [
            models.Index(fields=['post', 'created_at']),
        ]

    def __str__(self):
        return f'{self.author.email} commented on post {self.post.id}'
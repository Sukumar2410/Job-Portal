from django.conf import settings
from django.db import models


class Conversation(models.Model):
    """
    One AI chat session.
    """

    ROLE_CHOICES = (
        ("CANDIDATE", "Candidate"),
        ("HR", "HR"),
        ("ADMIN", "Admin"),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="ai_conversations"
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES
    )

    title = models.CharField(
        max_length=200,
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.user.email} - {self.title or 'New Conversation'}"


class ConversationMessage(models.Model):
    """
    Stores every message inside a conversation.
    """

    MESSAGE_ROLE_CHOICES = (
        ("user", "User"),
        ("assistant", "Assistant"),
    )

    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="messages"
    )

    role = models.CharField(
        max_length=20,
        choices=MESSAGE_ROLE_CHOICES
    )

    message = models.TextField()

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.role} ({self.conversation.id})"
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


class Conversation(models.Model):
    """
    Represents a private conversation between two users.
    """

    participant_1 = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='conversations_as_participant_1'
    )

    participant_2 = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='conversations_as_participant_2'
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        db_table = 'messaging_conversations'
        ordering = ['-updated_at']

        constraints = [
            models.UniqueConstraint(
                fields=['participant_1', 'participant_2'],
                name='unique_user_conversation'
            )
        ]

        indexes = [
            models.Index(
                fields=['participant_1', '-updated_at']
            ),
            models.Index(
                fields=['participant_2', '-updated_at']
            ),
        ]

    def clean(self):
        """
        Prevent a user from creating a conversation with themselves.
        """

        if (
            self.participant_1_id is not None
            and self.participant_2_id is not None
            and self.participant_1_id == self.participant_2_id
        ):
            raise ValidationError(
                'A user cannot have a conversation with themselves.'
            )

    def save(self, *args, **kwargs):
        """
        Store participant IDs in a consistent order.

        This prevents:
            User A + User B
        and
            User B + User A

        from being treated as two different conversations.
        """

        if (
            self.participant_1_id is not None
            and self.participant_2_id is not None
            and self.participant_1_id > self.participant_2_id
        ):
            self.participant_1_id, self.participant_2_id = (
                self.participant_2_id,
                self.participant_1_id
            )

        self.full_clean()

        super().save(*args, **kwargs)

    def __str__(self):
        return (
            f'Conversation: '
            f'{self.participant_1} ↔ {self.participant_2}'
        )


class Message(models.Model):
    """
    Represents an individual message inside a conversation.
    """

    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages'
    )

    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_messages'
    )

    content = models.TextField()

    is_read = models.BooleanField(
        default=False
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        db_table = 'messaging_messages'
        ordering = ['created_at']

        indexes = [
            models.Index(
                fields=['conversation', 'created_at']
            ),
            models.Index(
                fields=['sender', '-created_at']
            ),
            models.Index(
                fields=['conversation', 'is_read']
            ),
        ]

    def clean(self):
        """
        Make sure the sender belongs to the conversation.
        """

        if self.sender_id and self.conversation_id:

            if not (
                self.sender_id == self.conversation.participant_1_id
                or self.sender_id == self.conversation.participant_2_id
            ):
                raise ValidationError(
                    'The sender must be a participant in the conversation.'
                )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

        # Update the conversation timestamp whenever
        # a new message is created or an existing message changes.
        Conversation.objects.filter(
            id=self.conversation_id
        ).update(
            updated_at=self.created_at
        )

    def __str__(self):
        return (
            f'Message #{self.id} '
            f'by {self.sender}'
        )
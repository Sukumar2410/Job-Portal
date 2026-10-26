from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import User
from apps.notifications.email_service import send_welcome_email

@receiver(post_save, sender=User)
def welcome_email_signal(sender, instance, created, **kwargs):

    if created:
        send_welcome_email(instance)
"""
Centralized notification service.
Use these helper functions from anywhere in the app to send notifications.
"""
from .models import Notification, NotificationType, NotificationPriority


def send_notification(
    recipient,
    title,
    message,
    notification_type=NotificationType.OTHER,
    priority=NotificationPriority.NORMAL,
    action_url='',
    related_object_type='',
    related_object_id=None,
):
    """Create a single notification"""
    return Notification.objects.create(
        recipient=recipient,
        notification_type=notification_type,
        priority=priority,
        title=title,
        message=message,
        action_url=action_url,
        related_object_type=related_object_type,
        related_object_id=related_object_id,
    )


def send_bulk_notification(recipients, title, message, **kwargs):
    """Create the same notification for multiple recipients"""
    notifications = [
        Notification(
            recipient=user,
            title=title,
            message=message,
            notification_type=kwargs.get('notification_type', NotificationType.OTHER),
            priority=kwargs.get('priority', NotificationPriority.NORMAL),
            action_url=kwargs.get('action_url', ''),
            related_object_type=kwargs.get('related_object_type', ''),
            related_object_id=kwargs.get('related_object_id'),
        )
        for user in recipients
    ]
    return Notification.objects.bulk_create(notifications)
from .models import Event


def log_event(event_type, user=None, job=None, company=None, metadata=None, request=None):
    """Helper to log events consistently across the app"""
    ip_address = None
    user_agent = ''
    if request is not None:
        ip_address = request.META.get('REMOTE_ADDR')
        user_agent = request.META.get('HTTP_USER_AGENT', '')

    return Event.objects.create(
        event_type=event_type,
        user=user if (user and user.is_authenticated) else None,
        job=job,
        company=company,
        metadata=metadata or {},
        ip_address=ip_address,
        user_agent=user_agent,
    )
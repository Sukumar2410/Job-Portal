"""
Centralized audit log service.
Call log_action() from anywhere to record an audit entry.
"""
from .models import AuditLog, AuditAction, AuditSeverity


def log_action(
    action,
    actor=None,
    target=None,
    description='',
    changes=None,
    metadata=None,
    severity=AuditSeverity.INFO,
    request=None,
):
    """
    Create an audit log entry.

    Args:
        action: AuditAction choice
        actor: User object who performed the action
        target: The object acted upon (any Django model instance)
        description: Human-readable description
        changes: dict of {field: {before, after}} for updates
        metadata: additional context
        severity: INFO / WARNING / CRITICAL
        request: HTTP request (extracts IP + user agent)
    """
    ip_address = None
    user_agent = ''
    if request is not None:
        ip_address = _get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]

    actor_email = ''
    actor_role = ''
    if actor and hasattr(actor, 'email'):
        actor_email = actor.email
        actor_role = getattr(actor, 'role', '') or ''

    target_type = ''
    target_id = None
    target_repr = ''
    if target is not None:
        target_type = target.__class__.__name__
        target_id = getattr(target, 'pk', None)
        target_repr = str(target)[:300]

    return AuditLog.objects.create(
        action=action,
        severity=severity,
        actor=actor if (actor and getattr(actor, 'is_authenticated', False)) else None,
        actor_email=actor_email,
        actor_role=actor_role,
        target_type=target_type,
        target_id=target_id,
        target_repr=target_repr,
        description=description,
        changes=changes or {},
        metadata=metadata or {},
        ip_address=ip_address,
        user_agent=user_agent,
    )


def _get_client_ip(request):
    """Extract real IP from request (handles proxies)"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')
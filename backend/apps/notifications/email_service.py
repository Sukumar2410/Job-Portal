from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings

def send_welcome_email(user):

    html = render_to_string(
        "emails/welcome.html",
        {
            "name": user.full_name,
            "email": user.email,
            "role": user.get_role_display(),
            "login_url": "http://localhost:4200/login",
        },
    )

    email = EmailMultiAlternatives(
        subject="Welcome to Enterprise Job Portal 🎉",
        body="Welcome!",
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[user.email],
    )

    email.attach_alternative(html, "text/html")
    email.send()
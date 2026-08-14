import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User, UserRole

hrs = User.objects.filter(role=UserRole.HR)
print('HR users:', hrs.count())
for hr in hrs:
    profile = getattr(hr, 'hr_profile', None)
    company = getattr(profile, 'company', None)
    print('HR:', hr.email, 'company:', company.name if company else None)

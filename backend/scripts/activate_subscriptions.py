import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.utils import timezone
from datetime import timedelta
from apps.users.models import User, UserRole
from apps.payments.models import SubscriptionPlan, Subscription, SubscriptionStatus

cand = User.objects.filter(role=UserRole.CANDIDATE).first()
hr = User.objects.filter(email='hr8@retailhubcommerce.example.com').first()
cp = SubscriptionPlan.objects.filter(tier_code='CANDIDATE_PREMIUM').first()
hp = SubscriptionPlan.objects.filter(tier_code='PREMIUM').first()

print('candidate', cand.email if cand else 'none')
print('hr', hr.email if hr else 'none')
print('plan candidate', cp.id if cp else None)
print('plan hr', hp.id if hp else None)

now = timezone.now()

if cand and cp:
    sub = Subscription.objects.filter(user=cand, status=SubscriptionStatus.ACTIVE, plan=cp).first()
    print('cand existing', sub.id if sub else 'none')
    if not sub:
        sub = Subscription.objects.create(
            user=cand,
            plan=cp,
            status=SubscriptionStatus.ACTIVE,
            starts_at=now,
            expires_at=now + timedelta(days=30),
            auto_renew=True,
            discount_applied=0,
        )
        print('created candidate sub', sub.id)

if hr and hp and getattr(hr, 'hr_profile', None) and getattr(hr.hr_profile, 'company', None):
    company = hr.hr_profile.company
    sub2 = Subscription.objects.filter(company=company, status=SubscriptionStatus.ACTIVE, plan=hp).first()
    print('hr existing', sub2.id if sub2 else 'none')
    if not sub2:
        sub2 = Subscription.objects.create(
            company=company,
            plan=hp,
            status=SubscriptionStatus.ACTIVE,
            starts_at=now,
            expires_at=now + timedelta(days=30),
            auto_renew=True,
            discount_applied=0,
        )
        print('created hr sub', sub2.id)
else:
    print('HR user or company not found')

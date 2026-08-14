from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SubscriptionPlanViewSet, SubscriptionViewSet, PaymentViewSet,
    CouponViewSet,
    create_order, verify_payment, current_subscription,
    validate_coupon, revenue_dashboard,
)

router = DefaultRouter()
router.register(r'plans', SubscriptionPlanViewSet, basename='plan')
router.register(r'coupons', CouponViewSet, basename='coupon')
router.register(r'subscriptions', SubscriptionViewSet, basename='subscription')
router.register(r'payments', PaymentViewSet, basename='payment')

urlpatterns = [
    # Coupon validation (for candidates/HR during checkout)
    path('coupons/validate/', validate_coupon, name='validate_coupon'),

    path('', include(router.urls)),

    # Razorpay checkout
    path('create-order/', create_order, name='create_order'),
    path('verify-payment/', verify_payment, name='verify_payment'),

    # My subscription
    path('my-subscription/', current_subscription, name='current_subscription'),

    # Admin revenue dashboard
    path('revenue/', revenue_dashboard, name='revenue_dashboard'),
]
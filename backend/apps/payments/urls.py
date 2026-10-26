from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SubscriptionPlanViewSet, 
    SubscriptionViewSet, 
    PaymentViewSet,
    CouponViewSet,
    create_order, 
    verify_payment, 
    current_subscription,
    validate_coupon, 
    revenue_dashboard,
    admin_manual_payment_override,
    webhook_handler,
)

router = DefaultRouter()
router.register(r'plans', SubscriptionPlanViewSet, basename='plan')
router.register(r'coupons', CouponViewSet, basename='coupon')
router.register(r'subscriptions', SubscriptionViewSet, basename='subscription')
router.register(r'payments', PaymentViewSet, basename='payment')

urlpatterns = [
    # Static & Specific action routes must precede router paths
    path('coupons/validate/', validate_coupon, name='validate_coupon'),
    path('create-order/', create_order, name='create_order'),
    path('verify-payment/', verify_payment, name='verify_payment'),
    path('my-subscription/', current_subscription, name='current_subscription'),
    path('webhook/', webhook_handler, name='razorpay_webhook'),

    # Super Admin Dashboard & Manual Actions
    path('revenue/', revenue_dashboard, name='revenue_dashboard'),
    path('manual-payment/', admin_manual_payment_override, name='admin_manual_payment'),

    # Default router URLs (CRUDRoutes)
    path('', include(router.urls)),
]
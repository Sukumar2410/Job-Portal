from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NotificationViewSet, broadcast_notification

router = DefaultRouter()
router.register(r'', NotificationViewSet, basename='notification')

urlpatterns = [
    path('broadcast/', broadcast_notification, name='broadcast_notification'),
    path('', include(router.urls)),
]
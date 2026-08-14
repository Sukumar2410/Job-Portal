from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ApplicationViewSet, InterviewViewSet

router = DefaultRouter()
router.register(r'interviews', InterviewViewSet, basename='interview')
router.register(r'', ApplicationViewSet, basename='application')

urlpatterns = [
    path('', include(router.urls)),
]
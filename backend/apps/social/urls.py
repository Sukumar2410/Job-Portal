from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import PostViewSet, PostCommentViewSet


router = DefaultRouter()

router.register(
    r'posts',
    PostViewSet,
    basename='social-post'
)

router.register(
    r'comments',
    PostCommentViewSet,
    basename='social-comment'
)


urlpatterns = [
    path('', include(router.urls)),
]
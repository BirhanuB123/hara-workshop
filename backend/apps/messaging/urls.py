from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ConversationViewSet, MessageViewSet

router = DefaultRouter()
router.register(r'conversations', ConversationViewSet, basename='conversations')
router.register(r'messages', MessageViewSet, basename='messages')

root_router = DefaultRouter()
root_router.register(r'', ConversationViewSet, basename='messaging_root')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(root_router.urls)),
]

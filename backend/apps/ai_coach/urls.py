from django.urls import path

from .views import (
    chat,
    conversations,
    conversation_detail,
    delete_conversation,
    update_conversation_title,
    resume_review,
)

urlpatterns = [

    # AI Chat
    path(
        "chat/",
        chat,
        name="ai-coach-chat",
    ),

    # Resume Review
    path(
        "resume-review/",
        resume_review,
        name="resume-review",
    ),

    # GET = List Conversations
    # POST = Create Conversation
    path(
        "conversations/",
        conversations,
        name="conversations",
    ),

    # Conversation Detail
    path(
        "conversations/<int:pk>/",
        conversation_detail,
        name="conversation-detail",
    ),

    # Update Conversation Title
    path(
        "conversations/<int:pk>/title/",
        update_conversation_title,
        name="update-conversation-title",
    ),

    # Delete Conversation
    path(
        "conversations/<int:pk>/delete/",
        delete_conversation,
        name="delete-conversation",
    ),

]
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';
import { API } from '../constants/api.constants';

import {
  ChatRequest,
  ChatResponse,
  Conversation,
  ConversationDetail,
  ResumeReviewResponse
} from '../models/ai-coach.model';

@Injectable({
  providedIn: 'root'
})
export class AiCoachService {

  private api = inject(ApiService);

  // ============================
  // AI Chat
  // ============================

  chat(
    message: string,
    role: 'CANDIDATE' | 'HR' | 'ADMIN',
    conversationId?: number | null
  ): Observable<ChatResponse> {

    const payload: ChatRequest = {
      message,
      role,
      conversation_id: conversationId ?? null
    };

    return this.api.post<ChatResponse>(
      API.AI_COACH.CHAT,
      payload
    );

  }

  chatWithFile(
    message: string,
    role: 'CANDIDATE' | 'HR' | 'ADMIN',
    conversationId: number | null,
    file: File
  ): Observable<ChatResponse> {

    const formData = new FormData();

    formData.append('message', message);
    formData.append('role', role);

    if (conversationId !== null) {
      formData.append(
        'conversation_id',
        conversationId.toString()
      );
    }

    formData.append('file', file);

    return this.api.postFormData<ChatResponse>(
      API.AI_COACH.CHAT,
      formData
    );
  }

  createConversation(
    role: 'CANDIDATE' | 'HR' | 'ADMIN'
  ): Observable<Conversation> {

    return this.api.post<Conversation>(
      API.AI_COACH.CONVERSATIONS,
      {
        role
      }
    );

  }

  // ============================
  // Conversations
  // ============================

  getConversations(): Observable<Conversation[]> {

    return this.api.get<Conversation[]>(
      API.AI_COACH.CONVERSATIONS
    );

  }

  getConversation(
    id: number
  ): Observable<ConversationDetail> {

    return this.api.get<ConversationDetail>(
      `${API.AI_COACH.CONVERSATIONS}${id}/`
    );

  }

  deleteConversation(
    id: number
  ): Observable<void> {

    return this.api.delete<void>(
      `${API.AI_COACH.CONVERSATIONS}${id}/delete/`
    );

  }

  updateConversationTitle(
  id: number,
  title: string
): Observable<Conversation> {

  return this.api.patch<Conversation>(
    API.AI_COACH.UPDATE_TITLE(id),
    {
      title
    }
  );

}

resumeReview(): Observable<ResumeReviewResponse> {

  return this.api.post<ResumeReviewResponse>(
    API.AI_COACH.RESUME_REVIEW,
    {}
  );

}

}
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';
import { API } from '../constants/api.constants';

import {
  Conversation,
  ConversationDetail,
  ConversationsResponse,
  CreateConversationPayload,
  Message,
  MessagingUser,
  SendMessagePayload
} from '../models/messaging.model';


@Injectable({
  providedIn: 'root'
})
export class MessagingService {

  private api = inject(ApiService);


  // ==========================================================
  // CONVERSATIONS
  // ==========================================================


  /**
   * Get all conversations belonging to the
   * currently authenticated user.
   */
  getConversations(
    page?: number
  ): Observable<ConversationsResponse> {

    const params = page
      ? { page }
      : undefined;

    return this.api.get<ConversationsResponse>(
      API.MESSAGING.CONVERSATIONS,
      params
    );
  }


  /**
   * Get details of a single conversation.
   */
  getConversation(
    id: number
  ): Observable<ConversationDetail> {

    return this.api.get<ConversationDetail>(
      API.MESSAGING.CONVERSATION_DETAIL(id)
    );
  }


  /**
   * Create a new conversation with another user.
   *
   * The authenticated user is automatically handled
   * by the Django backend.
   */
  createConversation(
    participantId: number
  ): Observable<Conversation> {
    return this.api.post<Conversation>(
      API.MESSAGING.CONVERSATIONS,
      {
        participant_2: participantId
      }
    );
  }


  // ==========================================================
  // MESSAGES
  // ==========================================================


  /**
   * Get all messages belonging to a conversation.
   *
   * Backend:
   * GET /api/messaging/conversations/{id}/messages/
   */
  getMessages(
    conversationId: number
  ): Observable<Message[]> {

    return this.api.get<Message[]>(
      API.MESSAGING.MESSAGES(conversationId)
    );
  }


  /**
   * Send a new message.
   *
   * Backend:
   * POST /api/messaging/conversations/{id}/messages/
   */
  sendMessage(
    conversationId: number,
    payload: SendMessagePayload
  ): Observable<Message> {

    return this.api.post<Message>(
      API.MESSAGING.MESSAGES(conversationId),
      payload
    );
  }


  // ==========================================================
  // READ STATUS
  // ==========================================================


  /**
   * Mark all messages sent by other users
   * in the conversation as read.
   *
   * Backend:
   * POST /api/messaging/conversations/{id}/read/
   */
  markAsRead(
    conversationId: number
  ): Observable<{
    message: string;
    updated_count: number;
  }> {

    return this.api.post<{
      message: string;
      updated_count: number;
    }>(
      API.MESSAGING.MARK_AS_READ(conversationId),
      {}
    );
  }

  getUsers(
    search?: string,
    role?: string
  ): Observable<MessagingUser[]> {

    const params: Record<string, string> = {};

    if (search?.trim()) {
      params['search'] = search.trim();
    }

    if (role) {
      params['role'] = role;
    }

    return this.api.get<MessagingUser[]>(
      API.MESSAGING.USERS,
      params
    );
  }

}
export interface ChatRequest {
  message: string;

  role: 'CANDIDATE' | 'HR' | 'ADMIN';

  conversation_id?: number | null;
}

export interface ChatResponse {

  conversation_id: number;
  
  reply: string;
}

export interface ChatMessage {

  role: 'user' | 'assistant';

  message: string;

  timestamp: Date;

  copied?: boolean;

}

// ===========================================
// Conversation List
// ===========================================

export interface Conversation {

  id: number;

  title: string;

  role: string;

  updated_at: string;

  message_count: number;

}

// ===========================================
// Conversation Detail
// ===========================================

export interface ConversationMessage {

  id: number;

  role: 'user' | 'assistant';

  content: string;

  created_at: string;

  message: string;

}

export interface ConversationDetail {

  id: number;

  title: string;

  role: string;

  created_at: string;

  updated_at: string;

  messages: ConversationMessage[];

}

// ===========================================
// Resume Review
// ===========================================

export interface ResumeReviewResponse {

  review: string;

}
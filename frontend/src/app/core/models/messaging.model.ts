// ==========================================================
// MESSAGING USER
// ==========================================================

export interface MessagingUser {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

// ==========================================================
// MESSAGE
// ==========================================================

export interface Message {
  id: number;

  conversation: number;

  sender_id: number;
  sender_name: string;
  sender_email: string;

  content: string;

  is_read: boolean;

  created_at: string;
  updated_at: string;
}


// ==========================================================
// SEND MESSAGE PAYLOAD
// ==========================================================

export interface SendMessagePayload {
  content: string;
}


// ==========================================================
// CREATE CONVERSATION PAYLOAD
// ==========================================================

export interface CreateConversationPayload {
  participant_2: number;
}


// ==========================================================
// CONVERSATION
// ==========================================================

export interface Conversation {
  id: number;

  participant_1: MessagingUser;
  participant_2: MessagingUser;

  other_user: MessagingUser | null;

  last_message: Message | null;

  unread_count: number;

  created_at: string;
  updated_at: string;
}


// ==========================================================
// CONVERSATION DETAIL
// ==========================================================

export interface ConversationDetail extends Conversation {
  messages: Message[];
}


// ==========================================================
// CONVERSATION LIST RESPONSE
// ==========================================================

export interface ConversationsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Conversation[];
}


import type { ChatHistory } from '../../entities/ChatHistory';
import type { MessageFeedback } from '../../entities/MessageFeedback';
import type { RagResponse } from '@istock/shared';

/**
 * Service interface for health consultation operations
 */
export interface IHealthService {
  /**
   * Ask a health question and get AI response
   */
  askQuestion(query: string, userId: string): Promise<RagResponse>;

  /**
   * Get chat history for a user
   */
  getChatHistory(userId: string): Promise<ChatHistory[]>;

  /**
   * Get a specific chat by ID
   */
  getChat(chatId: string, userId: string): Promise<ChatHistory | null>;

  /**
   * Save a chat conversation
   */
  saveChat(
    chatData: Omit<ChatHistory, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { id?: string },
    userId: string
  ): Promise<string>;

  /**
   * Update a chat
   */
  updateChat(
    chatId: string,
    userId: string,
    updates: Partial<Pick<ChatHistory, 'title' | 'query' | 'response' | 'sources' | 'confidence'>>
  ): Promise<void>;

  /**
   * Delete a chat
   */
  deleteChat(chatId: string, userId: string): Promise<void>;

  /**
   * Save message feedback
   */
  saveMessageFeedback(userId: string, feedback: MessageFeedback): Promise<void>;

  /**
   * Get message feedback
   */
  getMessageFeedback(userId: string, messageId: string): Promise<MessageFeedback | null>;
}


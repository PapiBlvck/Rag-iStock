import type { ChatHistory } from '../../entities/ChatHistory';

/**
 * Repository interface for chat history operations
 */
export interface IChatRepository {
  /**
   * Find a chat by ID
   */
  findById(id: string, userId: string): Promise<ChatHistory | null>;

  /**
   * Find all chats for a user, ordered by timestamp
   */
  findAll(userId: string): Promise<ChatHistory[]>;

  /**
   * Create a new chat
   */
  create(chat: Omit<ChatHistory, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<ChatHistory>;

  /**
   * Update an existing chat
   */
  update(id: string, userId: string, updates: Partial<Pick<ChatHistory, 'title' | 'query' | 'response' | 'sources' | 'confidence'>>): Promise<ChatHistory>;

  /**
   * Delete a chat
   */
  delete(id: string, userId: string): Promise<void>;
}


import type { IHealthService } from '../interfaces/IHealthService';
import type { IChatRepository } from '../../repositories/interfaces/IChatRepository';
import type { ChatHistory } from '../../entities/ChatHistory';
import type { MessageFeedback } from '../../entities/MessageFeedback';
import type { RagResponse } from '@istock/shared';
import { NotFoundError, UnauthorizedError } from '@/lib/errors/DomainError';
import {
  saveMessageFeedback as saveFeedbackToFirestore,
  getMessageFeedback as getFeedbackFromFirestore,
} from '@/lib/firestore-services';

/**
 * Health service implementation
 */
export class HealthService implements IHealthService {
  private chatRepository: IChatRepository;
  private ragClient: { askRag: (query: string) => Promise<RagResponse> };

  constructor(
    chatRepository: IChatRepository,
    ragClient: { askRag: (query: string) => Promise<RagResponse> }
  ) {
    this.chatRepository = chatRepository;
    this.ragClient = ragClient;
  }

  async askQuestion(query: string, userId: string): Promise<RagResponse> {
    if (!userId) {
      throw new UnauthorizedError('User must be authenticated to ask questions');
    }

    if (!query || query.trim().length === 0) {
      throw new Error('Query cannot be empty');
    }

    return await this.ragClient.askRag(query);
  }

  async getChatHistory(userId: string): Promise<ChatHistory[]> {
    if (!userId) {
      throw new UnauthorizedError('User must be authenticated');
    }
    return await this.chatRepository.findAll(userId);
  }

  async getChat(chatId: string, userId: string): Promise<ChatHistory | null> {
    if (!userId) {
      throw new UnauthorizedError('User must be authenticated');
    }
    return await this.chatRepository.findById(chatId, userId);
  }

  async saveChat(
    chatData: Omit<ChatHistory, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { id?: string },
    userId: string
  ): Promise<string> {
    if (!userId) {
      throw new UnauthorizedError('User must be authenticated');
    }

    const chat = await this.chatRepository.create({
      ...chatData,
      userId,
    });

    return chat.id;
  }

  async updateChat(
    chatId: string,
    userId: string,
    updates: Partial<Pick<ChatHistory, 'title' | 'query' | 'response' | 'sources' | 'confidence'>>
  ): Promise<void> {
    if (!userId) {
      throw new UnauthorizedError('User must be authenticated');
    }

    const chat = await this.chatRepository.findById(chatId, userId);
    if (!chat) {
      throw new NotFoundError('Chat', chatId);
    }

    await this.chatRepository.update(chatId, userId, updates);
  }

  async deleteChat(chatId: string, userId: string): Promise<void> {
    if (!userId) {
      throw new UnauthorizedError('User must be authenticated');
    }

    const chat = await this.chatRepository.findById(chatId, userId);
    if (!chat) {
      throw new NotFoundError('Chat', chatId);
    }

    await this.chatRepository.delete(chatId, userId);
  }

  async saveMessageFeedback(userId: string, feedback: MessageFeedback): Promise<void> {
    if (!userId) {
      throw new UnauthorizedError('User must be authenticated');
    }

    await saveFeedbackToFirestore(userId, feedback.messageId, {
      ...feedback,
      timestamp: feedback.timestamp,
    });
  }

  async getMessageFeedback(userId: string, messageId: string): Promise<MessageFeedback | null> {
    if (!userId) {
      throw new UnauthorizedError('User must be authenticated');
    }

    const feedback = await getFeedbackFromFirestore(userId, messageId);
    if (!feedback) return null;
    
    return {
      messageId: feedback.messageId,
      messageText: feedback.messageText,
      feedback: feedback.feedback,
      timestamp: feedback.timestamp instanceof Date ? feedback.timestamp : new Date(feedback.timestamp),
    };
  }
}


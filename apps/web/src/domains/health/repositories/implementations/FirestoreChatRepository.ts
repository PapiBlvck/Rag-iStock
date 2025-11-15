import type { IChatRepository } from '../interfaces/IChatRepository';
import type { ChatHistory } from '../../entities/ChatHistory';
import {
  getDocument,
  setDocument,
  updateDocument,
  deleteDocument as deleteDocumentUtil,
  getDocumentsOrderedByTime,
  timestampToDate,
  dateToTimestamp,
} from '@/lib/firestore';

const CHATS_COLLECTION = 'chats';

/**
 * Firestore implementation of chat repository
 */
export class FirestoreChatRepository implements IChatRepository {
  async findById(id: string, userId: string): Promise<ChatHistory | null> {
    const chat = await getDocument<ChatHistory & { timestamp: any }>(CHATS_COLLECTION, id);
    if (!chat || chat.userId !== userId) {
      return null;
    }
    return {
      ...chat,
      timestamp: timestampToDate(chat.timestamp),
      createdAt: chat.createdAt ? timestampToDate(chat.createdAt) : undefined,
      updatedAt: chat.updatedAt ? timestampToDate(chat.updatedAt) : undefined,
    };
  }

  async findAll(userId: string): Promise<ChatHistory[]> {
    const chats = await getDocumentsOrderedByTime<ChatHistory & { timestamp: any }>(
      CHATS_COLLECTION,
      userId
    );
    return chats.map((chat) => ({
      ...chat,
      timestamp: timestampToDate(chat.timestamp),
      createdAt: chat.createdAt ? timestampToDate(chat.createdAt) : undefined,
      updatedAt: chat.updatedAt ? timestampToDate(chat.updatedAt) : undefined,
    }));
  }

  async create(
    chatData: Omit<ChatHistory, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): Promise<ChatHistory> {
    const chatId = chatData.id || `chat-${Date.now()}`;
    const { id, ...dataWithoutId } = chatData;
    
    const firestoreData = {
      ...dataWithoutId,
      userId: chatData.userId,
      id: chatId,
      timestamp: dateToTimestamp(chatData.timestamp),
      createdAt: dateToTimestamp(new Date()),
    };

    await setDocument(CHATS_COLLECTION, chatId, firestoreData);

    return {
      ...chatData,
      id: chatId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async update(
    id: string,
    userId: string,
    updates: Partial<Pick<ChatHistory, 'title' | 'query' | 'response' | 'sources' | 'confidence'>>
  ): Promise<ChatHistory> {
    const chat = await this.findById(id, userId);
    if (!chat) {
      throw new Error('Chat not found or access denied');
    }

    await updateDocument(CHATS_COLLECTION, id, {
      ...updates,
      updatedAt: dateToTimestamp(new Date()),
    });

    return {
      ...chat,
      ...updates,
      updatedAt: new Date(),
    };
  }

  async delete(id: string, userId: string): Promise<void> {
    const chat = await this.findById(id, userId);
    if (!chat) {
      throw new Error('Chat not found or access denied');
    }
    await deleteDocumentUtil(CHATS_COLLECTION, id);
  }
}


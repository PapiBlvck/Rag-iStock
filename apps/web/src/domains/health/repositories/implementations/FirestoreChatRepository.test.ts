import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FirestoreChatRepository } from './FirestoreChatRepository';
import * as firestore from '@/lib/firestore';

vi.mock('@/lib/firestore', () => ({
  getDocument: vi.fn(),
  setDocument: vi.fn(),
  updateDocument: vi.fn(),
  deleteDocument: vi.fn(),
  getDocumentsOrderedByTime: vi.fn(),
  timestampToDate: vi.fn((date) => (date instanceof Date ? date : new Date(date))),
  dateToTimestamp: vi.fn((date) => date.toISOString()),
}));

describe('FirestoreChatRepository', () => {
  let repository: FirestoreChatRepository;

  beforeEach(() => {
    repository = new FirestoreChatRepository();
    vi.clearAllMocks();
  });

  describe('findById', () => {
    it('should return null if chat does not exist', async () => {
      vi.mocked(firestore.getDocument).mockResolvedValue(null);

      const result = await repository.findById('chat1', 'user123');

      expect(result).toBeNull();
      expect(firestore.getDocument).toHaveBeenCalledWith('chats', 'chat1');
    });

    it('should return null if userId does not match', async () => {
      vi.mocked(firestore.getDocument).mockResolvedValue({
        id: 'chat1',
        userId: 'other-user',
        title: 'Test',
        query: 'Test query',
        response: 'Test response',
        timestamp: new Date().toISOString(),
      } as any);

      const result = await repository.findById('chat1', 'user123');

      expect(result).toBeNull();
    });

    it('should return chat if found and userId matches', async () => {
      const mockChat = {
        id: 'chat1',
        userId: 'user123',
        title: 'Test',
        query: 'Test query',
        response: 'Test response',
        timestamp: new Date().toISOString(),
      };

      vi.mocked(firestore.getDocument).mockResolvedValue(mockChat as any);
      vi.mocked(firestore.timestampToDate).mockReturnValue(new Date(mockChat.timestamp));

      const result = await repository.findById('chat1', 'user123');

      expect(result).toBeDefined();
      expect(result?.id).toBe('chat1');
      expect(result?.userId).toBe('user123');
    });
  });

  describe('findAll', () => {
    it('should return empty array if no chats found', async () => {
      vi.mocked(firestore.getDocumentsOrderedByTime).mockResolvedValue([]);

      const result = await repository.findAll('user123');

      expect(result).toEqual([]);
      expect(firestore.getDocumentsOrderedByTime).toHaveBeenCalledWith('chats', 'user123');
    });

    it('should return all chats for user', async () => {
      const mockChats = [
        {
          id: 'chat1',
          userId: 'user123',
          title: 'Test 1',
          query: 'Query 1',
          response: 'Response 1',
          timestamp: new Date().toISOString(),
        },
        {
          id: 'chat2',
          userId: 'user123',
          title: 'Test 2',
          query: 'Query 2',
          response: 'Response 2',
          timestamp: new Date().toISOString(),
        },
      ];

      vi.mocked(firestore.getDocumentsOrderedByTime).mockResolvedValue(mockChats as any);
      vi.mocked(firestore.timestampToDate).mockImplementation((date) => {
        if (typeof date === 'string') return new Date(date);
        return new Date();
      });

      const result = await repository.findAll('user123');

      expect(result).toHaveLength(2);
      expect(firestore.getDocumentsOrderedByTime).toHaveBeenCalledWith('chats', 'user123');
    });
  });

  describe('create', () => {
    it('should create a new chat with generated ID', async () => {
      const chatData = {
        userId: 'user123',
        title: 'Test',
        query: 'Test query',
        response: 'Test response',
        timestamp: new Date(),
      };

      await repository.create(chatData);

      expect(firestore.setDocument).toHaveBeenCalledWith(
        'chats',
        expect.stringContaining('chat-'),
        expect.objectContaining({
          userId: 'user123',
          title: 'Test',
        })
      );
    });

    it('should create a new chat with provided ID', async () => {
      const chatData = {
        id: 'custom-chat-id',
        userId: 'user123',
        title: 'Test',
        query: 'Test query',
        response: 'Test response',
        timestamp: new Date(),
      };

      await repository.create(chatData);

      expect(firestore.setDocument).toHaveBeenCalledWith(
        'chats',
        'custom-chat-id',
        expect.objectContaining({
          id: 'custom-chat-id',
          userId: 'user123',
        })
      );
    });
  });

  describe('update', () => {
    it('should throw error if chat not found', async () => {
      vi.mocked(firestore.getDocument).mockResolvedValue(null);

      await expect(
        repository.update('chat1', 'user123', { title: 'Updated' })
      ).rejects.toThrow('Chat not found or access denied');
    });

    it('should throw error if userId does not match', async () => {
      vi.mocked(firestore.getDocument).mockResolvedValue({
        id: 'chat1',
        userId: 'other-user',
        title: 'Test',
        query: 'Test query',
        response: 'Test response',
        timestamp: new Date().toISOString(),
      } as any);

      await expect(
        repository.update('chat1', 'user123', { title: 'Updated' })
      ).rejects.toThrow('Chat not found or access denied');
    });

    it('should update chat if found', async () => {
      const mockChat = {
        id: 'chat1',
        userId: 'user123',
        title: 'Test',
        query: 'Test query',
        response: 'Test response',
        timestamp: new Date().toISOString(),
      };

      vi.mocked(firestore.getDocument).mockResolvedValue(mockChat as any);
      vi.mocked(firestore.timestampToDate).mockReturnValue(new Date());

      await repository.update('chat1', 'user123', { title: 'Updated' });

      expect(firestore.updateDocument).toHaveBeenCalledWith(
        'chats',
        'chat1',
        expect.objectContaining({ title: 'Updated' })
      );
    });
  });

  describe('delete', () => {
    it('should throw error if chat not found', async () => {
      vi.mocked(firestore.getDocument).mockResolvedValue(null);

      await expect(repository.delete('chat1', 'user123')).rejects.toThrow(
        'Chat not found or access denied'
      );
    });

    it('should throw error if userId does not match', async () => {
      vi.mocked(firestore.getDocument).mockResolvedValue({
        id: 'chat1',
        userId: 'other-user',
        title: 'Test',
        query: 'Test query',
        response: 'Test response',
        timestamp: new Date().toISOString(),
      } as any);

      await expect(repository.delete('chat1', 'user123')).rejects.toThrow(
        'Chat not found or access denied'
      );
    });

    it('should delete chat if found', async () => {
      const mockChat = {
        id: 'chat1',
        userId: 'user123',
        title: 'Test',
        query: 'Test query',
        response: 'Test response',
        timestamp: new Date().toISOString(),
      };

      vi.mocked(firestore.getDocument).mockResolvedValue(mockChat as any);
      vi.mocked(firestore.timestampToDate).mockReturnValue(new Date());

      await repository.delete('chat1', 'user123');

      expect(firestore.deleteDocument).toHaveBeenCalledWith('chats', 'chat1');
    });
  });
});


import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HealthService } from './HealthService';
import type { IChatRepository } from '../../../repositories/interfaces/IChatRepository';
import type { ChatHistory } from '../../../entities/ChatHistory';
import type { RagResponse } from '@istock/shared';
import { NotFoundError, UnauthorizedError } from '@/lib/errors/DomainError';

describe('HealthService', () => {
  let healthService: HealthService;
  let mockChatRepository: IChatRepository;
  let mockRagClient: { askRag: (query: string) => Promise<RagResponse> };

  beforeEach(() => {
    mockChatRepository = {
      findById: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    mockRagClient = {
      askRag: vi.fn(),
    };

    healthService = new HealthService(mockChatRepository, mockRagClient);
  });

  describe('askQuestion', () => {
    it('should throw UnauthorizedError if userId is missing', async () => {
      await expect(healthService.askQuestion('test query', '')).rejects.toThrow(UnauthorizedError);
    });

    it('should throw error if query is empty', async () => {
      await expect(healthService.askQuestion('', 'user123')).rejects.toThrow('Query cannot be empty');
    });

    it('should throw error if query is only whitespace', async () => {
      await expect(healthService.askQuestion('   ', 'user123')).rejects.toThrow('Query cannot be empty');
    });

    it('should call ragClient.askRag with query', async () => {
      const mockResponse: RagResponse = {
        text: 'Test response',
        sources: [],
        confidence: 0.9,
      };

      vi.mocked(mockRagClient.askRag).mockResolvedValue(mockResponse);

      const result = await healthService.askQuestion('test query', 'user123');

      expect(mockRagClient.askRag).toHaveBeenCalledWith('test query');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getChatHistory', () => {
    it('should throw UnauthorizedError if userId is missing', async () => {
      await expect(healthService.getChatHistory('')).rejects.toThrow(UnauthorizedError);
    });

    it('should return chat history from repository', async () => {
      const mockChats: ChatHistory[] = [
        {
          id: 'chat1',
          userId: 'user123',
          title: 'Test Chat',
          query: 'Test query',
          response: 'Test response',
          timestamp: new Date(),
        },
      ];

      vi.mocked(mockChatRepository.findAll).mockResolvedValue(mockChats);

      const result = await healthService.getChatHistory('user123');

      expect(mockChatRepository.findAll).toHaveBeenCalledWith('user123');
      expect(result).toEqual(mockChats);
    });
  });

  describe('getChat', () => {
    it('should throw UnauthorizedError if userId is missing', async () => {
      await expect(healthService.getChat('chat1', '')).rejects.toThrow(UnauthorizedError);
    });

    it('should return chat from repository', async () => {
      const mockChat: ChatHistory = {
        id: 'chat1',
        userId: 'user123',
        title: 'Test Chat',
        query: 'Test query',
        response: 'Test response',
        timestamp: new Date(),
      };

      vi.mocked(mockChatRepository.findById).mockResolvedValue(mockChat);

      const result = await healthService.getChat('chat1', 'user123');

      expect(mockChatRepository.findById).toHaveBeenCalledWith('chat1', 'user123');
      expect(result).toEqual(mockChat);
    });

    it('should return null if chat not found', async () => {
      vi.mocked(mockChatRepository.findById).mockResolvedValue(null);

      const result = await healthService.getChat('chat1', 'user123');

      expect(result).toBeNull();
    });
  });

  describe('saveChat', () => {
    it('should throw UnauthorizedError if userId is missing', async () => {
      const chatData = {
        title: 'Test',
        query: 'Test query',
        response: 'Test response',
        timestamp: new Date(),
      };

      await expect(healthService.saveChat(chatData, '')).rejects.toThrow(UnauthorizedError);
    });

    it('should create chat via repository', async () => {
      const chatData = {
        title: 'Test',
        query: 'Test query',
        response: 'Test response',
        timestamp: new Date(),
      };

      const mockChat: ChatHistory = {
        ...chatData,
        id: 'chat1',
        userId: 'user123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockChatRepository.create).mockResolvedValue(mockChat);

      const result = await healthService.saveChat(chatData, 'user123');

      expect(mockChatRepository.create).toHaveBeenCalledWith({
        ...chatData,
        userId: 'user123',
      });
      expect(result).toBe('chat1');
    });
  });

  describe('updateChat', () => {
    it('should throw UnauthorizedError if userId is missing', async () => {
      await expect(
        healthService.updateChat('chat1', '', { title: 'Updated' })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw NotFoundError if chat does not exist', async () => {
      vi.mocked(mockChatRepository.findById).mockResolvedValue(null);

      await expect(
        healthService.updateChat('chat1', 'user123', { title: 'Updated' })
      ).rejects.toThrow(NotFoundError);
    });

    it('should update chat via repository', async () => {
      const mockChat: ChatHistory = {
        id: 'chat1',
        userId: 'user123',
        title: 'Test',
        query: 'Test query',
        response: 'Test response',
        timestamp: new Date(),
      };

      vi.mocked(mockChatRepository.findById).mockResolvedValue(mockChat);
      vi.mocked(mockChatRepository.update).mockResolvedValue({
        ...mockChat,
        title: 'Updated',
      });

      await healthService.updateChat('chat1', 'user123', { title: 'Updated' });

      expect(mockChatRepository.update).toHaveBeenCalledWith('chat1', 'user123', { title: 'Updated' });
    });
  });

  describe('deleteChat', () => {
    it('should throw UnauthorizedError if userId is missing', async () => {
      await expect(healthService.deleteChat('chat1', '')).rejects.toThrow(UnauthorizedError);
    });

    it('should throw NotFoundError if chat does not exist', async () => {
      vi.mocked(mockChatRepository.findById).mockResolvedValue(null);

      await expect(healthService.deleteChat('chat1', 'user123')).rejects.toThrow(NotFoundError);
    });

    it('should delete chat via repository', async () => {
      const mockChat: ChatHistory = {
        id: 'chat1',
        userId: 'user123',
        title: 'Test',
        query: 'Test query',
        response: 'Test response',
        timestamp: new Date(),
      };

      vi.mocked(mockChatRepository.findById).mockResolvedValue(mockChat);

      await healthService.deleteChat('chat1', 'user123');

      expect(mockChatRepository.delete).toHaveBeenCalledWith('chat1', 'user123');
    });
  });

  describe('saveMessageFeedback', () => {
    it('should throw UnauthorizedError if userId is missing', async () => {
      const feedback = {
        messageId: 'msg1',
        messageText: 'Test',
        feedback: 'like' as const,
        timestamp: new Date(),
      };

      await expect(healthService.saveMessageFeedback('', feedback)).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('getMessageFeedback', () => {
    it('should throw UnauthorizedError if userId is missing', async () => {
      await expect(healthService.getMessageFeedback('', 'msg1')).rejects.toThrow(UnauthorizedError);
    });
  });
});


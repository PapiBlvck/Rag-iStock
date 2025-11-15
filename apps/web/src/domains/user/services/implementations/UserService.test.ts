import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService } from './UserService';
import type { IUserRepository } from '../../repositories/interfaces/IUserRepository';
import type { UserProfile } from '../../entities/UserProfile';
import { NotFoundError, UnauthorizedError } from '@/lib/errors/DomainError';

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: IUserRepository;

  beforeEach(() => {
    mockUserRepository = {
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    };

    userService = new UserService(mockUserRepository);
  });

  describe('getProfile', () => {
    it('should throw UnauthorizedError if userId is missing', async () => {
      await expect(userService.getProfile('')).rejects.toThrow(UnauthorizedError);
    });

    it('should return user profile from repository', async () => {
      const mockProfile: UserProfile = {
        id: 'user123',
        email: 'test@example.com',
        role: 'Farmer',
        displayName: 'Test User',
      };

      vi.mocked(mockUserRepository.findById).mockResolvedValue(mockProfile);

      const result = await userService.getProfile('user123');

      expect(mockUserRepository.findById).toHaveBeenCalledWith('user123');
      expect(result).toEqual(mockProfile);
    });

    it('should return null if profile not found', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(null);

      const result = await userService.getProfile('user123');

      expect(result).toBeNull();
    });
  });

  describe('createProfile', () => {
    it('should throw UnauthorizedError if userId is missing', async () => {
      const profileData = {
        email: 'test@example.com',
        role: 'Farmer' as const,
      };

      await expect(userService.createProfile('', profileData)).rejects.toThrow(UnauthorizedError);
    });

    it('should create user profile via repository', async () => {
      const profileData = {
        email: 'test@example.com',
        role: 'Farmer' as const,
        displayName: 'Test User',
      };

      vi.mocked(mockUserRepository.create).mockResolvedValue({
        ...profileData,
        id: 'user123',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await userService.createProfile('user123', profileData);

      expect(mockUserRepository.create).toHaveBeenCalledWith({
        ...profileData,
        id: 'user123',
      });
    });
  });

  describe('updateProfile', () => {
    it('should throw UnauthorizedError if userId is missing', async () => {
      await expect(userService.updateProfile('', { displayName: 'Updated' })).rejects.toThrow(
        UnauthorizedError
      );
    });

    it('should throw NotFoundError if profile does not exist', async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(null);

      await expect(
        userService.updateProfile('user123', { displayName: 'Updated' })
      ).rejects.toThrow(NotFoundError);
    });

    it('should update profile via repository', async () => {
      const mockProfile: UserProfile = {
        id: 'user123',
        email: 'test@example.com',
        role: 'Farmer',
        displayName: 'Test User',
      };

      vi.mocked(mockUserRepository.findById).mockResolvedValue(mockProfile);

      await userService.updateProfile('user123', { displayName: 'Updated Name' });

      expect(mockUserRepository.update).toHaveBeenCalledWith('user123', {
        displayName: 'Updated Name',
      });
    });
  });
});


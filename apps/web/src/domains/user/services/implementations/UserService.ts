import type { IUserService } from '../interfaces/IUserService';
import type { IUserRepository } from '../../repositories/interfaces/IUserRepository';
import type { UserProfile } from '../../entities/UserProfile';
import { NotFoundError, UnauthorizedError } from '@/lib/errors/DomainError';

/**
 * User service implementation
 */
export class UserService implements IUserService {
  private userRepository: IUserRepository;

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    if (!userId) {
      throw new UnauthorizedError('User must be authenticated');
    }
    return await this.userRepository.findById(userId);
  }

  async createProfile(
    userId: string,
    profileData: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<void> {
    if (!userId) {
      throw new UnauthorizedError('User ID is required');
    }

    await this.userRepository.create({
      ...profileData,
      id: userId,
    });
  }

  async updateProfile(
    userId: string,
    updates: Partial<Omit<UserProfile, 'id' | 'createdAt'>>
  ): Promise<void> {
    if (!userId) {
      throw new UnauthorizedError('User must be authenticated');
    }

    const profile = await this.userRepository.findById(userId);
    if (!profile) {
      throw new NotFoundError('User profile', userId);
    }

    await this.userRepository.update(userId, updates);
  }
}


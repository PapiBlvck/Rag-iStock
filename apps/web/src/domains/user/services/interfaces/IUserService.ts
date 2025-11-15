import type { UserProfile } from '../../entities/UserProfile';

/**
 * Service interface for user operations
 */
export interface IUserService {
  /**
   * Get user profile
   */
  getProfile(userId: string): Promise<UserProfile | null>;

  /**
   * Create user profile
   */
  createProfile(userId: string, profileData: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<void>;

  /**
   * Update user profile
   */
  updateProfile(userId: string, updates: Partial<Omit<UserProfile, 'id' | 'createdAt'>>): Promise<void>;
}


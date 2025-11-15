import type { UserProfile } from '../../entities/UserProfile';

/**
 * Repository interface for user profile operations
 */
export interface IUserRepository {
  /**
   * Find a user profile by ID
   */
  findById(id: string): Promise<UserProfile | null>;

  /**
   * Create a new user profile
   */
  create(profile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<UserProfile>;

  /**
   * Update an existing user profile
   */
  update(id: string, updates: Partial<Omit<UserProfile, 'id' | 'createdAt'>>): Promise<UserProfile>;
}


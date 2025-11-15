import type { FeedOptimization } from '../../entities/FeedOptimization';

/**
 * Repository interface for feed optimization operations
 */
export interface IFeedOptimizationRepository {
  /**
   * Find a feed optimization by ID
   */
  findById(id: string, userId: string): Promise<FeedOptimization | null>;

  /**
   * Find all feed optimizations for a user, ordered by timestamp
   */
  findAll(userId: string): Promise<FeedOptimization[]>;

  /**
   * Create a new feed optimization
   */
  create(feed: Omit<FeedOptimization, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<FeedOptimization>;
}


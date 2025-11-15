/**
 * Feed optimization entity
 */
export interface FeedOptimization {
  id: string;
  userId: string;
  targetAnimal: string;
  cost: number;
  rations: Array<{ ingredientName: string; percentage: number }>;
  timestamp: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Create a new feed optimization entity
 */
export function createFeedOptimization(
  data: Omit<FeedOptimization, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): FeedOptimization {
  const now = new Date();
  return {
    id: data.id || `feed-${Date.now()}`,
    userId: data.userId,
    targetAnimal: data.targetAnimal,
    cost: data.cost,
    rations: data.rations,
    timestamp: data.timestamp,
    createdAt: now,
    updatedAt: now,
  };
}


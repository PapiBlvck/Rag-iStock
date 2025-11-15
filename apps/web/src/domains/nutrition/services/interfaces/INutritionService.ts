import type { Ingredient } from '../../entities/Ingredient';
import type { FeedOptimization } from '../../entities/FeedOptimization';
import type { FeedRation } from '@istock/shared';

/**
 * Service interface for nutrition operations
 */
export interface INutritionService {
  /**
   * Get all ingredients for a user
   */
  getIngredients(userId: string): Promise<Ingredient[]>;

  /**
   * Get a specific ingredient by ID
   */
  getIngredient(ingredientId: string, userId: string): Promise<Ingredient | null>;

  /**
   * Create a new ingredient
   */
  createIngredient(ingredient: Omit<Ingredient, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, userId: string): Promise<string>;

  /**
   * Update an ingredient
   */
  updateIngredient(ingredientId: string, userId: string, updates: Partial<Omit<Ingredient, 'id' | 'userId' | 'createdAt'>>): Promise<void>;

  /**
   * Delete an ingredient
   */
  deleteIngredient(ingredientId: string, userId: string): Promise<void>;

  /**
   * Optimize feed ration
   */
  optimizeFeed(
    targetAnimal: 'Dairy Cattle' | 'Beef Cattle' | 'Calf',
    ingredients: Array<{
      name: string;
      unitPrice: number;
      nutritionalValues: {
        protein?: number;
        energy?: number;
        fiber?: number;
        fat?: number;
      };
    }>
  ): Promise<FeedRation>;

  /**
   * Get feed optimization history
   */
  getFeedOptimizations(userId: string): Promise<FeedOptimization[]>;

  /**
   * Save feed optimization
   */
  saveFeedOptimization(
    feedData: Omit<FeedOptimization, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { id?: string },
    userId: string
  ): Promise<string>;
}


import type { INutritionService } from '../interfaces/INutritionService';
import type { IIngredientRepository } from '../../repositories/interfaces/IIngredientRepository';
import type { IFeedOptimizationRepository } from '../../repositories/interfaces/IFeedOptimizationRepository';
import type { Ingredient } from '../../entities/Ingredient';
import type { FeedOptimization } from '../../entities/FeedOptimization';
import type { FeedRation } from '@istock/shared';
import { NotFoundError, UnauthorizedError } from '@/lib/errors/DomainError';

/**
 * Nutrition service implementation
 */
export class NutritionService implements INutritionService {
  private ingredientRepository: IIngredientRepository;
  private feedOptimizationRepository: IFeedOptimizationRepository;
  private feedOptimizer: { optimizeFeed: (input: any) => Promise<FeedRation> };

  constructor(
    ingredientRepository: IIngredientRepository,
    feedOptimizationRepository: IFeedOptimizationRepository,
    feedOptimizer: { optimizeFeed: (input: any) => Promise<FeedRation> }
  ) {
    this.ingredientRepository = ingredientRepository;
    this.feedOptimizationRepository = feedOptimizationRepository;
    this.feedOptimizer = feedOptimizer;
  }

  async getIngredients(userId: string): Promise<Ingredient[]> {
    if (!userId) {
      throw new UnauthorizedError('User must be authenticated');
    }
    return await this.ingredientRepository.findAll(userId);
  }

  async getIngredient(ingredientId: string, userId: string): Promise<Ingredient | null> {
    if (!userId) {
      throw new UnauthorizedError('User must be authenticated');
    }
    return await this.ingredientRepository.findById(ingredientId, userId);
  }

  async createIngredient(
    ingredientData: Omit<Ingredient, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
    userId: string
  ): Promise<string> {
    if (!userId) {
      throw new UnauthorizedError('User must be authenticated');
    }

    const ingredient = await this.ingredientRepository.create({
      ...ingredientData,
      userId,
    });

    return ingredient.id;
  }

  async updateIngredient(
    ingredientId: string,
    userId: string,
    updates: Partial<Omit<Ingredient, 'id' | 'userId' | 'createdAt'>>
  ): Promise<void> {
    if (!userId) {
      throw new UnauthorizedError('User must be authenticated');
    }

    const ingredient = await this.ingredientRepository.findById(ingredientId, userId);
    if (!ingredient) {
      throw new NotFoundError('Ingredient', ingredientId);
    }

    await this.ingredientRepository.update(ingredientId, userId, updates);
  }

  async deleteIngredient(ingredientId: string, userId: string): Promise<void> {
    if (!userId) {
      throw new UnauthorizedError('User must be authenticated');
    }

    const ingredient = await this.ingredientRepository.findById(ingredientId, userId);
    if (!ingredient) {
      throw new NotFoundError('Ingredient', ingredientId);
    }

    await this.ingredientRepository.delete(ingredientId, userId);
  }

  async optimizeFeed(
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
  ): Promise<FeedRation> {
    if (ingredients.length === 0) {
      throw new Error('At least one ingredient is required');
    }

    return await this.feedOptimizer.optimizeFeed({
      targetAnimal,
      ingredients,
    });
  }

  async getFeedOptimizations(userId: string): Promise<FeedOptimization[]> {
    if (!userId) {
      throw new UnauthorizedError('User must be authenticated');
    }
    return await this.feedOptimizationRepository.findAll(userId);
  }

  async saveFeedOptimization(
    feedData: Omit<FeedOptimization, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { id?: string },
    userId: string
  ): Promise<string> {
    if (!userId) {
      throw new UnauthorizedError('User must be authenticated');
    }

    const feed = await this.feedOptimizationRepository.create({
      ...feedData,
      userId,
    });

    return feed.id;
  }
}


import type { Ingredient } from '../../entities/Ingredient';

/**
 * Repository interface for ingredient operations
 */
export interface IIngredientRepository {
  /**
   * Find an ingredient by ID
   */
  findById(id: string, userId: string): Promise<Ingredient | null>;

  /**
   * Find all ingredients for a user
   */
  findAll(userId: string): Promise<Ingredient[]>;

  /**
   * Create a new ingredient
   */
  create(ingredient: Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'>): Promise<Ingredient>;

  /**
   * Update an existing ingredient
   */
  update(id: string, userId: string, updates: Partial<Omit<Ingredient, 'id' | 'userId' | 'createdAt'>>): Promise<Ingredient>;

  /**
   * Delete an ingredient
   */
  delete(id: string, userId: string): Promise<void>;
}


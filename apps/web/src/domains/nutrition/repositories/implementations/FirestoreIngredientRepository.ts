import type { IIngredientRepository } from '../interfaces/IIngredientRepository';
import type { Ingredient } from '../../entities/Ingredient';
import {
  getDocument,
  setDocument,
  updateDocument,
  deleteDocument as deleteDocumentUtil,
  getDocumentsByUserId,
  dateToTimestamp,
  timestampToDate,
} from '@/lib/firestore';

const INGREDIENTS_COLLECTION = 'ingredients';

/**
 * Firestore implementation of ingredient repository
 */
export class FirestoreIngredientRepository implements IIngredientRepository {
  async findById(id: string, userId: string): Promise<Ingredient | null> {
    const ingredient = await getDocument<Ingredient & { createdAt?: any; updatedAt?: any }>(
      INGREDIENTS_COLLECTION,
      id
    );
    if (!ingredient || ingredient.userId !== userId) {
      return null;
    }
    return {
      ...ingredient,
      createdAt: ingredient.createdAt ? timestampToDate(ingredient.createdAt) : undefined,
      updatedAt: ingredient.updatedAt ? timestampToDate(ingredient.updatedAt) : undefined,
    };
  }

  async findAll(userId: string): Promise<Ingredient[]> {
    const ingredients = await getDocumentsByUserId<Ingredient & { createdAt?: any; updatedAt?: any }>(
      INGREDIENTS_COLLECTION,
      userId
    );
    return ingredients.map((ingredient) => ({
      ...ingredient,
      createdAt: ingredient.createdAt ? timestampToDate(ingredient.createdAt) : undefined,
      updatedAt: ingredient.updatedAt ? timestampToDate(ingredient.updatedAt) : undefined,
    }));
  }

  async create(ingredientData: Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'>): Promise<Ingredient> {
    const ingredientId = `${ingredientData.userId}-${ingredientData.name.toLowerCase().replace(/\s+/g, '-')}`;
    
    const firestoreData = {
      ...ingredientData,
      id: ingredientId,
      createdAt: dateToTimestamp(new Date()),
    };

    await setDocument(INGREDIENTS_COLLECTION, ingredientId, firestoreData);

    return {
      ...ingredientData,
      id: ingredientId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async update(
    id: string,
    userId: string,
    updates: Partial<Omit<Ingredient, 'id' | 'userId' | 'createdAt'>>
  ): Promise<Ingredient> {
    const ingredient = await this.findById(id, userId);
    if (!ingredient) {
      throw new Error('Ingredient not found or access denied');
    }

    await updateDocument(INGREDIENTS_COLLECTION, id, {
      ...updates,
      updatedAt: dateToTimestamp(new Date()),
    });

    return {
      ...ingredient,
      ...updates,
      updatedAt: new Date(),
    };
  }

  async delete(id: string, userId: string): Promise<void> {
    const ingredient = await this.findById(id, userId);
    if (!ingredient) {
      throw new Error('Ingredient not found or access denied');
    }
    await deleteDocumentUtil(INGREDIENTS_COLLECTION, id);
  }
}


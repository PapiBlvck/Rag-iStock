/**
 * Ingredient entity
 */
export interface Ingredient {
  id: string;
  userId: string;
  name: string;
  unitPrice: number;
  nutritionalValues: {
    protein: number;
    energy: number;
    fiber?: number;
    fat?: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Create a new ingredient entity
 */
export function createIngredient(
  data: Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): Ingredient {
  const now = new Date();
  return {
    id: data.id || `${data.userId}-${data.name.toLowerCase().replace(/\s+/g, '-')}`,
    userId: data.userId,
    name: data.name,
    unitPrice: data.unitPrice,
    nutritionalValues: data.nutritionalValues,
    createdAt: now,
    updatedAt: now,
  };
}


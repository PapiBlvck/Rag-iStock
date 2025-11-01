import { z } from 'zod';

export const NutritionalValuesSchema = z.object({
  protein: z.number().min(0).max(100).optional(),
  energy: z.number().min(0).optional(), // Mcal/kg
  fiber: z.number().min(0).optional(),
  fat: z.number().min(0).optional(),
});

export const FeedIngredientSchema = z.object({
  name: z.string().min(1, 'Ingredient name is required'),
  unitPrice: z.number().min(0, 'Unit price must be positive'),
  nutritionalValues: NutritionalValuesSchema,
});

export const FeedRationSchema = z.object({
  cost: z.number().min(0),
  rations: z.array(
    z.object({
      ingredientName: z.string(),
      percentage: z.number().min(0).max(100),
    })
  ),
});

export type NutritionalValues = z.infer<typeof NutritionalValuesSchema>;
export type FeedIngredient = z.infer<typeof FeedIngredientSchema>;
export type FeedRation = z.infer<typeof FeedRationSchema>;


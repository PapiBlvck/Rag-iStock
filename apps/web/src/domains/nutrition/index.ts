/**
 * Nutrition domain public API
 */

// Entities
export * from './entities/Ingredient';
export * from './entities/FeedOptimization';

// Repository interfaces
export * from './repositories/interfaces/IIngredientRepository';
export * from './repositories/interfaces/IFeedOptimizationRepository';

// Repository implementations
export * from './repositories/implementations/FirestoreIngredientRepository';
export * from './repositories/implementations/FirestoreFeedOptimizationRepository';

// Service interfaces
export * from './services/interfaces/INutritionService';

// Service implementations
export * from './services/implementations/NutritionService';


/**
 * Dependency injection setup
 * 
 * This file configures all domain services and repositories
 */

import { container } from './container';
import { FirestoreChatRepository } from '@/domains/health';
import { HealthService } from '@/domains/health';
import { FirestoreIngredientRepository, FirestoreFeedOptimizationRepository } from '@/domains/nutrition';
import { NutritionService } from '@/domains/nutrition';
import { FirestoreUserRepository } from '@/domains/user';
import { UserService } from '@/domains/user';

/**
 * Setup dependency injection container
 * 
 * This should be called once during app initialization
 */
export function setupDependencyInjection() {
  // Health domain
  container.register('ChatRepository', () => new FirestoreChatRepository(), true);
  container.register('HealthService', () => {
    const chatRepository = container.resolve<FirestoreChatRepository>('ChatRepository');
    // Note: In a real implementation, we'd need to properly handle the async RAG client
    // For now, we'll use a wrapper that uses the hook
    const ragClient = {
      askRag: async (_query: string) => {
        // This is a simplified version - in practice, you'd need to handle this differently
        // since hooks can't be called directly here
        throw new Error('RAG client should be used via hooks in components');
      },
    };
    return new HealthService(chatRepository, ragClient);
  }, true);

  // Nutrition domain
  container.register('IngredientRepository', () => new FirestoreIngredientRepository(), true);
  container.register('FeedOptimizationRepository', () => new FirestoreFeedOptimizationRepository(), true);
  container.register('NutritionService', () => {
    const ingredientRepository = container.resolve<FirestoreIngredientRepository>('IngredientRepository');
    const feedOptimizationRepository = container.resolve<FirestoreFeedOptimizationRepository>('FeedOptimizationRepository');
    const feedOptimizer = {
      optimizeFeed: async (_input: any) => {
        // Similar note as above - this should use the hook properly
        throw new Error('Feed optimizer should be used via hooks in components');
      },
    };
    return new NutritionService(ingredientRepository, feedOptimizationRepository, feedOptimizer);
  }, true);

  // User domain
  container.register('UserRepository', () => new FirestoreUserRepository(), true);
  container.register('UserService', () => {
    const userRepository = container.resolve<FirestoreUserRepository>('UserRepository');
    return new UserService(userRepository);
  }, true);
}

/**
 * Get a service from the container
 */
export function getService<T>(key: string): T {
  return container.resolve<T>(key);
}


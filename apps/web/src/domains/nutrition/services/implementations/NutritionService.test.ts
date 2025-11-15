import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NutritionService } from './NutritionService';
import type { IIngredientRepository } from '../../../repositories/interfaces/IIngredientRepository';
import type { IFeedOptimizationRepository } from '../../../repositories/interfaces/IFeedOptimizationRepository';
import type { Ingredient } from '../../../entities/Ingredient';
import type { FeedOptimization } from '../../../entities/FeedOptimization';
import type { FeedRation } from '@istock/shared';
import { NotFoundError, UnauthorizedError } from '@/lib/errors/DomainError';

describe('NutritionService', () => {
  let nutritionService: NutritionService;
  let mockIngredientRepository: IIngredientRepository;
  let mockFeedOptimizationRepository: IFeedOptimizationRepository;
  let mockFeedOptimizer: { optimizeFeed: (input: any) => Promise<FeedRation> };

  beforeEach(() => {
    mockIngredientRepository = {
      findById: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    mockFeedOptimizationRepository = {
      findById: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
    };

    mockFeedOptimizer = {
      optimizeFeed: vi.fn(),
    };

    nutritionService = new NutritionService(
      mockIngredientRepository,
      mockFeedOptimizationRepository,
      mockFeedOptimizer
    );
  });

  describe('getIngredients', () => {
    it('should throw UnauthorizedError if userId is missing', async () => {
      await expect(nutritionService.getIngredients('')).rejects.toThrow(UnauthorizedError);
    });

    it('should return ingredients from repository', async () => {
      const mockIngredients: Ingredient[] = [
        {
          id: 'ing1',
          userId: 'user123',
          name: 'Corn',
          unitPrice: 10,
          nutritionalValues: {
            protein: 8,
            energy: 100,
            fiber: 2,
            fat: 3,
          },
        },
      ];

      vi.mocked(mockIngredientRepository.findAll).mockResolvedValue(mockIngredients);

      const result = await nutritionService.getIngredients('user123');

      expect(mockIngredientRepository.findAll).toHaveBeenCalledWith('user123');
      expect(result).toEqual(mockIngredients);
    });
  });

  describe('getIngredient', () => {
    it('should throw UnauthorizedError if userId is missing', async () => {
      await expect(nutritionService.getIngredient('ing1', '')).rejects.toThrow(UnauthorizedError);
    });

    it('should return ingredient from repository', async () => {
      const mockIngredient: Ingredient = {
        id: 'ing1',
        userId: 'user123',
        name: 'Corn',
        unitPrice: 10,
        nutritionalValues: {
          protein: 8,
          energy: 100,
        },
      };

      vi.mocked(mockIngredientRepository.findById).mockResolvedValue(mockIngredient);

      const result = await nutritionService.getIngredient('ing1', 'user123');

      expect(mockIngredientRepository.findById).toHaveBeenCalledWith('ing1', 'user123');
      expect(result).toEqual(mockIngredient);
    });
  });

  describe('createIngredient', () => {
    it('should throw UnauthorizedError if userId is missing', async () => {
      const ingredientData = {
        name: 'Corn',
        unitPrice: 10,
        nutritionalValues: {
          protein: 8,
          energy: 100,
        },
      };

      await expect(nutritionService.createIngredient(ingredientData, '')).rejects.toThrow(
        UnauthorizedError
      );
    });

    it('should create ingredient via repository', async () => {
      const ingredientData = {
        name: 'Corn',
        unitPrice: 10,
        nutritionalValues: {
          protein: 8,
          energy: 100,
        },
      };

      const mockIngredient: Ingredient = {
        ...ingredientData,
        id: 'ing1',
        userId: 'user123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockIngredientRepository.create).mockResolvedValue(mockIngredient);

      const result = await nutritionService.createIngredient(ingredientData, 'user123');

      expect(mockIngredientRepository.create).toHaveBeenCalledWith({
        ...ingredientData,
        userId: 'user123',
      });
      expect(result).toBe('ing1');
    });
  });

  describe('updateIngredient', () => {
    it('should throw UnauthorizedError if userId is missing', async () => {
      await expect(
        nutritionService.updateIngredient('ing1', '', { name: 'Updated' })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw NotFoundError if ingredient does not exist', async () => {
      vi.mocked(mockIngredientRepository.findById).mockResolvedValue(null);

      await expect(
        nutritionService.updateIngredient('ing1', 'user123', { name: 'Updated' })
      ).rejects.toThrow(NotFoundError);
    });

    it('should update ingredient via repository', async () => {
      const mockIngredient: Ingredient = {
        id: 'ing1',
        userId: 'user123',
        name: 'Corn',
        unitPrice: 10,
        nutritionalValues: {
          protein: 8,
          energy: 100,
        },
      };

      vi.mocked(mockIngredientRepository.findById).mockResolvedValue(mockIngredient);

      await nutritionService.updateIngredient('ing1', 'user123', { name: 'Updated Corn' });

      expect(mockIngredientRepository.update).toHaveBeenCalledWith(
        'ing1',
        'user123',
        { name: 'Updated Corn' }
      );
    });
  });

  describe('deleteIngredient', () => {
    it('should throw UnauthorizedError if userId is missing', async () => {
      await expect(nutritionService.deleteIngredient('ing1', '')).rejects.toThrow(UnauthorizedError);
    });

    it('should throw NotFoundError if ingredient does not exist', async () => {
      vi.mocked(mockIngredientRepository.findById).mockResolvedValue(null);

      await expect(nutritionService.deleteIngredient('ing1', 'user123')).rejects.toThrow(
        NotFoundError
      );
    });

    it('should delete ingredient via repository', async () => {
      const mockIngredient: Ingredient = {
        id: 'ing1',
        userId: 'user123',
        name: 'Corn',
        unitPrice: 10,
        nutritionalValues: {
          protein: 8,
          energy: 100,
        },
      };

      vi.mocked(mockIngredientRepository.findById).mockResolvedValue(mockIngredient);

      await nutritionService.deleteIngredient('ing1', 'user123');

      expect(mockIngredientRepository.delete).toHaveBeenCalledWith('ing1', 'user123');
    });
  });

  describe('optimizeFeed', () => {
    it('should throw error if no ingredients provided', async () => {
      await expect(
        nutritionService.optimizeFeed('Dairy Cattle', [])
      ).rejects.toThrow('At least one ingredient is required');
    });

    it('should call feed optimizer with correct parameters', async () => {
      const mockRation: FeedRation = {
        cost: 15.5,
        rations: [
          { ingredientName: 'Corn', percentage: 60 },
          { ingredientName: 'Soybean', percentage: 40 },
        ],
      };

      const ingredients = [
        {
          name: 'Corn',
          unitPrice: 10,
          nutritionalValues: {
            protein: 8,
            energy: 100,
          },
        },
        {
          name: 'Soybean',
          unitPrice: 12,
          nutritionalValues: {
            protein: 40,
            energy: 120,
          },
        },
      ];

      vi.mocked(mockFeedOptimizer.optimizeFeed).mockResolvedValue(mockRation);

      const result = await nutritionService.optimizeFeed('Dairy Cattle', ingredients);

      expect(mockFeedOptimizer.optimizeFeed).toHaveBeenCalledWith({
        targetAnimal: 'Dairy Cattle',
        ingredients,
      });
      expect(result).toEqual(mockRation);
    });
  });

  describe('getFeedOptimizations', () => {
    it('should throw UnauthorizedError if userId is missing', async () => {
      await expect(nutritionService.getFeedOptimizations('')).rejects.toThrow(UnauthorizedError);
    });

    it('should return feed optimizations from repository', async () => {
      const mockOptimizations: FeedOptimization[] = [
        {
          id: 'feed1',
          userId: 'user123',
          targetAnimal: 'Dairy Cattle',
          cost: 15.5,
          rations: [{ ingredientName: 'Corn', percentage: 100 }],
          timestamp: new Date(),
        },
      ];

      vi.mocked(mockFeedOptimizationRepository.findAll).mockResolvedValue(mockOptimizations);

      const result = await nutritionService.getFeedOptimizations('user123');

      expect(mockFeedOptimizationRepository.findAll).toHaveBeenCalledWith('user123');
      expect(result).toEqual(mockOptimizations);
    });
  });

  describe('saveFeedOptimization', () => {
    it('should throw UnauthorizedError if userId is missing', async () => {
      const feedData = {
        targetAnimal: 'Dairy Cattle',
        cost: 15.5,
        rations: [{ ingredientName: 'Corn', percentage: 100 }],
        timestamp: new Date(),
      };

      await expect(nutritionService.saveFeedOptimization(feedData, '')).rejects.toThrow(
        UnauthorizedError
      );
    });

    it('should save feed optimization via repository', async () => {
      const feedData = {
        targetAnimal: 'Dairy Cattle',
        cost: 15.5,
        rations: [{ ingredientName: 'Corn', percentage: 100 }],
        timestamp: new Date(),
      };

      const mockFeed: FeedOptimization = {
        ...feedData,
        id: 'feed1',
        userId: 'user123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockFeedOptimizationRepository.create).mockResolvedValue(mockFeed);

      const result = await nutritionService.saveFeedOptimization(feedData, 'user123');

      expect(mockFeedOptimizationRepository.create).toHaveBeenCalledWith({
        ...feedData,
        userId: 'user123',
      });
      expect(result).toBe('feed1');
    });
  });
});


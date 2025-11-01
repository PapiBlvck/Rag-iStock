import type { RagResponse, FeedRation } from '@istock/shared';

// Mock delay function for simulating API calls
const mockDelay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Mock tRPC client procedures
export const mockTrpcClient = {
  health: {
    askRag: async (input: {
      query: string;
      context?: string;
    }): Promise<RagResponse> => {
      await mockDelay(1500); // Simulate API delay

      // Mock response with sources
      return {
        text: `Based on the symptoms you've described (${input.query}), this could indicate several potential conditions. Here's a comprehensive diagnostic approach:

1. **Immediate Assessment**: Monitor the animal's temperature, respiration rate, and behavior patterns.

2. **Recommended Actions**:
   - Isolate the affected animal to prevent potential spread
   - Ensure access to fresh water and clean environment
   - Document all observed symptoms with timestamps

3. **When to Consult a Veterinarian**: If symptoms persist for more than 24-48 hours or worsen, seek immediate veterinary attention.

Please note: This is a diagnostic aid and should not replace professional veterinary consultation for serious conditions.`,
        sources: [
          {
            uri: 'https://example.com/vet-guide/livestock-health',
            title: 'Livestock Health Management Guide 2024',
          },
          {
            uri: 'https://example.com/disease-symptoms/cattle',
            title: 'Common Cattle Disease Symptoms and Treatments',
          },
          {
            uri: 'https://example.com/precision-farming/diagnostics',
            title: 'Precision Livestock Diagnostics - Best Practices',
          },
        ],
        confidence: 0.85,
      };
    },
  },
  nutrition: {
    optimizeFeed: async (input: {
      targetAnimal: 'Dairy Cattle' | 'Beef Cattle' | 'Calf';
      ingredients: Array<{
        name: string;
        unitPrice: number;
        nutritionalValues: {
          protein?: number;
          energy?: number;
          fiber?: number;
          fat?: number;
        };
      }>;
    }): Promise<FeedRation> => {
      await mockDelay(2000); // Simulate optimization delay

      // Mock optimization algorithm result
      const totalIngredients = input.ingredients.length;
      if (totalIngredients === 0) {
        return { cost: 0, rations: [] };
      }

      const basePercentage = 100 / totalIngredients;

      // Simple mock: distribute percentages (in real app, this would be linear programming)
      const rations = input.ingredients.map((ingredient, index) => ({
        ingredientName: ingredient.name,
        percentage:
          Math.round((basePercentage + (index % 2 === 0 ? 5 : -5)) * 10) / 10,
      }));

      // Ensure percentages sum to 100
      const total = rations.reduce((sum, r) => sum + r.percentage, 0);
      if (total !== 100) {
        rations[0].percentage += 100 - total;
      }

      // Calculate mock cost based on weighted average
      const weightedCost =
        rations.reduce((sum, ration) => {
          const ingredient = input.ingredients.find(
            (i) => i.name === ration.ingredientName
          );
          return sum + (ingredient?.unitPrice || 0) * (ration.percentage / 100);
        }, 0) || 0;

      return {
        cost: Math.round(weightedCost * 100) / 100,
        rations,
      };
    },
  },
};


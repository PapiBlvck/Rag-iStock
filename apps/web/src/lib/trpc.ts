import { useMutation } from '@tanstack/react-query';
import { mockTrpcClient } from './mock-trpc-client';

// Type-safe hooks for tRPC procedures
export const useAskRag = () => {
  return useMutation({
    mutationFn: async (input: { query: string; context?: string }) => {
      return await mockTrpcClient.health.askRag(input);
    },
  });
};

export const useOptimizeFeed = () => {
  return useMutation({
    mutationFn: async (input: {
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
    }) => {
      return await mockTrpcClient.nutrition.optimizeFeed(input);
    },
  });
};

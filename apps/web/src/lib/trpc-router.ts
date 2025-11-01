// Type definitions for the tRPC router
// These match the procedures available on the server

import type { RagResponse, FeedRation } from '@istock/shared';

export interface AppRouter {
  health: {
    askRag: {
      input: {
        query: string;
        context?: string;
      };
      output: RagResponse;
    };
    saveRecord: {
      input: {
        animalId?: string;
        diagnosis: string;
        protocol: string;
      };
      output: { success: boolean };
    };
  };
  nutrition: {
    optimizeFeed: {
      input: {
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
      };
      output: FeedRation;
    };
  };
}


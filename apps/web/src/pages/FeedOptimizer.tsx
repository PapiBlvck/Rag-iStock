import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useOptimizeFeed } from '@/lib/trpc';
import { TargetAnimalSelect } from '@/components/feed/TargetAnimalSelect';
import { IngredientList } from '@/components/feed/IngredientList';
import { FeedResults } from '@/components/feed/FeedResults';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, BookOpen } from 'lucide-react';
import type { FeedRation, FeedIngredient } from '@istock/shared';
import { useNotification } from '@/contexts/NotificationContext';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { getIngredients } from '@/lib/firestore-services';
import { saveFeedOptimization } from '@/lib/firestore-services';

const feedOptimizerSchema = z.object({
  targetAnimal: z.enum(['Dairy Cattle', 'Beef Cattle', 'Calf']),
  ingredients: z
    .array(
      z.object({
        name: z.string().min(1, 'Ingredient name is required'),
        unitPrice: z.number().min(0, 'Unit price must be positive'),
        nutritionalValues: z.object({
          protein: z.number().min(0).max(100).optional(),
          energy: z.number().min(0).optional(),
          fiber: z.number().min(0).optional(),
          fat: z.number().min(0).optional(),
        }),
      })
    )
    .min(1, 'At least one ingredient is required'),
});

type FeedOptimizerForm = z.infer<typeof feedOptimizerSchema>;

export function FeedOptimizer() {
  const { user } = useAuth();
  const [result, setResult] = useState<FeedRation | null>(null);
  const [savedIngredients, setSavedIngredients] = useState<FeedIngredient[]>([]);
  const optimizeFeed = useOptimizeFeed();
  const { success } = useNotification();

  useEffect(() => {
    if (!user?.id) return;

    const loadIngredients = async () => {
      try {
        const ingredientsList = await getIngredients(user.id);
        // Convert Firestore ingredient format to FeedIngredient format
        const converted = ingredientsList.map((ing) => ({
          name: ing.name,
          unitPrice: ing.unitPrice,
          nutritionalValues: ing.nutritionalValues,
        }));
        setSavedIngredients(converted);
      } catch (error: any) {
        // Don't log errors for permission issues - they're expected until rules are set up
        if (error?.code !== 'permission-denied') {
          console.error('Failed to load ingredients:', error);
        }
      }
    };

    loadIngredients();
  }, [user?.id]);

  const form = useForm<FeedOptimizerForm>({
    resolver: zodResolver(feedOptimizerSchema),
    defaultValues: {
      targetAnimal: 'Dairy Cattle',
      ingredients: [
        {
          name: '',
          unitPrice: 0,
          nutritionalValues: {
            protein: 0,
            energy: 0,
          },
        },
      ],
    },
  });

  const fieldArray = useFieldArray({
    control: form.control,
    name: 'ingredients',
  });

  const loadSavedIngredient = (ingredient: FeedIngredient) => {
    fieldArray.append({
      name: ingredient.name,
      unitPrice: ingredient.unitPrice,
      nutritionalValues: {
        protein: ingredient.nutritionalValues.protein || 0,
        energy: ingredient.nutritionalValues.energy || 0,
        fiber: ingredient.nutritionalValues.fiber || 0,
        fat: ingredient.nutritionalValues.fat || 0,
      },
    });
    success(`Added ${ingredient.name} from library`);
  };

  const onSubmit = async (data: FeedOptimizerForm) => {
    try {
      const response = await optimizeFeed.mutateAsync({
        targetAnimal: data.targetAnimal,
        ingredients: data.ingredients.map((ing) => ({
          name: ing.name,
          unitPrice: ing.unitPrice,
          nutritionalValues: {
            protein: ing.nutritionalValues.protein,
            energy: ing.nutritionalValues.energy,
            fiber: ing.nutritionalValues.fiber,
            fat: ing.nutritionalValues.fat,
          },
        })),
      });

      setResult(response);

      // Save to Firestore
      if (user?.id) {
        try {
          await saveFeedOptimization(user.id, {
            id: `feed-${Date.now()}`,
            targetAnimal: data.targetAnimal,
            cost: response.cost,
            rations: response.rations,
            timestamp: new Date(),
          });
        } catch (error: any) {
          console.error('Failed to save feed optimization:', error);
          // Don't block the user, just log the error
          // Permission errors are expected if Firestore rules aren't set up yet
        }
      }
      
      success('Feed optimized successfully!');
    } catch (error) {
      console.error('Failed to optimize feed:', error);
      // Error handling improved with toast notifications
    }
  };

  return (
    <div className="h-full overflow-y-auto chat-scrollbar">
      <div className="p-6 border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-md backdrop-saturate-150 shadow-sm sticky top-0 z-50" style={{ backdropFilter: 'blur(16px) saturate(180%)' }}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Feed Optimizer
          </h1>
          <p className="text-sm text-muted-foreground mt-2 font-medium">
            Calculate least-cost feed rations based on ingredients and nutritional
            requirements
          </p>
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
        <Card className="border-0 shadow-xl">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-bold">Feed Optimization Calculator</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <TargetAnimalSelect form={form} />

                {/* Quick Add from Library */}
                {savedIngredients.length > 0 && (
                  <Card className="border-0 bg-primary/5 dark:bg-primary/10">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-3">
                        <BookOpen className="h-4 w-4 text-primary" />
                        <Label className="font-semibold">Quick Add from Library</Label>
                      </div>
                      <Select
                        onValueChange={(value) => {
                          const ingredient = savedIngredients.find((ing) => ing.name === value);
                          if (ingredient) {
                            loadSavedIngredient(ingredient);
                          }
                        }}
                      >
                        <SelectTrigger className="w-full md:w-[300px]">
                          <SelectValue placeholder="Select a saved ingredient..." />
                        </SelectTrigger>
                        <SelectContent>
                          {savedIngredients.map((ing) => (
                            <SelectItem key={ing.name} value={ing.name}>
                              {ing.name} - ${ing.unitPrice.toFixed(2)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                )}

                <IngredientList form={form} fieldArray={fieldArray} />

                {form.formState.errors.ingredients && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.ingredients.message}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={optimizeFeed.isPending}
                  className="w-full md:w-auto shadow-md hover:shadow-lg transition-shadow font-semibold"
                >
                  {optimizeFeed.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Optimizing...
                    </>
                  ) : (
                    'Optimize Feed'
                  )}
                </Button>
              </form>
            </Form>

            {optimizeFeed.isError && (
              <div className="mt-4 p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
                Failed to optimize feed. Please try again.
              </div>
            )}

            <FeedResults result={result} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


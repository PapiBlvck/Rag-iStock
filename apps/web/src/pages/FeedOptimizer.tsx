import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useOptimizeFeed } from '@/lib/trpc';
import { TargetAnimalSelect } from '@/components/feed/TargetAnimalSelect';
import { IngredientList } from '@/components/feed/IngredientList';
import { FeedResults } from '@/components/feed/FeedResults';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import type { FeedRation } from '@istock/shared';

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
  const [result, setResult] = useState<FeedRation | null>(null);
  const optimizeFeed = useOptimizeFeed();

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
    } catch (error) {
      console.error('Failed to optimize feed:', error);
      // Error handling could be improved with toast notifications
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-b from-gray-50/50 to-white">
      <div className="p-6 border-b bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Feed Optimizer
          </h1>
          <p className="text-sm text-muted-foreground mt-2 font-medium">
            Calculate least-cost feed rations based on ingredients and nutritional
            requirements
          </p>
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <Card className="border-0 shadow-xl">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-bold">Feed Optimization Calculator</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <TargetAnimalSelect form={form} />

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


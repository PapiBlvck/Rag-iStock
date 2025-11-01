import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { type UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface IngredientFormProps {
  form: UseFormReturn<any>;
  index: number;
  onRemove: () => void;
}

export function IngredientForm({
  form,
  index,
  onRemove,
}: IngredientFormProps) {
  return (
    <div className="border rounded-lg p-4 space-y-4 bg-card">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">Ingredient {index + 1}</h4>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="h-8 w-8"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={`ingredients.${index}.name`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ingredient Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Corn, Soybean Meal" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`ingredients.${index}.unitPrice`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unit Price (USD)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...field}
                  onChange={(e) =>
                    field.onChange(parseFloat(e.target.value) || 0)
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`ingredients.${index}.nutritionalValues.protein`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Protein (%)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="0.0"
                  {...field}
                  onChange={(e) =>
                    field.onChange(parseFloat(e.target.value) || 0)
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`ingredients.${index}.nutritionalValues.energy`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Energy (Mcal/kg)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...field}
                  onChange={(e) =>
                    field.onChange(parseFloat(e.target.value) || 0)
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}


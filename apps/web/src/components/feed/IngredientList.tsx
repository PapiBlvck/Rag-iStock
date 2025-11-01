import { type UseFieldArrayReturn, type UseFormReturn } from 'react-hook-form';
import { IngredientForm } from './IngredientForm';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface IngredientListProps {
  form: UseFormReturn<any>;
  fieldArray: UseFieldArrayReturn<any, 'ingredients'>;
}

export function IngredientList({ form, fieldArray }: IngredientListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Ingredients</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            fieldArray.append({
              name: '',
              unitPrice: 0,
              nutritionalValues: {
                protein: 0,
                energy: 0,
              },
            });
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Ingredient
        </Button>
      </div>

      {fieldArray.fields.length === 0 ? (
        <div className="border rounded-lg p-8 text-center text-muted-foreground">
          <p className="text-sm">No ingredients added yet.</p>
          <p className="text-xs mt-1">Click "Add Ingredient" to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {fieldArray.fields.map((field, index) => (
            <IngredientForm
              key={field.id}
              form={form}
              index={index}
              onRemove={() => fieldArray.remove(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}


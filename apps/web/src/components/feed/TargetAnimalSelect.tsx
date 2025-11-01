import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { type UseFormReturn } from 'react-hook-form';

interface TargetAnimalSelectProps {
  form: UseFormReturn<any>;
}

const animalOptions = [
  { value: 'Dairy Cattle', label: 'Dairy Cattle' },
  { value: 'Beef Cattle', label: 'Beef Cattle' },
  { value: 'Calf', label: 'Calf' },
];

export function TargetAnimalSelect({ form }: TargetAnimalSelectProps) {
  return (
    <FormField
      control={form.control}
      name="targetAnimal"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Target Animal</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select target animal" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {animalOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}


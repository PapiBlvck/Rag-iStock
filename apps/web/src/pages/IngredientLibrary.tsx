import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Edit2, BookOpen, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { FeedIngredient } from '@istock/shared';

const ingredientLibrarySchema = z.object({
  name: z.string().min(1, 'Ingredient name is required'),
  unitPrice: z.number().min(0, 'Unit price must be positive'),
  nutritionalValues: z.object({
    protein: z.number().min(0).max(100).optional(),
    energy: z.number().min(0).optional(),
    fiber: z.number().min(0).optional(),
    fat: z.number().min(0).optional(),
  }),
});

type IngredientFormData = z.infer<typeof ingredientLibrarySchema>;

export function IngredientLibrary() {
  const [ingredients, setIngredients] = useState<FeedIngredient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredIngredients, setFilteredIngredients] = useState<FeedIngredient[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const form = useForm<IngredientFormData>({
    resolver: zodResolver(ingredientLibrarySchema),
    defaultValues: {
      name: '',
      unitPrice: 0,
      nutritionalValues: {
        protein: 0,
        energy: 0,
      },
    },
  });

  useEffect(() => {
    // Load ingredients from localStorage
    const stored = JSON.parse(localStorage.getItem('istock_ingredients') || '[]');
    setIngredients(stored);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredIngredients(ingredients);
      return;
    }

    const query = searchQuery.toLowerCase();
    setFilteredIngredients(
      ingredients.filter((ing) => ing.name.toLowerCase().includes(query))
    );
  }, [searchQuery, ingredients]);

  const onSubmit = (data: IngredientFormData) => {
    const newIngredient: FeedIngredient = {
      ...data,
      nutritionalValues: data.nutritionalValues,
    };

    if (editingId) {
      // Update existing
      const updated = ingredients.map((ing) =>
        ing.name === editingId ? newIngredient : ing
      );
      setIngredients(updated);
      localStorage.setItem('istock_ingredients', JSON.stringify(updated));
      setEditingId(null);
    } else {
      // Add new
      const updated = [...ingredients, newIngredient];
      setIngredients(updated);
      localStorage.setItem('istock_ingredients', JSON.stringify(updated));
      setShowAddForm(false);
    }
    form.reset();
  };

  const deleteIngredient = (name: string) => {
    const updated = ingredients.filter((ing) => ing.name !== name);
    setIngredients(updated);
    localStorage.setItem('istock_ingredients', JSON.stringify(updated));
  };

  const startEdit = (ingredient: FeedIngredient) => {
    form.reset({
      name: ingredient.name,
      unitPrice: ingredient.unitPrice,
      nutritionalValues: {
        protein: ingredient.nutritionalValues.protein || 0,
        energy: ingredient.nutritionalValues.energy || 0,
        fiber: ingredient.nutritionalValues.fiber || 0,
        fat: ingredient.nutritionalValues.fat || 0,
      },
    });
    setEditingId(ingredient.name);
    setShowAddForm(true);
  };

  return (
    <div className="h-full overflow-y-auto chat-scrollbar">
      <div className="p-6 border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-md backdrop-saturate-150 shadow-sm sticky top-0 z-50" style={{ backdropFilter: 'blur(16px) saturate(180%)' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Ingredient Library
            </h1>
            <p className="text-sm text-muted-foreground mt-2 font-medium">
              Manage your saved feed ingredients
            </p>
          </div>
          <Button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setEditingId(null);
              form.reset();
            }}
            className="shadow-md hover:shadow-lg transition-shadow"
          >
            <Plus className="h-4 w-4 mr-2" />
            {showAddForm ? 'Cancel' : 'Add Ingredient'}
          </Button>
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
        {/* Add/Edit Form */}
        {showAddForm && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>
                {editingId ? 'Edit Ingredient' : 'Add New Ingredient'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ingredient Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Corn, Soybean Meal"
                              {...field}
                              disabled={!!editingId}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="unitPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit Price (USD)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
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
                      name="nutritionalValues.protein"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Protein (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
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
                      name="nutritionalValues.energy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Energy (Mcal/kg)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
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

                  <Button type="submit" className="w-full md:w-auto shadow-md">
                    <Save className="h-4 w-4 mr-2" />
                    {editingId ? 'Update Ingredient' : 'Save Ingredient'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Search Bar */}
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search ingredients by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Ingredients List */}
        {filteredIngredients.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="pt-12 pb-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchQuery ? 'No ingredients found' : 'No ingredients saved'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : 'Add your first ingredient to get started'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIngredients.map((ingredient) => (
              <Card
                key={ingredient.name}
                className="border-0 shadow-md hover:shadow-lg transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-bold">{ingredient.name}</CardTitle>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEdit(ingredient)}
                        className="h-8 w-8"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteIngredient(ingredient.name)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Unit Price:</span>
                    <span className="font-semibold text-foreground">
                      ${ingredient.unitPrice.toFixed(2)}
                    </span>
                  </div>
                  {ingredient.nutritionalValues.protein !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Protein:</span>
                      <span className="font-medium">{ingredient.nutritionalValues.protein}%</span>
                    </div>
                  )}
                  {ingredient.nutritionalValues.energy !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Energy:</span>
                      <span className="font-medium">
                        {ingredient.nutritionalValues.energy} Mcal/kg
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


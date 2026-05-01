import type { FoodItem } from '@/src/lib/food-catalog';
import validatedFoods from '@/data/foods-validated.json';

export const fullFoodCatalog: FoodItem[] = validatedFoods as FoodItem[];

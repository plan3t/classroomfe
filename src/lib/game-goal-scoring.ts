import type { FoodItem } from '@/src/lib/food-catalog';
import { defaultGoalScoringConfig } from '@/src/lib/goal-scoring-config';
type SavedCartLine = { foodId: string; variantId: string; qty: number };

export function evaluateGoal(goal: string, cart: SavedCartLine[], catalog: FoodItem[]) {
  const expanded = cart.flatMap((line) => {
    const item = catalog.find((f) => f.id === line.foodId);
    const variant = item?.variants.find((v) => v.id === line.variantId);
    if (!item || !variant) return [];
    return Array.from({ length: line.qty }).map(() => ({ item, variant }));
  });

  if (expanded.length === 0) return { reached: false, reason: 'Kein Einkauf vorhanden.' };

  if (goal === 'Weniger Salz kaufen') {
    const avgScore = expanded.reduce((s, x) => s + x.variant.rating.nachhaltigkeit, 0) / expanded.length;
    return { reached: avgScore >= 3, reason: `Ø Nachhaltigkeits-Score ${avgScore.toFixed(2)} (Min 3)` };
  }
  if (goal === 'Weniger zugesetzten Zucker kaufen') {
    const weakHealth = expanded.filter((x) => x.variant.rating.gesundheit <= 2).length;
    return { reached: weakHealth / expanded.length <= 0.4, reason: `${weakHealth}/${expanded.length} Produkte mit Gesundheits-Score ≤2` };
  }
  if (goal === 'Mehr ballaststoffreiche Produkte wählen') {
    const strongHealth = expanded.filter((x) => x.variant.rating.gesundheit >= 4).length;
    return { reached: strongHealth / expanded.length >= 0.5, reason: `${strongHealth}/${expanded.length} Produkte mit Gesundheits-Score ≥4` };
  }
  if (goal === 'Ultra-verarbeitete Produkte reduzieren') {
    const lowPriceFocus = expanded.filter((x) => x.variant.rating.preisbewusstsein <= 2).length;
    return { reached: lowPriceFocus / expanded.length <= 0.5, reason: `${lowPriceFocus}/${expanded.length} Produkte mit Preis-Score ≤2` };
  }

  return { reached: false, reason: 'Unbekanntes Ziel.' };
}

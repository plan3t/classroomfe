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
    const avgSalt = expanded.reduce((s, x) => s + x.variant.nutrition.saltG, 0) / expanded.length;
    return { reached: avgSalt <= defaultGoalScoringConfig.maxAverageSaltG, reason: `Ø Salz ${avgSalt.toFixed(2)} g (Grenze ${defaultGoalScoringConfig.maxAverageSaltG})` };
  }
  if (goal === 'Weniger zugesetzten Zucker kaufen') {
    const sugared = expanded.filter((x) => x.variant.risks.some((r) => r.toLowerCase().includes('zucker'))).length;
    return { reached: sugared / expanded.length <= defaultGoalScoringConfig.maxSugaredRatio, reason: `${sugared}/${expanded.length} Produkte mit Zuckerrisiko (Max ${Math.round(defaultGoalScoringConfig.maxSugaredRatio * 100)}%)` };
  }
  if (goal === 'Mehr ballaststoffreiche Produkte wählen') {
    const fiberish = expanded.filter((x) => x.variant.benefits.some((b) => b.toLowerCase().includes('ballast'))).length;
    return { reached: fiberish / expanded.length >= defaultGoalScoringConfig.minFiberRatio, reason: `${fiberish}/${expanded.length} ballaststofffreundlich (Min ${Math.round(defaultGoalScoringConfig.minFiberRatio * 100)}%)` };
  }
  if (goal === 'Ultra-verarbeitete Produkte reduzieren') {
    const processed = expanded.filter((x) => x.variant.additives.length >= 2).length;
    return { reached: processed / expanded.length <= defaultGoalScoringConfig.maxProcessedRatio, reason: `${processed}/${expanded.length} stark verarbeitet (Max ${Math.round(defaultGoalScoringConfig.maxProcessedRatio * 100)}%)` };
  }

  return { reached: false, reason: 'Unbekanntes Ziel.' };
}

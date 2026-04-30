import type { FoodItem } from '@/src/lib/food-catalog';
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
    return { reached: avgSalt <= 0.8, reason: `Ø Salz ${avgSalt.toFixed(2)} g` };
  }
  if (goal === 'Weniger zugesetzten Zucker kaufen') {
    const sugared = expanded.filter((x) => x.variant.risks.some((r) => r.toLowerCase().includes('zucker'))).length;
    return { reached: sugared <= Math.floor(expanded.length / 3), reason: `${sugared}/${expanded.length} Produkte mit Zuckerrisiko` };
  }
  if (goal === 'Mehr ballaststoffreiche Produkte wählen') {
    const fiberish = expanded.filter((x) => x.variant.benefits.some((b) => b.toLowerCase().includes('ballast'))).length;
    return { reached: fiberish >= Math.ceil(expanded.length / 3), reason: `${fiberish}/${expanded.length} ballaststofffreundlich` };
  }
  if (goal === 'Ultra-verarbeitete Produkte reduzieren') {
    const processed = expanded.filter((x) => x.variant.additives.length >= 2).length;
    return { reached: processed <= Math.floor(expanded.length / 4), reason: `${processed}/${expanded.length} stark verarbeitet` };
  }

  return { reached: false, reason: 'Unbekanntes Ziel.' };
}

import type { FoodItem } from '@/src/lib/food-catalog';
import validatedFoods from '@/data/foods-validated.json';

const names = [
  'Apfel','Banane','Birne','Tomate','Gurke','Karotte','Paprika','Brokkoli','Spinat','Kartoffel','Zwiebel','Knoblauch','Zucchini','Aubergine','Salat',
  'Vollkornbrot','Brötchen','Müsli','Haferflocken','Reis','Nudeln','Linsen','Bohnen','Kichererbsen','Joghurt','Quark','Käse','Milch','Butter','Eier',
  'Hähnchen','Rindfleisch','Tofu','Fisch','Thunfisch','Lachs','Wasser','Mineralwasser','Saft','Apfelsaft','Orangensaft','Cola','Tee','Kaffee',
  'Nüsse','Mandeln','Walnüsse','Erdnüsse','Sonnenblumenkerne','Olivenöl','Rapsöl','Honig','Marmelade','Schokolade','Kekse','Chips','Pizza','Suppe','TK-Gemüse','Joghurt-Drink'
];

const generatedFullCatalog: FoodItem[] = names.slice(0, 61).map((name, idx) => ({
  id: `food-${idx + 1}`,
  name,
  image: '🛒',
  category: idx % 4 === 0 ? 'OBST_GEMUESE' : idx % 4 === 1 ? 'BACKWAREN' : idx % 4 === 2 ? 'MILCHPRODUKTE' : 'GETRAENKE',
  variants: [
    {
      id: `food-${idx + 1}-a`,
      name: `${name} Standard`,
      priceCents: 80 + (idx % 9) * 20,
      nutrition: { energyKcal: 40 + (idx % 7) * 25, fatG: Number((0.3 + (idx % 6) * 0.9).toFixed(1)), saltG: Number((0.05 + (idx % 5) * 0.2).toFixed(2)) },
      additives: idx % 3 === 0 ? ['Aroma'] : [],
      benefits: idx % 2 === 0 ? ['Ballaststoffe'] : ['Eiweiß'],
      risks: idx % 4 === 0 ? ['Mehr Zucker'] : [],
    },
    {
      id: `food-${idx + 1}-b`,
      name: `${name} Premium`,
      priceCents: 110 + (idx % 10) * 25,
      nutrition: { energyKcal: 45 + (idx % 7) * 27, fatG: Number((0.4 + (idx % 6) * 1.0).toFixed(1)), saltG: Number((0.04 + (idx % 5) * 0.18).toFixed(2)) },
      additives: idx % 2 === 0 ? [] : ['Aroma', 'Emulgator'],
      benefits: idx % 3 === 0 ? ['Vitamin C'] : ['Calcium'],
      risks: idx % 5 === 0 ? ['Relativ hoher Salzgehalt'] : [],
    },
  ],
}));

const maybeValidated = validatedFoods as FoodItem[];
export const fullFoodCatalog: FoodItem[] = maybeValidated.length >= 61 ? maybeValidated : generatedFullCatalog;

export type FoodVariant = {
  id: string;
  name: string;
  priceCents: number;
  nutrition: {
    energyKcal: number;
    fatG: number;
    saltG: number;
  };
  additives: string[];
  benefits: string[];
  risks: string[];
};

export type FoodItem = {
  id: string;
  name: string;
  image: string;
  category: 'OBST_GEMUESE' | 'BACKWAREN' | 'MILCHPRODUKTE' | 'GETRAENKE';
  variants: FoodVariant[];
};

export const foodCatalog: FoodItem[] = [
  {
    id: 'apple',
    name: 'Apfel',
    image: '🍎',
    category: 'OBST_GEMUESE',
    variants: [
      { id: 'apple-bio', name: 'Bio Apfel', priceCents: 89, nutrition: { energyKcal: 52, fatG: 0.2, saltG: 0.01 }, additives: [], benefits: ['Vitamin C', 'Ballaststoffe'], risks: ['Fruchtzucker bei großen Mengen'] },
      { id: 'apple-standard', name: 'Tafelapfel', priceCents: 59, nutrition: { energyKcal: 51, fatG: 0.2, saltG: 0.01 }, additives: [], benefits: ['Sättigend'], risks: ['Pestizidbelastung möglich'] },
    ],
  },
  {
    id: 'bread',
    name: 'Vollkornbrot',
    image: '🍞',
    category: 'BACKWAREN',
    variants: [
      { id: 'bread-sliced', name: 'Vollkorn geschnitten', priceCents: 229, nutrition: { energyKcal: 245, fatG: 3.4, saltG: 1.2 }, additives: ['Hefe'], benefits: ['Viele Ballaststoffe'], risks: ['Relativ hoher Salzgehalt'] },
      { id: 'bread-seeds', name: 'Körnerbrot', priceCents: 279, nutrition: { energyKcal: 264, fatG: 5.8, saltG: 1.1 }, additives: ['Hefe'], benefits: ['Ungesättigte Fettsäuren'], risks: ['Kalorienreicher'] },
    ],
  },
  {
    id: 'yoghurt',
    name: 'Joghurt',
    image: '🥛',
    category: 'MILCHPRODUKTE',
    variants: [
      { id: 'yoghurt-natural', name: 'Naturjoghurt', priceCents: 79, nutrition: { energyKcal: 63, fatG: 3.5, saltG: 0.1 }, additives: [], benefits: ['Calcium', 'Eiweiß'], risks: ['Laktose'] },
      { id: 'yoghurt-fruit', name: 'Fruchtjoghurt', priceCents: 95, nutrition: { energyKcal: 98, fatG: 3.2, saltG: 0.12 }, additives: ['Aroma'], benefits: ['Calcium'], risks: ['Mehr Zucker'] },
    ],
  },
  {
    id: 'water',
    name: 'Mineralwasser',
    image: '💧',
    category: 'GETRAENKE',
    variants: [
      { id: 'water-still', name: 'Still 1L', priceCents: 69, nutrition: { energyKcal: 0, fatG: 0, saltG: 0.02 }, additives: [], benefits: ['Kalorienfrei'], risks: [] },
      { id: 'water-sparkling', name: 'Sprudel 1L', priceCents: 69, nutrition: { energyKcal: 0, fatG: 0, saltG: 0.02 }, additives: [], benefits: ['Kalorienfrei'], risks: [] },
    ],
  },
];

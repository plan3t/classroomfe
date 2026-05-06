export type FoodVariant = {
  id: string;
  name: string;
  variantName?: string;
  description?: string;
  packaging?: string;
  priceCents: number;
  priceLabel?: string;
  nutrition: {
    energyKcal: number;
    fatG: number;
    saltG: number;
  };
  additives: string[];
  benefits: string[];
  risks: string[];
  rating: {
    preisbewusstsein: number;
    gesundheit: number;
    nachhaltigkeit: number;
    preisText: string;
    gesundheitText: string;
    nachhaltigkeitText: string;
  };
};

export type FoodCategory =
  | 'OBST'
  | 'GEMUESE'
  | 'BACKWAREN_GEBAECK'
  | 'KUEHLREGAL_READY_TO_EAT'
  | 'KUEHLREGAL_FLEISCH_ALTERNATIVEN'
  | 'KUEHLREGAL_MILCH_ALTERNATIVEN'
  | 'GETREIDEPRODUKTE'
  | 'GETRAENKE'
  | 'NUESSE_UND_SALZIGES'
  | 'SCHOKOLADE_SUESSWAREN'
  | 'KEKSE'
  | 'TIEFKUEHL_EIS';

export type FoodItem = {
  id: string;
  name: string;
  image: string;
  category: FoodCategory;
  variants: FoodVariant[];
};

export const foodCatalog: FoodItem[] = [];

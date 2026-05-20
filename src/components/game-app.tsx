'use client';

import { useEffect, useMemo, useState } from 'react';
import { type FoodCategory, type FoodItem, type FoodVariant } from '@/src/lib/food-catalog';
import { fullFoodCatalog } from '@/src/lib/food-catalog-full';
import { Button, Card, Input } from '@/src/components/ui';

type Screen = 'start' | 'play';
type CartLine = { foodId: string; variantId: string; qty: number };
type Player = { id: string; name: string; cart: CartLine[]; done: boolean; goals: string[]; quizPoints: number };
type GameMode = 'normal';

const categoryOrder: FoodCategory[] = [
  'OBST',
  'GEMUESE',
  'BACKWAREN_GEBAECK',
  'KUEHLREGAL_READY_TO_EAT',
  'KUEHLREGAL_FLEISCH_ALTERNATIVEN',
  'KUEHLREGAL_MILCH_ALTERNATIVEN',
  'GETREIDEPRODUKTE',
  'GETRAENKE',
  'NUESSE_UND_SALZIGES',
  'SCHOKOLADE_SUESSWAREN',
  'KEKSE',
  'TIEFKUEHL_EIS',
];

const categoryLabels: Record<FoodCategory, string> = {
  OBST: 'Obst',
  GEMUESE: 'Gemüse',
  BACKWAREN_GEBAECK: 'Backwaren & Gebäck',
  KUEHLREGAL_READY_TO_EAT: 'Kühlregal · Fertiggerichte',
  KUEHLREGAL_FLEISCH_ALTERNATIVEN: 'Kühlregal · Fleisch & Alternativen',
  KUEHLREGAL_MILCH_ALTERNATIVEN: 'Kühlregal · Milch & Alternativen',
  GETREIDEPRODUKTE: 'Getreideprodukte',
  GETRAENKE: 'Getränke',
  NUESSE_UND_SALZIGES: 'Nüsse & Salziges',
  SCHOKOLADE_SUESSWAREN: 'Schokolade & Süßwaren',
  KEKSE: 'Kekse',
  TIEFKUEHL_EIS: 'Tiefkühl-Eis',
};

const categoryIcons: Record<FoodCategory, string> = {
  OBST: '🍎',
  GEMUESE: '🥦',
  BACKWAREN_GEBAECK: '🥐',
  KUEHLREGAL_READY_TO_EAT: '🥗',
  KUEHLREGAL_FLEISCH_ALTERNATIVEN: '🥩',
  KUEHLREGAL_MILCH_ALTERNATIVEN: '🥛',
  GETREIDEPRODUKTE: '🌾',
  GETRAENKE: '🧃',
  NUESSE_UND_SALZIGES: '🥜',
  SCHOKOLADE_SUESSWAREN: '🍫',
  KEKSE: '🍪',
  TIEFKUEHL_EIS: '🍦',
};


function findVariant(catalog: FoodItem[], foodId: string, variantId: string): { item: FoodItem; variant: FoodVariant } | null {
  const item = catalog.find((f) => f.id === foodId);
  const variant = item?.variants.find((v) => v.id === variantId);
  return item && variant ? { item, variant } : null;
}

export function GameApp() {
  const [screen, setScreen] = useState<Screen>('start');
  const [mode, setMode] = useState<GameMode>('normal');
  const [players, setPlayers] = useState<Player[]>([]);
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [qtyInput, setQtyInput] = useState('1');
  const [finishConfirmOpen, setFinishConfirmOpen] = useState(false);
  const [playerCountModalOpen, setPlayerCountModalOpen] = useState(false);
  const [playerCount, setPlayerCount] = useState(4);
  const [hydrated, setHydrated] = useState(false);
  const [finishWarning, setFinishWarning] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const catalog = useMemo(
    () => fullFoodCatalog.filter((item) => item.id !== 'wasser' && item.name.toLowerCase() !== 'wasser'),
    [],
  );

  const activePlayer = players[activePlayerIndex];
  const qty = Number.parseInt(qtyInput, 10);
  const canAddToCart = Number.isInteger(qty) && qty > 0;

  const allDone = players.length > 0 && players.every((p) => p.done);
  const canShowScores = allDone;

  const totalsByPlayer = useMemo(() => {
    return players.map((p) => {
      const total = p.cart.reduce((sum, line) => {
        const result = findVariant(catalog, line.foodId, line.variantId);
        return result ? sum + result.variant.rating.preisbewusstsein * line.qty : sum;
      }, 0);
      return { playerId: p.id, total };
    });
  }, [catalog, players]);

  const foodsByCategory = useMemo(() => {
    return catalog.reduce((groups, food) => {
      groups[food.category] = [...(groups[food.category] ?? []), food];
      return groups;
    }, {} as Partial<Record<FoodCategory, FoodItem[]>>);
  }, [catalog]);

  const categorySummaries = useMemo(() => {
    return categoryOrder
      .map((category) => ({ category, foods: foodsByCategory[category] ?? [] }))
      .filter(({ foods }) => foods.length > 0);
  }, [foodsByCategory]);

  const visibleFoods = useMemo(() => {
    if (!selectedCategory) return [];
    const query = productSearch.trim().toLowerCase();
    const categoryFoods = foodsByCategory[selectedCategory] ?? [];
    if (!query) return categoryFoods;
    return categoryFoods.filter((food) => food.name.toLowerCase().includes(query));
  }, [foodsByCategory, productSearch, selectedCategory]);

  const activeCartPriceCents = useMemo(() => {
    return activePlayer?.cart.reduce((sum, line) => {
      const entry = findVariant(catalog, line.foodId, line.variantId);
      return entry ? sum + entry.variant.priceCents * line.qty : sum;
    }, 0) ?? 0;
  }, [activePlayer?.cart, catalog]);

  const activeCartGroups = useMemo(() => {
    const grouped: Partial<Record<FoodCategory, Array<{ line: CartLine; lineIndex: number; item: FoodItem; variant: FoodVariant }>>> = {};
    activePlayer?.cart.forEach((line, lineIndex) => {
      const entry = findVariant(catalog, line.foodId, line.variantId);
      if (!entry) return;
      const category = entry.item.category;
      grouped[category] = [...(grouped[category] ?? []), { line, lineIndex, item: entry.item, variant: entry.variant }];
    });

    return categoryOrder
      .map((category) => ({ category, lines: grouped[category] ?? [] }))
      .filter(({ lines }) => lines.length > 0);
  }, [activePlayer?.cart, catalog]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem('game-companion-state-v1');
      if (!raw) {
        setHydrated(true);
        return;
      }
      const parsed = JSON.parse(raw) as Partial<{
        screen: Screen;
        mode: GameMode;
        players: Player[];
        activePlayerIndex: number;
      }>;
      if (parsed.screen) setScreen(parsed.screen);
      if (parsed.mode) setMode(parsed.mode);
      if (parsed.players) setPlayers(parsed.players);
      if (typeof parsed.activePlayerIndex === 'number') setActivePlayerIndex(parsed.activePlayerIndex);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    window.localStorage.setItem('game-companion-state-v1', JSON.stringify({
      screen,
      mode,
      players,
      activePlayerIndex,
    }));
  }, [hydrated, screen, mode, players, activePlayerIndex]);

  function resetAll() {
    setScreen('start');
    setMode('normal');
    setPlayers([]);
    setActivePlayerIndex(0);
    setSelectedFood(null);
    setSelectedVariantId('');
    setSelectedCategory(null);
    setProductSearch('');
    setQtyInput('1');
    setFinishConfirmOpen(false);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('game-companion-state-v1');
    }
  }

  function startGame() {
    const normalizedCount = Math.max(2, Math.min(4, playerCount));
    const defaultPlayers = Array.from({ length: normalizedCount }, (_, idx) => ({
      id: `p-${idx}`,
      name: `Spieler ${idx + 1}`,
      cart: [],
      done: false,
      goals: [],
      quizPoints: 0,
    }));
    setPlayers(defaultPlayers);
    setActivePlayerIndex(0);
    setSelectedCategory(null);
    setSelectedFood(null);
    setSelectedVariantId('');
    setProductSearch('');
    setPlayerCountModalOpen(false);
    setScreen('play');
  }

  function addToCart() {
    if (!activePlayer || !selectedFood || !selectedVariantId || !canAddToCart) return;
    setPlayers((current) => current.map((p, idx) => {
      if (idx !== activePlayerIndex) return p;
      const existingLineIndex = p.cart.findIndex((line) => line.foodId === selectedFood.id && line.variantId === selectedVariantId);
      if (existingLineIndex >= 0) {
        const nextCart = p.cart.map((line, lineIndex) => (
          lineIndex === existingLineIndex ? { ...line, qty: line.qty + qty } : line
        ));
        return { ...p, cart: nextCart };
      }
      return {
        ...p,
        cart: [...p.cart, { foodId: selectedFood.id, variantId: selectedVariantId, qty }],
      };
    }));
    setQtyInput('1');
  }

  function removeFromCart(lineIndex: number) {
    if (!activePlayer) return;
    setPlayers((current) => current.map((p, idx) => {
      if (idx !== activePlayerIndex) return p;
      return {
        ...p,
        cart: p.cart.filter((_, cartIdx) => cartIdx !== lineIndex),
      };
    }));
  }

  function finishShopping() {
    if (!activePlayer) return;
    const validation = canFinishShopping(activePlayer.cart);
    if (!validation.ok) {
      setFinishWarning('Du brauchst mindestens zwei Lebensmittel und ein Getränk.');
      setFinishConfirmOpen(false);
      return;
    }
    setPlayers((current) => current.map((p, idx) => idx === activePlayerIndex ? { ...p, done: true } : p));
    nextPlayer();
    setFinishWarning(null);
    setFinishConfirmOpen(false);
  }

  function canFinishShopping(cart: CartLine[]): { ok: boolean } {
    const additionalDrinkIds = new Set(['smoothie', 'trinkschokolade-kakao']);
    const counts = cart.reduce((sum, line) => {
      const entry = findVariant(catalog, line.foodId, line.variantId);
      if (!entry) return sum;
      if (entry.item.category === 'GETRAENKE' || additionalDrinkIds.has(entry.item.id)) {
        return { ...sum, drinks: sum.drinks + line.qty };
      }
      return { ...sum, foods: sum.foods + line.qty };
    }, { foods: 0, drinks: 0 });

    return { ok: counts.foods >= 2 && counts.drinks >= 1 };
  }

  function changeQuizPoints(delta: number) {
    setPlayers((current) => current.map((player, idx) => (
      idx === activePlayerIndex ? { ...player, quizPoints: Math.max(0, player.quizPoints + delta) } : player
    )));
  }

  function selectCategory(category: FoodCategory) {
    setSelectedCategory(category);
    setSelectedFood(null);
    setSelectedVariantId('');
    setProductSearch('');
  }

  function showCategoryOverview() {
    setSelectedCategory(null);
    setSelectedFood(null);
    setSelectedVariantId('');
    setProductSearch('');
  }

  function selectFood(food: FoodItem) {
    setSelectedFood(food);
    setSelectedVariantId(food.variants[0]?.id ?? '');
  }

  function nextPlayer() {
    if (players.length === 0) return;
    setActivePlayerIndex((i) => (i + 1) % players.length);
    setSelectedCategory(null);
    setSelectedFood(null);
    setSelectedVariantId('');
    setProductSearch('');
    setQtyInput('1');
  }

  function formatPrice(cents: number) {
    return `${(cents / 100).toFixed(2).replace('.', ',')} €`;
  }

  if (screen === 'start') {
    return (
      <>
        <Card className="mx-auto max-w-5xl overflow-hidden border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-0">
          <div className="grid gap-0 md:grid-cols-[1.25fr_0.75fr]">
            <div className="space-y-6 p-8 md:p-10">
              <p className="inline-flex rounded-full border border-emerald-300/40 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200">Smart Eat · Brettspiel-Begleitapp</p>
              <h1 className="text-4xl font-bold leading-tight md:text-5xl">Smart Eat</h1>
              <p className="max-w-2xl text-slate-300">Mit einem Klick startet eine vollständige Runde mit vier Spielern. Produktwahl, Warenkorb und Auswertung bleiben wie gewohnt erhalten – optimiert für Tablet und Klassenzimmer.</p>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => setPlayerCountModalOpen(true)} className="px-6 py-3 text-base font-semibold bg-emerald-400 text-slate-950 hover:bg-emerald-300">Spiel starten</Button>
              </div>
              <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm">
                <h2 className="text-lg font-semibold text-white">Spielanleitung</h2>
                <p><span className="font-semibold">Runde 1:</span> Kauft mindestens zwei Lebensmittel und ein Getränk. Vor jedem Zug Quiz-Karte ziehen und Punkte notieren.</p>
                <p><span className="font-semibold">Runde 2:</span> Verbessert euren schwächsten Aspekt (Preis, Gesundheit oder Nachhaltigkeit) aus Runde 1.</p>
                <p><span className="font-semibold">Aktionsfeld:</span> Landet ihr auf einem Aktionsfeld, zieht eine Aktionskarte und lest sie laut vor.</p>
                <p className="text-amber-200">Vergesst nicht eure Quiz-Punkte!</p>
              </div>
            </div>
            <div className="flex flex-col justify-center gap-4 border-t border-white/10 bg-slate-900/70 p-8 md:border-l md:border-t-0">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-300">Beim Start automatisch enthalten</p>
              <ul className="space-y-3 text-sm text-slate-200">
                <li>✅ 4 Spieler: <span className="text-white">„Spieler 1“ bis „Spieler 4“</span></li>
                <li>✅ Direkter Sprung in den Einkaufsbereich</li>
                <li>✅ Einheitliche Bedienung für die gesamte Klasse</li>
              </ul>
              <p className="text-xs text-slate-400">Tipp: Nach jedem Durchlauf kann das Spiel mit „Spiel zurücksetzen“ erneut gestartet werden.</p>
              <details className="rounded-xl border border-white/10 p-3 text-sm">
                <summary className="cursor-pointer font-semibold">Material & Symbolwürfel (optional)</summary>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-300">
                  <li>Material: Spielfeld, Zahlenwürfel, 4 Spielfiguren, 4 Einkaufszettel, 12 Regalblätter, Aktionskarten, Quiz-Karten.</li>
                  <li>Symbolwürfel Rot: Gewürfelte Augenzahl zurückgehen.</li>
                  <li>Rosa/Orange/Grün: Ziel anpassen (Herz, billig, nachhaltig).</li>
                  <li>Blau/Lila: Aktions- bzw. Quiz-Karte ziehen.</li>
                </ul>
              </details>
            </div>
          </div>
        </Card>
        {playerCountModalOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
            <Card className="w-full max-w-md space-y-4 border border-white/10">
              <h4 className="text-xl font-semibold">Wie viele Spieler machen mit?</h4>
              <p className="text-sm text-slate-300">Bitte wähle zwischen 2 und 4 Spielern.</p>
              <label className="block text-sm">
                <span>Anzahl Spieler</span>
                <select
                  value={playerCount}
                  onChange={(e) => setPlayerCount(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-slate-950 px-3 py-2"
                >
                  <option value={2}>2 Spieler</option>
                  <option value={3}>3 Spieler</option>
                  <option value={4}>4 Spieler</option>
                </select>
              </label>
              <div className="flex justify-end gap-2">
                <Button onClick={() => setPlayerCountModalOpen(false)} className="bg-white text-slate-950 hover:bg-slate-200">Abbrechen</Button>
                <Button onClick={startGame} className="bg-emerald-400 text-slate-950 hover:bg-emerald-300">Starten</Button>
              </div>
            </Card>
          </div>
        ) : null}
      </>
    );
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-2xl font-semibold">Aktiver Spieler: {activePlayer?.name}</h2>
          <p className="text-sm text-slate-300">Status: {activePlayer?.done ? 'Einkauf fertig · wartet an der Kasse' : 'Einkauft'}</p>
        </div>
        {finishWarning ? <p className="rounded-xl border border-amber-300/40 bg-amber-400/10 p-3 text-sm text-amber-100">{finishWarning}</p> : null}

        <div className="space-y-2">
          <h3 className="text-lg font-medium">Einkaufsübersicht</h3>
          <p className="text-sm text-slate-300">
            {selectedCategory
              ? `Einkaufsübersicht > ${categoryLabels[selectedCategory]}`
              : 'Wähle zuerst eine Kategorie aus. Danach werden nur die passenden Produkte angezeigt.'}
          </p>
        </div>

        {!selectedCategory ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {categorySummaries.map(({ category, foods }) => (
              <button
                key={category}
                type="button"
                onClick={() => selectCategory(category)}
                className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-left transition hover:border-emerald-300/60 hover:bg-white/5"
              >
                <div className="flex items-start gap-3">
                  <span className="text-4xl" aria-hidden="true">{categoryIcons[category]}</span>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Kategorie</p>
                    <p className="mt-1 font-semibold">{categoryLabels[category]}</p>
                    <p className="mt-1 text-sm text-slate-400">{foods.length} {foods.length === 1 ? 'Produkt' : 'Produkte'}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900/50 p-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Kategorie</p>
                <h4 className="text-xl font-semibold">{categoryIcons[selectedCategory]} {categoryLabels[selectedCategory]}</h4>
                <p className="text-sm text-slate-300">{foodsByCategory[selectedCategory]?.length ?? 0} Produkte in dieser Kategorie</p>
              </div>
              <Button onClick={showCategoryOverview} className="bg-white text-slate-950 hover:bg-slate-200">← Zurück zu Kategorien</Button>
            </div>

            <label className="block text-sm">
              <span>Produkt in {categoryLabels[selectedCategory]} suchen</span>
              <Input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Produktname eingeben ..." />
            </label>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {visibleFoods.map((food) => (
                <button
                  key={food.id}
                  type="button"
                  onClick={() => selectFood(food)}
                  className={`rounded-2xl border p-4 text-left transition hover:bg-white/5 ${selectedFood?.id === food.id ? 'border-emerald-300 bg-emerald-400/10' : 'border-white/10 bg-slate-900/60'}`}
                >
                  <p className="text-3xl">{food.image}</p>
                  <p className="mt-2 font-semibold">{food.name}</p>
                </button>
              ))}
            </div>
            {visibleFoods.length === 0 ? <p className="rounded-2xl border border-white/10 p-4 text-sm text-slate-300">Keine Produkte für diese Suche gefunden.</p> : null}
          </div>
        )}

        {selectedFood ? (
          <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-900/50 p-4">
            <h4 className="text-xl font-semibold">{selectedFood.name}</h4>
            <p className="text-xs text-slate-400">Kategorie: {categoryLabels[selectedFood.category]}</p>
            <label className="block text-sm">
              <span>Variante</span>
              <select
                value={selectedVariantId}
                onChange={(e) => setSelectedVariantId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-slate-950 px-3 py-2"
              >
                {selectedFood.variants.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </label>
            {selectedFood.variants.filter((v) => v.id === selectedVariantId).map((v) => (
              <div key={v.id} className="rounded-xl border border-white/10 p-3 text-sm">
                <p className="font-semibold">Produktinformationen</p>
                {v.variantName ? <p>Variante: {v.variantName}</p> : null}
                {v.description ? <p>Merkmale: {v.description}</p> : null}
                {v.packaging ? <p>Verpackung/Kaufart: {v.packaging}</p> : null}
                <p>Preis: {v.priceLabel ?? `${(v.priceCents / 100).toFixed(2).replace('.', ',')} €`}</p>
                <p>Zusatzstoffe: {v.additives.length ? v.additives.join(', ') : 'Keine angegeben'}</p>
                <p>Vorteile: {v.benefits.length ? v.benefits.join(', ') : 'Keine angegeben'}</p>
                <p>Risiken: {v.risks.length ? v.risks.join(', ') : 'Keine angegeben'}</p>
              </div>
            ))}
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-sm">
                Menge
                <Input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={qtyInput}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    if (/^\d*$/.test(nextValue)) setQtyInput(nextValue);
                  }}
                  placeholder="Menge eingeben"
                />
              </label>
              <Button onClick={addToCart} disabled={!canAddToCart}>In Einkaufskorb</Button>
            </div>
          </div>
        ) : null}
      </Card>

      <Card className="space-y-4">
        <h3 className="text-xl font-semibold">Einkaufskorb: {activePlayer?.name}</h3>
        <div className="space-y-3 text-sm">
          {activeCartGroups.length ? activeCartGroups.map(({ category, lines }) => (
            <div key={`cart-${category}`} className="rounded-2xl border border-white/10 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="font-semibold">{categoryIcons[category]} {categoryLabels[category]}</p>
                <p className="text-xs text-slate-400">{lines.length} {lines.length === 1 ? 'Artikel' : 'Artikel'}</p>
              </div>
              <div className="space-y-2">
                {lines.map(({ line, lineIndex, item, variant }) => (
                  <div key={`${line.foodId}-${line.variantId}-${lineIndex}`} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 p-2">
                    <span>{item.name} ({variant.name}) × {line.qty} · Einzelpreis: {formatPrice(variant.priceCents)}</span>
                    {!activePlayer?.done ? <Button onClick={() => removeFromCart(lineIndex)} className="bg-rose-300 px-3 py-1 text-xs text-slate-950 hover:bg-rose-200">Entfernen</Button> : null}
                  </div>
                ))}
              </div>
            </div>
          )) : <p className="text-slate-400">Noch nichts im Korb.</p>}
        </div>
        <p className="font-semibold">Preissumme: {formatPrice(activeCartPriceCents)}</p>
        <div className="rounded-2xl border border-white/10 p-3 text-sm">
          <p className="font-semibold">Quiz-Punkte: {activePlayer?.quizPoints ?? 0}</p>
          <div className="mt-2 flex gap-2">
            <Button onClick={() => changeQuizPoints(1)} className="bg-emerald-300 px-3 py-1 text-slate-950 hover:bg-emerald-200">+1</Button>
            <Button onClick={() => changeQuizPoints(-1)} className="bg-white px-3 py-1 text-slate-950 hover:bg-slate-200">-1</Button>
          </div>
        </div>
        {canShowScores ? <p className="font-semibold">Preis-Score Summe: {totalsByPlayer.find((t) => t.playerId === activePlayer?.id)?.total ?? 0}</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setFinishConfirmOpen(true)} className="bg-emerald-400 text-slate-950 hover:bg-emerald-300">Einkauf fertig</Button>
          <Button onClick={nextPlayer} className="bg-white text-slate-950 hover:bg-slate-200">iPad weitergeben</Button>
          <Button onClick={resetAll} className="bg-rose-300 text-slate-950 hover:bg-rose-200">Spiel zurücksetzen</Button>
        </div>

        <div className="rounded-2xl border border-white/10 p-3 text-sm">
          <p className="font-semibold">Spielstand</p>
          {players.map((p) => {
            const total = totalsByPlayer.find((t) => t.playerId === p.id)?.total ?? 0;
            return <p key={p.id}>{p.name}: {canShowScores ? `Preis-Score ${total} · ` : ''}{p.done ? 'fertig' : 'offen'}</p>;
          })}
        </div>

        {allDone ? (
          <div className="rounded-2xl border border-emerald-400/40 bg-emerald-400/10 p-4">
            <p className="font-semibold">Alle Spieler sind an der Kasse fertig.</p>
            <p className="text-sm text-slate-300">Feedback kann jetzt im Heft/Reflexionsbogen erfolgen.</p>
            <div className="mt-3 space-y-3 text-sm">
              {players.map((player) => {
                const totals = player.cart.reduce((sum, line) => {
                  const entry = findVariant(catalog, line.foodId, line.variantId);
                  if (!entry) return sum;
                  return {
                    preis: sum.preis + entry.variant.rating.preisbewusstsein * line.qty,
                    gesundheit: sum.gesundheit + entry.variant.rating.gesundheit * line.qty,
                    nachhaltigkeit: sum.nachhaltigkeit + entry.variant.rating.nachhaltigkeit * line.qty,
                    menge: sum.menge + line.qty,
                  };
                }, { preis: 0, gesundheit: 0, nachhaltigkeit: 0, menge: 0 });
                return (
                  <div key={`rating-${player.id}`} className="rounded-xl border border-white/10 p-3">
                    <p className="font-semibold">Bewertung für {player.name}</p>
                    <p>Preisbewusstsein: {totals.preis}</p>
                    <p>Gesundheitsförderlichkeit: {totals.gesundheit}</p>
                    <p>Nachhaltigkeit: {totals.nachhaltigkeit}</p>
                    {player.cart.length ? (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-emerald-200">Begründungen anzeigen</summary>
                        <div className="mt-2 space-y-2 text-slate-300">
                          {player.cart.map((line, idx) => {
                            const entry = findVariant(catalog, line.foodId, line.variantId);
                            if (!entry) return null;
                            return (
                              <div key={`reason-${player.id}-${idx}`}>
                                <p className="font-medium text-white">{entry.item.name} ({entry.variant.name}) × {line.qty}</p>
                                <p>Preis: {entry.variant.rating.preisText}</p>
                                <p>Gesundheit: {entry.variant.rating.gesundheitText}</p>
                                <p>Nachhaltigkeit: {entry.variant.rating.nachhaltigkeitText}</p>
                              </div>
                            );
                          })}
                        </div>
                      </details>
                    ) : <p className="text-slate-300">Keine Artikel im Einkaufskorb.</p>}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </Card>
      {finishConfirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <Card className="w-full max-w-md space-y-4 border border-white/10">
            <h4 className="text-xl font-semibold">Bist du sicher?</h4>
            <p className="text-sm text-slate-300">Soll der Einkauf für {activePlayer?.name} wirklich abgeschlossen werden?</p>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setFinishConfirmOpen(false)} className="bg-white text-slate-950 hover:bg-slate-200">Nein</Button>
              <Button onClick={finishShopping} className="bg-emerald-400 text-slate-950 hover:bg-emerald-300">Ja</Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

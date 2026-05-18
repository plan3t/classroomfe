'use client';

import { useEffect, useMemo, useState } from 'react';
import { foodCatalog, type FoodItem, type FoodVariant } from '@/src/lib/food-catalog';
import { fullFoodCatalog } from '@/src/lib/food-catalog-full';
import { Button, Card, Input } from '@/src/components/ui';
import { evaluateGoal } from '@/src/lib/game-goal-scoring';

type Screen = 'start' | 'guide' | 'setup' | 'play';
type CartLine = { foodId: string; variantId: string; qty: number };
type Player = { id: string; name: string; cart: CartLine[]; done: boolean; goals: string[] };
type GameMode = 'normal' | 'with-goals';

const availableGoals = [
  'Weniger Salz kaufen',
  'Weniger zugesetzten Zucker kaufen',
  'Mehr ballaststoffreiche Produkte wählen',
  'Ultra-verarbeitete Produkte reduzieren',
];


function findVariant(catalog: FoodItem[], foodId: string, variantId: string): { item: FoodItem; variant: FoodVariant } | null {
  const item = catalog.find((f) => f.id === foodId);
  const variant = item?.variants.find((v) => v.id === variantId);
  return item && variant ? { item, variant } : null;
}

export function GameApp() {
  const [screen, setScreen] = useState<Screen>('start');
  const [mode, setMode] = useState<GameMode>('normal');
  const [playerInput, setPlayerInput] = useState('Spieler 1\nSpieler 2');
  const [players, setPlayers] = useState<Player[]>([]);
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [qty, setQty] = useState(1);
  const [setupGoals, setSetupGoals] = useState<Record<number, string[]>>({});
  const [hydrated, setHydrated] = useState(false);
  const [guideVideoUrl, setGuideVideoUrl] = useState('');
  const [guideVideos, setGuideVideos] = useState<Array<{ name: string; url: string }>>([]);
  const [saveInfo, setSaveInfo] = useState<string | null>(null);
  const [useFullCatalog, setUseFullCatalog] = useState(true);
  const catalog = useFullCatalog ? fullFoodCatalog : foodCatalog;

  const activePlayer = players[activePlayerIndex];

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
        playerInput: string;
        players: Player[];
        activePlayerIndex: number;
        setupGoals: Record<number, string[]>;
      }>;
      if (parsed.screen) setScreen(parsed.screen);
      if (parsed.mode) setMode(parsed.mode);
      if (parsed.playerInput) setPlayerInput(parsed.playerInput);
      if (parsed.players) setPlayers(parsed.players);
      if (typeof parsed.activePlayerIndex === 'number') setActivePlayerIndex(parsed.activePlayerIndex);
      if (parsed.setupGoals) setSetupGoals(parsed.setupGoals);
      const mediaRaw = window.localStorage.getItem('game-companion-media-v1');
      if (mediaRaw) setGuideVideos(JSON.parse(mediaRaw));
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    window.localStorage.setItem('game-companion-state-v1', JSON.stringify({
      screen,
      mode,
      playerInput,
      players,
      activePlayerIndex,
      setupGoals,
    }));
  }, [hydrated, screen, mode, playerInput, players, activePlayerIndex, setupGoals]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('game-companion-media-v1', JSON.stringify(guideVideos));
  }, [guideVideos]);

  function resetAll() {
    setScreen('start');
    setMode('normal');
    setPlayerInput('Spieler 1\nSpieler 2');
    setPlayers([]);
    setActivePlayerIndex(0);
    setSelectedFood(null);
    setSelectedVariantId('');
    setQty(1);
    setSetupGoals({});
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('game-companion-state-v1');
      window.localStorage.removeItem('game-companion-media-v1');
    }
    setSaveInfo(null);
  }

  async function addGuideVideoFile(file: File) {
    const url = URL.createObjectURL(file);
    setGuideVideos((current) => [...current, { name: file.name, url }]);
  }

  async function saveSession() {
    const sessionId = `game-${Date.now()}`;
    const res = await fetch('/api/game/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: sessionId,
        mode,
        players,
        notes: 'Gespeichert aus iPad-Spielmodus',
      }),
    });
    if (!res.ok) {
      setSaveInfo('Speichern fehlgeschlagen.');
      return;
    }
    setSaveInfo(`Spielstand gespeichert: ${sessionId}`);
  }

  function startGame() {
    const lines = playerInput.split('\n').map((x) => x.trim()).filter(Boolean);
    if (lines.length < 1) return;
    setPlayers(lines.map((name, idx) => ({ id: `p-${idx}`, name, cart: [], done: false, goals: setupGoals[idx] ?? [] })));
    setActivePlayerIndex(0);
    setScreen('play');
  }

  function addToCart() {
    if (!activePlayer || !selectedFood || !selectedVariantId || qty <= 0) return;
    setPlayers((current) => current.map((p, idx) => {
      if (idx !== activePlayerIndex) return p;
      return {
        ...p,
        cart: [...p.cart, { foodId: selectedFood.id, variantId: selectedVariantId, qty }],
      };
    }));
    setQty(1);
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
    setPlayers((current) => current.map((p, idx) => idx === activePlayerIndex ? { ...p, done: true } : p));
  }

  function nextPlayer() {
    if (players.length === 0) return;
    setActivePlayerIndex((i) => (i + 1) % players.length);
    setSelectedFood(null);
    setSelectedVariantId('');
    setQty(1);
  }

  function toggleGoal(playerIndex: number, goal: string) {
    setSetupGoals((current) => {
      const existing = current[playerIndex] ?? [];
      const next = existing.includes(goal) ? existing.filter((g) => g !== goal) : [...existing, goal];
      return { ...current, [playerIndex]: next };
    });
  }

  if (screen === 'start') {
    return (
      <Card className="mx-auto max-w-4xl space-y-5">
        <h1 className="text-3xl font-bold">Brettspiel-Begleitapp</h1>
        <p className="text-slate-300">Ersetzt QR-Code- und Datenblatt-Stapel durch eine zentrale iPad-Oberfläche mit Lebensmitteln, Varianten und Einkaufskorb.</p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setScreen('guide')}>Anleitung lesen</Button>
          <Button onClick={() => setScreen('setup')} className="bg-white text-slate-950">Spiel starten</Button>
          <Button onClick={() => { setMode('with-goals'); setScreen('setup'); }} className="bg-amber-300 text-slate-950 hover:bg-amber-200">Spiel mit Ziel starten</Button>
        </div>
      </Card>
    );
  }

  if (screen === 'guide') {
    return (
      <Card className="mx-auto max-w-4xl space-y-4">
        <h2 className="text-2xl font-semibold">Anleitung (Kurzfassung)</h2>
        <ol className="list-decimal space-y-2 pl-5 text-slate-300">
          <li>Spieler würfeln analog und bewegen die Spielfigur auf dem Brett.</li>
          <li>Am iPad öffnet der aktive Spieler das passende Regal/Lebensmittel.</li>
          <li>Lebensmittel anklicken, Nährwerte + Varianten prüfen, in den Einkaufskorb legen.</li>
          <li>Wenn Spieler an der Kasse ist: „Einkauf fertig“ klicken.</li>
          <li>Wenn alle fertig sind, zeigt die App Summen und Einkaufslisten pro Spieler.</li>
        </ol>
        <Button onClick={() => setScreen('setup')}>Weiter zur Spielanlage</Button>
        <label className="block text-sm">
          <span>Optional: Video-Link zur Anleitung</span>
          <Input value={guideVideoUrl} onChange={(e) => setGuideVideoUrl(e.target.value)} placeholder="https://..." />
        </label>
        {guideVideoUrl ? <a href={guideVideoUrl} target="_blank" className="text-emerald-300 underline" rel="noreferrer">Anleitungsvideo öffnen</a> : null}
        <label className="block text-sm">
          <span>Oder Video zur Medienbibliothek hinzufügen</span>
          <input type="file" accept="video/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) void addGuideVideoFile(f); }} className="mt-1 block w-full text-sm" />
        </label>
        {guideVideos.length ? (
          <div className="rounded-2xl border border-white/10 p-3 text-sm">
            <p className="font-semibold">Medienbibliothek</p>
            {guideVideos.map((video, idx) => (
              <a key={`${video.name}-${idx}`} href={video.url} target="_blank" rel="noreferrer" className="block text-emerald-300 underline">{video.name}</a>
            ))}
          </div>
        ) : null}
      </Card>
    );
  }

  if (screen === 'setup') {
    return (
      <Card className="mx-auto max-w-4xl space-y-4">
        <h2 className="text-2xl font-semibold">Spiel vorbereiten</h2>
        <p className="text-slate-300">Ein Spieler pro Zeile (iPad wird im Zug weitergegeben).</p>
        <textarea
          value={playerInput}
          onChange={(e) => setPlayerInput(e.target.value)}
          className="min-h-36 w-full rounded-2xl border border-white/15 bg-slate-900 p-3 text-white"
        />
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3 text-sm">
          <p>Modus: <span className="font-semibold text-white">{mode === 'normal' ? 'Standard' : 'Spiel mit Ziel'}</span></p>
          <p className="mt-1 text-slate-400">Im Zielmodus wählt jeder Spieler persönliche Einkaufsziele.</p>
        </div>
        {mode === 'with-goals' ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Ziele pro Spieler auswählen</h3>
            {playerInput.split('\n').map((rawName, idx) => {
              const name = rawName.trim();
              if (!name) return null;
              const selectedGoals = setupGoals[idx] ?? [];
              return (
                <div key={`${name}-${idx}`} className="rounded-2xl border border-white/10 p-3">
                  <p className="font-medium">{name}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {availableGoals.map((goal) => (
                      <button
                        type="button"
                        key={goal}
                        onClick={() => toggleGoal(idx, goal)}
                        className={`rounded-full border px-3 py-1 text-sm ${selectedGoals.includes(goal) ? 'border-emerald-300 bg-emerald-400/20 text-emerald-100' : 'border-white/20 text-slate-200'}`}
                      >
                        {goal}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
        <Button onClick={startGame}>Spiel starten</Button>
      </Card>
    );
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-2xl font-semibold">Aktiver Spieler: {activePlayer?.name}</h2>
          <p className="text-sm text-slate-300">Status: {activePlayer?.done ? 'Einkauf fertig' : 'Einkauft'}</p>
        </div>

        <h3 className="text-lg font-medium">Lebensmittelübersicht</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {catalog.map((food) => (
            <button
              key={food.id}
              type="button"
              onClick={() => {
                setSelectedFood(food);
                setSelectedVariantId(food.variants[0]?.id ?? '');
              }}
              className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-left hover:bg-white/5"
            >
              <p className="text-3xl">{food.image}</p>
              <p className="mt-2 font-semibold">{food.name}</p>
            </button>
          ))}
        </div>

        {selectedFood ? (
          <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-900/50 p-4">
            <h4 className="text-xl font-semibold">{selectedFood.name}</h4>
            <p className="text-xs text-slate-400">Kategorie: {selectedFood.category}</p>
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
              <div key={v.id} className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-white/10 p-3 text-sm">
                  <p className="font-semibold">Nährwerte</p>
                  <p>Energie: {v.nutrition.energyKcal} kcal</p>
                  <p>Fett: {v.nutrition.fatG} g</p>
                  <p>Salz: {v.nutrition.saltG} g</p>
                </div>
                <div className="rounded-xl border border-white/10 p-3 text-sm">
                  <p className="font-semibold">Produktinformationen</p>
                  {v.variantName ? <p>Variante: {v.variantName}</p> : null}
                  {v.description ? <p>Merkmale: {v.description}</p> : null}
                  {v.packaging ? <p>Verpackung/Kaufart: {v.packaging}</p> : null}
                  <p>Preis: {v.priceLabel ?? `${(v.priceCents / 100).toFixed(2).replace('.', ',')} €`}</p>
                  <p>Zusatzstoffe: {v.additives.length ? v.additives.join(', ') : 'Keine angegeben'}</p>
                  <p>Vorteile: {v.benefits.length ? v.benefits.join(', ') : 'Keine angegeben'}</p>
                  <p>Risiken: {v.risks.length ? v.risks.join(', ') : 'Keine angegeben'}</p>
                </div>
              </div>
            ))}
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-sm">
                Menge
                <Input type="number" min={1} value={String(qty)} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} />
              </label>
              <Button onClick={addToCart}>In Einkaufskorb</Button>
            </div>
          </div>
        ) : null}
      </Card>

      <Card className="space-y-4">
        <h3 className="text-xl font-semibold">Einkaufskorb: {activePlayer?.name}</h3>
        <div className="space-y-2 text-sm">
          {activePlayer?.cart.length ? activePlayer.cart.map((line, idx) => {
            const entry = findVariant(catalog, line.foodId, line.variantId);
            if (!entry) return null;
            return (
              <div key={`${line.foodId}-${line.variantId}-${idx}`} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 p-2">
                <span>{entry.item.name} ({entry.variant.name}) × {line.qty}</span>
                {!activePlayer.done ? <Button onClick={() => removeFromCart(idx)} className="bg-rose-300 px-3 py-1 text-xs text-slate-950 hover:bg-rose-200">Entfernen</Button> : null}
              </div>
            );
          }) : <p className="text-slate-400">Noch nichts im Korb.</p>}
        </div>
        {canShowScores ? <p className="font-semibold">Preis-Score Summe: {totalsByPlayer.find((t) => t.playerId === activePlayer?.id)?.total ?? 0}</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button onClick={finishShopping} className="bg-emerald-400 text-slate-950 hover:bg-emerald-300">Einkauf fertig</Button>
          <Button onClick={nextPlayer} className="bg-white text-slate-950 hover:bg-slate-200">iPad weitergeben</Button>
          <Button onClick={() => void saveSession()} className="bg-amber-300 text-slate-950 hover:bg-amber-200">Spielstand speichern</Button>
          <Button onClick={resetAll} className="bg-rose-300 text-slate-950 hover:bg-rose-200">Spiel zurücksetzen</Button>
        </div>
        <label className="inline-flex items-center gap-2 text-xs text-slate-300">
          <input type="checkbox" checked={useFullCatalog} onChange={(e) => setUseFullCatalog(e.target.checked)} />
          Vollkatalog (61 Lebensmittel) verwenden
        </label>
        {saveInfo ? <p className="text-sm text-emerald-200">{saveInfo}</p> : null}

        <div className="rounded-2xl border border-white/10 p-3 text-sm">
          <p className="font-semibold">Spielstand</p>
          {players.map((p) => {
            const total = totalsByPlayer.find((t) => t.playerId === p.id)?.total ?? 0;
            return <p key={p.id}>{p.name}: {canShowScores ? `Preis-Score ${total} · ` : ''}{p.done ? 'fertig' : 'offen'}{mode === 'with-goals' && p.goals.length ? ` · Ziele: ${p.goals.join(', ')}` : ''}</p>;
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
                const divisor = Math.max(1, totals.menge);
                return (
                  <div key={`rating-${player.id}`} className="rounded-xl border border-white/10 p-3">
                    <p className="font-semibold">Bewertung für {player.name}</p>
                    <p>Preisbewusstsein: {(totals.preis / divisor).toFixed(1)}/5</p>
                    <p>Gesundheitsförderlichkeit: {(totals.gesundheit / divisor).toFixed(1)}/5</p>
                    <p>Nachhaltigkeit: {(totals.nachhaltigkeit / divisor).toFixed(1)}/5</p>
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
            {mode === 'with-goals' ? <p className="mt-2 text-sm text-amber-200">Jetzt pro Spieler prüfen, wie gut die ausgewählten Ziele erreicht wurden.</p> : null}
            {mode === 'with-goals' ? (
              <div className="mt-3 space-y-2 text-sm">
                {players.map((player) => (
                  <div key={`feedback-${player.id}`}>
                    <p className="font-semibold">{player.name}</p>
                    {player.goals.length === 0 ? <p className="text-slate-300">Keine Ziele ausgewählt.</p> : player.goals.map((goal) => {
                      const result = evaluateGoal(goal, player.cart, catalog);
                      return <p key={`${player.id}-${goal}`} className={result.reached ? 'text-emerald-200' : 'text-amber-200'}>{goal}: {result.reached ? 'erreicht' : 'noch offen'} ({result.reason})</p>;
                    })}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </Card>
    </div>
  );
}

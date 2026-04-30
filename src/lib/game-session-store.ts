export type SavedCartLine = { foodId: string; variantId: string; qty: number };
export type SavedPlayer = { id: string; name: string; goals: string[]; done: boolean; cart: SavedCartLine[] };
export type SavedGameSession = {
  id: string;
  createdAt: string;
  mode: 'normal' | 'with-goals';
  players: SavedPlayer[];
  notes?: string;
};

const store = new Map<string, SavedGameSession>();

export function saveGameSession(session: SavedGameSession) {
  store.set(session.id, session);
  return session;
}

export function getGameSession(id: string) {
  return store.get(id) ?? null;
}

export function listGameSessions() {
  return [...store.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

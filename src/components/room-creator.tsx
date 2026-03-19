'use client';

import { useState } from 'react';
import type { RoomSummaryDto } from '@/src/lib/contracts';
import { Button, Card, Select } from '@/src/components/ui';

export function RoomCreator() {
  const [language, setLanguage] = useState<'DE' | 'EN' | 'FR' | 'ES'>('DE');
  const [languageHelp, setLanguageHelp] = useState(true);
  const [room, setRoom] = useState<RoomSummaryDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setError(null);
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language, languageHelp }),
    });
    const body = await res.json();
    if (!res.ok) {
      setError(body.message ?? 'Raum konnte nicht erstellt werden.');
      return;
    }
    setRoom(body.room as RoomSummaryDto);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="space-y-4">
        <div>
          <p className="text-sm text-emerald-300">Thema</p>
          <h2 className="text-2xl font-bold">Supermarkt</h2>
        </div>
        <label className="block space-y-2 text-sm">
          <span>Zielsprache</span>
          <Select value={language} onChange={(event) => setLanguage(event.target.value as 'DE' | 'EN' | 'FR' | 'ES')}>
            <option value="DE">Deutsch</option>
            <option value="EN">Englisch</option>
            <option value="FR">Französisch</option>
            <option value="ES">Spanisch</option>
          </Select>
        </label>
        <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm">
          <span>Sprachhilfe aktiv</span>
          <input type="checkbox" checked={languageHelp} onChange={(event) => setLanguageHelp(event.target.checked)} />
        </label>
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        <Button onClick={handleCreate}>Raum erstellen</Button>
      </Card>
      <Card className="space-y-4">
        <h3 className="text-xl font-semibold">Live-Zugang</h3>
        {room ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-300">Join-ID: <span className="font-mono text-lg text-white">{room.joinId}</span></p>
            <img src={room.qrCodeDataUrl} alt="QR Code" className="mx-auto h-48 w-48 rounded-2xl bg-white p-3" />
            <a className="text-sm text-emerald-300 underline" href={`/room/${room.joinId}/teacher`}>
              Warteraum öffnen
            </a>
          </div>
        ) : (
          <p className="text-sm text-slate-400">Erstelle einen Raum, um Join-ID und QR-Code zu erhalten.</p>
        )}
      </Card>
    </div>
  );
}

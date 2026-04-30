'use client';

import { useState } from 'react';
import type { RoomSummaryDto } from '@/src/lib/contracts';
import { Button, Card, Input, Select } from '@/src/components/ui';
import { formatLanguage } from '@/src/lib/utils';

export function RoomCreator() {
  const [language, setLanguage] = useState<'DE' | 'EN' | 'FR' | 'ES'>('DE');
  const [languageHelp, setLanguageHelp] = useState(true);
  const [room, setRoom] = useState<RoomSummaryDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    setError(null);
    setCopied(false);
    setLoading(true);
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: 'SUPERMARKET', language, languageHelp }),
    });
    const body = await res.json();
    if (!res.ok) {
      setError(body.message ?? 'Spiel konnte nicht erstellt werden.');
      setLoading(false);
      return;
    }
    setRoom(body.room as RoomSummaryDto);
    setLoading(false);
  }

  async function copyJoinUrl() {
    if (!room?.joinUrl || typeof navigator === 'undefined' || !navigator.clipboard) return;
    await navigator.clipboard.writeText(room.joinUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="space-y-4">
        <div>
          <p className="text-sm text-emerald-300">Spielsetup</p>
          <h2 className="text-2xl font-bold">Neues Spiel</h2>
          <p className="mt-2 text-sm text-slate-300">Lege ein Spiel mit 8-stelliger Spiel-ID, QR-Code und optionalen Hilfsfunktionen an.</p>
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
        <Button onClick={handleCreate} disabled={loading}>{loading ? 'Erstelle Spiel…' : 'Spiel erstellen'}</Button>
      </Card>
      <Card className="space-y-4">
        <h3 className="text-xl font-semibold">Spielzugang</h3>
        {room ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-300">
              <p>Modus: <span className="font-semibold text-white">Punkte & Runden</span></p>
              <p>Zielsprache: <span className="font-semibold text-white">{formatLanguage(room.language)}</span></p>
              <p className="mt-2">Spiel-ID: <span className="font-mono text-lg text-white">{room.joinId}</span></p>
            </div>
            <img src={room.qrCodeDataUrl} alt="QR-Code zum Spielbeitritt" className="mx-auto h-48 w-48 rounded-2xl bg-white p-3" />
            <div className="space-y-2">
              <p className="text-sm text-slate-300">Spiel-URL</p>
              <Input value={room.joinUrl} readOnly aria-label="Spiel-URL" />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={copyJoinUrl} className="bg-white text-slate-950 hover:bg-slate-200">{copied ? 'Kopiert!' : 'Link kopieren'}</Button>
              <a className="rounded-2xl border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/5" href={`/room/${room.joinId}/teacher`}>
                Lobby öffnen
              </a>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400">Erstelle ein Spiel, um Spiel-ID, Spiel-URL und QR-Code zu erhalten.</p>
        )}
      </Card>
    </div>
  );
}

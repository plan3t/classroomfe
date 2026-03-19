'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Input } from '@/src/components/ui';

export function StudentJoin({ initialJoinId = '' }: { initialJoinId?: string }) {
  const router = useRouter();
  const [joinId, setJoinId] = useState(initialJoinId);
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const nfcSupported = useMemo(() => typeof window !== 'undefined' && 'NDEFReader' in window, []);

  async function submit() {
    const res = await fetch('/api/rooms/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ joinId, displayName }),
    });
    const body = await res.json();
    if (!res.ok) {
      setError(body.message ?? 'Beitritt fehlgeschlagen');
      return;
    }
    sessionStorage.setItem('participantId', body.participant.id);
    sessionStorage.setItem('displayName', body.participant.displayName);
    router.push(`/join/${body.room.joinId}?participantId=${body.participant.id}`);
  }

  return (
    <Card className="mx-auto max-w-lg space-y-4">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Schüler-Zugang</p>
        <h1 className="mt-2 text-3xl font-bold">Raum beitreten</h1>
      </div>
      <Input value={joinId} onChange={(event) => setJoinId(event.target.value)} placeholder="8-stellige Join-ID" maxLength={8} />
      <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Anzeigename" />
      {nfcSupported ? (
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-100">
          NFC ist experimentell verfügbar. Der Capability-Check ist aktiv, aber die Funktion bleibt hinter dem Feature-Flag verborgen.
        </div>
      ) : null}
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <Button onClick={submit}>Jetzt beitreten</Button>
    </Card>
  );
}

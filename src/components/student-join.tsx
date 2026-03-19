'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { featureFlags } from '@/src/lib/env';
import { Button, Card, Input } from '@/src/components/ui';

export function StudentJoin({ initialJoinId = '' }: { initialJoinId?: string }) {
  const router = useRouter();
  const [joinId, setJoinId] = useState(initialJoinId.replace(/\D/g, '').slice(0, 8));
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [nfcMessage, setNfcMessage] = useState<string | null>(null);
  const nfcSupported = useMemo(() => typeof window !== 'undefined' && 'NDEFReader' in window, []);
  const showNfcActions = featureFlags.nfcJoin && nfcSupported;
  const showNfcHint = featureFlags.nfcJoin;

  async function submit() {
    setError(null);
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
    router.push(`/join/${body.room.joinId}?participantId=${body.participant.id}`);
  }

  async function startNfcScan() {
    if (!showNfcActions || typeof window === 'undefined') return;
    try {
      setScanning(true);
      setNfcMessage('NFC-Tag jetzt an das Gerät halten…');
      const ReaderCtor = (window as unknown as Window & { NDEFReader: new () => { scan: () => Promise<void>; onreading: ((event: { message: { records: Array<{ recordType: string; data?: DataView }> } }) => void) | null } }).NDEFReader;
      const reader = new ReaderCtor();
      await reader.scan();
      reader.onreading = (event) => {
        const record = event.message.records.find((entry) => entry.recordType === 'text');
        if (!record?.data) {
          setNfcMessage('Kein lesbarer Join-Code auf dem NFC-Tag gefunden.');
          setScanning(false);
          return;
        }
        const text = new TextDecoder().decode(record.data).trim();
        const parsedJoinId = text.replace(/\D/g, '').slice(0, 8);
        if (!parsedJoinId) {
          setNfcMessage('Der NFC-Tag enthält keine gültige Join-ID.');
          setScanning(false);
          return;
        }
        setJoinId(parsedJoinId);
        setNfcMessage(`Join-ID ${parsedJoinId} übernommen.`);
        setScanning(false);
      };
    } catch {
      setNfcMessage('NFC-Scan konnte nicht gestartet werden. Bitte Browserberechtigung prüfen.');
      setScanning(false);
    }
  }

  return (
    <Card className="mx-auto max-w-lg space-y-4">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Schüler-Zugang</p>
        <h1 className="mt-2 text-3xl font-bold">Raum beitreten</h1>
      </div>
      <Input value={joinId} onChange={(event) => setJoinId(event.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="8-stellige Join-ID" maxLength={8} inputMode="numeric" />
      <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Anzeigename" maxLength={24} />
      {showNfcHint ? (
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-100">
          {nfcSupported
            ? 'NFC ist in diesem Browser verfügbar. Der Scan bleibt per Feature-Flag optional.'
            : 'NFC ist per Feature-Flag aktiviert, wird von diesem Browser aber nicht unterstützt.'}
        </div>
      ) : null}
      {showNfcActions ? <Button onClick={startNfcScan} disabled={scanning} className="w-full bg-white text-slate-950 hover:bg-slate-200">{scanning ? 'Suche NFC-Tag…' : 'Join-ID per NFC scannen'}</Button> : null}
      {nfcMessage ? <p className="text-sm text-emerald-200">{nfcMessage}</p> : null}
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <Button onClick={submit}>Jetzt beitreten</Button>
    </Card>
  );
}

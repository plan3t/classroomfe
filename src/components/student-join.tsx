'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { featureFlags } from '@/src/lib/env';
import { Button, Card, Input } from '@/src/components/ui';

type JoinErrors = {
  joinId?: string;
  displayName?: string;
};

function validateJoin(joinId: string, displayName: string): JoinErrors {
  const trimmedName = displayName.trim();
  return {
    joinId: joinId.length === 8 ? undefined : 'Bitte gib eine 8-stellige Spiel-ID ein.',
    displayName: trimmedName.length >= 2 ? undefined : 'Bitte gib einen Anzeigenamen mit mindestens 2 Zeichen ein.',
  };
}

export function StudentJoin({ initialJoinId = '' }: { initialJoinId?: string }) {
  const router = useRouter();
  const [joinId, setJoinId] = useState(initialJoinId.replace(/\D/g, '').slice(0, 8));
  const [displayName, setDisplayName] = useState('');
  const [fieldErrors, setFieldErrors] = useState<JoinErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [nfcMessage, setNfcMessage] = useState<string | null>(null);
  const nfcSupported = useMemo(() => typeof window !== 'undefined' && 'NDEFReader' in window, []);
  const showNfcActions = featureFlags.nfcJoin && nfcSupported;
  const showNfcHint = featureFlags.nfcJoin;
  const currentErrors = validateJoin(joinId, displayName);
  const isFormValid = !currentErrors.joinId && !currentErrors.displayName;

  async function submit() {
    const nextErrors = validateJoin(joinId, displayName);
    setFieldErrors(nextErrors);
    setError(null);
    if (nextErrors.joinId || nextErrors.displayName) {
      return;
    }

    setSubmitting(true);
    const res = await fetch('/api/rooms/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ joinId, displayName: displayName.trim() }),
    });
    const body = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(body.message ?? 'Spielbeitritt fehlgeschlagen');
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
          setNfcMessage('Keine lesbare Spiel-ID auf dem NFC-Tag gefunden.');
          setScanning(false);
          return;
        }
        const text = new TextDecoder().decode(record.data).trim();
        const parsedJoinId = text.replace(/\D/g, '').slice(0, 8);
        if (!parsedJoinId) {
          setNfcMessage('Der NFC-Tag enthält keine gültige Spiel-ID.');
          setScanning(false);
          return;
        }
        setJoinId(parsedJoinId);
        setFieldErrors((current) => ({ ...current, joinId: undefined }));
        setNfcMessage(`Spiel-ID ${parsedJoinId} übernommen.`);
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
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Spieler-Zugang</p>
        <h1 className="mt-2 text-3xl font-bold">Spiel beitreten</h1>
      </div>
      <div className="space-y-2">
        <Input
          value={joinId}
          onChange={(event) => {
            const nextValue = event.target.value.replace(/\D/g, '').slice(0, 8);
            setJoinId(nextValue);
            setFieldErrors((current) => ({ ...current, joinId: validateJoin(nextValue, displayName).joinId }));
          }}
          placeholder="8-stellige Spiel-ID"
          maxLength={8}
          inputMode="numeric"
          aria-invalid={Boolean(fieldErrors.joinId)}
          aria-describedby={fieldErrors.joinId ? 'joinId-error' : undefined}
        />
        {fieldErrors.joinId ? <p id="joinId-error" className="text-sm text-rose-300">{fieldErrors.joinId}</p> : null}
      </div>
      <div className="space-y-2">
        <Input
          value={displayName}
          onChange={(event) => {
            setDisplayName(event.target.value);
            setFieldErrors((current) => ({ ...current, displayName: validateJoin(joinId, event.target.value).displayName }));
          }}
          placeholder="Anzeigename"
          maxLength={24}
          aria-invalid={Boolean(fieldErrors.displayName)}
          aria-describedby={fieldErrors.displayName ? 'displayName-error' : undefined}
        />
        {fieldErrors.displayName ? <p id="displayName-error" className="text-sm text-rose-300">{fieldErrors.displayName}</p> : null}
      </div>
      {showNfcHint ? (
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-100">
          {nfcSupported
            ? 'NFC ist in diesem Browser verfügbar. Der Scan bleibt per Feature-Flag optional.'
            : 'NFC ist per Feature-Flag aktiviert, wird von diesem Browser aber nicht unterstützt.'}
        </div>
      ) : null}
      {showNfcActions ? <Button onClick={startNfcScan} disabled={scanning} className="w-full bg-white text-slate-950 hover:bg-slate-200">{scanning ? 'Suche NFC-Tag…' : 'Spiel-ID per NFC scannen'}</Button> : null}
      {nfcMessage ? <p className="text-sm text-emerald-200">{nfcMessage}</p> : null}
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <Button onClick={submit} disabled={!isFormValid || submitting}>{submitting ? 'Beitritt läuft…' : 'Jetzt beitreten'}</Button>
    </Card>
  );
}

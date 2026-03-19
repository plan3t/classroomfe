'use client';

import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { Button, Card, Select } from '@/src/components/ui';
import type { RoomSummaryDto, StudentAnswerDto } from '@/src/lib/contracts';
import { summarizeRoomProgress } from '@/src/lib/progress';
import { socketEvents } from '@/src/lib/socket-events';
import { formatLanguage } from '@/src/lib/utils';

type WaitingRoomPayload = { participants: RoomSummaryDto['participants'] };
type AnswerPayload = { answers: StudentAnswerDto[] };
type RoomStatusPayload = { status: RoomSummaryDto['status']; startedAt?: string | null };
type ConnectionState = 'verbunden' | 'verbinde…' | 'getrennt';
type ActionState = 'idle' | 'starting' | 'finishing';
type FeedbackState = { tone: 'success' | 'error' | 'info'; message: string } | null;
type ResultSort = 'accuracy-desc' | 'progress-desc' | 'correct-desc' | 'name-asc';

function formatTimeRemaining(expiresAt?: string) {
  if (!expiresAt) return 'Keine Ablaufzeit verfügbar';
  const remainingMs = new Date(expiresAt).getTime() - Date.now();
  if (remainingMs <= 0) return 'Raum läuft gerade ab';

  const totalMinutes = Math.floor(remainingMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, '0')}m verbleibend`;
  }

  return `${minutes} Min verbleibend`;
}

function getCountdownTone(expiresAt?: string) {
  if (!expiresAt) return 'text-slate-300';
  const remainingMs = new Date(expiresAt).getTime() - Date.now();
  if (remainingMs <= 60_000) return 'text-rose-300';
  if (remainingMs <= 5 * 60_000) return 'text-orange-300';
  if (remainingMs <= 10 * 60_000) return 'text-amber-300';
  return 'text-emerald-300';
}

export function TeacherRoom({ room, itemCount }: { room: RoomSummaryDto; itemCount: number }) {
  const [state, setState] = useState(room);
  const [connectionState, setConnectionState] = useState<ConnectionState>('verbinde…');
  const [actionState, setActionState] = useState<ActionState>('idle');
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [timeRemaining, setTimeRemaining] = useState(() => formatTimeRemaining(room.expiresAt));
  const [resultSort, setResultSort] = useState<ResultSort>('accuracy-desc');
  const socket = useMemo(() => io({ path: '/api/socket/io', autoConnect: false, reconnection: true }), []);

  useEffect(() => {
    if (!state.expiresAt) return;
    setTimeRemaining(formatTimeRemaining(state.expiresAt));
    const timer = window.setInterval(() => {
      setTimeRemaining(formatTimeRemaining(state.expiresAt));
    }, 1000 * 30);

    return () => window.clearInterval(timer);
  }, [state.expiresAt]);

  useEffect(() => {
    let active = true;

    async function ensureSocket() {
      try {
        await fetch('/api/socket');
        if (!active) return;
        setConnectionState('verbinde…');
        socket.connect();
      } catch {
        if (!active) return;
        setConnectionState('getrennt');
        setFeedback({
          tone: 'error',
          message: 'Live-Verbindung konnte nicht initialisiert werden. Bitte Seite neu laden oder erneut versuchen.',
        });
      }
    }

    function handleConnect() {
      setConnectionState('verbunden');
      socket.emit(socketEvents.teacherJoin, { joinId: room.joinId });
    }

    function handleDisconnect() {
      setConnectionState('getrennt');
      setFeedback({
        tone: 'info',
        message: 'Die Live-Verbindung wurde unterbrochen. Es wird automatisch erneut verbunden.',
      });
    }

    function handleReconnect() {
      setConnectionState('verbunden');
      setFeedback({ tone: 'success', message: 'Die Live-Verbindung wurde erfolgreich wiederhergestellt.' });
      socket.emit(socketEvents.teacherJoin, { joinId: room.joinId });
    }

    ensureSocket();
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.io.on('reconnect', handleReconnect);
    socket.on(socketEvents.waitingRoomUpdate, (payload: WaitingRoomPayload) => {
      setState((current) => ({ ...current, participants: payload.participants }));
    });
    socket.on(socketEvents.answerSubmitted, (payload: AnswerPayload) => {
      setState((current) => ({ ...current, answers: payload.answers }));
    });
    socket.on(socketEvents.roomStarted, (payload: RoomStatusPayload) => {
      setState((current) => ({ ...current, status: payload.status, startedAt: payload.startedAt ?? current.startedAt }));
      setActionState('idle');
      setFeedback({ tone: 'success', message: 'Die Session wurde gestartet.' });
    });
    socket.on(socketEvents.roomFinished, (payload: RoomStatusPayload) => {
      setState((current) => ({ ...current, status: payload.status }));
      setActionState('idle');
      setFeedback({ tone: 'success', message: 'Die Session wurde beendet.' });
    });

    return () => {
      active = false;
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.io.off('reconnect', handleReconnect);
      socket.off(socketEvents.waitingRoomUpdate);
      socket.off(socketEvents.answerSubmitted);
      socket.off(socketEvents.roomStarted);
      socket.off(socketEvents.roomFinished);
      socket.disconnect();
    };
  }, [room.joinId, socket]);

  async function performRoomAction(action: 'start' | 'finish') {
    const nextActionState = action === 'start' ? 'starting' : 'finishing';
    setActionState(nextActionState);
    setFeedback({ tone: 'info', message: action === 'start' ? 'Session wird gestartet…' : 'Session wird beendet…' });

    try {
      const res = await fetch(`/api/rooms/${room.id}/${action}`, { method: 'POST' });
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        throw new Error(body.message ?? (action === 'start' ? 'Session konnte nicht gestartet werden.' : 'Session konnte nicht beendet werden.'));
      }
      setFeedback({
        tone: 'success',
        message: action === 'start'
          ? 'Startsignal gesendet. Die Live-Ansicht aktualisiert sich gleich.'
          : 'Beenden-Signal gesendet. Die Live-Ansicht aktualisiert sich gleich.',
      });
    } catch (error) {
      setActionState('idle');
      setFeedback({
        tone: 'error',
        message: `${error instanceof Error ? error.message : 'Aktion fehlgeschlagen.'} Bitte erneut versuchen.`,
      });
    }
  }

  const { participantProgress, completedCount, totalCorrect, averageAccuracy, averageProgress, totalAttempted } = summarizeRoomProgress(
    state.participants,
    state.answers ?? [],
    itemCount,
  );

  const sortedParticipantProgress = [...participantProgress].sort((left, right) => {
    switch (resultSort) {
      case 'progress-desc':
        return right.progressPercent - left.progressPercent || right.accuracy - left.accuracy;
      case 'correct-desc':
        return right.correctAnswers - left.correctAnswers || right.accuracy - left.accuracy;
      case 'name-asc':
        return left.displayName.localeCompare(right.displayName);
      case 'accuracy-desc':
      default:
        return right.accuracy - left.accuracy || right.progressPercent - left.progressPercent;
    }
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-emerald-300">Raum {state.joinId}</p>
            <h1 className="text-3xl font-bold">Warteraum</h1>
            <p className="mt-2 text-sm text-slate-300">Thema: Supermarkt</p>
          </div>
          <div className="space-y-2 text-right">
            <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-sm">{formatLanguage(state.language)}</span>
            <p className={`text-xs ${connectionState === 'verbunden' ? 'text-emerald-300' : connectionState === 'verbinde…' ? 'text-amber-300' : 'text-rose-300'}`}>
              Live-Status: {connectionState}
            </p>
          </div>
        </div>
        {feedback ? (
          <div
            aria-live="polite"
            className={`rounded-2xl border px-4 py-3 text-sm ${feedback.tone === 'success' ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100' : feedback.tone === 'error' ? 'border-rose-400/30 bg-rose-400/10 text-rose-100' : 'border-amber-400/30 bg-amber-400/10 text-amber-100'}`}
          >
            {feedback.message}
          </div>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-300">
            <p className="text-slate-400">Status</p>
            <p className="mt-1 font-semibold text-white">{state.status}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-300">
            <p className="text-slate-400">Sprachhilfe</p>
            <p className="mt-1 font-semibold text-white">{state.languageHelp ? 'Aktiv' : 'Inaktiv'}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-300">
            <p className="text-slate-400">Bearbeitet gesamt</p>
            <p className="mt-1 font-semibold text-white">{totalAttempted}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-300">
            <p className="text-slate-400">Richtige Antworten gesamt</p>
            <p className="mt-1 font-semibold text-white">{totalCorrect}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-300">
            <p className="text-slate-400">Abgeschlossen</p>
            <p className="mt-1 font-semibold text-white">{completedCount}/{state.participants.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-300">
            <p className="text-slate-400">Ø Trefferquote / Fortschritt</p>
            <p className="mt-1 font-semibold text-white">{averageAccuracy}% / {averageProgress}%</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-300 sm:col-span-2">
            <p className="text-slate-400">Countdown bis Ablauf</p>
            <p className={`mt-1 font-semibold ${getCountdownTone(state.expiresAt)}`}>{timeRemaining}</p>
            <p className="mt-1 text-xs text-slate-500">Warnstufen wechseln automatisch bei 10, 5 und 1 Minute Restzeit.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-300">
            <p className="text-slate-400">Abgeschlossen</p>
            <p className="mt-1 font-semibold text-white">{completedCount}/{state.participants.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-300">
            <p className="text-slate-400">Ø Trefferquote / Fortschritt</p>
            <p className="mt-1 font-semibold text-white">{averageAccuracy}% / {averageProgress}%</p>
          </div>
        </div>
        <div className="space-y-3">
          <img src={state.qrCodeDataUrl} alt="QR Code zum Raumbeitritt" className="h-48 w-48 rounded-2xl bg-white p-3" />
          <p className="break-all text-sm text-slate-300">Join-URL: <span className="text-white">{state.joinUrl}</span></p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => performRoomAction('start')} disabled={state.status !== 'WAITING' || actionState !== 'idle'}>
            {actionState === 'starting' ? 'Session startet…' : 'Session starten'}
          </Button>
          <Button onClick={() => performRoomAction('finish')} disabled={state.status !== 'ACTIVE' || actionState !== 'idle'} className="bg-rose-300 text-slate-950 hover:bg-rose-200">
            {actionState === 'finishing' ? 'Session beendet…' : 'Session beenden'}
          </Button>
          <a href={`/api/rooms/${room.id}/results`} className="rounded-2xl border border-white/15 px-4 py-3 font-semibold text-white transition hover:bg-white/5">
            CSV exportieren
          </a>
        </div>
      </Card>
      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Ergebnisse im Browser</h2>
            <p className="text-sm text-slate-400">Sortierbare Live-Auswertung zusätzlich zum CSV-Export.</p>
          </div>
          <div className="w-48">
            <Select value={resultSort} onChange={(event) => setResultSort(event.target.value as ResultSort)} aria-label="Ergebnisse sortieren">
              <option value="accuracy-desc">Trefferquote</option>
              <option value="progress-desc">Fortschritt</option>
              <option value="correct-desc">Richtige Antworten</option>
              <option value="name-asc">Name A–Z</option>
            </Select>
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead className="bg-white/5 text-left text-slate-300">
              <tr>
                <th className="px-4 py-3 font-medium">Schüler</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Bearbeitet</th>
                <th className="px-4 py-3 font-medium">Richtig</th>
                <th className="px-4 py-3 font-medium">Trefferquote</th>
                <th className="px-4 py-3 font-medium">Fortschritt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 bg-slate-950/40">
              {sortedParticipantProgress.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-400">Noch keine Teilnehmer im Raum.</td>
                </tr>
              ) : sortedParticipantProgress.map((participant) => (
                <tr key={participant.id}>
                  <td className="px-4 py-3 font-medium text-white">{participant.displayName}</td>
                  <td className="px-4 py-3 text-slate-300">{participant.status}</td>
                  <td className="px-4 py-3 text-slate-300">{participant.attemptedAnswers}/{itemCount}</td>
                  <td className="px-4 py-3 text-slate-300">{participant.correctAnswers}/{itemCount}</td>
                  <td className="px-4 py-3 text-slate-300">{participant.accuracy}%</td>
                  <td className="px-4 py-3 text-slate-300">{participant.progressPercent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

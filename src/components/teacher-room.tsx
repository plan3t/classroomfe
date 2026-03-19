'use client';

import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { Button, Card } from '@/src/components/ui';
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

export function TeacherRoom({ room, itemCount }: { room: RoomSummaryDto; itemCount: number }) {
  const [state, setState] = useState(room);
  const [connectionState, setConnectionState] = useState<ConnectionState>('verbinde…');
  const [actionState, setActionState] = useState<ActionState>('idle');
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const socket = useMemo(() => io({ path: '/api/socket/io', autoConnect: false, reconnection: true }), []);

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
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Schüler live</h2>
          <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-sm text-emerald-300">{state.participants.length} beigetreten</span>
        </div>
        <div className="space-y-3">
          {participantProgress.map((participant) => (
            <div key={participant.id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{participant.displayName}</p>
                  <p className="text-sm text-slate-400">{participant.status}</p>
                </div>
                <div className="text-right text-sm text-slate-300">
                  <p>{participant.attemptedAnswers} bearbeitet · {participant.correctAnswers} richtig</p>
                  <p className="font-semibold text-white">{participant.accuracy}% Trefferquote · {participant.progressPercent}% Fortschritt</p>
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
                <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${participant.progressPercent}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

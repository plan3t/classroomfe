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

export function TeacherRoom({ room, itemCount }: { room: RoomSummaryDto; itemCount: number }) {
  const [state, setState] = useState(room);
  const socket = useMemo(() => io({ path: '/api/socket/io', autoConnect: false }), []);

  useEffect(() => {
    fetch('/api/socket');
    socket.connect();
    socket.emit(socketEvents.teacherJoin, { joinId: room.joinId });
    socket.on(socketEvents.waitingRoomUpdate, (payload: WaitingRoomPayload) => {
      setState((current) => ({ ...current, participants: payload.participants }));
    });
    socket.on(socketEvents.answerSubmitted, (payload: AnswerPayload) => {
      setState((current) => ({ ...current, answers: payload.answers }));
    });
    socket.on(socketEvents.roomStarted, (payload: RoomStatusPayload) => {
      setState((current) => ({ ...current, status: payload.status, startedAt: payload.startedAt ?? current.startedAt }));
    });
    socket.on(socketEvents.roomFinished, (payload: RoomStatusPayload) => {
      setState((current) => ({ ...current, status: payload.status }));
    });
    return () => {
      socket.disconnect();
    };
  }, [room.joinId, socket]);

  async function startSession() {
    await fetch(`/api/rooms/${room.id}/start`, { method: 'POST' });
  }

  async function finishSession() {
    await fetch(`/api/rooms/${room.id}/finish`, { method: 'POST' });
  }

  const { participantProgress, completedCount, totalCorrect, averageAccuracy } = summarizeRoomProgress(
    state.participants,
    state.answers ?? [],
    itemCount,
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-emerald-300">Raum {state.joinId}</p>
            <h1 className="text-3xl font-bold">Warteraum</h1>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-sm">{formatLanguage(state.language)}</span>
        </div>
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
            <p className="text-slate-400">Abgeschlossen</p>
            <p className="mt-1 font-semibold text-white">{completedCount}/{state.participants.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-300">
            <p className="text-slate-400">Ø Genauigkeit</p>
            <p className="mt-1 font-semibold text-white">{averageAccuracy}%</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-300 sm:col-span-2">
            <p className="text-slate-400">Richtige Antworten gesamt</p>
            <p className="mt-1 font-semibold text-white">{totalCorrect}</p>
          </div>
        </div>
        <img src={state.qrCodeDataUrl} alt="QR Code" className="h-48 w-48 rounded-2xl bg-white p-3" />
        <div className="flex flex-wrap gap-3">
          <Button onClick={startSession} disabled={state.status !== 'WAITING'}>
            Session starten
          </Button>
          <Button onClick={finishSession} disabled={state.status !== 'ACTIVE'} className="bg-rose-300 text-slate-950 hover:bg-rose-200">
            Session beenden
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
                  <p>{participant.correctAnswers} / {itemCount} richtig</p>
                  <p className="font-semibold text-white">{participant.accuracy}% Genauigkeit</p>
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${participant.completionPercent}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { Button, Card } from '@/src/components/ui';
import type { RoomSummaryDto, StudentAnswerDto } from '@/src/lib/contracts';
import { socketEvents } from '@/src/lib/socket-events';
import { formatLanguage } from '@/src/lib/utils';

type WaitingRoomPayload = { participants: RoomSummaryDto['participants'] };
type AnswerPayload = { answers: StudentAnswerDto[] };
type RoomStartedPayload = { status: RoomSummaryDto['status']; startedAt: string | null };

export function TeacherRoom({ room }: { room: RoomSummaryDto }) {
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
    socket.on(socketEvents.roomStarted, (payload: RoomStartedPayload) => {
      setState((current) => ({ ...current, status: payload.status, startedAt: payload.startedAt }));
    });
    return () => {
      socket.disconnect();
    };
  }, [room.joinId, socket]);

  async function startSession() {
    await fetch(`/api/rooms/${room.id}/start`, { method: 'POST' });
  }

  const correctByParticipant = (state.answers ?? []).reduce<Record<string, number>>((acc, answer) => {
    if (answer.isCorrect) acc[answer.participantId] = (acc[answer.participantId] ?? 0) + 1;
    return acc;
  }, {});

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
        <div className="space-y-2 text-sm text-slate-300">
          <p>Thema: Supermarkt</p>
          <p>Sprachhilfe: {state.languageHelp ? 'Aktiv' : 'Inaktiv'}</p>
          <p>Status: {state.status}</p>
        </div>
        <img src={state.qrCodeDataUrl} alt="QR Code" className="h-48 w-48 rounded-2xl bg-white p-3" />
        <Button onClick={startSession} disabled={state.status !== 'WAITING'}>
          Session starten
        </Button>
      </Card>
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Schüler live</h2>
          <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-sm text-emerald-300">{state.participants.length} beigetreten</span>
        </div>
        <div className="space-y-3">
          {state.participants.map((participant) => (
            <div key={participant.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <div>
                <p className="font-medium">{participant.displayName}</p>
                <p className="text-sm text-slate-400">{participant.status}</p>
              </div>
              <div className="text-right text-sm text-slate-300">
                <p>Fortschritt</p>
                <p className="text-lg font-semibold text-white">{correctByParticipant[participant.id] ?? 0}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { Button, Card, Input } from '@/src/components/ui';
import type { LearningItemDto, RoomSummaryDto } from '@/src/lib/contracts';
import { formatLanguage } from '@/src/lib/utils';
import { socketEvents } from '@/src/lib/socket-events';

type RoomStatusPayload = { status: RoomSummaryDto['status'] };

type AnswerResponse = {
  verdict: { isCorrect: boolean };
  expected: string;
  participantStatus: 'WAITING' | 'ACTIVE' | 'COMPLETED';
};

export function StudentRoom({ room, items, participantId }: { room: RoomSummaryDto; items: LearningItemDto[]; participantId: string }) {
  const [activeRoom, setActiveRoom] = useState(room);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [completed, setCompleted] = useState(room.status === 'COMPLETED');
  const socket = useMemo(() => io({ path: '/api/socket/io', autoConnect: false }), []);

  useEffect(() => {
    fetch('/api/socket');
    socket.connect();
    socket.emit(socketEvents.studentJoin, { joinId: room.joinId, participantId });
    socket.on(socketEvents.roomStarted, (payload: RoomStatusPayload) => {
      setActiveRoom((current) => ({ ...current, status: payload.status }));
    });
    socket.on(socketEvents.roomFinished, (payload: RoomStatusPayload) => {
      setActiveRoom((current) => ({ ...current, status: payload.status }));
      setCompleted(true);
      setFeedback('Die Session wurde vom Lehrer beendet.');
    });
    return () => {
      socket.disconnect();
    };
  }, [participantId, room.joinId, socket]);

  const item = items[currentIndex];

  async function submit() {
    if (!item) return;
    const res = await fetch('/api/rooms/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId, itemId: item.id, answer }),
    });
    const body = (await res.json()) as Partial<AnswerResponse> & { message?: string };
    if (!res.ok) {
      setFeedback(body.message ?? 'Fehler beim Senden');
      return;
    }

    const isCorrect = Boolean(body.verdict?.isCorrect);
    setFeedback(isCorrect ? 'Richtig!' : `Noch nicht. Lösung: ${body.expected}`);
    setAnswer('');

    if (isCorrect) {
      setCorrectCount((value) => value + 1);
      if (body.participantStatus === 'COMPLETED') {
        setCompleted(true);
        return;
      }
      if (currentIndex < items.length - 1) {
        setCurrentIndex((value) => value + 1);
      }
    }
  }

  function speak() {
    if (!item?.speechText || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(item.speechText));
  }

  if (activeRoom.status === 'WAITING') {
    return <Card className="mx-auto max-w-lg text-center text-lg">Bitte warten, bis der Lehrer die Session startet.</Card>;
  }

  if (completed || activeRoom.status === 'COMPLETED' || !item) {
    return (
      <Card className="mx-auto max-w-xl space-y-4 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Fertig</p>
        <h2 className="text-3xl font-bold">Session abgeschlossen</h2>
        <p className="text-slate-300">{feedback ?? 'Die Supermarkt-Session ist beendet.'}</p>
        <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-6">
          <p className="text-sm text-slate-300">Dein Ergebnis</p>
          <p className="mt-2 text-4xl font-black text-white">{correctCount} / {items.length}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-xl space-y-5">
      <div className="flex items-center justify-between text-sm text-slate-300">
        <span>Artikel {currentIndex + 1} / {items.length}</span>
        <span>{formatLanguage(activeRoom.language)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${Math.round((correctCount / items.length) * 100)}%` }} />
      </div>
      <img src={item.imageUrl} alt="Supermarkt-Artikel" className="h-72 w-full rounded-3xl object-cover" />
      <Input value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Wie heißt der Artikel?" />
      <div className="flex gap-3">
        <Button onClick={submit} className="flex-1">Antwort prüfen</Button>
        {activeRoom.languageHelp && item.speechText ? <Button onClick={speak} className="bg-slate-100 text-slate-950">Vorlesen</Button> : null}
      </div>
      {feedback ? <p className="text-sm text-emerald-200">{feedback}</p> : null}
    </Card>
  );
}

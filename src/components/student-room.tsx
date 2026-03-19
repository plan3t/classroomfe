'use client';

import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { Button, Card, Input } from '@/src/components/ui';
import type { LearningItemDto, RoomSummaryDto } from '@/src/lib/contracts';
import { socketEvents } from '@/src/lib/socket-events';

type RoomStartedPayload = { status: RoomSummaryDto['status'] };

export function StudentRoom({ room, items, participantId }: { room: RoomSummaryDto; items: LearningItemDto[]; participantId: string }) {
  const [activeRoom, setActiveRoom] = useState(room);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const socket = useMemo(() => io({ path: '/api/socket/io', autoConnect: false }), []);

  useEffect(() => {
    fetch('/api/socket');
    socket.connect();
    socket.emit(socketEvents.studentJoin, { joinId: room.joinId, participantId });
    socket.on(socketEvents.roomStarted, (payload: RoomStartedPayload) => {
      setActiveRoom((current) => ({ ...current, status: payload.status }));
    });
    return () => {
      socket.disconnect();
    };
  }, [participantId, room.joinId, socket]);

  const item = items[currentIndex];

  async function submit() {
    const res = await fetch('/api/rooms/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId, itemId: item.id, answer }),
    });
    const body = await res.json();
    if (!res.ok) {
      setFeedback(body.message ?? 'Fehler beim Senden');
      return;
    }
    setFeedback(body.verdict.isCorrect ? 'Richtig!' : `Noch nicht. Lösung: ${body.expected}`);
    setAnswer('');
    if (body.verdict.isCorrect && currentIndex < items.length - 1) {
      setCurrentIndex((value) => value + 1);
    }
  }

  function speak() {
    const translation = item.translations.find((entry) => entry.language === activeRoom.language);
    if (!translation || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(translation.label));
  }

  if (activeRoom.status === 'WAITING') {
    return <Card className="mx-auto max-w-lg text-center text-lg">Bitte warten, bis der Lehrer die Session startet.</Card>;
  }

  if (!item) {
    return <Card className="mx-auto max-w-lg text-center text-lg">Super! Du hast alle Artikel bearbeitet.</Card>;
  }

  return (
    <Card className="mx-auto max-w-xl space-y-5">
      <div className="flex items-center justify-between text-sm text-slate-300">
        <span>Artikel {currentIndex + 1} / {items.length}</span>
        <span>{activeRoom.language}</span>
      </div>
      <img src={item.imageUrl} alt="Supermarkt-Artikel" className="h-72 w-full rounded-3xl object-cover" />
      <Input value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Wie heißt der Artikel?" />
      <div className="flex gap-3">
        <Button onClick={submit} className="flex-1">Antwort prüfen</Button>
        {activeRoom.languageHelp ? <Button onClick={speak} className="bg-slate-100 text-slate-950">Vorlesen</Button> : null}
      </div>
      {feedback ? <p className="text-sm text-emerald-200">{feedback}</p> : null}
    </Card>
  );
}

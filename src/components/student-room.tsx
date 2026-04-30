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

function buildHint(expected: string) {
  return `Tipp: Das Wort beginnt mit „${expected.slice(0, 1)}“ und hat ${expected.length} Zeichen.`;
}

function buildChoices(items: LearningItemDto[], expected: string, currentItemId: string) {
  const distractors = items
    .filter((item) => item.id !== currentItemId && item.speechText && item.speechText !== expected)
    .map((item) => item.speechText as string)
    .slice(0, 2);

  return [expected, ...distractors].sort((a, b) => a.localeCompare(b));
}

function getSpeechLanguage(language: RoomSummaryDto['language']) {
  return {
    DE: 'de-DE',
    EN: 'en-US',
    FR: 'fr-FR',
    ES: 'es-ES',
  }[language];
}

export function StudentRoom({ room, items, participantId }: { room: RoomSummaryDto; items: LearningItemDto[]; participantId: string }) {
  const [activeRoom, setActiveRoom] = useState(room);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [completed, setCompleted] = useState(room.status === 'COMPLETED');
  const [attemptsByItem, setAttemptsByItem] = useState<Record<string, number>>({});
  const [choices, setChoices] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const socket = useMemo(() => io({ path: '/api/socket/io', autoConnect: false, reconnection: true }), []);

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
      setFeedback('Das Spiel wurde vom Spielleiter beendet.');
    });
    return () => {
      socket.off(socketEvents.roomStarted);
      socket.off(socketEvents.roomFinished);
      socket.disconnect();
    };
  }, [participantId, room.joinId, socket]);

  const item = items[currentIndex];
  const currentAttempts = item ? attemptsByItem[item.id] ?? 0 : 0;

  async function advanceToNextItem() {
    setChoices([]);
    setAnswer('');
    if (currentIndex < items.length - 1) {
      setCurrentIndex((value) => value + 1);
      return;
    }
    setCompleted(true);
  }

  async function submit() {
    if (!item || !answer.trim()) return;
    setSubmitting(true);
    const res = await fetch('/api/rooms/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId, itemId: item.id, answer: answer.trim() }),
    });
    const body = (await res.json()) as Partial<AnswerResponse> & { message?: string };
    setSubmitting(false);
    if (!res.ok) {
      setFeedback(body.message ?? 'Fehler beim Senden');
      return;
    }

    const isCorrect = Boolean(body.verdict?.isCorrect);
    setAnswer('');

    if (isCorrect) {
      setFeedback('Richtig!');
      setChoices([]);
      setCorrectCount((value) => value + 1);
      setAttemptsByItem((current) => ({ ...current, [item.id]: 0 }));
      if (body.participantStatus === 'COMPLETED') {
        setCompleted(true);
        return;
      }
      await advanceToNextItem();
      return;
    }

    const nextAttempts = currentAttempts + 1;
    setAttemptsByItem((current) => ({ ...current, [item.id]: nextAttempts }));

    if (nextAttempts === 1) {
      setFeedback(buildHint(body.expected ?? ''));
      return;
    }

    if (nextAttempts === 2) {
      setChoices(buildChoices(items, body.expected ?? '', item.id));
      setFeedback('Noch nicht richtig. Wähle aus den Vorschlägen oder gib das Wort erneut ein.');
      return;
    }

    setFeedback(`Lösung: ${body.expected}. Wir gehen jetzt weiter zum nächsten Begriff.`);
    await advanceToNextItem();
  }

  function speak() {
    if (!item?.speechText || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(item.speechText);
    utterance.lang = getSpeechLanguage(activeRoom.language);
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith(utterance.lang.toLowerCase().slice(0, 2)));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }

  if (activeRoom.status === 'WAITING') {
    return <Card className="mx-auto max-w-lg text-center text-lg">Bitte warten, bis der Spielleiter das Spiel startet.</Card>;
  }

  if (completed || activeRoom.status === 'COMPLETED' || !item) {
    return (
      <Card className="mx-auto max-w-xl space-y-4 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Fertig</p>
        <h2 className="text-3xl font-bold">Spiel abgeschlossen</h2>
        <p className="text-slate-300" aria-live="polite">{feedback ?? 'Das Spiel ist beendet.'}</p>
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
        <span>Zug {currentIndex + 1} / {items.length}</span>
        <span>{formatLanguage(activeRoom.language)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
        <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${Math.round((currentIndex / items.length) * 100)}%` }} />
      </div>
      <img src={item.imageUrl} alt={item.imageAlt ?? 'Spielkarte'} className="h-72 w-full rounded-3xl object-cover" />
      <div className="space-y-2">
        <Input
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          placeholder="Deine Aktion / Antwort"
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              void submit();
            }
          }}
        />
        {choices.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {choices.map((choice) => (
              <button
                key={choice}
                type="button"
                className="rounded-full border border-white/10 px-3 py-2 text-sm text-slate-100 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-300"
                onClick={() => setAnswer(choice)}
              >
                {choice}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className="flex gap-3">
        <Button onClick={() => void submit()} disabled={submitting || !answer.trim()} className="flex-1">{submitting ? 'Prüfe…' : 'Eingabe prüfen'}</Button>
        {activeRoom.languageHelp && item.speechText ? <Button onClick={speak} className="bg-slate-100 text-slate-950">Vorlesen</Button> : null}
      </div>
      <p className="text-xs text-slate-400">Fehlversuche für dieses Wort: {currentAttempts}</p>
      {feedback ? <p className="text-sm text-emerald-200" aria-live="polite">{feedback}</p> : null}
    </Card>
  );
}

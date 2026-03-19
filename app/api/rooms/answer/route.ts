import { NextResponse } from 'next/server';
import { z } from 'zod';
import { submitAnswer } from '@/src/lib/room-service';
import { prisma } from '@/src/lib/prisma';
import { emitAnswerSubmitted } from '@/src/server/socket';

const answerSchema = z.object({
  participantId: z.string().min(1),
  itemId: z.string().min(1),
  answer: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const payload = answerSchema.parse(await request.json());
    const result = await submitAnswer(payload);
    const participant = await prisma.participant.findUniqueOrThrow({ where: { id: payload.participantId } });
    const answers = await prisma.studentAnswer.findMany({ where: { roomId: participant.roomId } });
    emitAnswerSubmitted(participant.roomId, answers);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Fehler' }, { status: 400 });
  }
}

import { cookies } from 'next/headers';
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
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(`student-access-${payload.participantId}`)?.value;

    if (!accessToken) {
      return NextResponse.json({ message: 'Schülerzugang fehlt. Bitte dem Raum erneut beitreten.' }, { status: 401 });
    }

    const result = await submitAnswer({ ...payload, accessToken });
    const answers = await prisma.studentAnswer.findMany({ where: { roomId: result.roomId } });
    emitAnswerSubmitted(result.roomId, answers);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Fehler' }, { status: 400 });
  }
}

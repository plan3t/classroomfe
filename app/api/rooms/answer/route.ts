import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { submitAnswer } from '@/src/lib/room-service';
import { prisma } from '@/src/lib/prisma';
import { emitAnswerSubmitted, emitWaitingRoom } from '@/src/server/socket';

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
    const [answers, room] = await Promise.all([
      prisma.studentAnswer.findMany({ where: { roomId: result.roomId } }),
      prisma.room.findUnique({
        where: { id: result.roomId },
        include: { participants: { orderBy: { joinedAt: 'asc' } } },
      }),
    ]);

    emitAnswerSubmitted(result.roomId, answers);
    if (room) {
      emitWaitingRoom(room.joinId, room.participants.map((participant) => ({
        id: participant.id,
        displayName: participant.displayName,
        status: participant.status,
        joinedAt: participant.joinedAt.toISOString(),
      })));
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Fehler' }, { status: 400 });
  }
}

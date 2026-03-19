import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { joinRoom } from '@/src/lib/room-service';

const joinSchema = z.object({
  joinId: z.string().length(8),
  displayName: z.string().min(2).max(24),
});

export async function POST(request: Request) {
  try {
    const payload = joinSchema.parse(await request.json());
    const joined = await joinRoom(payload.joinId, payload.displayName.trim());
    const cookieStore = await cookies();
    cookieStore.set(`student-access-${joined.participant.id}`, joined.participant.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 4,
    });

    return NextResponse.json({
      room: joined.room,
      participant: {
        id: joined.participant.id,
        displayName: joined.participant.displayName,
        status: joined.participant.status,
      },
    });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Fehler' }, { status: 400 });
  }
}

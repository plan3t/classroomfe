import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createRoom } from '@/src/lib/room-service';
import { requireTeacherSession } from '@/src/lib/session';

const roomSchema = z.object({
  topic: z.literal('SUPERMARKET').default('SUPERMARKET'),
  language: z.enum(['DE', 'EN', 'FR', 'ES']),
  languageHelp: z.boolean(),
});

export async function POST(request: Request) {
  try {
    const session = await requireTeacherSession();
    const payload = roomSchema.parse(await request.json());
    const origin = new URL(request.url).origin;
    const room = await createRoom({
      teacherId: session.user.id,
      language: payload.language,
      languageHelp: payload.languageHelp,
      baseUrl: origin,
    });
    return NextResponse.json({ room });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Fehler' }, { status: 400 });
  }
}

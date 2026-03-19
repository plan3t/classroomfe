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
    return NextResponse.json(joined);
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Fehler' }, { status: 400 });
  }
}

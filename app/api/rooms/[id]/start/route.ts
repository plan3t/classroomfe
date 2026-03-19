import { NextResponse } from 'next/server';
import { startRoom } from '@/src/lib/room-service';
import { requireTeacherSession } from '@/src/lib/session';
import { emitRoomStarted } from '@/src/server/socket';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireTeacherSession();
    const { id } = await params;
    const room = await startRoom(id);
    emitRoomStarted(room.joinId, room.status, room.startedAt?.toISOString() ?? null);
    return NextResponse.json({ room });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Fehler' }, { status: 400 });
  }
}

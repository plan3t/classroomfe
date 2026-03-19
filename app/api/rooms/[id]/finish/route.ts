import { NextResponse } from 'next/server';
import { ensureTeacherOwnsRoom, finishRoom } from '@/src/lib/room-service';
import { requireTeacherSession } from '@/src/lib/session';
import { emitRoomFinished, emitWaitingRoom } from '@/src/server/socket';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireTeacherSession();
    const { id } = await params;
    const ownedRoom = await ensureTeacherOwnsRoom(id, session.user.id);
    const room = await finishRoom(id);
    emitRoomFinished(room.joinId, room.status);
    emitWaitingRoom(ownedRoom.joinId, room.participants);
    return NextResponse.json({ room });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Fehler' }, { status: 400 });
  }
}

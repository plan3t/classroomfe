import { NextResponse } from 'next/server';
import { ensureTeacherOwnsRoom, exportRoomResultsCsv } from '@/src/lib/room-service';
import { requireTeacherSession } from '@/src/lib/session';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireTeacherSession();
    const { id } = await params;
    const room = await ensureTeacherOwnsRoom(id, session.user.id);
    const csv = await exportRoomResultsCsv(id);

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="linguaclass-${room.joinId}-results.csv"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Fehler' }, { status: 400 });
  }
}

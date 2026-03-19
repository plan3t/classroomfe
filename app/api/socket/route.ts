import { Server as NetServer } from 'http';
import { NextResponse } from 'next/server';
import { Server as IOServer } from 'socket.io';
import { prisma } from '@/src/lib/prisma';
import { socketEvents } from '@/src/lib/socket-events';
import { emitWaitingRoom, setSocketServer } from '@/src/server/socket';

export const dynamic = 'force-dynamic';

export async function GET() {
  const globalAny = global as typeof globalThis & {
    server?: NetServer & { io?: IOServer };
  };

  if (!globalAny.server?.io) {
    const io = new IOServer({
      path: '/api/socket/io',
      addTrailingSlash: false,
      cors: { origin: '*' },
    });

    io.on('connection', (socket) => {
      socket.on(socketEvents.teacherJoin, async ({ joinId }) => {
        socket.join(`room:${joinId}`);
        const room = await prisma.room.findUnique({ where: { joinId }, include: { participants: true } });
        if (room) {
          socket.join(`room-id:${room.id}`);
          emitWaitingRoom(joinId, room.participants);
        }
      });

      socket.on(socketEvents.studentJoin, async ({ joinId, participantId }) => {
        socket.join(`room:${joinId}`);
        const participant = await prisma.participant.update({
          where: { id: participantId },
          data: { socketId: socket.id },
          include: { room: { include: { participants: true } } },
        });
        socket.join(`room-id:${participant.roomId}`);
        emitWaitingRoom(joinId, participant.room.participants);
      });
    });

    setSocketServer(io);
    globalAny.server = Object.assign(new NetServer(), { io });
  }

  return NextResponse.json({ ok: true });
}

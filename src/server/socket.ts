import { Server as IOServer } from 'socket.io';
import { socketEvents } from '@/src/lib/socket-events';

declare global {
  var ioServer: IOServer | undefined;
}

export function getSocketServer() {
  return global.ioServer;
}

export function setSocketServer(io: IOServer) {
  global.ioServer = io;
}

export function emitWaitingRoom(joinId: string, participants: unknown[]) {
  global.ioServer?.to(`room:${joinId}`).emit(socketEvents.waitingRoomUpdate, { participants });
}

export function emitRoomStarted(joinId: string, status: string, startedAt: string | null) {
  global.ioServer?.to(`room:${joinId}`).emit(socketEvents.roomStarted, { status, startedAt });
}

export function emitAnswerSubmitted(roomId: string, answers: unknown[]) {
  global.ioServer?.to(`room-id:${roomId}`).emit(socketEvents.answerSubmitted, { answers });
}

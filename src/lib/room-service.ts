import QRCode from 'qrcode';
import { prisma } from '@/src/lib/prisma';
import { checkAnswer, generateJoinId } from '@/src/lib/utils';

const ROOM_TTL_HOURS = 4;

export async function createRoom({
  teacherId,
  language,
  languageHelp,
  baseUrl,
}: {
  teacherId: string;
  language: 'DE' | 'EN' | 'FR' | 'ES';
  languageHelp: boolean;
  baseUrl: string;
}) {
  let joinId = generateJoinId();
  while (await prisma.room.findUnique({ where: { joinId } })) {
    joinId = generateJoinId();
  }

  const joinUrl = `${baseUrl}/join/${joinId}`;
  const qrCodeDataUrl = await QRCode.toDataURL(joinUrl);

  return prisma.room.create({
    data: {
      teacherId,
      topic: 'SUPERMARKET',
      language,
      languageHelp,
      joinId,
      joinUrl,
      qrCodeDataUrl,
      expiresAt: new Date(Date.now() + ROOM_TTL_HOURS * 60 * 60 * 1000),
    },
    include: {
      participants: true,
    },
  });
}

export async function expireRoomIfNeeded(joinId: string) {
  const room = await prisma.room.findUnique({ where: { joinId } });
  if (!room) return null;
  if (room.expiresAt <= new Date() && room.status !== 'EXPIRED') {
    return prisma.room.update({
      where: { joinId },
      data: { status: 'EXPIRED' },
    });
  }
  return room;
}

export async function joinRoom(joinId: string, displayName: string) {
  const room = await expireRoomIfNeeded(joinId);
  if (!room || room.status === 'EXPIRED') {
    throw new Error('Dieser Raum ist abgelaufen oder existiert nicht.');
  }

  const participant = await prisma.participant.create({
    data: {
      roomId: room.id,
      displayName,
      status: room.status === 'ACTIVE' ? 'ACTIVE' : 'WAITING',
    },
  });

  return prisma.room.findUniqueOrThrow({
    where: { id: room.id },
    include: {
      participants: { orderBy: { joinedAt: 'asc' } },
    },
  }).then((freshRoom: any) => ({ room: freshRoom, participant }));
}

export async function startRoom(roomId: string) {
  return prisma.room.update({
    where: { id: roomId },
    data: {
      status: 'ACTIVE',
      startedAt: new Date(),
      participants: {
        updateMany: {
          where: { roomId },
          data: { status: 'ACTIVE' },
        },
      },
    },
    include: {
      participants: true,
      answers: true,
    },
  });
}

export async function submitAnswer({
  participantId,
  itemId,
  answer,
}: {
  participantId: string;
  itemId: string;
  answer: string;
}) {
  const participant = await prisma.participant.findUniqueOrThrow({
    where: { id: participantId },
    include: {
      room: true,
    },
  });

  const translation = await prisma.itemTranslation.findUniqueOrThrow({
    where: {
      itemId_language: {
        itemId,
        language: participant.room.language,
      },
    },
  });

  const verdict = checkAnswer(answer, [translation.label, ...translation.alternatives]);

  const created = await prisma.studentAnswer.upsert({
    where: { participantId_itemId: { participantId, itemId } },
    update: {
      submittedText: answer,
      normalizedText: verdict.normalized,
      isCorrect: verdict.isCorrect,
    },
    create: {
      roomId: participant.roomId,
      participantId,
      itemId,
      language: participant.room.language,
      submittedText: answer,
      normalizedText: verdict.normalized,
      isCorrect: verdict.isCorrect,
    },
  });

  return { created, verdict, expected: translation.label };
}

export async function getRoomDetailForTeacher(teacherId: string, joinId: string) {
  return prisma.room.findFirst({
    where: { teacherId, joinId },
    include: {
      participants: { orderBy: { joinedAt: 'asc' } },
      answers: true,
    },
  });
}

export async function getLearningItems() {
  return prisma.item.findMany({
    where: { topic: 'SUPERMARKET' },
    include: { translations: true },
    orderBy: { order: 'asc' },
  });
}

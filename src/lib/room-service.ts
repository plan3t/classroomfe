import crypto from 'node:crypto';
import QRCode from 'qrcode';
import { prisma } from '@/src/lib/prisma';
import { checkAnswer, generateJoinId } from '@/src/lib/utils';
import type { LearningItemDto, ParticipantDto, RoomSummaryDto } from '@/src/lib/contracts';

const ROOM_TTL_HOURS = 4;

function toParticipantDto(participant: {
  id: string;
  displayName: string;
  status: 'WAITING' | 'ACTIVE' | 'COMPLETED';
  joinedAt?: Date;
}): ParticipantDto {
  return {
    id: participant.id,
    displayName: participant.displayName,
    status: participant.status,
    joinedAt: participant.joinedAt?.toISOString(),
  };
}

function toRoomSummaryDto(room: {
  id: string;
  joinId: string;
  language: 'DE' | 'EN' | 'FR' | 'ES';
  languageHelp: boolean;
  status: 'WAITING' | 'ACTIVE' | 'EXPIRED';
  qrCodeDataUrl: string;
  startedAt: Date | null;
  participants: Array<{
    id: string;
    displayName: string;
    status: 'WAITING' | 'ACTIVE' | 'COMPLETED';
    joinedAt?: Date;
  }>;
  answers?: Array<{
    id: string;
    participantId: string;
    itemId: string;
    isCorrect: boolean;
    submittedText: string;
    normalizedText: string;
  }>;
}): RoomSummaryDto {
  return {
    id: room.id,
    joinId: room.joinId,
    language: room.language,
    languageHelp: room.languageHelp,
    status: room.status,
    qrCodeDataUrl: room.qrCodeDataUrl,
    startedAt: room.startedAt?.toISOString() ?? null,
    participants: room.participants.map(toParticipantDto),
    answers: room.answers?.map((answer) => ({
      id: answer.id,
      participantId: answer.participantId,
      itemId: answer.itemId,
      isCorrect: answer.isCorrect,
      submittedText: answer.submittedText,
      normalizedText: answer.normalizedText,
    })),
  };
}

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

  const room = await prisma.room.create({
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

  return toRoomSummaryDto({ ...room, startedAt: room.startedAt ?? null });
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

  const accessToken = crypto.randomBytes(24).toString('hex');
  const participant = await prisma.participant.create({
    data: {
      roomId: room.id,
      displayName,
      accessToken,
      status: room.status === 'ACTIVE' ? 'ACTIVE' : 'WAITING',
    },
  });

  const freshRoom = await prisma.room.findUniqueOrThrow({
    where: { id: room.id },
    include: {
      participants: { orderBy: { joinedAt: 'asc' } },
    },
  });

  return {
    room: toRoomSummaryDto({ ...freshRoom, startedAt: freshRoom.startedAt ?? null }),
    participant: {
      ...toParticipantDto(participant),
      accessToken,
    },
  };
}

export async function ensureTeacherOwnsRoom(roomId: string, teacherId: string) {
  const room = await prisma.room.findFirst({ where: { id: roomId, teacherId } });
  if (!room) {
    throw new Error('Raum nicht gefunden oder keine Berechtigung.');
  }
  return room;
}

export async function startRoom(roomId: string) {
  const room = await prisma.room.update({
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

  return toRoomSummaryDto(room);
}

export async function getAuthorizedParticipant(participantId: string, accessToken: string) {
  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    include: { room: true },
  });

  if (!participant || !participant.accessToken || participant.accessToken !== accessToken) {
    throw new Error('Schülerzugang ist ungültig oder abgelaufen.');
  }

  if (participant.room.expiresAt <= new Date() || participant.room.status === 'EXPIRED') {
    throw new Error('Dieser Raum ist abgelaufen oder existiert nicht.');
  }

  return participant;
}

export async function submitAnswer({
  participantId,
  itemId,
  answer,
  accessToken,
}: {
  participantId: string;
  itemId: string;
  answer: string;
  accessToken: string;
}) {
  const participant = await getAuthorizedParticipant(participantId, accessToken);

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

  return { created, verdict, expected: translation.label, roomId: participant.roomId };
}

export async function getRoomDetailForTeacher(teacherId: string, joinId: string) {
  const room = await prisma.room.findFirst({
    where: { teacherId, joinId },
    include: {
      participants: { orderBy: { joinedAt: 'asc' } },
      answers: true,
    },
  });

  return room ? toRoomSummaryDto(room) : null;
}

export async function getStudentRoom(joinId: string, participantId: string, accessToken: string) {
  const room = await prisma.room.findUnique({
    where: { joinId },
    include: {
      participants: { orderBy: { joinedAt: 'asc' } },
    },
  });

  if (!room) {
    return null;
  }

  const participant = await getAuthorizedParticipant(participantId, accessToken);
  if (participant.room.joinId !== joinId) {
    throw new Error('Schülerzugang passt nicht zu diesem Raum.');
  }

  return toRoomSummaryDto({ ...room, startedAt: room.startedAt ?? null });
}

export async function getLearningItems(): Promise<LearningItemDto[]> {
  const items = await prisma.item.findMany({
    where: { topic: 'SUPERMARKET' },
    include: { translations: true },
    orderBy: { order: 'asc' },
  });

  return items.map((item: (typeof items)[number]) => ({
    id: item.id,
    imageUrl: item.imageUrl,
    order: item.order,
    translations: item.translations.map((translation: (typeof item.translations)[number]) => ({
      language: translation.language,
      label: translation.label,
      alternatives: translation.alternatives,
    })),
  }));
}

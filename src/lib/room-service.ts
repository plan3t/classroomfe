import crypto from 'node:crypto';
import QRCode from 'qrcode';
import { prisma } from '@/src/lib/prisma';
import { checkAnswer, generateJoinId } from '@/src/lib/utils';
import type { LanguageCode, LearningItemDto, ParticipantDto, RoomSummaryDto } from '@/src/lib/contracts';

const ROOM_TTL_HOURS = 4;

type RoomRecord = {
  id: string;
  joinId: string;
  teacherId: string;
  topic: 'SUPERMARKET';
  language: 'DE' | 'EN' | 'FR' | 'ES';
  languageHelp: boolean;
  joinUrl: string;
  qrCodeDataUrl: string;
  status: 'WAITING' | 'ACTIVE' | 'COMPLETED' | 'EXPIRED';
  expiresAt: Date;
  startedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

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
  status: 'WAITING' | 'ACTIVE' | 'COMPLETED' | 'EXPIRED';
  qrCodeDataUrl: string;
  joinUrl: string;
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
    topic: 'SUPERMARKET',
    joinId: room.joinId,
    joinUrl: room.joinUrl,
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

async function expireRoomRecord<T extends { id: string; joinId: string; status: 'WAITING' | 'ACTIVE' | 'COMPLETED' | 'EXPIRED'; expiresAt: Date }>(room: T): Promise<T | RoomRecord> {
  if (room.expiresAt <= new Date() && room.status !== 'EXPIRED' && room.status !== 'COMPLETED') {
    return prisma.room.update({
      where: { id: room.id },
      data: { status: 'EXPIRED' },
    }) as Promise<RoomRecord>;
  }

  return room;
}

export async function expireRoomIfNeeded(joinId: string) {
  const room = await prisma.room.findUnique({ where: { joinId } });
  if (!room) return null;
  return expireRoomRecord(room);
}

export async function expireRoomsForTeacher(teacherId: string) {
  await prisma.room.updateMany({
    where: {
      teacherId,
      status: { in: ['WAITING', 'ACTIVE'] },
      expiresAt: { lte: new Date() },
    },
    data: { status: 'EXPIRED' },
  });
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

export async function joinRoom(joinId: string, displayName: string) {
  const room = await expireRoomIfNeeded(joinId);
  if (!room || room.status === 'EXPIRED' || room.status === 'COMPLETED') {
    throw new Error('Dieser Raum ist nicht mehr beitretbar.');
  }

  const accessToken = crypto.randomBytes(24).toString('hex');

  let participant;
  try {
    participant = await prisma.participant.create({
      data: {
        roomId: room.id,
        displayName,
        accessToken,
        status: room.status === 'ACTIVE' ? 'ACTIVE' : 'WAITING',
      },
    });
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && (error as { code?: string }).code === 'P2002') {
      throw new Error('Dieser Anzeigename ist bereits vergeben.');
    }
    throw error;
  }

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

  return expireRoomRecord(room);
}

export async function startRoom(roomId: string) {
  const currentRoom = await prisma.room.findUniqueOrThrow({ where: { id: roomId } });
  const safeRoom = await expireRoomRecord(currentRoom);

  if (safeRoom.status === 'EXPIRED') {
    throw new Error('Abgelaufene Räume können nicht gestartet werden.');
  }

  if (safeRoom.status !== 'WAITING') {
    throw new Error('Nur wartende Räume können gestartet werden.');
  }

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

export async function finishRoom(roomId: string) {
  const room = await prisma.room.findUniqueOrThrow({ where: { id: roomId } });
  const safeRoom = await expireRoomRecord(room);

  if (safeRoom.status === 'EXPIRED') {
    throw new Error('Abgelaufene Räume können nicht beendet werden.');
  }

  if (safeRoom.status !== 'ACTIVE') {
    throw new Error('Nur aktive Räume können beendet werden.');
  }

  const completedRoom = await prisma.room.update({
    where: { id: roomId },
    data: {
      status: 'COMPLETED',
      participants: {
        updateMany: {
          where: { roomId, status: { in: ['WAITING', 'ACTIVE'] } },
          data: { status: 'COMPLETED' },
        },
      },
    },
    include: {
      participants: true,
      answers: true,
    },
  });

  return toRoomSummaryDto(completedRoom);
}

export async function getAuthorizedParticipant(participantId: string, accessToken: string) {
  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    include: { room: true },
  });

  if (!participant || !participant.accessToken || participant.accessToken !== accessToken) {
    throw new Error('Schülerzugang ist ungültig oder abgelaufen.');
  }

  const room = await expireRoomRecord(participant.room);
  if (room.status === 'EXPIRED' || room.status === 'COMPLETED') {
    throw new Error('Dieser Raum ist nicht mehr aktiv.');
  }

  return {
    ...participant,
    room,
  };
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

  const [translation, totalItems] = await Promise.all([
    prisma.itemTranslation.findUniqueOrThrow({
      where: {
        itemId_language: {
          itemId,
          language: participant.room.language,
        },
      },
    }),
    prisma.item.count({ where: { topic: 'SUPERMARKET' } }),
  ]);

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

  let participantStatus = participant.status;
  if (verdict.isCorrect) {
    const correctAnswers = await prisma.studentAnswer.count({
      where: {
        participantId,
        roomId: participant.roomId,
        isCorrect: true,
      },
    });

    participantStatus = correctAnswers >= totalItems ? 'COMPLETED' : 'ACTIVE';
    await prisma.participant.update({
      where: { id: participantId },
      data: { status: participantStatus },
    });
  }

  return { created, verdict, expected: translation.label, roomId: participant.roomId, participantStatus };
}

export async function getRoomDetailForTeacher(teacherId: string, joinId: string) {
  const room = await prisma.room.findFirst({
    where: { teacherId, joinId },
    include: {
      participants: { orderBy: { joinedAt: 'asc' } },
      answers: true,
    },
  });

  if (!room) {
    return null;
  }

  const safeRoom = await expireRoomRecord(room);
  const hydratedRoom = safeRoom.status === room.status
    ? room
    : await prisma.room.findUniqueOrThrow({
        where: { id: room.id },
        include: {
          participants: { orderBy: { joinedAt: 'asc' } },
          answers: true,
        },
      });

  return toRoomSummaryDto(hydratedRoom);
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

  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    include: { room: true },
  });

  if (!participant || participant.accessToken !== accessToken || participant.room.joinId !== joinId) {
    throw new Error('Schülerzugang passt nicht zu diesem Raum.');
  }

  const safeRoom = await expireRoomRecord(room);
  if (safeRoom.status === 'EXPIRED') {
    throw new Error('Dieser Raum ist nicht mehr aktiv.');
  }

  const hydratedRoom = safeRoom.status === room.status
    ? room
    : await prisma.room.findUniqueOrThrow({
        where: { id: room.id },
        include: {
          participants: { orderBy: { joinedAt: 'asc' } },
        },
      });

  return toRoomSummaryDto({ ...hydratedRoom, startedAt: hydratedRoom.startedAt ?? null });
}

export async function exportRoomResultsCsv(roomId: string) {
  const room = await prisma.room.findUniqueOrThrow({
    where: { id: roomId },
    include: {
      participants: { orderBy: { displayName: 'asc' } },
      answers: true,
    },
  });
  const totalItems = await prisma.item.count({ where: { topic: 'SUPERMARKET' } });

  const rows = room.participants.map((participant) => {
    const answers = room.answers.filter((answer) => answer.participantId === participant.id);
    const correctAnswers = answers.filter((answer) => answer.isCorrect).length;
    const accuracy = answers.length === 0 ? 0 : Math.round((correctAnswers / answers.length) * 100);
    return [participant.displayName, participant.status, String(correctAnswers), String(totalItems), `${accuracy}%`];
  });

  return [
    ['Anzeigename', 'Status', 'Richtige Antworten', 'Gesamtitems', 'Genauigkeit'].join(';'),
    ...rows.map((row) => row.join(';')),
  ].join('\n');
}

export async function getLearningItems(language?: LanguageCode, includeSpeechText = false): Promise<LearningItemDto[]> {
  const items = await prisma.item.findMany({
    where: { topic: 'SUPERMARKET' },
    include: {
      translations: language
        ? { where: { language }, take: 1 }
        : { take: 0 },
    },
    orderBy: { order: 'asc' },
  });

  return items.map((item: (typeof items)[number]) => ({
    id: item.id,
    imageUrl: item.imageUrl,
    order: item.order,
    speechText: includeSpeechText ? item.translations[0]?.label : undefined,
  }));
}

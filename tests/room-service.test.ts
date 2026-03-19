import { beforeEach, describe, expect, it, vi } from 'vitest';
import { checkAnswer, normalizeAnswer } from '@/src/lib/utils';
import { exportRoomResultsCsv, finishRoom, submitAnswer } from '@/src/lib/room-service';
import { prisma } from '@/src/lib/prisma';

vi.mock('@/src/lib/prisma', () => ({
  prisma: {
    participant: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    room: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
    },
    itemTranslation: {
      findUniqueOrThrow: vi.fn(),
    },
    studentAnswer: {
      upsert: vi.fn(),
      count: vi.fn(),
    },
    item: {
      count: vi.fn(),
    },
  },
}));

describe('answer normalization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('matches answers case-insensitively and trimmed', () => {
    expect(checkAnswer('  ÄPFEL ', ['Apfel', 'Äpfel']).isCorrect).toBe(true);
  });

  it('removes accents before comparison', () => {
    expect(normalizeAnswer('Pêché')).toBe('peche');
  });

  it('rejects wrong answers', () => {
    expect(checkAnswer('Birne', ['Apfel']).isCorrect).toBe(false);
  });

  it('marks a participant as completed after the final correct answer', async () => {
    vi.mocked(prisma.participant.findUnique).mockResolvedValue({
      id: 'participant-1',
      roomId: 'room-1',
      status: 'ACTIVE',
      accessToken: 'secure-token',
      room: {
        id: 'room-1',
        joinId: '12345678',
        language: 'DE',
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 10000),
      },
    } as never);
    vi.mocked(prisma.itemTranslation.findUniqueOrThrow).mockResolvedValue({
      label: 'Apfel',
      alternatives: ['Äpfel'],
    } as never);
    vi.mocked(prisma.item.count).mockResolvedValue(3 as never);
    vi.mocked(prisma.studentAnswer.upsert).mockResolvedValue({ id: 'answer-1' } as never);
    vi.mocked(prisma.studentAnswer.count).mockResolvedValue(3 as never);
    vi.mocked(prisma.participant.update).mockResolvedValue({ status: 'COMPLETED' } as never);

    const result = await submitAnswer({
      participantId: 'participant-1',
      itemId: 'item-1',
      answer: 'Apfel',
      accessToken: 'secure-token',
    });

    expect(result.participantStatus).toBe('COMPLETED');
    expect(prisma.participant.update).toHaveBeenCalledWith({
      where: { id: 'participant-1' },
      data: { status: 'COMPLETED' },
    });
  });

  it('finishes an active room and marks remaining participants completed', async () => {
    vi.mocked(prisma.room.findUniqueOrThrow).mockResolvedValue({
      id: 'room-1',
      status: 'ACTIVE',
      joinId: '12345678',
      expiresAt: new Date(Date.now() + 10000),
    } as never);
    vi.mocked(prisma.room.update).mockResolvedValue({
      id: 'room-1',
      joinId: '12345678',
      language: 'DE',
      languageHelp: true,
      status: 'COMPLETED',
      qrCodeDataUrl: 'qr',
      startedAt: new Date(),
      participants: [],
      answers: [],
    } as never);

    const room = await finishRoom('room-1');
    expect(room.status).toBe('COMPLETED');
  });

  it('exports room results as csv', async () => {
    vi.mocked(prisma.room.findUniqueOrThrow).mockResolvedValue({
      id: 'room-1',
      participants: [
        { id: 'participant-1', displayName: 'Mia', status: 'COMPLETED' },
      ],
      answers: [
        { participantId: 'participant-1', isCorrect: true },
      ],
    } as never);
    vi.mocked(prisma.item.count).mockResolvedValue(3 as never);

    const csv = await exportRoomResultsCsv('room-1');
    expect(csv).toContain('Anzeigename;Status;Richtige Antworten;Gesamtitems;Genauigkeit');
    expect(csv).toContain('Mia;COMPLETED;1;3;100%');
  });
});

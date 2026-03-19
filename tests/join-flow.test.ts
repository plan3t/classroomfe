import { beforeEach, describe, expect, it, vi } from 'vitest';
import { joinRoom, getAuthorizedParticipant } from '@/src/lib/room-service';
import { prisma } from '@/src/lib/prisma';

vi.mock('node:crypto', () => ({
  default: {
    randomBytes: vi.fn(() => ({ toString: () => 'secure-token' })),
  },
}));

vi.mock('@/src/lib/prisma', () => ({
  prisma: {
    room: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    participant: {
      create: vi.fn(),
      findUnique: vi.fn(),
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

describe('join flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a waiting participant with an access token', async () => {
    vi.mocked(prisma.room.findUnique).mockResolvedValue({
      id: 'room-1',
      joinId: '12345678',
      status: 'WAITING',
      expiresAt: new Date(Date.now() + 10000),
    } as never);
    vi.mocked(prisma.participant.create).mockResolvedValue({
      id: 'participant-1',
      displayName: 'Mia',
      status: 'WAITING',
      joinedAt: new Date('2026-03-19T10:00:00Z'),
    } as never);
    vi.mocked(prisma.room.findUniqueOrThrow).mockResolvedValue({
      id: 'room-1',
      joinId: '12345678',
      language: 'DE',
      languageHelp: true,
      status: 'WAITING',
      qrCodeDataUrl: 'qr',
      startedAt: null,
      participants: [{
        id: 'participant-1',
        displayName: 'Mia',
        status: 'WAITING',
        joinedAt: new Date('2026-03-19T10:00:00Z'),
      }],
    } as never);

    const result = await joinRoom('12345678', 'Mia');
    expect(prisma.participant.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ displayName: 'Mia', accessToken: 'secure-token' }),
    }));
    expect(result.room.joinId).toBe('12345678');
  });

  it('shows a friendly message for duplicate display names', async () => {
    vi.mocked(prisma.room.findUnique).mockResolvedValue({
      id: 'room-1',
      joinId: '12345678',
      status: 'WAITING',
      expiresAt: new Date(Date.now() + 10000),
    } as never);
    vi.mocked(prisma.participant.create).mockRejectedValue(
      { code: 'P2002' } as never,
    );

    await expect(joinRoom('12345678', 'Mia')).rejects.toThrow(/bereits vergeben/);
  });

  it('rejects expired rooms', async () => {
    vi.mocked(prisma.room.findUnique).mockResolvedValue({
      id: 'room-1',
      joinId: '12345678',
      status: 'EXPIRED',
      expiresAt: new Date(Date.now() - 10000),
    } as never);
    vi.mocked(prisma.room.update).mockResolvedValue({
      id: 'room-1',
      joinId: '12345678',
      status: 'EXPIRED',
      expiresAt: new Date(Date.now() - 10000),
    } as never);

    await expect(joinRoom('12345678', 'Mia')).rejects.toThrow(/abgelaufen/);
  });

  it('authorizes a participant via access token', async () => {
    vi.mocked(prisma.participant.findUnique).mockResolvedValue({
      id: 'participant-1',
      status: 'ACTIVE',
      accessToken: 'secure-token',
      room: {
        id: 'room-1',
        joinId: '12345678',
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 10000),
      },
    } as never);

    const participant = await getAuthorizedParticipant('participant-1', 'secure-token');
    expect(participant.id).toBe('participant-1');
  });
});

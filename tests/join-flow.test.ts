import { beforeEach, describe, expect, it, vi } from 'vitest';
import { joinRoom } from '@/src/lib/room-service';
import { prisma } from '@/src/lib/prisma';

vi.mock('@/src/lib/prisma', () => ({
  prisma: {
    room: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
    },
    participant: {
      create: vi.fn(),
    },
  },
}));

describe('join flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a waiting participant for active room lookup', async () => {
    vi.mocked(prisma.room.findUnique).mockResolvedValue({
      id: 'room-1',
      joinId: '12345678',
      status: 'WAITING',
      expiresAt: new Date(Date.now() + 10000),
    } as any);
    vi.mocked(prisma.participant.create).mockResolvedValue({ id: 'participant-1', displayName: 'Mia' } as any);
    vi.mocked(prisma.room.findUniqueOrThrow).mockResolvedValue({ id: 'room-1', joinId: '12345678', participants: [{ id: 'participant-1', displayName: 'Mia' }] } as any);

    const result = await joinRoom('12345678', 'Mia');
    expect(prisma.participant.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ displayName: 'Mia' }),
    }));
    expect(result.room.joinId).toBe('12345678');
  });

  it('rejects expired rooms', async () => {
    vi.mocked(prisma.room.findUnique).mockResolvedValue({
      id: 'room-1',
      joinId: '12345678',
      status: 'EXPIRED',
      expiresAt: new Date(Date.now() - 10000),
    } as any);
    vi.mocked(prisma.room.update).mockResolvedValue({
      id: 'room-1',
      joinId: '12345678',
      status: 'EXPIRED',
      expiresAt: new Date(Date.now() - 10000),
    } as any);

    await expect(joinRoom('12345678', 'Mia')).rejects.toThrow(/abgelaufen/);
  });
});

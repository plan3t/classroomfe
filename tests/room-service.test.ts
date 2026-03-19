import { describe, expect, it, vi, beforeEach } from 'vitest';
import { checkAnswer } from '@/src/lib/utils';

vi.mock('@/src/lib/prisma', () => ({
  prisma: {
    room: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    participant: {
      create: vi.fn(),
    },
  },
}));

describe('answer normalization', () => {
  it('matches answers case-insensitively and trimmed', () => {
    expect(checkAnswer('  ÄPFEL ', ['Apfel', 'Äpfel']).isCorrect).toBe(true);
  });

  it('rejects wrong answers', () => {
    expect(checkAnswer('Birne', ['Apfel']).isCorrect).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { checkAnswer, normalizeAnswer } from '@/src/lib/utils';

describe('answer normalization', () => {
  it('matches answers case-insensitively and trimmed', () => {
    expect(checkAnswer('  ÄPFEL ', ['Apfel', 'Äpfel']).isCorrect).toBe(true);
  });

  it('removes accents before comparison', () => {
    expect(normalizeAnswer('Pêché')).toBe('peche');
  });

  it('rejects wrong answers', () => {
    expect(checkAnswer('Birne', ['Apfel']).isCorrect).toBe(false);
  });
});

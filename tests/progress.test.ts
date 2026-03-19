import { describe, expect, it } from 'vitest';
import { buildParticipantProgress, summarizeRoomProgress } from '@/src/lib/progress';

const participants = [
  { id: 'p1', displayName: 'Mia', status: 'ACTIVE' as const },
  { id: 'p2', displayName: 'Noah', status: 'COMPLETED' as const },
];

const answers = [
  { id: 'a1', participantId: 'p1', itemId: 'i1', isCorrect: true, submittedText: 'Apfel', normalizedText: 'apfel' },
  { id: 'a2', participantId: 'p1', itemId: 'i2', isCorrect: false, submittedText: 'Birne', normalizedText: 'birne' },
  { id: 'a3', participantId: 'p2', itemId: 'i1', isCorrect: true, submittedText: 'Apfel', normalizedText: 'apfel' },
  { id: 'a4', participantId: 'p2', itemId: 'i2', isCorrect: true, submittedText: 'Brot', normalizedText: 'brot' },
  { id: 'a5', participantId: 'p2', itemId: 'i3', isCorrect: true, submittedText: 'Milch', normalizedText: 'milch' },
];

describe('room progress helpers', () => {
  it('builds participant progress with attempts, accuracy and progress', () => {
    const progress = buildParticipantProgress(participants, answers, 3);
    expect(progress[0]).toMatchObject({ attemptedAnswers: 2, correctAnswers: 1, accuracy: 50, progressPercent: 67 });
    expect(progress[1]).toMatchObject({ attemptedAnswers: 3, correctAnswers: 3, accuracy: 100, progressPercent: 100 });
  });

  it('summarizes room totals', () => {
    const summary = summarizeRoomProgress(participants, answers, 3);
    expect(summary.completedCount).toBe(1);
    expect(summary.totalAttempted).toBe(5);
    expect(summary.totalCorrect).toBe(4);
    expect(summary.averageAccuracy).toBe(75);
    expect(summary.averageProgress).toBe(84);
  });
});

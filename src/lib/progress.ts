import type { ParticipantDto, StudentAnswerDto } from '@/src/lib/contracts';

export type ParticipantProgress = ParticipantDto & {
  correctAnswers: number;
  accuracy: number;
  completionPercent: number;
};

export function buildParticipantProgress(
  participants: ParticipantDto[],
  answers: StudentAnswerDto[],
  totalItems: number,
): ParticipantProgress[] {
  return participants.map((participant) => {
    const participantAnswers = answers.filter((answer) => answer.participantId === participant.id);
    const correctAnswers = participantAnswers.filter((answer) => answer.isCorrect).length;
    const attemptedAnswers = participantAnswers.length;
    const accuracy = attemptedAnswers === 0 ? 0 : Math.round((correctAnswers / attemptedAnswers) * 100);
    const completionPercent = totalItems === 0 ? 0 : Math.min(100, Math.round((correctAnswers / totalItems) * 100));

    return {
      ...participant,
      correctAnswers,
      accuracy,
      completionPercent,
    };
  });
}

export function summarizeRoomProgress(participants: ParticipantDto[], answers: StudentAnswerDto[], totalItems: number) {
  const participantProgress = buildParticipantProgress(participants, answers, totalItems);
  const completedCount = participantProgress.filter((participant) => participant.status === 'COMPLETED').length;
  const totalCorrect = participantProgress.reduce((sum, participant) => sum + participant.correctAnswers, 0);
  const averageAccuracy = participantProgress.length === 0
    ? 0
    : Math.round(participantProgress.reduce((sum, participant) => sum + participant.accuracy, 0) / participantProgress.length);

  return {
    participantProgress,
    completedCount,
    totalCorrect,
    averageAccuracy,
  };
}

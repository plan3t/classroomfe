import type { ParticipantDto, StudentAnswerDto } from '@/src/lib/contracts';

export type ParticipantProgress = ParticipantDto & {
  attemptedAnswers: number;
  correctAnswers: number;
  accuracy: number;
  progressPercent: number;
};

export function buildParticipantProgress(
  participants: ParticipantDto[],
  answers: StudentAnswerDto[],
  totalItems: number,
): ParticipantProgress[] {
  const answersByParticipant = new Map<string, StudentAnswerDto[]>();

  for (const answer of answers) {
    const participantAnswers = answersByParticipant.get(answer.participantId) ?? [];
    participantAnswers.push(answer);
    answersByParticipant.set(answer.participantId, participantAnswers);
  }

  return participants.map((participant) => {
    const participantAnswers = answersByParticipant.get(participant.id) ?? [];
    const correctAnswers = participantAnswers.filter((answer) => answer.isCorrect).length;
    const attemptedAnswers = participantAnswers.length;
    const accuracy = attemptedAnswers === 0 ? 0 : Math.round((correctAnswers / attemptedAnswers) * 100);
    const progressPercent = totalItems === 0 ? 0 : Math.min(100, Math.round((attemptedAnswers / totalItems) * 100));

    return {
      ...participant,
      attemptedAnswers,
      correctAnswers,
      accuracy,
      progressPercent,
    };
  });
}

export function summarizeRoomProgress(participants: ParticipantDto[], answers: StudentAnswerDto[], totalItems: number) {
  const participantProgress = buildParticipantProgress(participants, answers, totalItems);
  const completedCount = participantProgress.filter((participant) => participant.status === 'COMPLETED').length;
  const totalAttempted = participantProgress.reduce((sum, participant) => sum + participant.attemptedAnswers, 0);
  const totalCorrect = participantProgress.reduce((sum, participant) => sum + participant.correctAnswers, 0);
  const averageAccuracy = participantProgress.length === 0
    ? 0
    : Math.round(participantProgress.reduce((sum, participant) => sum + participant.accuracy, 0) / participantProgress.length);
  const averageProgress = participantProgress.length === 0
    ? 0
    : Math.round(participantProgress.reduce((sum, participant) => sum + participant.progressPercent, 0) / participantProgress.length);

  return {
    participantProgress,
    completedCount,
    totalAttempted,
    totalCorrect,
    averageAccuracy,
    averageProgress,
  };
}

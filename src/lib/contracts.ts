export type LanguageCode = 'DE' | 'EN' | 'FR' | 'ES';
export type RoomTopicCode = 'SUPERMARKET';
export type RoomStatusCode = 'WAITING' | 'ACTIVE' | 'COMPLETED' | 'EXPIRED';
export type ParticipantStatusCode = 'WAITING' | 'ACTIVE' | 'COMPLETED';

export type ParticipantDto = {
  id: string;
  displayName: string;
  status: ParticipantStatusCode;
  joinedAt?: string;
};

export type StudentAnswerDto = {
  id: string;
  participantId: string;
  itemId: string;
  isCorrect: boolean;
  submittedText: string;
  normalizedText: string;
};

export type RoomSummaryDto = {
  id: string;
  topic: RoomTopicCode;
  joinId: string;
  joinUrl: string;
  language: LanguageCode;
  languageHelp: boolean;
  status: RoomStatusCode;
  qrCodeDataUrl: string;
  participants: ParticipantDto[];
  answers?: StudentAnswerDto[];
  startedAt?: string | null;
};

export type LearningItemDto = {
  id: string;
  imageUrl: string;
  order: number;
  speechText?: string;
  imageAlt?: string;
};

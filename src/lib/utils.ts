import { clsx } from 'clsx';

export function cn(...inputs: Array<string | false | null | undefined>) {
  return clsx(inputs);
}

export function normalizeAnswer(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function checkAnswer(input: string, accepted: string[]) {
  const normalized = normalizeAnswer(input);
  return {
    normalized,
    isCorrect: accepted.map(normalizeAnswer).includes(normalized),
  };
}

export function generateJoinId() {
  return Math.random().toString().slice(2, 10).padEnd(8, '0');
}

export function formatLanguage(language: 'DE' | 'EN' | 'FR' | 'ES') {
  return {
    DE: 'Deutsch',
    EN: 'Englisch',
    FR: 'Französisch',
    ES: 'Spanisch',
  }[language];
}

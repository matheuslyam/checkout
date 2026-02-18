// src/types/index.ts

export type MoodState = 'sunny' | 'blue' | 'harmonic'; // Estados de humor do app

export interface BitstrumMessage {
  id: string;
  text: string;
  category: 'saudade' | 'admiração' | 'apoio';
  unlockCondition?: string; // Ex: Só aparece após tocar tal música
}

export interface StringNote {
  stringIndex: number; // 0 a 5 (como uma guitarra real)
  frequency: number;   // Frequência da nota em Hz
  label: string;       // Nome da nota (E, A, D, etc.)
}

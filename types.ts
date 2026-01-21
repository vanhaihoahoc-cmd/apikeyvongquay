
export interface Question {
  q: string;
  options: string[];
  correct: number;
}

export interface Segment {
  text: string;
  color: string;
  textColor: string;
}

export enum GameState {
  IDLE = 'IDLE',
  SPINNING = 'SPINNING',
  QUESTION = 'QUESTION',
  COMPLETED = 'COMPLETED'
}

export type SpinSpeed = 1000 | 3000 | 5000;

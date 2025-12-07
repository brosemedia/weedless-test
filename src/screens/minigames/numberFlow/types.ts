export type NumberFlowLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type NumberFlowPhase = 'intro' | 'countdown' | 'playing' | 'answer' | 'result';

export interface NumberFlowOperation {
  op: '+' | '-';
  value: number;
}

export interface NumberFlowSequence {
  startValue: number;
  operations: NumberFlowOperation[];
  correctResult: number;
}


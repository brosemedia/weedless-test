import type { NumberFlowLevel, NumberFlowOperation, NumberFlowSequence } from './types';

type Range = [number, number];

type LevelConfig = {
  operations: Range;
  valueRange: Range;
  startRange: Range;
};

const MIN_RESULT = 0;
const MAX_RESULT = 99;
const MAX_ATTEMPTS = 80;

const LEVEL_CONFIG: Record<NumberFlowLevel, LevelConfig> = {
  1: { operations: [3, 3], valueRange: [1, 5], startRange: [4, 16] },
  2: { operations: [4, 4], valueRange: [1, 9], startRange: [6, 20] },
  3: { operations: [4, 5], valueRange: [1, 9], startRange: [6, 22] },
  4: { operations: [4, 5], valueRange: [1, 9], startRange: [8, 24] },
  5: { operations: [6, 6], valueRange: [1, 12], startRange: [10, 28] },
  6: { operations: [6, 7], valueRange: [1, 12], startRange: [12, 30] },
  7: { operations: [6, 7], valueRange: [1, 12], startRange: [14, 32] },
  8: { operations: [8, 8], valueRange: [1, 15], startRange: [14, 34] },
  9: { operations: [8, 9], valueRange: [1, 15], startRange: [16, 36] },
  10: { operations: [9, 10], valueRange: [1, 15], startRange: [18, 38] },
};

const randomInt = (min: number, max: number) => {
  if (max <= min) return min;
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const pickOperation = (current: number, config: LevelConfig): { op: NumberFlowOperation['op']; value: number; next: number } | null => {
  const [minValue] = config.valueRange;
  const maxValueRange = config.valueRange[1];

  const maxAdd = Math.min(maxValueRange, MAX_RESULT - current);
  const maxSubtract = Math.min(maxValueRange, current - MIN_RESULT);

  const candidates: Array<'+' | '-'> = [];
  if (maxAdd >= minValue) {
    candidates.push('+');
  }
  if (maxSubtract >= minValue) {
    candidates.push('-');
  }

  if (!candidates.length) {
    return null;
  }

  const op = candidates[Math.floor(Math.random() * candidates.length)];
  const opMax = op === '+' ? maxAdd : maxSubtract;
  const value = randomInt(minValue, opMax);
  const next = op === '+' ? current + value : current - value;
  return { op, value, next };
};

export const generateNumberFlowSequence = (level: NumberFlowLevel): NumberFlowSequence => {
  const config = LEVEL_CONFIG[level];

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const operationsTarget = randomInt(config.operations[0], config.operations[1]);
    const startValue = randomInt(config.startRange[0], config.startRange[1]);
    let current = startValue;
    const operations: NumberFlowOperation[] = [];
    let valid = true;

    for (let i = 0; i < operationsTarget; i++) {
      const nextOp = pickOperation(current, config);
      if (!nextOp) {
        valid = false;
        break;
      }
      operations.push({ op: nextOp.op, value: nextOp.value });
      current = nextOp.next;
      if (current < MIN_RESULT || current > MAX_RESULT) {
        valid = false;
        break;
      }
    }

    if (valid && operations.length === operationsTarget) {
      return {
        startValue,
        operations,
        correctResult: current,
      };
    }
  }

  // Fallback sequence if generation fails (should be rare)
  return {
    startValue: 10,
    operations: [
      { op: '+', value: 3 },
      { op: '-', value: 2 },
      { op: '+', value: 4 },
      { op: '-', value: 1 },
    ],
    correctResult: 14,
  };
};


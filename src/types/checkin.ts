import type { ConsumptionMethod, ConsumptionAmountUnit, PaidByUser } from './profile';

export type DailyUseEvent = {
  type: 'use';
  amountGrams?: number;
  form?: string;
  time?: string; // HH:MM
  craving0to10?: number;
  notes?: string;
};

export type DailyPauseEvent = {
  type: 'pause';
  time?: string; // HH:MM
  schlafstoerung?: number;
  reizbarkeit?: number;
  unruhe?: number;
  appetit?: number;
  schwitzen?: number;
  craving0to10?: number;
  notes?: string;
};

export type DailyCheckinData = {
  dateISO: string;
  usedToday: boolean;
  amountGrams: number;
  cravings0to10: number;
  mood1to5: number;
  sleepHours: number;
  notes?: string;
  consumptionPaidByUser?: PaidByUser;
  consumptionAmountSpentEUR?: number;
  consumptionSessionMinutes?: number;
  consumptionMethod?: ConsumptionMethod;
  consumptionAmountValue?: number;
  consumptionAmountUnit?: ConsumptionAmountUnit;
  consumptionJoints?: number;
  reasonCategoryIds?: string[];
  reasonIds?: string[];
  withdrawalSymptomIds?: string[];
  skippedSymptoms?: boolean;
  uses?: DailyUseEvent[];
  pauses?: DailyPauseEvent[];
};


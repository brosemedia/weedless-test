export type GoalMode = 'quit' | 'reduce';

export interface Baseline {
  unit: 'g' | 'joint';
  amountPerDay: number;
  pricePerUnit: number;
}

export interface SavingGoal {
  title: string;
  targetAmount: number;
  imageUrl?: string;
}

export interface Profile {}
export interface Profile {
  startedAt: string;
  goalMode: GoalMode;
  baseline: Baseline;
  savingGoal?: SavingGoal;
  currency: 'EUR' | 'USD' | string;
}

export interface DiaryEntry {
  id: string;
  date: string; // ISO
  amount: number;
  craving?: number;
  note?: string;
}

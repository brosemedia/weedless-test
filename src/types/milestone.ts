export type MilestoneKind = 'streak' | 'count' | 'money' | 'pause';

export type MilestoneIconKey =
  | 'streakSeed'
  | 'streakSprout'
  | 'streakBloom'
  | 'streakCanopy'
  | 'streakForest'
  | 'streakSummit'
  | 'streakLegend'
  | 'countFirst'
  | 'countHabit'
  | 'countCommitted'
  | 'countMastery'
  | 'countCenturion'
  | 'moneySeed'
  | 'moneySapling'
  | 'moneyGrowth'
  | 'moneyHarvest'
  | 'moneyTreasury'
  | 'moneyLegacy';

export type Milestone = {
  id: string;
  title: string;
  description?: string;
  xpReward: number;
  icon?: MilestoneIconKey;
  achievedAt?: string;
  kind: MilestoneKind;
  threshold: number;
};

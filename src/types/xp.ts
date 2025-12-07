export type XpEventReason =
  | 'daily-check-in'
  | 'breathing-session'
  | 'reaction-test'
  | 'stroop-focus'
  | 'zen-glide'
  | 'mind-house'
  | 'number-flow'
  | 'pause-daily-bonus'
  | 'milestone'
  | 'mission'
  | 'manual';

export type XpEventMeta = {
  label?: string;
  taskId?: string;
  milestoneId?: string;
  milestoneTitle?: string;
  pauseId?: string;
};

export type XpEvent = {
  id: string;
  dateISO: string;
  amount: number;
  reason: XpEventReason;
  meta?: XpEventMeta;
};

export type XpState = {
  totalXp: number;
  currentLevel: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  xpEvents: XpEvent[];
};


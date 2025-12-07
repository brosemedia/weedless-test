export const TASK_IDS = [
  'reaction-test',
  'stroop-focus',
  'daily-check-in',
  'breathing-session',
  'zen-glide',
  'mind-house',
  'number-flow',
] as const;

export type TaskKey = (typeof TASK_IDS)[number];

export const TASK_LABELS: Record<TaskKey, string> = {
  'reaction-test': 'Reaktionstest',
  'stroop-focus': 'Stroop Focus',
  'daily-check-in': 'Daily Check-in',
  'breathing-session': 'Atemübung',
  'zen-glide': 'Zen Glide',
  'mind-house': 'Mind House',
  'number-flow': 'Number Flow',
};

export const TASK_XP: Record<TaskKey, number> = {
  'reaction-test': 40,
  'stroop-focus': 40,
  'daily-check-in': 25,
  'breathing-session': 30,
  'zen-glide': 20,
  'mind-house': 35,
  'number-flow': 35,
};

export const GRAMS_PER_JOINT_DEFAULT = 0.25;

export const PAUSE_DAILY_XP_BONUS = 35;

export const getTaskLabel = (taskId: string): string => {
  return TASK_LABELS[taskId as TaskKey] ?? taskId;
};

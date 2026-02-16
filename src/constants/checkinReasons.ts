export type CheckinReasonCategoryId =
  | 'stress'
  | 'conflict'
  | 'mood'
  | 'routine'
  | 'social'
  | 'reward'
  | 'body'
  | 'craving'
  | 'other';

export type CheckinReasonId =
  | 'work_stress'
  | 'school_pressure'
  | 'conflict_partner'
  | 'conflict_family'
  | 'sadness'
  | 'anxiety'
  | 'loneliness'
  | 'boredom'
  | 'habit_evening'
  | 'celebration'
  | 'social_pressure'
  | 'wind_down'
  | 'pain_relief'
  | 'sleep_helper'
  | 'strong_craving'
  | 'relapse_chain'
  | 'dont_know';

export type ReasonCategory = {
  id: CheckinReasonCategoryId;
  label: string;
  emoji: string;
};

export type ReasonOption = {
  id: CheckinReasonId;
  label: string;
  categories: CheckinReasonCategoryId[];
};

export const REASON_CATEGORIES: ReasonCategory[] = [
  { id: 'stress', emoji: '💼', label: 'Stress & Alltag' },
  { id: 'conflict', emoji: '💬', label: 'Konflikte & Druck' },
  { id: 'mood', emoji: '💭', label: 'Gefühle & Stimmung' },
  { id: 'routine', emoji: '🔁', label: 'Gewohnheit & Routine' },
  { id: 'social', emoji: '👥', label: 'Soziale Situationen' },
  { id: 'reward', emoji: '🧠', label: 'Kopf abschalten & Belohnung' },
  { id: 'body', emoji: '💊', label: 'Körper & Beschwerden' },
  { id: 'craving', emoji: '🔥', label: 'Craving & Rückfall' },
  { id: 'other', emoji: '❓', label: 'Weiß nicht / Sonstiges' },
];

export const REASON_OPTIONS: ReasonOption[] = [
  { id: 'work_stress', label: 'Arbeitsstress', categories: ['stress'] },
  { id: 'school_pressure', label: 'Druck / Überforderung', categories: ['stress'] },
  { id: 'conflict_partner', label: 'Streit / Partnerschaft', categories: ['conflict'] },
  { id: 'conflict_family', label: 'Familie / Freunde', categories: ['conflict'] },
  { id: 'sadness', label: 'Traurigkeit / Leere', categories: ['mood'] },
  { id: 'anxiety', label: 'Angst / Unruhe', categories: ['mood'] },
  { id: 'loneliness', label: 'Einsamkeit', categories: ['mood', 'social'] },
  { id: 'boredom', label: 'Langeweile', categories: ['routine', 'reward'] },
  { id: 'habit_evening', label: 'Abendroutine', categories: ['routine'] },
  { id: 'celebration', label: 'Feier / Anlass', categories: ['social', 'reward'] },
  { id: 'social_pressure', label: 'Sozialer Druck / Gruppe', categories: ['social'] },
  { id: 'wind_down', label: 'Abschalten / Belohnung', categories: ['reward'] },
  { id: 'pain_relief', label: 'Schmerzen / Beschwerden', categories: ['body'] },
  { id: 'sleep_helper', label: 'Besser einschlafen', categories: ['body', 'mood'] },
  { id: 'strong_craving', label: 'Starkes Craving', categories: ['craving'] },
  { id: 'relapse_chain', label: 'Rückfallkette', categories: ['craving', 'routine'] },
  { id: 'dont_know', label: 'Weiß nicht / Sonstiges', categories: ['other'] },
];


export type Profile = {
  pricePerGram?: number; // €/g
  costPerJoint?: number; // €/Joint
  gramsPerDayBaseline?: number; // g/Tag
  jointsPerDayBaseline?: number; // J/Tag
  avgSessionMinutes?: number; // Ø Minuten je Session
  startTimestamp: number; // ms – "konsumfrei seit"
  lastConsumptionAt?: number;
  locale?: string; // "de-DE"
  version: number; // schema version
};

export type PaidByUser = 'yes' | 'no' | 'unknown';

export type ConsumptionMethod = 'joint' | 'vape' | 'bong' | 'edible' | 'other';

export type ConsumptionEntry = {
  id: string;
  createdAt: number;
  grams?: number;
  joints?: number;
  sessionMinutes?: number;
  method?: ConsumptionMethod;
  paidByUser: PaidByUser;
  amountSpent?: number;
};

export type DayCheckin = {
  usedToday: boolean;
  amountGrams: number;
  cravings0to10: number;
  mood1to5: number;
  sleepHours: number;
  notes?: string;
  recordedAt: number;
};

export type DayLog = {
  date: string; // YYYY-MM-DD
  consumedGrams?: number;
  consumedJoints?: number;
  consumptionEntries?: ConsumptionEntry[];
  /** Summe der für Cannabis ausgegebenen Euros an diesem Tag */
  moneySpentEUR?: number;
  /** Tatsächlich konsumierte Sitzungsminuten dieses Tages */
  sessionMinutes?: number;
  notes?: string;
  checkin?: DayCheckin;
  tests?: {
    reactionMs?: number;
    memoryScore?: number;
    stroopAccuracy?: number;
    stroopMeanRt?: number;
    stroopInterference?: number;
    stroopTimestamp?: number;
  };
  tasksDone?: string[];
  xpEarned?: number;
};

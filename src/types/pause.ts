export type PauseStatus = 'aktiv' | 'abgeschlossen' | 'abgebrochen';

export type PauseStats = {
  savedMoney: number;
  savedGrams: number;
  savedTimeHours: number;
};

export type Pause = {
  id: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: PauseStatus;
  createdAt: number;
  /** Echtzeit-Startmoment als ms-Timestamp */
  startTimestamp?: number;
  /** Geplanter Endzeitpunkt als ms-Timestamp */
  endTimestamp?: number;
  completedAt?: number;
  completedStatus?: PauseStatus;
  stats?: PauseStats;
  /** Datum-Keys (YYYY-MM-DD), für die bereits XP vergeben wurden */
  xpAwardedDays: string[];
};

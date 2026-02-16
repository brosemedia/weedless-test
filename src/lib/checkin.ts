import { GRAMS_PER_JOINT_DEFAULT } from './tasks';
import { createConsumptionEntry } from './consumption';
import type { DailyCheckinData } from '../types/checkin';
import type { ConsumptionEntry } from '../types/profile';

export type NormalizedCheckinConsumption = {
  grams: number;
  joints?: number;
  sessionMinutes?: number;
  moneySpent?: number;
  entry?: ConsumptionEntry | null;
};

/**
 * Normalisiert die Konsumangaben aus dem Check-in, sodass sie in DayLogs und KPIs verwendet werden können.
 * Unbekannte Einheiten werden nicht auf Gramm umgerechnet (0), mgTHC wird in Gramm (mg/1000) gewandelt.
 */
export function normalizeCheckinConsumption(
  data: DailyCheckinData,
  gramsPerJoint: number = GRAMS_PER_JOINT_DEFAULT
): NormalizedCheckinConsumption {
  if (!data.usedToday) {
    return { grams: 0, joints: undefined, sessionMinutes: undefined, moneySpent: undefined, entry: null };
  }

  const unit = data.consumptionAmountUnit ?? 'g';
  const raw = data.consumptionAmountValue ?? data.amountGrams ?? 0;

  let grams = 0;
  if (unit === 'g') {
    grams = raw;
  } else if (unit === 'mg_thc') {
    grams = raw / 1000;
  }
  // Für andere Einheiten fehlen belastbare Umrechnungen -> 0 g, aber wir behalten die Rohwerte im Check-in.

  const joints = gramsPerJoint > 0 && grams > 0 ? grams / gramsPerJoint : undefined;
  const moneySpent = data.consumptionPaidByUser === 'yes' ? data.consumptionAmountSpentEUR : undefined;

  const entry =
    grams > 0
      ? createConsumptionEntry({
          grams,
          joints,
          sessionMinutes: data.consumptionSessionMinutes,
          method: data.consumptionMethod,
          paidByUser: data.consumptionPaidByUser ?? 'unknown',
          amountSpent: moneySpent,
        })
      : null;

  return {
    grams: Math.max(0, grams),
    joints,
    sessionMinutes: data.consumptionSessionMinutes,
    moneySpent,
    entry,
  };
}


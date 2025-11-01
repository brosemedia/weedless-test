export type Checkin = {
  dateISO: string;
  mcq0_10?: number;      // Cannabis-Craving (0–10)
  cws0_50?: number;      // Withdrawal (Summe 0–50)
  who5_0_25?: number;    // WHO-5 (Summe 0–25)
  pss4_0_16?: number;    // PSS-4 (0–16, nach Reverse)
  isi2_0_8?: number;     // ISI-mini (2 Items 0–4; Summe 0–8)
};

export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/** Normalisierte Prozentwerte (1 = gut) für Dashboard-Kreise */
export function normCravingPercent(mcq0_10?: number): number {
  if (mcq0_10 == null || Number.isNaN(mcq0_10)) return 0.5;
  return clamp(1 - mcq0_10 / 10, 0, 1);
}

export function normWithdrawalPercent(cws0_50?: number): number {
  if (cws0_50 == null || Number.isNaN(cws0_50)) return 0.5;
  return clamp(1 - cws0_50 / 50, 0, 1);
}

export function normWellbeingPercent(who5_0_25?: number): number {
  if (who5_0_25 == null || Number.isNaN(who5_0_25)) return 0;
  const n = clamp(who5_0_25, 0, 25) / 25;
  return clamp(n, 0, 1);                // mehr Wohlbefinden = besser
}

export function normStressPercent(pss4_0_16?: number): number {
  if (pss4_0_16 == null || Number.isNaN(pss4_0_16)) return 0;
  const n = clamp(pss4_0_16, 0, 16) / 16;
  return clamp(1 - n, 0, 1);            // weniger Stress = besser
}

export function normInsomniaPercent(isi2_0_8?: number): number {
  if (isi2_0_8 == null || Number.isNaN(isi2_0_8)) return 0;
  const n = clamp(isi2_0_8, 0, 8) / 8;
  return clamp(1 - n, 0, 1);            // weniger Schlafprobleme = besser
}

export function normSleepPercent(isi2_0_8?: number): number {
  if (isi2_0_8 == null || Number.isNaN(isi2_0_8)) return 0.5;
  return clamp(1 - isi2_0_8 / 8, 0, 1);
}

/** Schwächste Metrik ermitteln (für „Erkunden“) */
export type MetricKey = 'craving' | 'withdrawal' | 'wellbeing' | 'stress' | 'sleep';
export type SimpleMetrics = { craving: number; withdrawal: number; sleep: number };

// Overloads: simple metrics object OR full Checkin
export function weakestMetric(p: { craving: number; withdrawal: number; sleep: number }): { key: 'craving' | 'withdrawal' | 'sleep'; percent: number };
export function weakestMetric(checkin: Checkin): { key: MetricKey; percent: number };
export function weakestMetric(arg: SimpleMetrics | Checkin): { key: any; percent: number } {
  if ('craving' in (arg as any) && 'withdrawal' in (arg as any) && 'sleep' in (arg as any)) {
    const p = arg as SimpleMetrics;
    const list = [
      { key: 'craving', percent: clamp(p.craving, 0, 1) },
      { key: 'withdrawal', percent: clamp(p.withdrawal, 0, 1) },
      { key: 'sleep', percent: clamp(p.sleep, 0, 1) },
    ];
    return list.reduce((min, cur) => (cur.percent < min.percent ? cur : min), list[0]);
  }
  const checkin = arg as Checkin;
  const candidates: { key: MetricKey; percent: number }[] = [
    { key: 'craving', percent: normCravingPercent(checkin.mcq0_10) },
    { key: 'withdrawal', percent: normWithdrawalPercent(checkin.cws0_50) },
    { key: 'wellbeing', percent: normWellbeingPercent(checkin.who5_0_25) },
    { key: 'stress', percent: normStressPercent(checkin.pss4_0_16) },
    { key: 'sleep', percent: normSleepPercent(checkin.isi2_0_8) },
  ];
  return candidates.reduce((min, cur) => (cur.percent < min.percent ? cur : min), candidates[0]);
}

export function weakestMetricKey(p: SimpleMetrics): 'craving' | 'withdrawal' | 'sleep' {
  const entries = Object.entries(p).sort((a, b) => (a[1] as number) - (b[1] as number));
  return entries[0][0] as 'craving' | 'withdrawal' | 'sleep';
}

/** PSS-4 Scoring (2 von 4 Items sind invertiert)
 * Items-Skala: 0–4 je Item. Items 2 und 3 werden invertiert (4 - wert).
 * Ergebnis: Summe 0–16 (höher = mehr Stress).
 */
export function scorePSS4(items: number[]): number;
export function scorePSS4(i1: number, i2: number, i3: number, i4: number): number;
export function scorePSS4(...args: any[]): number {
  const items: number[] = Array.isArray(args[0]) ? (args[0] as number[]) : (args as number[]);
  const [i1, i2, i3, i4] = items.map((v) => clamp(v ?? 0, 0, 4)) as [number, number, number, number];
  const inv = (x: number) => 4 - x;
  const sum = i1 + inv(i2) + inv(i3) + i4;
  return clamp(sum, 0, 16);
}

/** WHO-5 Prozent (0–100, höher = besser) */
export function who5Percent(who5_0_25?: number): number | undefined {
  if (who5_0_25 == null || Number.isNaN(who5_0_25)) return undefined;
  return clamp((who5_0_25 / 25) * 100, 0, 100);
}


export function sortMetricsWeakToStrong(checkin: Checkin): { key: MetricKey; percent: number }[] {
  const list = [
    { key: 'craving', percent: normCravingPercent(checkin.mcq0_10) },
    { key: 'withdrawal', percent: normWithdrawalPercent(checkin.cws0_50) },
    { key: 'wellbeing', percent: normWellbeingPercent(checkin.who5_0_25) },
    { key: 'stress', percent: normStressPercent(checkin.pss4_0_16) },
    { key: 'sleep', percent: normSleepPercent(checkin.isi2_0_8) },
  ];
  return list.sort((a, b) => a.percent - b.percent);
}

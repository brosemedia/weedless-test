import type { Milestone } from '../types/milestone';

const STEP_BY_KIND: Record<Milestone['kind'], number> = {
  money: 0.01, // Cent-genau
  count: 1,
  streak: 1,
  pause: 1,
};

/**
 * Liefert ein an die Anzeige gekoppeltes Fortschrittsverhältnis.
 * - Halb-Schritt-Korrektur sorgt dafür, dass Balken und Zahl gleichzeitig „umklappen“.
 * - Verhindert, dass der Balken 100% erreicht, bevor der Schwellenwert tatsächlich erreicht ist.
 */
export function computeMilestoneCompletion(progressValue: number, milestone: Milestone): number {
  const threshold = milestone.threshold || 0;
  if (threshold <= 0) return 1;

  const step = STEP_BY_KIND[milestone.kind] ?? 1;
  const epsilon = step * 1e-6;
  const halfStep = step / 2;
  const adjusted = Math.max(0, progressValue + halfStep + epsilon);

  if (adjusted >= threshold) return 1;

  const ratio = progressValue / threshold;
  return Math.max(0, Math.min(0.9999, ratio));
}


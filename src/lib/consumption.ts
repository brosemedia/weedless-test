import { GRAMS_PER_JOINT_DEFAULT } from './tasks';
import type {
  ConsumptionEntry,
  ConsumptionMethod,
  DayLog,
  PaidByUser,
  Profile,
} from '../types/profile';

export type ConsumptionQuantityUnit = 'grams' | 'joints';

export type ConsumptionFormValues = {
  quantity: string;
  unit: ConsumptionQuantityUnit;
  method: ConsumptionMethod;
  durationMinutes: string;
  paidByUser: PaidByUser;
  amountSpent: string;
};

export type NormalizedConsumption = {
  grams: number;
  joints?: number;
  sessionMinutes?: number;
  method?: ConsumptionMethod;
  paidByUser: PaidByUser;
  amountSpent?: number;
};

const randomId = () => Math.random().toString(36).slice(2, 10);

export const createEmptyConsumptionForm = (): ConsumptionFormValues => ({
  quantity: '',
  unit: 'grams',
  method: 'joint',
  durationMinutes: '',
  paidByUser: 'unknown',
  amountSpent: '',
});

export const parseNumberInput = (raw: string) => {
  if (!raw?.trim()) return NaN;
  const normalized = raw.replace(',', '.');
  const value = Number(normalized);
  return Number.isFinite(value) ? value : NaN;
};

export const gramsPerJointFromProfile = (profile?: Profile | null) => {
  if (!profile) return GRAMS_PER_JOINT_DEFAULT;
  if (profile.gramsPerDayBaseline && profile.jointsPerDayBaseline) {
    const ratio = profile.gramsPerDayBaseline / Math.max(1, profile.jointsPerDayBaseline);
    if (Number.isFinite(ratio) && ratio > 0) {
      return ratio;
    }
  }
  return GRAMS_PER_JOINT_DEFAULT;
};

export const normalizeConsumptionForm = (
  value: ConsumptionFormValues,
  gramsPerJoint: number
): NormalizedConsumption => {
  const quantityValue = parseNumberInput(value.quantity);
  const minutesValue = parseNumberInput(value.durationMinutes);
  const amountValue = parseNumberInput(value.amountSpent);
  const hasQuantity = Number.isFinite(quantityValue) && quantityValue > 0;
  const grams =
    hasQuantity && value.unit === 'grams'
      ? quantityValue
      : hasQuantity && gramsPerJoint > 0
      ? quantityValue * gramsPerJoint
      : 0;
  const joints =
    hasQuantity && value.unit === 'joints'
      ? quantityValue
      : hasQuantity && gramsPerJoint > 0
      ? grams / gramsPerJoint
      : undefined;
  const sessionMinutes = Number.isFinite(minutesValue) && minutesValue > 0 ? minutesValue : undefined;
  const amountSpent =
    value.paidByUser === 'yes' && Number.isFinite(amountValue) && amountValue > 0 ? amountValue : undefined;
  return {
    grams,
    joints: typeof joints === 'number' && Number.isFinite(joints) && joints > 0 ? joints : undefined,
    sessionMinutes,
    method: value.method,
    paidByUser: value.paidByUser,
    amountSpent,
  };
};

export const createConsumptionEntry = (input: NormalizedConsumption): ConsumptionEntry => ({
  id: `consumption_${randomId()}`,
  createdAt: Date.now(),
  grams: input.grams > 0 ? input.grams : undefined,
  joints: input.joints,
  sessionMinutes: input.sessionMinutes,
  method: input.method,
  paidByUser: input.paidByUser,
  amountSpent: input.amountSpent,
});

export const findLastSpentAmount = (dayLogs: Record<string, DayLog>) => {
  const recent = Object.values(dayLogs)
    .flatMap((log) => log.consumptionEntries ?? [])
    .filter((entry): entry is ConsumptionEntry & { amountSpent: number } => typeof entry.amountSpent === 'number' && entry.amountSpent > 0)
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  return recent[0]?.amountSpent ?? null;
};

export const deriveDefaultAmountSpent = (dayLogs: Record<string, DayLog>, profile?: Profile | null) => {
  const last = findLastSpentAmount(dayLogs);
  if (last && last > 0) {
    return last;
  }
  if (profile?.costPerJoint && profile.costPerJoint > 0) {
    return profile.costPerJoint;
  }
  if (profile?.pricePerGram && profile.pricePerGram > 0) {
    return profile.pricePerGram;
  }
  return null;
};

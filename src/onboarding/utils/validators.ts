import { z } from 'zod';
import type { Goal, OnboardingProfile, Unit } from '../types';

export const DEFAULT_GRAMS_PER_JOINT = 0.3;
export const DEFAULT_POTENCY_THC = 18;
export const DEFAULT_REMINDER_TIME = '20:30';

export const unitEnum = z.enum(['day', 'week', 'month']);

export const onboardingSchemas = {
  goals: z.object({
    goal: z.enum(['pause', 'reduce', 'quit', 'track']),
  }),
  regionCurrency: z.object({
    region: z.string().min(2),
    currency: z.string().min(3),
  }),
  forms: z.object({
    forms: z.array(z.string()).min(1),
  }),
  frequency: z
    .object({
      forms: z.array(z.string()).min(1),
      frequency: z.object({
        unit: unitEnum,
        jointsPerUnit: z.number().optional(),
        sessionsPerUnit: z.number().optional(),
        hitsPerUnit: z.number().optional(),
        portionsPerUnit: z.number().optional(),
        gramsPerJoint: z.number().nullable().optional(),
        mgPerPortion: z.number().nullable().optional(),
        potencyTHC: z.number().nullable().optional(),
      }),
    })
    .refine(
      ({ frequency }) =>
        !!frequency.jointsPerUnit ||
        !!frequency.sessionsPerUnit ||
        !!frequency.hitsPerUnit ||
        !!frequency.portionsPerUnit,
      { message: 'Mindestens ein Wert erforderlich' }
    ),
  potency: z.object({
    potencyTHC: z.number().nullable().optional(),
  }),
  spend: z.object({
    amount: z.number().nullable().optional(),
    unit: unitEnum,
  }),
  quit: z.object({
    quitDateISO: z.string().optional(),
    pauseLengthDays: z.number().nullable().optional(),
  }),
  triggers: z.object({
    triggers: z.array(z.string()).max(5),
  }),
  baseline: z.object({
    sleepQ: z.number().min(1).max(5).optional(),
    mood: z.number().min(1).max(5).optional(),
    stress: z.number().min(1).max(5).optional(),
  }),
  connections: z.object({
    healthKit: z.boolean(),
    screenTime: z.boolean(),
    calendar: z.boolean(),
  }),
  reminders: z.object({
    checkInTimeLocal: z.string().optional(),
    nudgeLevel: z.enum(['low', 'medium', 'high']),
    relapseSupport: z.boolean(),
  }),
  motivation: z.object({
    motivations: z.array(z.string()).max(3),
    commitment: z.string().optional(),
  }),
  legal: z.object({
    ageConfirmed: z.literal(true, {
      errorMap: () => ({ message: 'Notwendig' }),
    }),
    disclaimerAccepted: z.literal(true, {
      errorMap: () => ({ message: 'Notwendig' }),
    }),
  }),
  account: z.object({
    method: z.enum(['anonymous', 'apple', 'google']),
  }),
};

export const parseNumberInput = (value: string): number | null => {
  if (!value) return null;
  const normalized = value.replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

export const ensureUnit = (value: Unit | string): Unit => {
  if (value === 'day' || value === 'week' || value === 'month') {
    return value;
  }
  return 'week';
};

export const ensureGoal = (value: Goal | string): Goal => {
  if (value === 'pause' || value === 'reduce' || value === 'quit' || value === 'track') {
    return value;
  }
  return 'track';
};

export const mergeProfile = (current: OnboardingProfile, patch: Partial<OnboardingProfile>): OnboardingProfile => ({
  ...current,
  ...patch,
});

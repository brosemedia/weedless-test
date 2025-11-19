import { Profile } from '../types/profile';

export const isProfileComplete = (p: Profile | null) =>
  !!p &&
  (!!p.pricePerGram || !!p.costPerJoint) &&
  (!!p.gramsPerDayBaseline || !!p.jointsPerDayBaseline) &&
  typeof p.startTimestamp === 'number';

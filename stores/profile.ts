import { useStore } from '../src/store/useStore';
import type { Profile } from '../src/types';

export type OnboardingProfile = Profile;

export async function loadProfile(): Promise<OnboardingProfile> {
  return useStore.getState().profile;
}

export async function saveProfile(next: Partial<OnboardingProfile>) {
  useStore.getState().updateProfile(next);
}

export function subscribeProfile(fn: (p: OnboardingProfile) => void) {
  return useStore.subscribe((state) => {
    try {
      fn(state.profile);
    } catch (error) {
      console.warn('profile subscriber failed', error);
    }
  });
}

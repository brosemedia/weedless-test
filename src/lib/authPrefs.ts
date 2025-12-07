import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_PREF_KEY = 'hazeless-auth-pref';

export type AuthPref = {
  hasAccount: boolean;
  lastSignedOut: boolean;
};

const DEFAULT_PREF: AuthPref = {
  hasAccount: false,
  lastSignedOut: false,
};

export async function loadAuthPref(): Promise<AuthPref> {
  try {
    const raw = await AsyncStorage.getItem(AUTH_PREF_KEY);
    if (!raw) return DEFAULT_PREF;
    const parsed = JSON.parse(raw) as Partial<AuthPref>;
    return {
      hasAccount: parsed.hasAccount ?? false,
      lastSignedOut: parsed.lastSignedOut ?? false,
    };
  } catch (error) {
    console.warn('Failed to load auth pref', error);
    return DEFAULT_PREF;
  }
}

async function saveAuthPref(pref: AuthPref) {
  try {
    await AsyncStorage.setItem(AUTH_PREF_KEY, JSON.stringify(pref));
  } catch (error) {
    console.warn('Failed to save auth pref', error);
  }
}

export async function markSignedIn() {
  const current = await loadAuthPref();
  await saveAuthPref({
    hasAccount: true,
    lastSignedOut: false,
  });
  return current;
}

export async function markSignedOut() {
  const current = await loadAuthPref();
  await saveAuthPref({
    hasAccount: current.hasAccount || true,
    lastSignedOut: true,
  });
  return current;
}

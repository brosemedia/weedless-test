import AsyncStorage from '@react-native-async-storage/async-storage';

const CLOUD_CONSENT_SHOWN_KEY = 'hazeless.cloudConsentShown';

/**
 * Checks if the cloud consent screen has been shown to the user.
 * This prevents nagging the user on every app launch if they chose "Nicht jetzt".
 */
export async function getCloudConsentShown(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(CLOUD_CONSENT_SHOWN_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error reading cloudConsentShown flag:', error);
    return false;
  }
}

/**
 * Marks that the cloud consent screen has been shown to the user.
 */
export async function setCloudConsentShown(shown: boolean): Promise<void> {
  try {
    if (shown) {
      await AsyncStorage.setItem(CLOUD_CONSENT_SHOWN_KEY, 'true');
    } else {
      await AsyncStorage.removeItem(CLOUD_CONSENT_SHOWN_KEY);
    }
  } catch (error) {
    console.error('Error setting cloudConsentShown flag:', error);
  }
}


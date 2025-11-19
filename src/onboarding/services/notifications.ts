import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { addDays, isValid, parseISO } from 'date-fns';
import type { OnboardingProfile } from '../types';

const MILESTONES = [1, 3, 7, 14, 30] as const;

const ensurePermissionsAsync = async () => {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    await Notifications.requestPermissionsAsync();
  }
};

const ensureChannelAsync = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('weedless-default', {
      name: 'Weedless Erinnerungen',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
};

export const cancelAllOnboardingNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

export const scheduleAllOnboardingNotifications = async (profile: OnboardingProfile) => {
  await ensurePermissionsAsync();
  await ensureChannelAsync();
  await cancelAllOnboardingNotifications();

  const { reminders, quitDateISO, goal } = profile;

  if (reminders.checkInTimeLocal) {
    const [hour = 20, minute = 30] = reminders.checkInTimeLocal.split(':').map(Number);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Weedless Tracken',
        body: 'Wie fühlst du dich heute? Ein kurzes Tracken hilft dir auf Kurs zu bleiben.',
        sound: true,
      },
      trigger: {
        hour,
        minute,
        repeats: true,
        channelId: 'weedless-default',
      },
    });
  }

  const base = quitDateISO ? parseISO(quitDateISO) : new Date();
  if (!isValid(base)) {
    return;
  }

  for (const days of MILESTONES) {
    const target = addDays(base, days);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Tag ${days}`,
        body:
          goal === 'pause'
            ? `Du bist seit ${days} Tagen in deiner Pause – weiter so!`
            : `Großartig! ${days} Tage auf Kurs.`,
        sound: true,
      },
      trigger: { channelId: 'weedless-default', date: target },
    });
  }
};

import { Platform, Vibration } from 'react-native';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';

export type HapticMode = 'game' | 'pause' | 'breath' | 'dashboard' | 'onboarding' | 'general';

export type HapticFeedbackType =
  | 'success'
  | 'error'
  | 'selection'
  | 'impact'
  | 'celebration'
  | 'threshold'
  | 'rhythmic'
  | 'completion'
  | 'notification';

export type HapticIntensity = 'light' | 'medium' | 'heavy';

interface HapticOptions {
  intensity?: HapticIntensity;
  duration?: number; // Für rhythmische Muster
}

// Globaler Cache für hapticsEnabled, der von außen gesetzt wird
// Dies vermeidet Hook-Probleme beim Zugriff auf den Store
let globalHapticsEnabled: boolean | null = null;
let warnedSimulator = false;

/**
 * Setzt den globalen Haptik-Status (wird von der Settings-Seite aufgerufen)
 */
export function setGlobalHapticsEnabled(enabled: boolean): void {
  globalHapticsEnabled = enabled;
}

class HapticsService {
  /**
   * Prüft ob Haptik aktiviert ist
   * Verwendet globalen Cache, um Hook-Probleme zu vermeiden
   */
  isEnabled(): boolean {
    // Wenn globaler Cache gesetzt ist, verwende diesen
    if (globalHapticsEnabled !== null) {
      return globalHapticsEnabled;
    }

    // Fallback: Default aktiviert
    // Der Cache wird von der Settings-Seite gesetzt, wenn der Store initialisiert ist
    return true;
  }

  /**
   * Hauptmethode zum Auslösen von Haptik-Feedback
   */
  async trigger(
    mode: HapticMode,
    type: HapticFeedbackType,
    options: HapticOptions = {}
  ): Promise<void> {
    const enabled = this.isEnabled();
    console.log('[Haptics] trigger called:', { mode, type, enabled, platform: Platform.OS });
    
    if (!enabled) {
      console.log('[Haptics] Haptics disabled, skipping');
      return;
    }

    if (Platform.OS === 'web') {
      console.log('[Haptics] Web platform, skipping');
      return; // Keine Haptik im Web
    }

    const isIosSimulator = Platform.OS === 'ios' && Constants?.isDevice === false;
    if (isIosSimulator) {
      if (!warnedSimulator) {
        console.warn('[Haptics] iOS simulator detected, skipping haptics to avoid native errors.');
        warnedSimulator = true;
      }
      return;
    }

    try {
      switch (mode) {
        case 'game':
          await this.triggerGameFeedback(type, options);
          break;
        case 'pause':
          await this.triggerPauseFeedback(type, options);
          break;
        case 'breath':
          await this.triggerBreathFeedback(type, options);
          break;
        case 'dashboard':
          await this.triggerDashboardFeedback(type, options);
          break;
        case 'onboarding':
          await this.triggerOnboardingFeedback(type, options);
          break;
        case 'general':
          await this.triggerGeneralFeedback(type, options);
          break;
      }
      console.log('[Haptics] Successfully triggered:', { mode, type });
    } catch (error: any) {
      console.warn('[Haptics] Error triggering haptic feedback:', error);
    }
  }

  /**
   * Game-Modus: Für Minigames
   */
  private async triggerGameFeedback(
    type: HapticFeedbackType,
    options: HapticOptions
  ): Promise<void> {
    console.log('[Haptics] triggerGameFeedback:', { type, platform: Platform.OS });
    if (Platform.OS === 'ios') {
      try {
        switch (type) {
          case 'success':
            // Kurze, schnelle Doppel-Vibration
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await this.delay(50);
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            break;
          case 'error':
            // Lange, tiefe Vibration
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            break;
          case 'impact':
            // Mittlere, präzise Vibration
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            break;
          case 'celebration':
            // Sequenz von kurzen, aufsteigenden Vibrationen
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            await this.delay(80);
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await this.delay(80);
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            await this.delay(100);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            break;
          default:
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        console.log('[Haptics] iOS haptic triggered successfully');
      } catch (error: any) {
        // Ignoriere Hook-Fehler (können von expo-haptics intern kommen)
        if (error?.message?.includes('Invalid hook call')) {
          console.warn('[Haptics] Hook error ignored (likely from expo-haptics):', error.message);
          return;
        }
        console.error('[Haptics] Error in triggerGameFeedback iOS:', error);
        // Werfe Fehler nicht weiter, um App nicht zu crashen
      }
    } else {
      // Android Fallback
      switch (type) {
        case 'success':
          Vibration.vibrate([0, 50, 50, 50]);
          break;
        case 'error':
          Vibration.vibrate([0, 200]);
          break;
        case 'impact':
          Vibration.vibrate(50);
          break;
        case 'celebration':
          Vibration.vibrate([0, 50, 50, 50, 50, 100]);
          break;
        default:
          Vibration.vibrate(50);
      }
    }
  }

  /**
   * Pause-Modus: Für Pause-Check-in und Planung
   */
  private async triggerPauseFeedback(
    type: HapticFeedbackType,
    options: HapticOptions
  ): Promise<void> {
    const intensity = options.intensity ?? 'light';
    const impactStyle =
      intensity === 'heavy'
        ? Haptics.ImpactFeedbackStyle.Heavy
        : intensity === 'medium'
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Light;
    const durationForIntensity = intensity === 'heavy' ? 70 : intensity === 'medium' ? 45 : 25;

    if (Platform.OS === 'ios') {
      switch (type) {
        case 'success':
          // Sanfte, aber skalierte Doppel-Vibration
          await Haptics.impactAsync(impactStyle);
          await this.delay(90);
          await Haptics.impactAsync(impactStyle);
          break;
        case 'threshold':
          // Leichte Vibration bei Schwellenwerten
          await Haptics.impactAsync(impactStyle);
          break;
        case 'selection':
          // Sehr leichte Vibration
          await Haptics.selectionAsync();
          break;
        default:
          await Haptics.impactAsync(impactStyle);
      }
    } else {
      // Android Fallback
      switch (type) {
        case 'success':
          Vibration.vibrate([0, durationForIntensity, 80, durationForIntensity]);
          break;
        case 'threshold':
          Vibration.vibrate(durationForIntensity);
          break;
        case 'selection':
          Vibration.vibrate(20);
          break;
        default:
          Vibration.vibrate(durationForIntensity);
      }
    }
  }

  /**
   * Breath-Modus: Für Atemübung
   */
  private async triggerBreathFeedback(
    type: HapticFeedbackType,
    options: HapticOptions
  ): Promise<void> {
    if (Platform.OS === 'ios') {
      switch (type) {
        case 'rhythmic':
          // Rhythmische, beruhigende Vibrationen
          const duration = options.duration ?? 4000;
          const cycles = Math.floor(duration / 2000); // 2 Sekunden pro Zyklus
          for (let i = 0; i < cycles; i++) {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            await this.delay(1000);
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            await this.delay(1000);
          }
          break;
        case 'completion':
          // Sanfte, ausklingende Vibration
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          await this.delay(150);
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          await this.delay(150);
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        default:
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } else {
      // Android Fallback
      switch (type) {
        case 'rhythmic':
          const pattern = [0];
          const cycles = Math.floor((options.duration ?? 4000) / 2000);
          for (let i = 0; i < cycles; i++) {
            pattern.push(30, 1000, 30, 1000);
          }
          Vibration.vibrate(pattern);
          break;
        case 'completion':
          Vibration.vibrate([0, 30, 150, 30, 150, 30]);
          break;
        default:
          Vibration.vibrate(30);
      }
    }
  }

  /**
   * Dashboard-Modus: Für Dashboard-Interaktionen
   */
  private async triggerDashboardFeedback(
    type: HapticFeedbackType,
    options: HapticOptions
  ): Promise<void> {
    if (Platform.OS === 'ios') {
      switch (type) {
        case 'impact':
          const intensity = options.intensity ?? 'medium';
          const style =
            intensity === 'light'
              ? Haptics.ImpactFeedbackStyle.Light
              : intensity === 'heavy'
                ? Haptics.ImpactFeedbackStyle.Heavy
                : Haptics.ImpactFeedbackStyle.Medium;
          await Haptics.impactAsync(style);
          break;
        case 'success':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'notification':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        default:
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } else {
      // Android Fallback
      switch (type) {
        case 'impact':
          const duration = options.intensity === 'heavy' ? 80 : options.intensity === 'light' ? 30 : 50;
          Vibration.vibrate(duration);
          break;
        case 'success':
          Vibration.vibrate(50);
          break;
        case 'notification':
          Vibration.vibrate([0, 50, 50, 50]);
          break;
        default:
          Vibration.vibrate(50);
      }
    }
  }

  /**
   * Onboarding-Modus: Für Onboarding-Flows
   */
  private async triggerOnboardingFeedback(
    type: HapticFeedbackType,
    options: HapticOptions
  ): Promise<void> {
    if (Platform.OS === 'ios') {
      switch (type) {
        case 'selection':
          await Haptics.selectionAsync();
          break;
        case 'threshold':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'impact':
          const intensity = options.intensity ?? 'light';
          const style =
            intensity === 'light'
              ? Haptics.ImpactFeedbackStyle.Light
              : intensity === 'medium'
                ? Haptics.ImpactFeedbackStyle.Medium
                : Haptics.ImpactFeedbackStyle.Heavy;
          await Haptics.impactAsync(style);
          break;
        default:
          await Haptics.selectionAsync();
      }
    } else {
      // Android Fallback
      switch (type) {
        case 'selection':
          Vibration.vibrate(20);
          break;
        case 'threshold':
          Vibration.vibrate(30);
          break;
        case 'impact':
          const duration = options.intensity === 'heavy' ? 60 : options.intensity === 'medium' ? 40 : 20;
          Vibration.vibrate(duration);
          break;
        default:
          Vibration.vibrate(20);
      }
    }
  }

  /**
   * General-Modus: Für allgemeine UI-Interaktionen
   */
  private async triggerGeneralFeedback(
    type: HapticFeedbackType,
    options: HapticOptions
  ): Promise<void> {
    if (Platform.OS === 'ios') {
      switch (type) {
        case 'selection':
          await Haptics.selectionAsync();
          break;
        case 'impact':
          const intensity = options.intensity ?? 'medium';
          const style =
            intensity === 'light'
              ? Haptics.ImpactFeedbackStyle.Light
              : intensity === 'medium'
                ? Haptics.ImpactFeedbackStyle.Medium
                : Haptics.ImpactFeedbackStyle.Heavy;
          await Haptics.impactAsync(style);
          break;
        case 'notification':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        default:
          await Haptics.selectionAsync();
      }
    } else {
      // Android Fallback
      switch (type) {
        case 'selection':
          Vibration.vibrate(20);
          break;
        case 'impact':
          const duration = options.intensity === 'heavy' ? 60 : options.intensity === 'light' ? 30 : 50;
          Vibration.vibrate(duration);
          break;
        case 'notification':
          Vibration.vibrate([0, 50, 50, 50]);
          break;
        default:
          Vibration.vibrate(20);
      }
    }
  }

  /**
   * Hilfsmethode für Delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton-Instanz
export const haptics = new HapticsService();

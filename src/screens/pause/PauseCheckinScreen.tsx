/**
 * PauseCheckinScreen - Check-in bei aktiver Pause
 * 
 * Zeigt einen Swipe-Slider, mit dem der Nutzer angibt, ob er geraucht hat oder nicht.
 * - Nach links: "Ich habe geraucht" → öffnet blocking Konsum-Flow
 * - Nach rechts: "Nicht geraucht" → speichert Check-in und navigiert ins Dashboard
 */
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { haptics } from '../../services/haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme/useTheme';
import { ThemedText } from '../../design/theme';
import { spacing, radius } from '../../design/tokens';
import { useApp } from '../../store/app';
import { toDateKey } from '../../lib/pause';
import ConsumptionFormFields from '../../components/ConsumptionFormFields';
import {
  createConsumptionEntry,
  createEmptyConsumptionForm,
  deriveDefaultAmountSpent,
  gramsPerJointFromProfile,
  normalizeConsumptionForm,
  type ConsumptionFormValues,
} from '../../lib/consumption';
import type { DayLog } from '../../types/profile';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HAPTIC_THRESHOLDS = [0.25, 0.5, 0.75]; // Schwellen für Haptik-Impulse

// Slider Track Konfiguration (außerhalb der Komponente für Stabilität)
const TRACK_WIDTH = SCREEN_WIDTH * 0.85;
const THUMB_SIZE = 72;
const MAX_TRANSLATE = (TRACK_WIDTH - THUMB_SIZE) / 2;
const SWIPE_THRESHOLD = MAX_TRANSLATE * 0.7;

type PauseCheckinScreenProps = {
  navigation: any;
};

export default function PauseCheckinScreen({ navigation }: PauseCheckinScreenProps) {
  const { theme } = useTheme();
  const palette = theme.colors;
  const insets = useSafeAreaInsets();
  
  const profile = useApp((s) => s.profile);
  const dayLogs = useApp((s) => s.dayLogs);
  const upsertDayLog = useApp((s) => s.upsertDayLog);
  const addDailyCheckIn = useApp((s) => s.addDailyCheckIn);
  
  const [showConsumptionModal, setShowConsumptionModal] = useState(false);
  const [consumptionForm, setConsumptionForm] = useState<ConsumptionFormValues>(() => createEmptyConsumptionForm());
  const [consumptionError, setConsumptionError] = useState<string | null>(null);
  
  const translateX = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const lastHapticThreshold = useSharedValue<number | null>(null);
  
  const gramsPerJoint = gramsPerJointFromProfile(profile);
  const defaultAmountSuggestion = deriveDefaultAmountSpent(dayLogs, profile);
  
  // Handler für "Nicht geraucht"
  const handleNotSmoked = useCallback(() => {
    const todayKey = toDateKey(new Date());
    addDailyCheckIn(todayKey, false);
    
    // Navigiere ins Dashboard
    navigation.replace('Tabs', { screen: 'Dashboard' });
  }, [addDailyCheckIn, navigation]);

  // Wrapper-Funktionen für Haptik (runOnJS benötigt synchrone Funktionen)
  const triggerHapticThreshold = useCallback(() => {
    haptics.trigger('pause', 'threshold').catch((error) => {
      console.warn('[PauseCheckin] Haptic error:', error);
    });
  }, []);

  const triggerHapticSuccess = useCallback(() => {
    haptics.trigger('pause', 'success').catch((error) => {
      console.warn('[PauseCheckin] Haptic error:', error);
    });
  }, []);
  
  
  // Pan-Gesture für Swipe-Logik - stabilisiert mit useMemo
  const panGesture = useMemo(() => {
    return Gesture.Pan()
      .onStart(() => {
        isDragging.value = true;
        lastHapticThreshold.value = -1;
      })
      .onUpdate((e) => {
        // Begrenze die Bewegung auf den Track
        const newValue = Math.max(-MAX_TRANSLATE, Math.min(MAX_TRANSLATE, e.translationX));
        translateX.value = newValue;
        
        // Vereinfachte Haptik-Impulse bei Schwellen
        const normalized = Math.abs(newValue) / MAX_TRANSLATE;
        let thresholdIndex = -1;
        
        if (normalized >= 0.75) {
          thresholdIndex = 2;
        } else if (normalized >= 0.5) {
          thresholdIndex = 1;
        } else if (normalized >= 0.25) {
          thresholdIndex = 0;
        }
        
        if (thresholdIndex !== -1 && lastHapticThreshold.value !== thresholdIndex) {
          lastHapticThreshold.value = thresholdIndex;
          runOnJS(triggerHapticThreshold)();
        }
      })
      .onEnd(() => {
        isDragging.value = false;
        const absTranslate = Math.abs(translateX.value);
        
        if (absTranslate >= SWIPE_THRESHOLD) {
          // Auslösung - stärkeres Haptik-Feedback
          runOnJS(triggerHapticSuccess)();
          
          if (translateX.value < 0) {
            // Nach links: "Ich habe geraucht"
            runOnJS(setShowConsumptionModal)(true);
          } else {
            // Nach rechts: "Nicht geraucht"
            runOnJS(handleNotSmoked)();
          }
        }
        
        // Zurück zur Mitte springen
        translateX.value = withSpring(0, {
          damping: 15,
          stiffness: 200,
        });
      });
  }, [handleNotSmoked, triggerHapticThreshold, triggerHapticSuccess, setShowConsumptionModal]);
  
  // Animierter Style für den Regler
  const thumbStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  // Animierter Style für den gefüllten Track-Bereich
  const filledTrackStyle = useAnimatedStyle(() => {
    const center = TRACK_WIDTH / 2 - 6; // -6 für Track-Höhe (12/2)
    const absValue = Math.abs(translateX.value);
    const width = absValue > 0 ? absValue : 0;
    const left = translateX.value < 0 ? center + translateX.value : center;
    
    return {
      width,
      left,
      opacity: interpolate(
        absValue,
        [0, MAX_TRANSLATE],
        [0.3, 0.6],
        Extrapolation.CLAMP
      ),
    };
  });
  
  // Style für Hintergrund-Labels
  const leftLabelStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0.3],
      Extrapolation.CLAMP
    );
    return { opacity };
  });
  
  const rightLabelStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0.3, 1],
      Extrapolation.CLAMP
    );
    return { opacity };
  });
  
  // Handler für Konsum-Submit
  const handleConsumptionSubmit = () => {
    setConsumptionError(null);
    
    const normalized = normalizeConsumptionForm(consumptionForm, gramsPerJoint);
    if (normalized.grams <= 0) {
      setConsumptionError('Bitte Menge in Gramm oder Joints angeben.');
      return;
    }
    if (consumptionForm.paidByUser === 'yes' && !normalized.amountSpent) {
      setConsumptionError('Bitte Betrag größer 0 € eingeben.');
      return;
    }
    
    const entry = createConsumptionEntry(normalized);
    const key = toDateKey(new Date());
    const existing = dayLogs[key];
    const totalGrams = (existing?.consumedGrams ?? 0) + (entry.grams ?? normalized.grams);
    const totalJoints = (existing?.consumedJoints ?? 0) + (entry.joints ?? 0);
    const totalMinutes = (existing?.sessionMinutes ?? 0) + (entry.sessionMinutes ?? 0);
    const costDelta =
      entry.paidByUser === 'yes' && entry.amountSpent ? entry.amountSpent : 0;
    const totalCost =
      costDelta > 0 ? (existing?.moneySpentEUR ?? 0) + costDelta : existing?.moneySpentEUR;
    const nextEntries = [...(existing?.consumptionEntries ?? []), entry];
    
    const nextLog: Partial<DayLog> & { date: string } = {
      date: key,
      consumedGrams: totalGrams,
      consumptionEntries: nextEntries,
      checkin: {
        usedToday: true,
        amountGrams: normalized.grams,
        cravings0to10: 0,
        mood1to5: 3,
        sleepHours: 0,
        recordedAt: Date.now(),
      },
    };
    
    if (totalJoints > 0) {
      nextLog.consumedJoints = totalJoints;
    }
    if (totalMinutes > 0) {
      nextLog.sessionMinutes = totalMinutes;
    }
    if (typeof totalCost === 'number') {
      nextLog.moneySpentEUR = totalCost;
    }
    
    upsertDayLog({
      ...nextLog,
      lastConsumptionAt: Date.now(),
    });
    
    // Schließe Modal und navigiere ins Dashboard
    setShowConsumptionModal(false);
    navigation.replace('Tabs', { screen: 'Dashboard' });
  };
  
  // Grüner Gradient-Hintergrund - schöne, beruhigende Farben
  const gradientColors = ['#0F5132', '#1B5E20', '#2E7D32', '#4CAF50', '#66BB6A'];
  const gradientLocations = [0, 0.2, 0.5, 0.8, 1];
  
  // Animierter Gradient-Effekt für mehr Tiefe
  const gradientAnimation = useSharedValue(0);
  
  useEffect(() => {
    gradientAnimation.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 8000 }),
        withTiming(0, { duration: 8000 })
      ),
      -1,
      false
    );
  }, []);
  
  const animatedGradientStyle = useAnimatedStyle(() => {
    const offset = interpolate(gradientAnimation.value, [0, 1], [0, 0.15]);
    return {
      opacity: 1,
      transform: [{ translateY: offset * 20 }],
    };
  });
  
  // Text-Farben für guten Kontrast auf grünem Hintergrund
  const textColor = '#FFFFFF';
  const textMutedColor = 'rgba(255, 255, 255, 0.85)';
  const hintBgColor = 'rgba(255, 255, 255, 0.15)';
  
  return (
    <>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Gradient-Hintergrund */}
        <LinearGradient
          colors={gradientColors}
          locations={gradientLocations}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        
        {/* Subtiler animierter Overlay für mehr Tiefe */}
        <Animated.View style={[StyleSheet.absoluteFill, animatedGradientStyle]}>
          <LinearGradient
            colors={['rgba(76, 175, 80, 0.2)', 'transparent', 'rgba(27, 94, 32, 0.3)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        
        {/* Header - oben */}
        <View style={[styles.header, { paddingTop: insets.top + spacing.xl }]}>
          <Text style={{ color: textColor, fontSize: 32, textAlign: 'center', fontWeight: '700', textShadowColor: 'rgba(0, 0, 0, 0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 }}>
            Kurzer Check-in
          </Text>
          <Text style={{ color: textMutedColor, fontSize: 16, textAlign: 'center', marginTop: spacing.m, lineHeight: 22, textShadowColor: 'rgba(0, 0, 0, 0.2)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>
            Wische nach links oder rechts, um deinen Status anzugeben.
          </Text>
        </View>
        
        {/* Swipe-Bereich - zentriert */}
        <View style={styles.swipeContainer}>
          {/* Hintergrund-Labels - oben */}
          <View style={styles.labelsContainer}>
            <Animated.View style={[styles.backgroundLabel, styles.leftLabel, leftLabelStyle]}>
              <MaterialCommunityIcons name="smoking" size={40} color="#FFB74D" />
              <Text style={{ 
                color: '#FFB74D', 
                marginTop: spacing.xs, 
                fontWeight: '700',
                fontSize: 16,
                textAlign: 'center',
                textShadowColor: 'rgba(0, 0, 0, 0.4)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 3,
              }}>
                Ich habe{'\n'}geraucht
              </Text>
            </Animated.View>
            
            <Animated.View style={[styles.backgroundLabel, styles.rightLabel, rightLabelStyle]}>
              <MaterialCommunityIcons name="check-circle" size={40} color="#E8F5E9" />
              <Text style={{ 
                color: '#E8F5E9', 
                marginTop: spacing.xs, 
                fontWeight: '700',
                fontSize: 16,
                textAlign: 'center',
                textShadowColor: 'rgba(0, 0, 0, 0.4)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 3,
              }}>
                Nicht{'\n'}geraucht
              </Text>
            </Animated.View>
          </View>
          
          {/* Slider Track */}
          <View style={styles.sliderTrackContainer}>
            {/* Track Hintergrund */}
            <View style={[
              styles.track,
              {
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 3,
              }
            ]} />
            
            {/* Gefüllter Track-Bereich (animiert) */}
            <Animated.View style={[
              styles.filledTrack,
              {
                backgroundColor: 'rgba(255, 255, 255, 0.4)',
              },
              filledTrackStyle,
            ]} />
            
            {/* Slider Regler */}
            <GestureDetector gesture={panGesture}>
              <Animated.View style={[
                styles.sliderThumb,
                {
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E8F5E9',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 8,
                },
                thumbStyle,
              ]}>
                <MaterialCommunityIcons 
                  name="drag-horizontal" 
                  size={28} 
                  color="#2E7D32" 
                />
              </Animated.View>
            </GestureDetector>
          </View>
        </View>
        
        {/* Hinweis - unten */}
        <View style={[styles.hint, { 
          backgroundColor: hintBgColor,
          marginBottom: insets.bottom + spacing.l,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.2)',
        }]}>
          <MaterialCommunityIcons 
            name="information-outline" 
            size={20} 
            color={textColor} 
          />
          <Text style={{ 
            color: textColor, 
            fontSize: 13, 
            marginLeft: spacing.xs, 
            flex: 1,
            lineHeight: 18,
            fontWeight: '500',
          }}>
            Wenn du loslässt, bevor eine Seite erreicht wurde, springt der Regler zurück.
          </Text>
        </View>
      </SafeAreaView>
      
      {/* Konsum-Modal */}
      <Modal
        visible={showConsumptionModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowConsumptionModal(false);
          // Setze Slider zurück zur Mitte
          translateX.value = withSpring(0, {
            damping: 15,
            stiffness: 200,
          });
        }}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: palette.surface }]}>
          <View style={[styles.modalHeader, { borderBottomColor: palette.border }]}>
            <View style={{ flex: 1 }}>
              <ThemedText kind="h2" style={{ color: palette.text }}>
                Konsum eintragen
              </ThemedText>
              <ThemedText style={{ color: palette.textMuted, fontSize: 14, marginTop: spacing.xs }}>
                Bitte gib deinen Konsum ein, um fortzufahren.
              </ThemedText>
            </View>
            <Pressable
              onPress={() => {
                setShowConsumptionModal(false);
                // Setze Slider zurück zur Mitte
                translateX.value = withSpring(0, {
                  damping: 15,
                  stiffness: 200,
                });
              }}
              style={({ pressed }) => [
                {
                  marginLeft: spacing.m,
                  padding: spacing.xs,
                  opacity: pressed ? 0.7 : 1,
                }
              ]}
              accessibilityRole="button"
              accessibilityLabel="Modal schließen"
            >
              <MaterialCommunityIcons name="close" size={24} color={palette.text} />
            </Pressable>
          </View>
          
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              <ConsumptionFormFields
                value={consumptionForm}
                suggestedAmount={defaultAmountSuggestion}
                onChange={(patch) =>
                  setConsumptionForm((prev) => ({
                    ...prev,
                    ...patch,
                  }))
                }
              />
              
              {consumptionError ? (
                <View style={[styles.errorContainer, { backgroundColor: `${palette.danger}15` }]}>
                  <MaterialCommunityIcons name="alert-circle" size={20} color={palette.danger} />
                  <ThemedText style={{ color: palette.danger, marginLeft: spacing.s, flex: 1 }}>
                    {consumptionError}
                  </ThemedText>
                </View>
              ) : null}
              
              <Pressable
                onPress={handleConsumptionSubmit}
                style={({ pressed }) => [
                  styles.submitButton,
                  {
                    backgroundColor: palette.primary,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
              >
                <ThemedText style={{ color: palette.surface, fontSize: 16, fontWeight: '700' }}>
                  Konsum speichern & fortfahren
                </ThemedText>
              </Pressable>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    overflow: 'hidden',
  },
  header: {
    paddingBottom: spacing.xl,
  },
  swipeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    minHeight: 300,
    paddingVertical: spacing.xl,
  },
  labelsContainer: {
    width: SCREEN_WIDTH * 0.85,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
    paddingHorizontal: 0,
  },
  backgroundLabel: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: (SCREEN_WIDTH * 0.85) / 2 - 20,
  },
  leftLabel: {
    alignItems: 'flex-start',
  },
  rightLabel: {
    alignItems: 'flex-end',
  },
  sliderTrackContainer: {
    width: SCREEN_WIDTH * 0.85,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  track: {
    position: 'absolute',
    width: '100%',
    height: 12,
    borderRadius: 6,
  },
  filledTrack: {
    position: 'absolute',
    height: 12,
    borderRadius: 6,
  },
  sliderThumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: radius.l,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    padding: spacing.xl,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  modalContent: {
    padding: spacing.xl,
    gap: spacing.l,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.m,
    borderRadius: radius.l,
  },
  submitButton: {
    paddingVertical: spacing.m,
    borderRadius: radius.pill,
    alignItems: 'center',
    marginTop: spacing.m,
  },
});


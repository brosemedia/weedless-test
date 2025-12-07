import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Dimensions, ImageBackground, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

import { ThemedText, PrimaryButton, Card } from '../../../design/theme';
import { useQuickActionsVisibility } from '../../../hooks/useQuickActionsVisibility';
import { useApp } from '../../../store/app';
import { useTheme } from '../../../theme/useTheme';
import { TASK_XP } from '../../../lib/tasks';
import type { MinigameStackParamList } from '../MinigamesHub';
import { generateNumberFlowSequence } from './generateSequence';
import type { NumberFlowLevel, NumberFlowPhase, NumberFlowSequence } from './types';

// BackButton entfernt – der native Stack-Header hat bereits einen Zurück-Button mit Blur-Effekt

const AMBIENT_BG = require('../../../../assets/ambient_bg.png');

type Props = NativeStackScreenProps<MinigameStackParamList, 'NumberFlowGame'>;

const SCREEN_WIDTH = Dimensions.get('window').width;
const clampLevel = (value: number): NumberFlowLevel =>
  (value < 1 ? 1 : value > 10 ? 10 : value) as NumberFlowLevel;

export default function NumberFlowGame({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const palette = theme.colors;
  
  // Höhe für den nativen transparenten Stack-Header
  const headerHeight = 44;

  const [level, setLevel] = useState<NumberFlowLevel>(1);
  const [phase, setPhase] = useState<NumberFlowPhase>('intro');
  const [sequence, setSequence] = useState<NumberFlowSequence | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [confettiKey, setConfettiKey] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [countdownValue, setCountdownValue] = useState<number | null>(null);

  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const markTaskDone = useApp((s) => s.markTaskDone);
  const hasMarkedTaskDone = useRef(false);

  useQuickActionsVisibility('number-flow-game', true);

  const revealDelay = useMemo(() => {
    const base = 1500 - level * 60;
    return Math.max(900, base);
  }, [level]);

  const startHoldDelay = useMemo(() => Math.max(1200, revealDelay + 400), [revealDelay]);
  const endPauseDelay = useMemo(() => Math.max(1300, revealDelay + 300), [revealDelay]);

  const clearRevealTimer = useCallback(() => {
    if (revealTimerRef.current) {
      clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }
  }, []);

  const clearCountdownTimer = useCallback(() => {
    if (countdownTimerRef.current) {
      clearTimeout(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }, []);

  const startRound = useCallback(
    (targetLevel?: NumberFlowLevel) => {
      const activeLevel = targetLevel ?? level;
      const nextSequence = generateNumberFlowSequence(activeLevel);
      setSequence(nextSequence);
      setPhase('countdown');
      setCurrentStep(0);
      setDisplayText('');
      setCountdownValue(3);
      setUserAnswer('');
      setIsCorrect(null);
      hasMarkedTaskDone.current = false;
    },
    [level]
  );

  useEffect(() => {
    if (phase !== 'countdown') {
      clearCountdownTimer();
      return;
    }

    if (countdownValue === null) {
      setCountdownValue(3);
      return;
    }

    if (countdownValue === 0) {
      countdownTimerRef.current = setTimeout(() => {
        setCountdownValue(null);
        setPhase('playing');
      }, 500);
      return () => clearCountdownTimer();
    }

    countdownTimerRef.current = setTimeout(() => {
      setCountdownValue((prev) => (prev != null ? prev - 1 : null));
    }, 900);

    return () => clearCountdownTimer();
  }, [phase, countdownValue, clearCountdownTimer]);

  useEffect(() => {
    if (phase !== 'playing' || !sequence) return;

    const operationsLength = sequence.operations.length;

    if (currentStep === 0) {
      setDisplayText(String(sequence.startValue));
      revealTimerRef.current = setTimeout(() => {
        setCurrentStep(1);
      }, startHoldDelay);
    } else if (currentStep >= 1 && currentStep <= operationsLength) {
      const op = sequence.operations[currentStep - 1];
      setDisplayText(`${op.op} ${op.value}`);
      revealTimerRef.current = setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
      }, revealDelay);
    } else {
      setDisplayText('...');
      revealTimerRef.current = setTimeout(() => setPhase('answer'), endPauseDelay);
    }

    return () => clearRevealTimer();
  }, [phase, sequence, currentStep, revealDelay, startHoldDelay, endPauseDelay, clearRevealTimer]);

  useEffect(() => () => {
    clearRevealTimer();
    clearCountdownTimer();
  }, [clearRevealTimer, clearCountdownTimer]);

  useEffect(() => {
    if (phase === 'result' && isCorrect) {
      setShowConfetti(true);
      setConfettiKey((prev) => prev + 1);
    } else if (phase !== 'result') {
      setShowConfetti(false);
    }
  }, [phase, isCorrect]);

  useFocusEffect(
    useCallback(() => {
      setPhase('intro');
      setSequence(null);
      setCurrentStep(0);
      setDisplayText('');
      setCountdownValue(null);
      setUserAnswer('');
      setIsCorrect(null);
      return () => {
        clearRevealTimer();
        clearCountdownTimer();
      };
    }, [clearRevealTimer, clearCountdownTimer])
  );

  const handleAnswerChange = useCallback((value: string) => {
    if (value === '') {
      setUserAnswer('');
      return;
    }
    const digitsOnly = value.replace(/[^0-9]/g, '');
    setUserAnswer(digitsOnly);
  }, []);

  const handleStartLevel = useCallback(() => {
    startRound();
  }, [startRound]);

  const handleCheckAnswer = useCallback(() => {
    if (!sequence) return;
    const answer = Number(userAnswer);
    const correct = answer === sequence.correctResult;
    setIsCorrect(correct);
    setPhase('result');

    if (correct && !hasMarkedTaskDone.current) {
      hasMarkedTaskDone.current = true;
      const todayKey = new Date().toISOString().slice(0, 10);
      markTaskDone(todayKey, 'number-flow', TASK_XP['number-flow'] ?? 0);
    } else if (!correct) {
      setLevel(1);
    }
  }, [sequence, userAnswer, markTaskDone]);

  const handleTryAgain = useCallback(() => {
    startRound();
  }, [startRound]);

  const handleNextLevel = useCallback(() => {
    if (!isCorrect) {
      startRound();
      return;
    }

    if (level < 10) {
      const nextLevel = clampLevel(level + 1);
      setLevel(nextLevel);
      startRound(nextLevel);
    } else {
      startRound(level);
    }
  }, [isCorrect, level, startRound]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const renderIntro = () => (
    <View style={styles.phaseContainer}>
      <ThemedText kind="h1" style={styles.title}>
        Number Flow
      </ThemedText>
      <ThemedText kind="h2" style={styles.subtitle}>
        Keep track of the flow of numbers.
      </ThemedText>
      <Card style={styles.infoCard}>
        <ThemedText kind="body" style={styles.cardBody}>
          You’ll see a starting number and a short chain of + and − operations. Stay present, follow the flow,
          and at the end enter the final result. Simple, focused, no rush.
        </ThemedText>
      </Card>
      <PrimaryButton title={`Start level ${level}`} onPress={handleStartLevel} />
    </View>
  );

  const renderCountdownOverlay = () => (
    <View style={styles.countdownOverlay}>
      <BlurView intensity={70} tint={theme.mode === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      <View style={styles.countdownContent}>
        <ThemedText kind="h2" style={styles.subtitle}>
          Errechne das Ergebnis Schritt für Schritt.
        </ThemedText>
        <View style={[styles.countdownCircle, { borderColor: palette.primary }]}>
          <ThemedText kind="h1" style={[styles.countdownValue, { color: palette.text }]}>
            {countdownValue ?? 3}
          </ThemedText>
        </View>
      </View>
    </View>
  );

  const renderPlaying = () => (
    <View style={styles.phaseContainer}>
      <ThemedText kind="h2" style={styles.subtitle}>
        Errechne das Ergebnis Schritt für Schritt.
      </ThemedText>
      <Card style={styles.sequenceCard}>
        <View style={[styles.displayWrapper, { backgroundColor: palette.surfaceMuted }]}>
          <ThemedText kind="h1" style={[styles.displayValue, { color: palette.text }]}>
            {displayText || '...'}
          </ThemedText>
        </View>
      </Card>
    </View>
  );

  const renderAnswer = () => (
    <View style={styles.phaseContainer}>
      <ThemedText kind="h2" style={styles.subtitle}>
        What’s the final result?
      </ThemedText>
      <ThemedText kind="caption" muted style={styles.hintText}>
        No calculators – just your mind.
      </ThemedText>
      <Card style={styles.answerCard}>
        <TextInput
          style={[
            styles.answerInput,
            { borderColor: palette.border, color: palette.text, backgroundColor: palette.surface },
          ]}
          value={userAnswer}
          onChangeText={handleAnswerChange}
          keyboardType="numeric"
          inputMode="numeric"
          placeholder="Enter number"
          placeholderTextColor={palette.textMuted}
          maxLength={3}
        />
        <Pressable
          style={({ pressed }) => [
            styles.checkButton,
            {
              backgroundColor: userAnswer ? palette.primary : palette.textMuted,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
          onPress={handleCheckAnswer}
          disabled={!userAnswer}
        >
          <ThemedText kind="button" style={{ color: 'white' }}>
            Check answer
          </ThemedText>
        </Pressable>
      </Card>
    </View>
  );

  const renderResult = () => {
    const success = Boolean(isCorrect);
    return (
      <View style={styles.phaseContainer}>
        {success ? (
          <>
            <ThemedText kind="h1" style={[styles.title, { color: palette.success }]}>
              Nice! You nailed it.
            </ThemedText>
            <Card style={styles.infoCard}>
              <ThemedText kind="body" style={styles.cardBody}>
                Your mind stayed with the numbers all the way. Level complete: {level}.
              </ThemedText>
            </Card>
            <PrimaryButton
              title={level < 10 ? 'Next level' : 'Play again'}
              onPress={handleNextLevel}
            />
          </>
        ) : (
          <>
            <ThemedText kind="h1" style={styles.title}>
              Close – but not quite.
            </ThemedText>
            <Card style={styles.infoCard}>
              <ThemedText kind="body" style={styles.cardBody}>
                The correct result was {sequence?.correctResult}. Try again and follow the flow a bit closer.
              </ThemedText>
            </Card>
            <PrimaryButton title="Try again" onPress={handleTryAgain} />
          </>
        )}
        <Pressable
          style={[styles.backButton, { borderColor: palette.border }]}
          onPress={handleBack}
        >
          <ThemedText kind="button" style={{ color: palette.text }}>
            Back
          </ThemedText>
        </Pressable>
      </View>
    );
  };

  return (
    <ImageBackground source={AMBIENT_BG} style={styles.screen} resizeMode="cover">
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + headerHeight + 24,
            paddingBottom: Math.max(24, insets.bottom),
          },
        ]}
        scrollEventThrottle={16}
      >
        {/* BackButton entfernt – nativer Header übernimmt */}
        <View style={[styles.badge, { backgroundColor: palette.surfaceMuted }]}>
          <ThemedText kind="caption" style={{ color: palette.textMuted }}>
            Level {level}
          </ThemedText>
        </View>
        {phase === 'intro' && renderIntro()}
        {phase === 'playing' && renderPlaying()}
        {phase === 'answer' && renderAnswer()}
        {phase === 'result' && renderResult()}
      </ScrollView>
      {phase === 'countdown' && renderCountdownOverlay()}
      {showConfetti ? (
        <ConfettiCannon
          key={confettiKey}
          count={180}
          fadeOut
          fallSpeed={2400}
          explosionSpeed={350}
          origin={{ x: SCREEN_WIDTH / 2, y: -20 }}
          onAnimationEnd={() => setShowConfetti(false)}
        />
      ) : null}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    gap: 24,
  },
  phaseContainer: {
    gap: 20,
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    textAlign: 'center',
    fontWeight: '600',
  },
  infoCard: {
    width: '100%',
    padding: 20,
    gap: 12,
  },
  cardBody: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  badge: {
    alignSelf: 'center',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  sequenceCard: {
    width: '100%',
    padding: 20,
    gap: 12,
  },
  sequenceLabel: {
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  displayWrapper: {
    width: '100%',
    minHeight: 140,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  displayValue: {
    fontSize: 64,
    fontWeight: '700',
  },
  hintText: {
    textAlign: 'center',
  },
  answerCard: {
    width: '100%',
    gap: 16,
    padding: 20,
  },
  answerInput: {
    width: '100%',
    borderWidth: 2,
    borderRadius: 16,
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 12,
  },
  backButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  checkButton: {
    width: '100%',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  countdownContent: {
    width: '80%',
    maxWidth: 320,
    alignItems: 'center',
    gap: 24,
  },
  countdownCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  countdownValue: {
    fontSize: 72,
    fontWeight: '700',
  },
});


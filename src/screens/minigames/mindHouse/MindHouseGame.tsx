import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Animated,
  ScrollView,
  Dimensions,
  Easing,
  Image,
  ImageBackground,
  LayoutRectangle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ConfettiCannon from 'react-native-confetti-cannon';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuickActionsVisibility } from '../../../hooks/useQuickActionsVisibility';
import { ThemedText, PrimaryButton, Card } from '../../../design/theme';
import { useTheme } from '../../../theme/useTheme';
import { useApp } from '../../../store/app';
import { TASK_XP } from '../../../lib/tasks';
import type { MinigameStackParamList } from '../MinigamesHub';
import type { Difficulty, MindHouseEvent, Phase } from './types';
import { generateMindHouseSequence } from './generateSequence';
import StandingMan from '../../../../assets/standing-man.svg';
import StandingWoman from '../../../../assets/standing-woman.svg';
import { useAppStrings } from '../../../i18n/useStrings';

// BackButton entfernt – der native Stack-Header hat bereits einen Zurück-Button mit Blur-Effekt

const HOUSE_IMAGE = require('../../../../assets/house_01.png');
const AMBIENT_BG = require('../../../../assets/ambient_bg.png');

const formatTemplate = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(values[key] ?? ''));

type MindHouseLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

const clampLevel = (value: number): MindHouseLevel => {
  if (value <= 1) return 1;
  if (value >= 10) return 10;
  return value as MindHouseLevel;
};

const difficultyForLevel = (level: MindHouseLevel): Difficulty => {
  if (level <= 3) return 'easy';
  if (level <= 7) return 'medium';
  return 'hard';
};

const fallbackMindHouseStrings = {
  title: 'Mind House',
  subtitle: 'Train your focus – one house, many thoughts.',
  intro:
    'Small figures will walk in and out of the house. Stay present and keep track of how many are inside. At the end, enter the final number.',
  levelLabel: 'Current level: {{level}}',
  startButton: 'Start round',
  playingTitle: 'Watch carefully...',
  answerTitle: 'How many figures are in the house now?',
  answerHint: 'Trust your memory. Just give it your best shot.',
  checkButton: 'Check answer',
  successTitle: 'Nice! Your focus is on point.',
  successBody: 'Level {{level}} complete. You tracked every figure.',
  successHint: 'Up next: Level {{nextLevel}}.',
  failTitle: 'Close – but not quite.',
  failBody: 'The correct number was {{count}}. Each round is practice.',
  failHint: 'Level resets – start again at level 1.',
  finalSummary: 'Final count in the house: {{count}}',
  nextLevelButton: 'Continue to level {{nextLevel}}',
  retryButton: 'Back to level 1',
  countdownTitle: 'Level {{level}} begins shortly.',
  levelBadge: 'Level {{level}}',
};

type Props = NativeStackScreenProps<MinigameStackParamList, 'MindHouseGame'>;

const HOUSE_WIDTH = 300;
const HOUSE_HEIGHT = 240;
const FIGURE_SIZE = 40;
const ANIMATION_DURATION = 1500; // ms for figure to walk across screen
const SCREEN_WIDTH = Dimensions.get('window').width;
const CONTENT_HORIZONTAL_PADDING = 20;

export default function MindHouseGame({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const palette = theme.colors;
  const strings = useAppStrings();
  const mindHouseStrings = strings.minigames?.mindHouse ?? fallbackMindHouseStrings;
  const backLabel = strings.common?.back ?? 'Back';
  
  // Höhe für den nativen transparenten Stack-Header
  const headerHeight = 44;

  const [phase, setPhase] = useState<Phase>('intro');
  const [level, setLevel] = useState<MindHouseLevel>(1);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [events, setEvents] = useState<MindHouseEvent[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentCount, setCurrentCount] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [activeFigures, setActiveFigures] = useState<Array<{
    id: number;
    x: Animated.Value;
    opacity: Animated.Value;
    direction: 'left' | 'right';
    gender: 'man' | 'woman';
  }>>([]);
  const [houseLayout, setHouseLayout] = useState<LayoutRectangle | null>(null);
  const [confettiKey, setConfettiKey] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [countdownValue, setCountdownValue] = useState<number | null>(null);

  // Hide quick actions (add button) during playing phase
  useQuickActionsVisibility('mind-house-game', true);

  const playbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextLevelRef = useRef<MindHouseLevel>(1);
  const markTaskDone = useApp((s) => s.markTaskDone);
  const hasMarkedTaskDone = useRef(false);
  const figureIdCounter = useRef(0);
  const houseXPosition = useRef(SCREEN_WIDTH / 2); // Center of screen
  const houseLeftEdge = useRef(0); // Left edge of house (door position) - absolute screen position
  const houseRightEdge = useRef(0); // Right edge of house (door position) - absolute screen position

  useEffect(() => {
    if (!houseLayout) return;
    const absoluteHouseLeft = CONTENT_HORIZONTAL_PADDING + houseLayout.x;
    houseXPosition.current = absoluteHouseLeft + houseLayout.width / 2;
    houseLeftEdge.current = absoluteHouseLeft + houseLayout.width * 0.45;
    houseRightEdge.current = absoluteHouseLeft + houseLayout.width * 0.55;
  }, [houseLayout]);

  const groundY = useMemo(() => {
    if (!houseLayout) return null;
    const GROUND_OFFSET = 4; // Tweak to align feet with door threshold
    return houseLayout.y + houseLayout.height - FIGURE_SIZE + GROUND_OFFSET;
  }, [houseLayout]);

  const clearPlaybackTimer = useCallback(() => {
    if (playbackTimerRef.current) {
      clearTimeout(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
  }, []);

  const clearCountdownTimer = useCallback(() => {
    if (countdownTimerRef.current) {
      clearTimeout(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }, []);

  const startNewRound = useCallback(
    (targetLevel?: MindHouseLevel) => {
      const nextLevel = clampLevel(targetLevel ?? level);
      const nextDifficulty = difficultyForLevel(nextLevel);
      setLevel(nextLevel);
      setDifficulty(nextDifficulty);
      const seq = generateMindHouseSequence(nextDifficulty);
      setEvents(seq);
      setCurrentIndex(0);
      setCurrentCount(0);
      setIsCorrect(null);
      setUserAnswer('');
      hasMarkedTaskDone.current = false;
      setHouseLayout(null);
      setCountdownValue(3);
      setPhase('countdown');
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

  // Playback logic with smooth animations
  useEffect(() => {
    if (phase !== 'playing' || events.length === 0) return;

    let count = 0;
    let index = 0;

    const animateFigure = (
      from: 'left' | 'right',
      isEntering: boolean,
      laneIndex: number,
      totalLanes: number,
      onDone: () => void
    ) => {
      const id = figureIdCounter.current++;
      const gender = Math.random() < 0.5 ? 'man' : 'woman';
      
      // Determine start and end positions - all positions are absolute screen coordinates
      let startX: number;
      let doorX: number; // Position where figure enters/exits house (where they disappear/appear)
      let endX: number; // Final position
      const laneSpacing = FIGURE_SIZE * 0.8;
      const normalizedIndex = totalLanes > 1 ? laneIndex - (totalLanes - 1) / 2 : 0;
      const laneOffset = normalizedIndex * laneSpacing;
      const houseOffset = laneOffset * 0.65;
      const clampX = (value: number) => Math.max(-80, Math.min(SCREEN_WIDTH + 80, value));
      
      if (isEntering) {
        // ENTERING: Start from off-screen, walk past door into center of house
        if (from === 'left') {
          startX = clampX(-50 + laneOffset); // Start off-screen to the left
          doorX = houseLeftEdge.current + laneOffset; // Door position
          endX = clampX(houseXPosition.current + houseOffset); // Walk to center of house (disappear inside)
        } else {
          startX = clampX(SCREEN_WIDTH + 50 + laneOffset); // Start off-screen to the right
          doorX = houseRightEdge.current + laneOffset; // Door position
          endX = clampX(houseXPosition.current + houseOffset); // Walk to center of house (disappear inside)
        }
      } else {
        // EXITING: Start from center of house, walk to off-screen
        if (from === 'left') {
          doorX = houseLeftEdge.current + laneOffset; // Door position
          startX = clampX(houseXPosition.current + houseOffset); // Start at center of house (appear from inside)
          endX = clampX(-50 + laneOffset); // Walk all the way off-screen to the left
        } else {
          doorX = houseRightEdge.current + laneOffset; // Door position
          startX = clampX(houseXPosition.current + houseOffset); // Start at center of house (appear from inside)
          endX = clampX(SCREEN_WIDTH + 50 + laneOffset); // Walk all the way off-screen to the right
        }
      }
      
      const x = new Animated.Value(startX);
      const opacity = new Animated.Value(isEntering ? 1 : 0);
      
      // Calculate fade zone (where opacity changes) - smaller zone, closer to house center
      const fadeZoneSize = FIGURE_SIZE * 0.6; // Smaller fade zone for more precise visibility
      let fadeStartX: number;
      let fadeEndX: number;
      
      if (isEntering) {
        // ENTERING: Fully visible from screen edge until close to house center, then fade out
        if (from === 'left') {
          fadeStartX = endX - fadeZoneSize; // Start fading just before reaching center
          fadeEndX = endX; // Completely invisible at center
        } else {
          fadeStartX = endX; // Start fading at center
          fadeEndX = endX + fadeZoneSize; // Completely invisible after center
        }
      } else {
        // EXITING: Fade in when leaving house center, fully visible until screen edge, then fade out
        if (from === 'left') {
          fadeStartX = startX; // Start fading in at center
          fadeEndX = startX - fadeZoneSize; // Fully visible after leaving center
        } else {
          fadeStartX = startX; // Start fading in at center
          fadeEndX = startX + fadeZoneSize; // Fully visible after leaving center
        }
      }

      // Add figure to active list
      setActiveFigures((prev) => [...prev, { id, x, opacity, direction: from, gender }]);

      // Create listener to update opacity based on position
      const opacityListener = x.addListener(({ value }) => {
        let newOpacity = 0;
        
        if (isEntering) {
          // ENTERING: Fully visible from screen edge until close to house center, then fade out
          if (from === 'left') {
            if (value < fadeStartX) {
              newOpacity = 1; // Fully visible before reaching fade zone
            } else if (value <= fadeEndX) {
              // Fading as approaching house center
              const progress = (value - fadeStartX) / fadeZoneSize;
              newOpacity = Math.max(0, 1 - progress);
            } else {
              newOpacity = 0; // Completely invisible after center (inside house)
            }
          } else {
            // Coming from right
            if (value > fadeStartX) {
              newOpacity = 1; // Fully visible before reaching fade zone
            } else if (value >= fadeEndX) {
              // Fading as approaching house center
              const progress = (fadeStartX - value) / fadeZoneSize;
              newOpacity = Math.max(0, 1 - progress);
            } else {
              newOpacity = 0; // Completely invisible after center (inside house)
            }
          }
        } else {
          // EXITING: Fade in when leaving house center, fully visible until screen edge, then fade out
          if (from === 'left') {
            // Exiting to left: value goes from center to 0
            if (value > fadeStartX) {
              newOpacity = 0; // Invisible before leaving center (still inside house)
            } else if (value >= fadeEndX) {
              // Fading in as leaving house center
              const progress = (fadeStartX - value) / fadeZoneSize;
              newOpacity = Math.min(1, progress);
            } else if (value > FIGURE_SIZE) {
              // Fully visible while walking to screen edge (but not too close to edge)
              newOpacity = 1;
            } else {
              // Fade out when reaching screen edge (last FIGURE_SIZE pixels)
              const fadeOutProgress = value / FIGURE_SIZE;
              newOpacity = Math.max(0, fadeOutProgress);
            }
          } else {
            // Exiting to right: value goes from center to SCREEN_WIDTH
            if (value < fadeStartX) {
              newOpacity = 0; // Invisible before leaving center (still inside house)
            } else if (value <= fadeEndX) {
              // Fading in as leaving house center
              const progress = (value - fadeStartX) / fadeZoneSize;
              newOpacity = Math.min(1, progress);
            } else if (value < SCREEN_WIDTH - FIGURE_SIZE) {
              // Fully visible while walking to screen edge (but not too close to edge)
              newOpacity = 1;
            } else {
              // Fade out when reaching screen edge (last FIGURE_SIZE pixels)
              const fadeOutProgress = (SCREEN_WIDTH - value) / FIGURE_SIZE;
              newOpacity = Math.max(0, fadeOutProgress);
            }
          }
        }
        
        opacity.setValue(newOpacity);
      });

      // Animate figure moving
      // For entering: from screen edge to door
      // For exiting: from door to screen edge
      Animated.timing(x, {
        toValue: endX,
        duration: ANIMATION_DURATION,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: true,
      }).start(() => {
        // Clean up listener
        x.removeListener(opacityListener);
        
        // Remove figure from active list
        setActiveFigures((prev) => prev.filter((f) => f.id !== id));
        
        // Call onDone callback
        onDone();
      });
    };

    const playNextEvent = () => {
      if (index >= events.length) {
        // Wait for all animations to finish before showing answer
        setTimeout(() => {
          setPhase('answer');
        }, 500);
        return;
      }

      const event = events[index];
      let figuresAnimated = 0;
      const totalFigures = event.amount;
      
      const onFigureDone = () => {
        figuresAnimated++;
        if (figuresAnimated === totalFigures) {
          // All figures for this event are done, update count and move to next
          if (event.type === 'IN') {
            count += event.amount;
          } else {
            count = Math.max(0, count - event.amount);
          }
          
          setCurrentCount(count);
          setCurrentIndex(index);
          index++;

          // Determine delay based on difficulty
          const delay = difficulty === 'easy' ? 800 + Math.random() * 200 :
                        difficulty === 'medium' ? 600 + Math.random() * 200 :
                        400 + Math.random() * 300;

          playbackTimerRef.current = setTimeout(playNextEvent, delay);
        }
      };
      
      // Animate figures using the 'from' property from the event
      // For OUT events, 'from' indicates the direction they exit (left or right)
      const laneCount = event.amount;
      const staggerDelay = event.type === 'IN' ? 70 : 90;
      for (let i = 0; i < laneCount; i++) {
        setTimeout(() => {
          animateFigure(event.from, event.type === 'IN', i, laneCount, onFigureDone);
        }, i * staggerDelay); // Minimal stagger to keep them grouped
      }
    };

    playNextEvent();

    return () => {
      clearPlaybackTimer();
      setActiveFigures([]);
    };
  }, [phase, events, difficulty, clearPlaybackTimer]);

  const handleCheckAnswer = useCallback(() => {
    const answer = Number(userAnswer);
    const correct = answer === currentCount;
    setIsCorrect(correct);
    setPhase('result');
    
    // Mark task as done if answer is correct and not already marked
    if (correct && !hasMarkedTaskDone.current) {
      hasMarkedTaskDone.current = true;
      const todayKey = new Date().toISOString().slice(0, 10);
      markTaskDone(todayKey, 'mind-house', TASK_XP['mind-house'] ?? 0);
    }
    nextLevelRef.current = correct ? clampLevel(level + 1) : 1;
  }, [userAnswer, currentCount, markTaskDone, level]);

  const handlePlayAgain = useCallback(() => {
    startNewRound(nextLevelRef.current);
  }, [startNewRound]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

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
      setCountdownValue(null);
      return () => {
        clearPlaybackTimer();
        clearCountdownTimer();
      };
    }, [clearPlaybackTimer, clearCountdownTimer])
  );

  const renderIntro = () => (
    <View style={styles.phaseContainer}>
      <ThemedText kind="h1" style={styles.title}>{mindHouseStrings.title}</ThemedText>
      <ThemedText kind="h2" style={styles.subtitle}>
        {mindHouseStrings.subtitle}
      </ThemedText>
      <Card style={styles.introCard}>
        <ThemedText kind="body" style={styles.introText}>
          {mindHouseStrings.intro}
        </ThemedText>
      </Card>
      <ThemedText kind="caption" muted>
        {formatTemplate(mindHouseStrings.levelLabel, { level })}
      </ThemedText>
      <PrimaryButton title={mindHouseStrings.startButton} onPress={() => startNewRound(level)} />
    </View>
  );

  const renderHouse = () => {
    return (
      <View style={styles.houseContainer}>
        <View
          style={styles.houseWrapper}
          onLayout={(event) => setHouseLayout(event.nativeEvent.layout)}
        >
          <Image 
            source={HOUSE_IMAGE} 
            style={styles.houseImage}
            resizeMode="contain"
          />
        </View>
      </View>
    );
  };

  const renderPlaying = () => (
    <View style={styles.phaseContainer}>
      <ThemedText kind="h2" style={styles.playingTitle}>
        {mindHouseStrings.playingTitle}
      </ThemedText>
      <View style={styles.houseAndFiguresContainer}>
        {renderHouse()}
        {groundY != null && (
          <View style={styles.figuresContainer}>
            {activeFigures.map((figure) => {
              const FigureComponent = figure.gender === 'man' ? StandingMan : StandingWoman;
              const scaleDirection = figure.direction === 'left' ? 1 : -1;
              
              return (
                <Animated.View
                  key={figure.id}
                  style={[
                    styles.walkingFigureAbsolute,
                    {
                      top: groundY,
                      transform: [
                        { translateX: figure.x },
                        { scaleX: scaleDirection },
                      ],
                      opacity: figure.opacity,
                    },
                  ]}
                >
                  <FigureComponent width={FIGURE_SIZE} height={FIGURE_SIZE} />
                </Animated.View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );

  const renderAnswer = () => (
    <View style={styles.phaseContainer}>
      <ThemedText kind="h2" style={styles.answerTitle}>
        {mindHouseStrings.answerTitle}
      </ThemedText>
      <ThemedText kind="caption" muted style={styles.hintText}>
        {mindHouseStrings.answerHint}
      </ThemedText>
      <View style={styles.inputContainer}>
        <View style={styles.numberInputRow}>
          <Pressable
            style={[styles.numberButton, { backgroundColor: palette.surfaceMuted }]}
            onPress={() => {
              const num = Number(userAnswer) || 0;
              setUserAnswer(String(Math.max(0, num - 1)));
            }}
          >
            <Text style={[styles.numberButtonText, { color: palette.text }]}>−</Text>
          </Pressable>
          <TextInput
            style={[
              styles.numberInput,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
                color: palette.text,
              },
            ]}
            value={userAnswer}
            onChangeText={setUserAnswer}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={palette.textMuted}
            selectTextOnFocus
          />
          <Pressable
            style={[styles.numberButton, { backgroundColor: palette.surfaceMuted }]}
            onPress={() => {
              const num = Number(userAnswer) || 0;
              setUserAnswer(String(num + 1));
            }}
          >
            <Text style={[styles.numberButtonText, { color: palette.text }]}>+</Text>
          </Pressable>
        </View>
      </View>
      <Pressable
        style={({ pressed }) => [
          styles.checkButton,
          {
            backgroundColor: (!userAnswer || isNaN(Number(userAnswer))) 
              ? palette.textMuted 
              : palette.primary,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
        onPress={handleCheckAnswer}
        disabled={!userAnswer || isNaN(Number(userAnswer))}
      >
        <ThemedText kind="button" style={{ color: 'white' }}>
          {mindHouseStrings.checkButton}
        </ThemedText>
      </Pressable>
    </View>
  );

  const renderResult = () => {
    const nextLevelValue = level < 10 ? level + 1 : level;
    const nextLevelLabel = formatTemplate(mindHouseStrings.nextLevelButton, { nextLevel: nextLevelValue });
    return (
      <View style={styles.phaseContainer}>
        {isCorrect ? (
          <>
            <ThemedText kind="h1" style={[styles.resultTitle, { color: palette.success }]}>
              {mindHouseStrings.successTitle}
            </ThemedText>
            <Card style={styles.resultCard}>
              <ThemedText kind="body" style={styles.resultBody}>
                {formatTemplate(mindHouseStrings.successBody, { level })}
              </ThemedText>
              {level < 10 ? (
                <ThemedText kind="caption" muted style={styles.levelHint}>
                  {formatTemplate(mindHouseStrings.successHint, { nextLevel: level + 1 })}
                </ThemedText>
              ) : null}
            </Card>
          </>
        ) : (
          <>
            <ThemedText kind="h1" style={styles.resultTitle}>
              {mindHouseStrings.failTitle}
            </ThemedText>
            <Card style={styles.resultCard}>
              <ThemedText kind="body" style={styles.resultBody}>
                {formatTemplate(mindHouseStrings.failBody, { count: currentCount })}
              </ThemedText>
              <ThemedText kind="caption" muted style={styles.levelHint}>
                {mindHouseStrings.failHint}
              </ThemedText>
            </Card>
          </>
        )}
        <ThemedText kind="caption" style={styles.summaryText}>
          {formatTemplate(mindHouseStrings.finalSummary, { count: currentCount })}
        </ThemedText>
        <View style={styles.resultButtons}>
          <PrimaryButton
            title={isCorrect ? nextLevelLabel : mindHouseStrings.retryButton}
            onPress={handlePlayAgain}
          />
          <Pressable
            style={[styles.backButton, { borderColor: palette.border }]}
            onPress={handleBack}
          >
            <ThemedText kind="button" style={{ color: palette.text }}>
              {backLabel}
            </ThemedText>
          </Pressable>
        </View>
      </View>
    );
  };

  const renderCountdownOverlay = () => (
    <View style={styles.countdownOverlay}>
      <BlurView
        intensity={70}
        tint={theme.mode === 'dark' ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.countdownContent}>
        <ThemedText kind="h2" style={[styles.title, { fontSize: 24 }]}>
          {formatTemplate(mindHouseStrings.countdownTitle, { level })}
        </ThemedText>
        <View style={[styles.countdownCircle, { borderColor: palette.primary }]}>
          <ThemedText kind="h1" style={{ fontSize: 64, color: palette.text }}>
            {countdownValue ?? 3}
          </ThemedText>
        </View>
      </View>
    </View>
  );

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
      >
        {/* BackButton entfernt – nativer Header übernimmt */}
        <View style={[styles.levelBadge, { backgroundColor: palette.surfaceMuted }]}>
          <ThemedText kind="caption" style={{ color: palette.textMuted }}>
            {formatTemplate(mindHouseStrings.levelBadge, { level })}
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
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    gap: 24,
  },
  phaseContainer: {
    gap: 24,
    alignItems: 'center',
  },
  levelBadge: {
    alignSelf: 'center',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  introCard: {
    padding: 20,
    gap: 12,
  },
  introText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  playingTitle: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  houseAndFiguresContainer: {
    position: 'relative',
    width: '100%',
    minHeight: 250,
    marginVertical: 20,
    overflow: 'visible',
  },
  houseContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  houseWrapper: {
    width: HOUSE_WIDTH,
    height: HOUSE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  houseImage: {
    width: HOUSE_WIDTH,
    height: HOUSE_HEIGHT,
  },
  walkingFigure: {
    position: 'absolute',
    width: FIGURE_SIZE,
    height: FIGURE_SIZE,
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 10,
    left: 0, // Start from left edge of screen
  },
  figuresContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: -CONTENT_HORIZONTAL_PADDING,
    right: -CONTENT_HORIZONTAL_PADDING,
    pointerEvents: 'none',
    zIndex: 1000,
  },
  walkingFigureAbsolute: {
    width: FIGURE_SIZE,
    height: FIGURE_SIZE,
    alignItems: 'center',
    justifyContent: 'flex-end', // Align SVG to bottom of container so feet are at bottom
    left: 0, // Position relative to screen (0 = left edge, SCREEN_WIDTH = right edge)
    pointerEvents: 'none', // Don't block touches
    overflow: 'visible', // Ensure SVG is fully visible
    // Add paddingBottom to push the figure down if there's SVG whitespace
    paddingBottom: 0,
  },
  hintText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  answerTitle: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  numberInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  numberButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberButtonText: {
    fontSize: 24,
    fontWeight: '600',
  },
  numberInput: {
    width: 120,
    height: 60,
    borderWidth: 2,
    borderRadius: 12,
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  resultCard: {
    padding: 20,
    gap: 12,
  },
  resultBody: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  levelHint: {
    marginTop: 4,
    textAlign: 'center',
  },
  summaryText: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
  },
  resultButtons: {
    width: '100%',
    gap: 12,
    alignItems: 'stretch',
  },
  backButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  countdownContent: {
    width: '80%',
    maxWidth: 320,
    alignItems: 'center',
    gap: 24,
  },
  countdownCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.88)',
  },
});


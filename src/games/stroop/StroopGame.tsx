import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { NativeModulesProxy } from 'expo-modules-core';
import { Ionicons } from '@expo/vector-icons';
import { saveStroopSession, type SessionSummary } from './storage';

type Mode = 'INK' | 'WORD';
type ColorName = 'RED' | 'GREEN' | 'BLUE' | 'YELLOW' | 'PURPLE' | 'ORANGE';

type ColorOption = {
  name: ColorName;
  label: string;
  hex: string;
  marker: string;
};

type Trial = {
  id: number;
  inkColor: ColorOption;
  word: string;
  correctColor: ColorOption;
  isCongruent: boolean | null;
  isCannabis: boolean;
};

type TrialResult = {
  trial: Trial;
  correct: boolean;
  rt: number;
  timedOut: boolean;
};

type Props = {
  mode?: Mode;
  useCannabisStroop?: boolean;
  onExit?: (summary: SessionSummary) => void;
  onAbort?: () => void;
};

const TOTAL_TRIALS = 30;
const TRIAL_TIMEOUT_MS = 2000;
const ITI_MS = 400;
const CANNABIS_WORDS = ['Gras', 'Weed', 'Joint', 'Bong', 'Kiffen'];

const COLOR_OPTIONS: ColorOption[] = [
  { name: 'RED', label: 'Rot', hex: '#ef4444', marker: '⬤' },
  { name: 'GREEN', label: 'Grün', hex: '#22c55e', marker: '◆' },
  { name: 'BLUE', label: 'Blau', hex: '#3b82f6', marker: '■' },
  { name: 'YELLOW', label: 'Gelb', hex: '#facc15', marker: '▲' },
  { name: 'PURPLE', label: 'Lila', hex: '#a855f7', marker: '⬟' },
  { name: 'ORANGE', label: 'Orange', hex: '#f97316', marker: '⬢' },
];

const HAPTICS_MODULE = NativeModulesProxy?.ExpoHapticsModule as
  | {
      impactAsync?: (style: number) => Promise<void>;
      notificationAsync?: (type: number) => Promise<void>;
    }
  | undefined;

const triggerHaptic = (kind: 'success' | 'warning') => {
  if (!HAPTICS_MODULE?.impactAsync) return;
  const style = kind === 'success' ? 0 : 1; // roughly maps to Light / Medium styles
  HAPTICS_MODULE.impactAsync(style).catch(() => undefined);
};

const createSeededRng = (seed: number) => {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
};

const pickColorExcluding = (rand: () => number, exclude: ColorName): ColorOption => {
  let candidate = COLOR_OPTIONS[Math.floor(rand() * COLOR_OPTIONS.length)];
  let guard = 0;
  while (candidate.name === exclude && guard < 10) {
    candidate = COLOR_OPTIONS[Math.floor(rand() * COLOR_OPTIONS.length)];
    guard += 1;
  }
  return candidate;
};

const buildTrials = (seed: number, mode: Mode, allowCannabisWords: boolean): Trial[] => {
  const rand = createSeededRng(seed);
  const trials: Trial[] = [];
  for (let i = 0; i < TOTAL_TRIALS; i += 1) {
    const inkColor = COLOR_OPTIONS[Math.floor(rand() * COLOR_OPTIONS.length)];
    const shouldBeCongruent = rand() > 0.5;
    const useCannabisWord = allowCannabisWords && rand() < 0.25;

    let word = '';
    let wordColor: ColorOption | null = null;
    let isCannabis = false;

    if (useCannabisWord && mode === 'INK') {
      word = CANNABIS_WORDS[Math.floor(rand() * CANNABIS_WORDS.length)];
      isCannabis = true;
    } else {
      wordColor = shouldBeCongruent ? inkColor : pickColorExcluding(rand, inkColor.name);
      word = wordColor.label.toUpperCase();
    }

    const correctColor = mode === 'WORD' ? wordColor ?? inkColor : inkColor;
    const isCongruent = wordColor ? wordColor.name === inkColor.name : null;

    trials.push({
      id: i,
      inkColor,
      word,
      correctColor,
      isCongruent,
      isCannabis,
    });
  }
  return trials;
};

const mean = (values: number[]): number => {
  if (!values.length) return NaN;
  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
};

const buildSummary = (
  results: TrialResult[],
  mode: Mode,
  useCannabisStroop: boolean
): SessionSummary => {
  const totalTrials = results.length;
  const correct = results.filter((r) => r.correct).length;
  const accuracy = totalTrials ? correct / totalTrials : 0;
  const meanRTAll = mean(results.map((r) => r.rt));
  const congruent = results.filter((r) => r.trial.isCongruent === true).map((r) => r.rt);
  const incongruent = results.filter((r) => r.trial.isCongruent === false).map((r) => r.rt);
  const cannabis = results.filter((r) => r.trial.isCannabis).map((r) => r.rt);
  const neutral = results.filter((r) => !r.trial.isCannabis).map((r) => r.rt);

  const meanRTCongruent = mean(congruent);
  const meanRTIncongruent = mean(incongruent);
  const stroopInterferenceMs = meanRTIncongruent - meanRTCongruent;
  const cannabisBias =
    useCannabisStroop && cannabis.length && neutral.length ? mean(cannabis) - mean(neutral) : undefined;

  return {
    totalTrials,
    correct,
    accuracy,
    meanRTAll,
    meanRTCongruent,
    meanRTIncongruent,
    stroopInterferenceMs,
    cannabisBiasMs: cannabisBias,
    mode,
    useCannabisStroop,
    timestamp: Date.now(),
  };
};

const formatMsValue = (value: number): string => {
  if (!Number.isFinite(value)) return '—';
  return `${Math.round(value)} ms`;
};

type Interpretation = {
  title: string;
  body: string;
  mood: 'good' | 'ok' | 'warn';
};

const interpretSummary = (summary: SessionSummary): Interpretation => {
  const accuracy = summary.accuracy;
  const interference = summary.stroopInterferenceMs;
  if (accuracy >= 0.9 && interference <= 120) {
    return {
      title: 'Laser-Fokus',
      body: 'Sehr sichere Antworten und kaum Zusatzzeit bei Konflikten. Weiter so – dein Kopf bleibt ruhig.',
      mood: 'good',
    };
  }
  if (accuracy >= 0.8 && interference <= 200) {
    return {
      title: 'Stabile Kontrolle',
      body: 'Gute Trefferquote, leichte Ablenkbarkeit bei Konflikten. Mit regelmäßiger Übung wirst du noch schneller.',
      mood: 'ok',
    };
  }
  return {
    title: 'Trainingsmodus',
    body: 'Dein Gehirn hat sich oft von den Wörtern austricksen lassen. Atme durch, probier es nüchtern & ausgeruht erneut.',
    mood: 'warn',
  };
};

export default function StroopGame({
  mode = 'INK',
  useCannabisStroop = false,
  onExit,
  onAbort,
}: Props) {
  const [seed, setSeed] = useState(() => Date.now());
  const [stage, setStage] = useState<'intro' | 'running' | 'summary'>('intro');
  const [trialIndex, setTrialIndex] = useState(0);
  const [results, setResults] = useState<TrialResult[]>([]);
  const [isCoolingDown, setIsCoolingDown] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const trialStartRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const itiRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedRef = useRef(false);

  const effectiveMode = mode ?? 'INK';
  const allowCannabisWords = useCannabisStroop && effectiveMode === 'INK';

  const trials = useMemo(
    () => buildTrials(seed, effectiveMode, allowCannabisWords),
    [seed, effectiveMode, allowCannabisWords]
  );

  const currentTrial = stage === 'running' ? trials[trialIndex] : undefined;

  const resetTimers = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (itiRef.current) {
      clearTimeout(itiRef.current);
      itiRef.current = null;
    }
  };

  const handleAbort = () => {
    resetTimers();
    setResults([]);
    setTrialIndex(0);
    setIsCoolingDown(false);
    setStage('intro');
    savedRef.current = false;
    onAbort?.();
  };

  const handleAnswer = useCallback(
    (selectedName: ColorName | null, timedOut = false) => {
      if (stage !== 'running' || isCoolingDown) return;
      const trial = trials[trialIndex];
      if (!trial) return;
      resetTimers();
      setIsCoolingDown(true);

      const now = performance.now();
      const started = trialStartRef.current || now;
      const rt = Math.max(0, now - started);
      const correct = !timedOut && selectedName === trial.correctColor.name;

      triggerHaptic(correct ? 'success' : 'warning');

      setResults((prev) => [
        ...prev,
        {
          trial,
          correct,
          rt,
          timedOut,
        },
      ]);

      itiRef.current = setTimeout(() => {
        setIsCoolingDown(false);
        if (trialIndex + 1 >= TOTAL_TRIALS) {
          setStage('summary');
        } else {
          setTrialIndex((prevIdx) => prevIdx + 1);
        }
      }, ITI_MS);
    },
    [isCoolingDown, stage, trialIndex, trials]
  );

  useEffect(() => {
    return () => {
      resetTimers();
    };
  }, []);

  useEffect(() => {
    if (stage !== 'running' || !currentTrial) return;
    setIsCoolingDown(false);
    trialStartRef.current = performance.now();
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => handleAnswer(null, true), TRIAL_TIMEOUT_MS);
  }, [stage, trialIndex, currentTrial, handleAnswer]);

  const summary = useMemo(() => {
    if (results.length < TOTAL_TRIALS) return null;
    return buildSummary(results, effectiveMode, allowCannabisWords);
  }, [results, effectiveMode, allowCannabisWords]);
  const summaryInterpretation = summary ? interpretSummary(summary) : null;

  useEffect(() => {
    if (stage !== 'summary' || !summary || savedRef.current) return;
    savedRef.current = true;
    saveStroopSession(summary).catch(() => {
      savedRef.current = false;
    });
  }, [stage, summary]);

  useEffect(() => {
    if (stage !== 'summary') {
      setShowInfo(false);
    }
  }, [stage]);

  const startSession = () => {
    savedRef.current = false;
    resetTimers();
    setResults([]);
    setTrialIndex(0);
    setIsCoolingDown(false);
    setSeed(Date.now());
    setStage('running');
  };

  const restartSession = () => {
    startSession();
  };

  const finishSession = () => {
    if (summary) {
      onExit?.(summary);
    } else {
      onExit?.(
        buildSummary(results, effectiveMode, allowCannabisWords)
      );
    }
  };

  const accuracyPct = Math.round((summary?.accuracy ?? 0) * 100);
  const instruction =
    effectiveMode === 'INK'
      ? 'Tipp auf die FARBE der Schrift – ignoriere das Wort.'
      : 'Tipp auf das WORT – ignoriere die Schriftfarbe.';

return (
  <View style={styles.root}>
    <View style={styles.topBar}>
      <Pressable style={styles.abortBtn} onPress={handleAbort} accessibilityRole="button">
        <Ionicons name="close-circle-outline" size={18} color="#f5f5f5" />
        <Text style={styles.abortText}>Abbrechen</Text>
      </Pressable>
    </View>
    <View style={styles.stageContainer}>
      {stage === 'intro' ? (
        <View style={styles.centerWrap}>
          <Text style={styles.title}>Stroop Focus</Text>
          <Text style={styles.instruction}>{instruction}</Text>
          <Text style={styles.infoText}>Kurztest (≈1–2 Min). Am besten nüchtern durchführen.</Text>
          <Pressable style={styles.primaryBtn} onPress={startSession}>
            <Text style={styles.primaryBtnText}>Start</Text>
          </Pressable>
        </View>
      ) : null}

      {stage === 'running' && currentTrial ? (
        <View style={styles.gameWrap}>
          <View style={styles.headerRow}>
            <Text style={styles.titleSmall}>Stroop Focus</Text>
            <Text style={styles.progress}>
              {trialIndex + 1}/{TOTAL_TRIALS}
            </Text>
          </View>
          <Text style={styles.instruction}>{instruction}</Text>
          <View style={styles.stimulusCard}>
            <Text
              testID="stroop-stimulus"
              style={[
                styles.stimulusWord,
                {
                  color: currentTrial.inkColor.hex,
                },
              ]}
            >
              {currentTrial.word}
            </Text>
          </View>
          <Text style={styles.helperText}>Wie lautet deine Antwort?</Text>
          <View style={styles.answersGrid}>
            {COLOR_OPTIONS.map((color) => (
              <Pressable
                key={color.name}
                testID={`stroop-answer-${color.name}`}
                onPress={() => handleAnswer(color.name)}
                disabled={isCoolingDown}
                style={({ pressed }) => [
                  styles.answerButton,
                  { borderColor: color.hex },
                  (pressed || isCoolingDown) && styles.answerButtonPressed,
                ]}
              >
                <View style={[styles.answerMarker, { borderColor: color.hex }]}>
                  <Text style={[styles.answerMarkerText, { color: color.hex }]}>{color.marker}</Text>
                </View>
                <Text style={styles.answerLabel}>{color.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {stage === 'summary' && summary ? (
        <View style={styles.summaryWrap}>
          <Text style={styles.title}>Stroop Focus</Text>
          <Text style={styles.instruction}>{instruction}</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryLeadRow}>
              <Text style={styles.summaryLead}>Starker Fokus! Hier sind deine Werte:</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setShowInfo((prev) => !prev)}
                style={styles.infoButton}
              >
                <Ionicons
                  name={showInfo ? 'information-circle' : 'information-circle-outline'}
                  size={20}
                  color="#f5f5f5"
                />
              </Pressable>
            </View>
            {showInfo ? (
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoTitle}>Stroop-Interferenz</Text>
                  <Text style={styles.infoTextSmall}>
                    Zeigt, wie viele Extra-Millis dein Gehirn braucht, wenn Farbe und Wort nicht zusammenpassen. Je
                    kleiner, desto entspannter reagierst du.
                  </Text>
                </View>
                {summary.cannabisBiasMs !== undefined ? (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoTitle}>Cannabis-Bias</Text>
                    <Text style={styles.infoTextSmall}>
                      Vergleicht Cannabis-Wörter mit neutralen Begriffen. Positiv = Cannabis lenkt dich etwas mehr ab.
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}
            <View style={styles.summaryGrid}>
              <View style={[styles.metricCard, styles.metricHighlight]}>
                <Text style={styles.metricValue}>{accuracyPct}%</Text>
                <Text style={styles.metricLabel}>Trefferquote</Text>
                <Text style={styles.metricHint}>Genauigkeit</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{formatMsValue(summary.meanRTAll)}</Text>
                <Text style={styles.metricLabel}>Ø Reaktionszeit</Text>
                <Text style={styles.metricHint}>Reaktionsschnelle</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{formatMsValue(summary.stroopInterferenceMs)}</Text>
                <Text style={styles.metricLabel}>Stroop-Interferenz</Text>
                <Text style={styles.metricHint}>Kleiner = besser</Text>
              </View>
              {summary.cannabisBiasMs !== undefined ? (
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>{formatMsValue(summary.cannabisBiasMs)}</Text>
                  <Text style={styles.metricLabel}>Cannabis-Bias</Text>
                  <Text style={styles.metricHint}>+ = langsamer bei Cannabis</Text>
                </View>
              ) : null}
            </View>
            {summary ? (
              <View
                style={[
                  styles.interpretCard,
                  summaryInterpretation?.mood === 'good'
                    ? styles.interpretGood
                    : summaryInterpretation?.mood === 'warn'
                    ? styles.interpretWarn
                    : undefined,
                ]}
              >
                <Text style={styles.interpretTitle}>{summaryInterpretation?.title}</Text>
                <Text style={styles.interpretText}>{summaryInterpretation?.body}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.summaryActions}>
            <Pressable style={[styles.secondaryBtn, styles.summaryBtn]} onPress={restartSession}>
              <Text style={styles.secondaryBtnText}>Nochmal</Text>
            </Pressable>
            <Pressable style={[styles.primaryBtn, styles.summaryBtn]} onPress={finishSession}>
              <Text style={styles.primaryBtnText}>Fertig</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  </View>
);
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#050505',
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 16,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  abortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  abortText: {
    color: '#f5f5f5',
    fontSize: 13,
    fontWeight: '600',
  },
  stageContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  centerWrap: {
    alignItems: 'center',
    gap: 16,
  },
  gameWrap: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
  },
  summaryWrap: {
    flex: 1,
    justifyContent: 'center',
    gap: 20,
  },
  title: {
    color: '#f5f5f5',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  titleSmall: {
    color: '#f5f5f5',
    fontSize: 18,
    fontWeight: '600',
  },
  instruction: {
    color: '#d4d4d4',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  infoText: {
    color: '#a3a3a3',
    fontSize: 14,
    textAlign: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progress: {
    color: '#f5f5f5',
    fontSize: 16,
    fontWeight: '600',
  },
  stimulusCard: {
    borderRadius: 16,
    backgroundColor: '#111827',
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stimulusWord: {
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  helperText: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
  },
  answersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  answerButton: {
    width: '48%',
    borderRadius: 16,
    borderWidth: 2,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0f172a',
  },
  answerButtonPressed: {
    opacity: 0.7,
  },
  answerMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerMarkerText: {
    fontSize: 16,
    fontWeight: '700',
  },
  answerLabel: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryBtn: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#04110b',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    borderColor: '#d4d4d4',
    borderWidth: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: '#f5f5f5',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 20,
    gap: 16,
  },
  summaryLeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLead: {
    color: '#e2e8f0',
    fontSize: 15,
    textAlign: 'center',
  },
  infoButton: {
    padding: 6,
  },
  infoCard: {
    backgroundColor: '#0b1220',
    borderRadius: 16,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  infoRow: {
    gap: 4,
  },
  infoTitle: {
    color: '#f5f5f5',
    fontSize: 13,
    fontWeight: '600',
  },
  infoTextSmall: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  metricCard: {
    width: '47%',
    backgroundColor: '#0b1220',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  metricHighlight: {
    borderColor: '#22c55e',
    backgroundColor: 'rgba(34,197,94,0.12)',
  },
  metricValue: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '700',
  },
  metricLabel: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricHint: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
  },
  summaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  interpretCard: {
    marginTop: 4,
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#101828',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 6,
  },
  interpretGood: {
    borderColor: 'rgba(34,197,94,0.6)',
    backgroundColor: 'rgba(34,197,94,0.12)',
  },
  interpretWarn: {
    borderColor: 'rgba(248,113,113,0.6)',
    backgroundColor: 'rgba(248,113,113,0.12)',
  },
  interpretTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  interpretText: {
    color: '#cbd5f5',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  summaryBtn: {
    flex: 1,
  },
});

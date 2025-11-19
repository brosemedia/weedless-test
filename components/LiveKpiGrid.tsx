/**
 * LiveKpiGrid
 * - Vier quadratische Karten (2x2) mit Live-Werten.
 * - Progressbar synct EXAKT zur nächsten Einheit per Modulo:
 *   - Money: 0,01 Währung
 *   - Cannabis: 0,001 g
 *   - Joints: 1 Stk
 *   - Zeit zurückgewonnen: 1 Minute
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMonotonicTicker } from '../hooks/useMonotonicTicker';
import { useStats } from '../src/lib/selectors';
import { GRAMS_PER_JOINT_DEFAULT } from '../src/lib/tasks';
import { colors } from '../src/design/tokens';
import { FrostedSurface } from '../src/design/FrostedSurface';

function safeProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function progressModulo(current: number, step: number): number {
  if (!Number.isFinite(current) || !Number.isFinite(step) || step <= 0) {
    return 0;
  }
  const remainder = ((current % step) + step) % step;
  return safeProgress(remainder / step);
}

const CARD_TEXT = colors.light.text;
const CARD_TEXT_MUTED = colors.light.textMuted;
const ICON_COLOR = colors.light.primary;
const CARD_BORDER = colors.light.primary;

type KpiCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  subline: string;
  progress: number;
  testID: string;
};

function KpiCard({ icon, label, value, subline, progress, testID }: KpiCardProps) {
  return (
    <View style={styles.card} accessibilityRole="text" accessibilityLabel={`${label}: ${value}`} testID={testID}>
      <FrostedSurface
        borderRadius={22}
        intensity={75}
        fallbackColor="rgba(255,255,255,0.04)"
        overlayColor="rgba(255,255,255,0.2)"
        style={styles.cardInner}
      >
        <View style={styles.cardIcon}>{icon}</View>
        <Text style={styles.cardValue}>{value}</Text>
        <Text style={styles.cardSub}>{subline}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${safeProgress(progress) * 100}%` }]} />
        </View>
        <Text style={styles.cardLabel}>{label}</Text>
      </FrostedSurface>
    </View>
  );
}

export default function LiveKpiGrid() {
  useMonotonicTicker(8);
  const stats = useStats();

  if (!stats) return null;

  const { savedMoney, savedGrams, savedJoints, minutesSaved, fmtEUR, fmtG, fmtJ, fmtMM, profile } = stats;
  const gramsPerDay =
    profile.gramsPerDayBaseline ??
    (profile.jointsPerDayBaseline != null ? profile.jointsPerDayBaseline * GRAMS_PER_JOINT_DEFAULT : 0);
  const jointsPerDay =
    profile.jointsPerDayBaseline ??
    (profile.gramsPerDayBaseline != null ? profile.gramsPerDayBaseline / GRAMS_PER_JOINT_DEFAULT : 0);
  const gramsPerHour = gramsPerDay / 24;
  const jointsPerHour = jointsPerDay / 24;
  const pricePerGram =
    profile.pricePerGram ??
    (profile.costPerJoint ? profile.costPerJoint / GRAMS_PER_JOINT_DEFAULT : 0);
  const moneyPerHour = gramsPerHour * pricePerGram;
  const minutesPerHour = (profile.avgSessionMinutes ?? 0) * jointsPerHour;

  const moneyProgress = progressModulo(savedMoney, 0.01);
  const gramProgress = progressModulo(savedGrams, 0.001);
  const jointProgress = progressModulo(savedJoints, 1);
  const timeProgress = progressModulo(minutesSaved, 1);

  const moneyDisplay = fmtEUR(savedMoney);
  const gramDisplay = `${fmtG(savedGrams)} g`;
  const jointsDisplay = `${fmtJ(savedJoints)}`;
  const timeDisplay = fmtMM(minutesSaved);

  const nfHour = new Intl.NumberFormat(profile.locale ?? 'de-DE', {
    maximumFractionDigits: 2,
  });

  return (
    <View style={styles.grid}>
      <KpiCard
        icon={<MaterialCommunityIcons name="cash-multiple" size={30} color={ICON_COLOR} />}
        label="Geld gespart"
        value={moneyDisplay}
        subline={`≈ ${fmtEUR(moneyPerHour)} /h`}
        progress={moneyProgress}
        testID="kpi-money"
      />
      <KpiCard
        icon={<MaterialCommunityIcons name="leaf" size={30} color={ICON_COLOR} />}
        label="Gramm vermieden"
        value={gramDisplay}
        subline={`≈ ${nfHour.format(gramsPerHour)} g/h`}
        progress={gramProgress}
        testID="kpi-grams"
      />
      <KpiCard
        icon={<MaterialCommunityIcons name="smoking-off" size={30} color={ICON_COLOR} />}
        label="Joints vermieden"
        value={jointsDisplay}
        subline={`≈ ${nfHour.format(jointsPerHour)} /h`}
        progress={jointProgress}
        testID="kpi-joints"
      />
      <KpiCard
        icon={<MaterialCommunityIcons name="clock-check" size={30} color={ICON_COLOR} />}
        label="Zeit zurückgewonnen"
        value={timeDisplay}
        subline={`≈ ${nfHour.format(minutesPerHour)} min/h`}
        progress={timeProgress}
        testID="kpi-time"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: -6,
  },
  card: {
    flexBasis: '48%',
    maxWidth: '48%',
    aspectRatio: 1,
    borderRadius: 22,
    marginBottom: 16,
    shadowColor: 'rgba(161,166,31,0.45)',
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
    backgroundColor: 'transparent',
  },
  cardInner: {
    flex: 1,
    borderRadius: 22,
    padding: 18,
    justifyContent: 'flex-end',
    borderWidth: 2,
    borderColor: CARD_BORDER,
    overflow: 'hidden',
  },
  cardIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
    opacity: 0.9,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: '800',
    color: CARD_TEXT,
  },
  cardSub: {
    marginTop: 4,
    fontSize: 13,
    color: CARD_TEXT_MUTED,
  },
  cardLabel: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
    color: CARD_TEXT,
  },
  progressTrack: {
    marginTop: 12,
    height: 5,
    width: '100%',
    borderRadius: 5,
    backgroundColor: 'rgba(161,166,31,0.15)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: CARD_BORDER,
  },
});

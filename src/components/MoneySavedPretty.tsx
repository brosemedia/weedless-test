import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useApp } from '../store/app';
import { DayLog, Profile } from '../types/profile';

type Pt = { x: Date; y: number };

const gramsPerJointDefault = 0.25;
const DAY = 24 * 60 * 60 * 1000;

function gramsPerHour(p: Profile) {
  if (p.gramsPerDayBaseline) return p.gramsPerDayBaseline / 24;
  if (p.jointsPerDayBaseline) return (p.jointsPerDayBaseline * gramsPerJointDefault) / 24;
  return 0;
}
function pricePerGram(p: Profile) {
  if (p.pricePerGram) return p.pricePerGram;
  if (p.costPerJoint) return p.costPerJoint / gramsPerJointDefault;
  return 0;
}
function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

function sumConsumedUpTo(dayLogs: Record<string, DayLog>, untilYmd: string, fromYmd?: string) {
  return Object.values(dayLogs).reduce((a, d) => {
    if (!d.date || d.date > untilYmd) return a;
    if (fromYmd && d.date < fromYmd) return a;
    return a + (d.consumedGrams || 0);
  }, 0);
}

/** Builds a daily cumulative "money saved" series from profile.moneyCalculationStartTimestamp (fallback start) to today. */
function buildMoneySavedSeries(profile: Profile, logs: Record<string, DayLog>): Pt[] {
  const startSource = profile.moneyCalculationStartTimestamp ?? profile.startTimestamp;
  if (!startSource) return [];
  const gph = gramsPerHour(profile);
  const ppg = pricePerGram(profile);
  const start = new Date(startSource);
  const today = new Date();
  const days = Math.max(
    0,
    Math.floor(
      (Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) -
        Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())) /
        DAY,
    ),
  );
  const out: Pt[] = [];
  const startKey = ymd(start);
  for (let i = 0; i <= days; i++) {
    const d = new Date(start.getTime() + i * DAY);
    const key = ymd(d);
    const hoursSinceStart = (d.getTime() + DAY - startSource) / 3_600_000; // end of day
    const expectedGrams = Math.max(0, hoursSinceStart * gph);
    const consumedGrams = sumConsumedUpTo(logs, key, startKey);
    const savedGrams = Math.max(0, expectedGrams - consumedGrams);
    const money = Math.max(0, savedGrams * ppg);
    out.push({ x: d, y: Number(money.toFixed(2)) });
  }
  return out;
}

export default function MoneySavedPretty() {
  const profile = useApp((s) => s.profile);
  const logs = useApp((s) => s.dayLogs);

  if (!profile) return null;

  const locale = profile.locale ?? 'de-DE';
  const series = useMemo(() => buildMoneySavedSeries(profile, logs), [profile, logs]);

  if (!series.length) {
    return (
      <View style={{ paddingVertical: 12 }}>
        <Text style={{ opacity: 0.7 }}>Noch keine Daten für „Geld gespart“.</Text>
      </View>
    );
  }

  // Map to gifted-charts format
  const points = series.map((d) => ({
    value: d.y,
    label: d.x.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' }),
    // You can also add 'dataPointText' if you want labels on points
  }));

  // Auto-scale Y with small padding
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = (max - min) * 0.05 || 1;
  const yMin = Math.max(0, Math.floor(min - pad));
  const yMax = Math.ceil(max + pad);

  return (
    <View accessible accessibilityLabel="Verlauf Geld gespart">
      <LineChart
        data={points}
        areaChart
        curved
        thickness={3}
        hideRules
        yAxisTextStyle={{ opacity: 0.7 }}
        yAxisOffset={yMin}
        maxValue={yMax}
        // avoid clipping bottom/left labels:
        initialSpacing={16}
        endSpacing={16}
        xAxisThickness={1}
        xAxisTextNumberOfLines={1}
        adjustToWidth
        // nice interactions:
        focusEnabled
        showDataPointOnFocus
        showStripOnFocus
        stripHeight={8}
      />
    </View>
  );
}

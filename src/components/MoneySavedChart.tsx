import React from "react";
import { View, Text, useWindowDimensions, Pressable } from "react-native";
import { Svg, Defs, LinearGradient, Stop, Path, Line, Circle, Text as SvgText } from "react-native-svg";
import { eachDayOfInterval } from "date-fns";
import { useTheme } from "../design/theme";
import { useStore } from "../store/useStore";
import { useApp } from "../store/app";
import type { DiaryEntry, Profile } from "../types";
import type { DayLog } from "../types/profile";

const COLOR_LINE = "#7C3AED";
const COLOR_FILL = "rgba(124,58,237,0.18)";
const COLOR_GRID = "rgba(0,0,0,0.08)";
const DAY = 24 * 60 * 60 * 1000;

type Range = "week" | "month" | "year" | "all";

const RANGE_OPTIONS: { key: Range; label: string }[] = [
  { key: "week", label: "Woche" },
  { key: "month", label: "Monat" },
  { key: "year", label: "Jahr" },
  { key: "all", label: "Alle" },
];

const RANGE_DAYS: Record<Range, number | null> = {
  week: 7,
  month: 30,
  year: 365,
  all: null,
};

type SeriesPoint = { x: Date; y: number };

const toDateKey = (date: Date) => date.toISOString().slice(0, 10);

const buildDiaryMap = (entries: DiaryEntry[]) =>
  entries.reduce<Record<string, number>>((acc, entry) => {
    if (!entry?.date) return acc;
    const key = entry.date.slice(0, 10);
    acc[key] = (acc[key] ?? 0) + (entry.amount ?? 0);
    return acc;
  }, {});

const buildSavedSeries = (
  profile: Profile | undefined,
  diary: DiaryEntry[],
  dayLogs: Record<string, DayLog>
): SeriesPoint[] => {
  if (!profile?.baseline) return [];
  const baselinePerDay = profile.baseline.amountPerDay ?? 0;
  const pricePerUnit = profile.baseline.pricePerUnit ?? 0;
  if (!baselinePerDay || !pricePerUnit) return [];
  const startDate = profile.startedAt ? new Date(profile.startedAt) : new Date();
  const today = new Date();
  if (Number.isNaN(startDate.getTime()) || startDate > today) return [];
  const diaryMap = buildDiaryMap(diary);
  const spendMap = Object.values(dayLogs).reduce<Record<string, number>>((acc, log) => {
    if (!log?.date) return acc;
    const key = log.date.slice(0, 10);
    acc[key] = (acc[key] ?? 0) + (log.moneySpentEUR ?? 0);
    return acc;
  }, {});
  let cumulative = 0;
  const days = eachDayOfInterval({ start: startDate, end: today });
  return days.map((day) => {
    const key = toDateKey(day);
    const actualUnits = diaryMap[key] ?? 0;
    const savedUnits = Math.max(0, baselinePerDay - actualUnits);
    const savedValue = savedUnits * pricePerUnit;
    const spentToday = spendMap[key] ?? 0;
    cumulative = Math.max(0, cumulative + savedValue - spentToday);
    return { x: day, y: Number(cumulative.toFixed(2)) };
  });
};

export default function MoneySavedChart({ height = 160 }: { height?: number }) {
  const profile = useStore((s) => s.profile);
  const diary = useStore((s) => s.diary);
  const dayLogs = useApp((s) => s.dayLogs);
  const { width: windowWidth } = useWindowDimensions();
  const { colors: themeColors } = useTheme();
  const [range, setRange] = React.useState<Range>("month");

  const series = React.useMemo(
    () => buildSavedSeries(profile, diary, dayLogs),
    [profile, diary, dayLogs]
  );
  if (!profile || series.length === 0) {
    return null;
  }

  const locale = profile.locale ?? "de-DE";
  const currency = profile.currency ?? "EUR";
  const fmtEUR = (v: number, fractionDigits = 0) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: fractionDigits,
    }).format(v);

  const chartWidth = Math.min(Math.max(windowWidth - 36, 280), 360);
  const padding = 16;
  const lastDate = series[series.length - 1]?.x;
  if (!lastDate) return null;
  const cutoffDate =
    RANGE_DAYS[range] == null ? series[0].x : new Date(lastDate.getTime() - RANGE_DAYS[range]! * DAY);
  const trimmedSeries = series.filter((point) => point.x >= cutoffDate);
  const visibleSeries = trimmedSeries.length ? trimmedSeries : [series[series.length - 1]];
  const minX = visibleSeries[0].x.getTime();
  const maxX = visibleSeries[visibleSeries.length - 1].x.getTime();
  const rangeX = Math.max(1, maxX - minX);
  const values = visibleSeries.map((point) => point.y);
  const minY = Math.min(...values);
  const maxY = Math.max(...values);
  const rangeY = Math.max(1, maxY - minY);
  const baseY = height - padding;

  const points = visibleSeries.map((point) => {
    const x =
      padding +
      ((point.x.getTime() - minX) / rangeX) * (chartWidth - padding * 2 || 1);
    const y =
      padding +
      ((maxY - point.y) / rangeY) * (height - padding * 2 || 1);
    return { x, y, value: point.y, date: point.x };
  });

  const yTicks = Array.from({ length: 4 }).map((_, idx) => {
    const value = maxY - (rangeY * idx) / 3;
    const y =
      padding +
      ((maxY - value) / rangeY) * (height - padding * 2 || 1);
    return { value, y };
  });

  const xTicks = Array.from({ length: 4 }).map((_, idx) => {
    const ratio = idx / 3;
    const value = minX + rangeX * ratio;
    const x =
      padding +
      ((value - minX) / rangeX) * (chartWidth - padding * 2 || 1);
    return { date: new Date(value), x };
  });

  const linePath = points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${baseY} L ${points[0].x} ${baseY} Z`;
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  const changePercent =
    firstPoint && firstPoint.value > 0
      ? ((lastPoint.value - firstPoint.value) / Math.max(1, firstPoint.value)) * 100
      : 0;
  const changeLabel = `${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(1)}%`;

  const pauseStartLabel = new Date(profile.startedAt ?? new Date().toISOString()).toLocaleDateString(
    locale,
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
  const totalSaved = series[series.length - 1]?.y ?? 0;

  const rangeLabel =
    range === "week" ? "Letzte Woche" : range === "month" ? "Letzte 30 Tage" : range === "year" ? "Letztes Jahr" : "Gesamt";

  return (
    <View accessible accessibilityLabel="Verlauf Geld gespart" style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View>
          <Text style={{ fontSize: 13, color: themeColors.textMuted }}>Geld gespart</Text>
          <Text style={{ fontSize: 22, fontWeight: "600", color: themeColors.text }}>
            {fmtEUR(totalSaved)}
          </Text>
          <Text style={{ fontSize: 12, color: themeColors.textMuted }}>Seit {pauseStartLabel}</Text>
          <Text style={{ fontSize: 11, color: themeColors.textMuted }}>{rangeLabel}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <View
            style={{
              backgroundColor: "rgba(124,58,237,0.18)",
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 999,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: "600", color: COLOR_LINE }}>{changeLabel}</Text>
          </View>
          <Text style={{ fontSize: 11, color: themeColors.textMuted, marginTop: 4 }}>
            ggü. {rangeLabel}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {RANGE_OPTIONS.map((option) => (
          <Pressable
            key={option.key}
            onPress={() => setRange(option.key)}
            style={{
              borderRadius: 999,
              borderWidth: 1,
              borderColor: range === option.key ? "#7C3AED" : themeColors.border,
              backgroundColor: range === option.key ? "rgba(124,58,237,0.1)" : "transparent",
              paddingHorizontal: 12,
              paddingVertical: 4,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: range === option.key ? "600" : "500",
                color: range === option.key ? "#4C1D95" : themeColors.text,
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <Svg width={chartWidth} height={height}>
        <Defs>
          <LinearGradient id="moneySavedGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={COLOR_FILL} stopOpacity={1} />
            <Stop offset="100%" stopColor={COLOR_FILL} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        {yTicks.map((tick) => (
          <React.Fragment key={`y-${tick.y}`}>
            <Line
              x1={padding}
              y1={tick.y}
              x2={chartWidth - padding}
              y2={tick.y}
              stroke={COLOR_GRID}
              strokeWidth={1}
            />
            <SvgText
              x={padding - 6}
              y={tick.y + 4}
              fill={themeColors.textMuted}
              fontSize={10}
              textAnchor="end"
            >
              {fmtEUR(tick.value, 0)}
            </SvgText>
          </React.Fragment>
        ))}
        <Path d={areaPath} fill="url(#moneySavedGradient)" stroke="transparent" />
        <Path d={linePath} stroke={COLOR_LINE} strokeWidth={3} fill="none" />
        <Circle cx={lastPoint.x} cy={lastPoint.y} r={6} fill="#fff" stroke={COLOR_LINE} strokeWidth={3} />
        {xTicks.map((tick) => (
          <SvgText
            key={`x-${tick.x}`}
            x={tick.x}
            y={height - padding + 14}
            fill={themeColors.textMuted}
            fontSize={10}
            textAnchor="middle"
          >
            {tick.date.toLocaleDateString(locale, { day: "2-digit", month: "short" })}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

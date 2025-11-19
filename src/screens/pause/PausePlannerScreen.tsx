import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Text, Pressable, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { addDays, addMonths, differenceInCalendarDays, format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../../design/tokens';
import { HEADER_TOTAL_HEIGHT } from '../../components/AppHeader';
import { FrostedSurface } from '../../design/FrostedSurface';
import { useApp } from '../../store/app';
import { usePauseEngine } from '../../hooks/usePauseEngine';
import { DateTimePickerModal } from '../../components/DateTimePickerModal';
import { calculatePauseStats, parseDateKey, pauseDurationInDays, toDateKey } from '../../lib/pause';
import { useStore } from '../../store/useStore';
import { useUiStore } from '../../store/ui';

const PRESETS = [
  { label: '3 Tage', days: 3 },
  { label: '7 Tage', days: 7 },
  { label: '14 Tage', days: 14 },
  { label: '1 Monat', days: 30 },
] as const;

const formatDateLabel = (key: string) => format(parseDateKey(key), 'dd.MM.yyyy');

const InfoText = ({ children }: { children: React.ReactNode }) => (
  <Text style={{ color: colors.light.textMuted, fontSize: 14 }}>{children}</Text>
);

const ActionButton = ({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
}) => (
  <Pressable
    accessibilityRole="button"
    onPress={disabled ? undefined : onPress}
    style={({ pressed }) => [
      {
        paddingVertical: spacing.m,
        borderRadius: radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: variant === 'ghost' ? 1 : 0,
        borderColor: variant === 'ghost' ? colors.light.primary : 'transparent',
        backgroundColor: variant === 'ghost' ? 'transparent' : colors.light.primary,
        opacity: disabled ? 0.4 : 1,
      },
      pressed && !disabled && { opacity: 0.85 },
    ]}
    disabled={disabled}
  >
    <Text
      style={{
        fontSize: 16,
        fontWeight: '700',
        color:
          variant === 'ghost'
            ? disabled
              ? 'rgba(16,104,74,0.5)'
              : colors.light.primary
            : colors.light.surface,
      }}
    >
      {label}
    </Text>
  </Pressable>
);

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(
    Math.round(value)
  );

const formatNumber = (value: number) =>
  new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(value);

const dateKeyToEndOfDayTimestamp = (key: string) => {
  if (!key) return undefined;
  const [yearRaw, monthRaw, dayRaw] = key.split('-');
  const year = parseInt(yearRaw, 10);
  const month = parseInt(monthRaw, 10);
  const day = parseInt(dayRaw, 10);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return undefined;
  return new Date(year, month - 1, day, 23, 59, 59, 999).getTime();
};

export default function PausePlannerScreen({ navigation }: any) {
  usePauseEngine();
  const insets = useSafeAreaInsets();
  const headerAccessoryHeight = useUiStore((s) => s.headerAccessoryHeight);
  const pauses = useApp((s) => s.pauses);
  const startPause = useApp((s) => s.startPause);
  const endPause = useApp((s) => s.endPause);
  const profile = useApp((s) => s.profile);
  const celebrationId = useApp((s) => s.pauseCelebrationId);
  const acknowledge = useApp((s) => s.acknowledgePauseCelebration);
  const awardMilestone = useStore((s) => s.awardMilestone);
  const [selection, setSelection] = useState<typeof PRESETS[number]['days'] | 'custom'>(PRESETS[1].days);
  const [customStart, setCustomStart] = useState(new Date());
  const [customEnd, setCustomEnd] = useState(addDays(new Date(), 7));
  const [picker, setPicker] = useState<null | 'start' | 'end'>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [celebrationAwarded, setCelebrationAwarded] = useState(false);
  const activePause = pauses.find((pause) => pause.status === 'aktiv');
  const disableStart = Boolean(activePause);
  const sortedPauses = useMemo(() => [...pauses].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)), [pauses]);
  const latestFinished = sortedPauses.find((pause) => pause.status !== 'aktiv');
  const celebrationPause = celebrationId ? pauses.find((pause) => pause.id === celebrationId) : undefined;

  const todayKey = toDateKey(new Date());

  const derivedRange = useMemo(() => {
    if (selection === 'custom') {
      return { start: toDateKey(customStart), end: toDateKey(customEnd) };
    }
    const start = todayKey;
    const end = toDateKey(addDays(new Date(), selection - 1));
    return { start, end };
  }, [selection, customStart, customEnd, todayKey]);

  const durationDays = Math.max(
    1,
    differenceInCalendarDays(parseDateKey(derivedRange.end), parseDateKey(derivedRange.start)) + 1
  );

  const handleStartPause = () => {
    if (activePause) {
      setStatus('Es läuft bereits eine Pause – öffne die Detailansicht unten.');
      return;
    }
    const nowTs = Date.now();
    const plannedStartTs = selection === 'custom' ? customStart.getTime() : nowTs;
    const plannedEndTs =
      selection === 'custom' ? customEnd.getTime() : dateKeyToEndOfDayTimestamp(derivedRange.end);
    const result = startPause({
      startDate: derivedRange.start,
      endDate: derivedRange.end,
      startTimestamp: plannedStartTs,
      endTimestamp: plannedEndTs,
    });
    if (result.ok) {
      setStatus('Pause gestartet!');
    } else if (result.reason === 'date-order') {
      setStatus('Enddatum muss nach dem Start liegen.');
    } else {
      setStatus('Es ist bereits eine Pause aktiv.');
    }
  };

  const handleFinishActive = (status: 'abgebrochen' | 'abgeschlossen') => {
    endPause(status);
  };

  const closeCelebration = () => {
    if (celebrationPause) {
      acknowledge(celebrationPause.id);
    }
  };

  useEffect(() => {
    if (celebrationPause && !celebrationAwarded) {
      awardMilestone('pause-achieved');
      setCelebrationAwarded(true);
    }
    if (!celebrationPause && celebrationAwarded) {
      setCelebrationAwarded(false);
    }
  }, [celebrationPause, celebrationAwarded, awardMilestone]);

  return (
    <>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + HEADER_TOTAL_HEIGHT + headerAccessoryHeight + spacing.l,
          paddingBottom: Math.max(insets.bottom + spacing.xl, spacing.xl),
          paddingHorizontal: spacing.xl,
          gap: spacing.l,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.m }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Zurück"
            onPress={() => navigation.goBack?.()}
            hitSlop={10}
            style={({ pressed }) => [
              {
                width: 42,
                height: 42,
                borderRadius: radius.pill,
                backgroundColor: 'rgba(16,104,74,0.12)',
                alignItems: 'center',
                justifyContent: 'center',
              },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Ionicons name="chevron-back" size={22} color={colors.light.primary} />
          </Pressable>
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.light.text }}>Zurück</Text>
        </View>
        <View style={{ gap: spacing.s }}>
          <Text style={{ fontSize: 28, fontWeight: '700', color: colors.light.text }}>Pause einlegen</Text>
          <InfoText>Kurze Auszeiten helfen dir, Körper und Kopf Luft zu verschaffen. Suche dir einen Zeitraum aus – wir erinnern dich täglich.</InfoText>
        </View>

        {activePause ? (
          <FrostedSurface
            borderRadius={radius.xl}
            intensity={85}
            fallbackColor="rgba(16,104,74,0.15)"
            overlayColor="rgba(255,255,255,0.08)"
            style={{ padding: spacing.l, gap: spacing.m }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ fontSize: 18, fontWeight: '700', color: colors.light.text }}>Pause aktiv</Text>
                <InfoText>
                  {formatDateLabel(activePause.startDate)} – {formatDateLabel(activePause.endDate)}
                </InfoText>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="time-outline" size={18} color={colors.light.primary} />
                <Text style={{ fontWeight: '600', color: colors.light.primary }}>
                  noch {Math.max(0, pauseDurationInDays(activePause) - activePause.xpAwardedDays.length)} Tage
                </Text>
              </View>
            </View>
            <View style={{ height: 6, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.15)' }}>
              <View
                style={{
                  height: 6,
                  borderRadius: radius.pill,
                  backgroundColor: colors.light.primary,
                  width: `${Math.min(
                    100,
                    Math.round((activePause.xpAwardedDays.length / Math.max(1, pauseDurationInDays(activePause))) * 100)
                  )}%`,
                }}
              />
            </View>
            <InfoText>
              Sollte sich etwas ändern, kannst du die Pause jederzeit beenden. Wir speichern sie dann in deiner Historie.
            </InfoText>
            <ActionButton label="Pause beenden" onPress={() => handleFinishActive('abgebrochen')} />
            <ActionButton label="Zur Historie" variant="ghost" onPress={() => navigation.navigate('PauseHistory')} />
          </FrostedSurface>
        ) : null}

        <FrostedSurface
          borderRadius={radius.xl}
          intensity={75}
          fallbackColor="rgba(255,255,255,0.12)"
          overlayColor="rgba(255,255,255,0.18)"
          style={{ padding: spacing.l, gap: spacing.m, opacity: disableStart ? 0.5 : 1 }}
        >
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.light.text }}>Dauer auswählen</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s }}>
            {PRESETS.map((preset) => {
              const active = selection === preset.days;
              return (
                <Pressable
                  key={preset.label}
                  onPress={() => setSelection(preset.days)}
                  style={({ pressed }) => [
                    {
                      paddingHorizontal: spacing.l,
                      paddingVertical: spacing.s,
                      borderRadius: radius.pill,
                      backgroundColor: active ? colors.light.primary : colors.light.surface,
                      borderWidth: 1,
                      borderColor: active ? colors.light.primary : colors.light.border,
                    },
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Text style={{ fontWeight: '600', color: active ? colors.light.surface : colors.light.text }}>
                    {preset.label}
                  </Text>
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => setSelection('custom')}
              style={({ pressed }) => [
                {
                  paddingHorizontal: spacing.l,
                  paddingVertical: spacing.s,
                  borderRadius: radius.pill,
                  backgroundColor: selection === 'custom' ? colors.light.primary : colors.light.surface,
                  borderWidth: 1,
                  borderColor: selection === 'custom' ? colors.light.primary : colors.light.border,
                },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={{ fontWeight: '600', color: selection === 'custom' ? colors.light.surface : colors.light.text }}>
                Benutzerdefiniert
              </Text>
            </Pressable>
          </View>
          {selection === 'custom' ? (
            <View style={{ gap: spacing.m }}>
              <View>
                <Text style={{ fontWeight: '600', marginBottom: spacing.xs, color: colors.light.text }}>Startdatum</Text>
                <Pressable
                  onPress={() => setPicker('start')}
                  style={({ pressed }) => [
                    {
                      padding: spacing.m,
                      borderRadius: radius.l,
                      borderWidth: 1,
                      borderColor: colors.light.border,
                      backgroundColor: colors.light.surface,
                    },
                    pressed && { opacity: 0.9 },
                  ]}
                >
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.light.text }}>
                    {format(customStart, 'PPPP', { locale: de })}
                  </Text>
                </Pressable>
              </View>
              <View>
                <Text style={{ fontWeight: '600', marginBottom: spacing.xs, color: colors.light.text }}>Enddatum</Text>
                <Pressable
                  onPress={() => setPicker('end')}
                  style={({ pressed }) => [
                    {
                      padding: spacing.m,
                      borderRadius: radius.l,
                      borderWidth: 1,
                      borderColor: colors.light.border,
                      backgroundColor: colors.light.surface,
                    },
                    pressed && { opacity: 0.9 },
                  ]}
                >
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.light.text }}>
                    {format(customEnd, 'PPPP', { locale: de })}
                  </Text>
                </Pressable>
              </View>
              <InfoText>
                Tipp: Plane mindestens drei Tage ein – dein Körper kann in Ruhe auf Konsumfreiheit umstellen.
              </InfoText>
            </View>
          ) : null}

          <View>
            <Text style={{ fontWeight: '700', color: colors.light.text }}>Zusammenfassung</Text>
            <InfoText>
              {formatDateLabel(derivedRange.start)} – {formatDateLabel(derivedRange.end)} · {durationDays} Tage
            </InfoText>
          </View>
          <ActionButton label="Pause starten" onPress={handleStartPause} disabled={disableStart} />
          {disableStart ? (
            <InfoText>Es läuft bereits eine Pause. Beende sie, bevor du eine neue planst.</InfoText>
          ) : null}
          {status ? <Text style={{ color: colors.light.primary, fontWeight: '600' }}>{status}</Text> : null}
        </FrostedSurface>

        {latestFinished ? (
          <FrostedSurface borderRadius={radius.xl} intensity={70} fallbackColor="rgba(255,255,255,0.1)" overlayColor="rgba(255,255,255,0.16)" style={{ padding: spacing.l, gap: spacing.s }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.light.text }}>Letzte Auswertung</Text>
            <InfoText>
              {formatDateLabel(latestFinished.startDate)} – {formatDateLabel(latestFinished.endDate)} ({pauseDurationInDays(latestFinished)} Tage)
            </InfoText>
            {(() => {
              const statsBlock = latestFinished.stats || (profile ? calculatePauseStats(latestFinished, profile) : undefined);
              if (!statsBlock) return null;
              return (
                <View style={{ gap: spacing.xs }}>
                  <Text style={{ fontWeight: '600', color: colors.light.text }}>Gespart</Text>
                  <InfoText>
                    {formatCurrency(statsBlock.savedMoney)} · {formatNumber(statsBlock.savedGrams)} g ·
                    {` ${formatNumber(statsBlock.savedTimeHours)} h`}
                  </InfoText>
                </View>
              );
            })()}
            <ActionButton label="Zur Historie" variant="ghost" onPress={() => navigation.navigate('PauseHistory')} />
          </FrostedSurface>
        ) : null}
      </ScrollView>

      <DateTimePickerModal
        visible={picker === 'start'}
        date={customStart}
        locale="de-DE"
        onChange={(date) => {
          setCustomStart(date);
          if (date > customEnd) {
            setCustomEnd(addDays(date, 3));
          }
        }}
        onDismiss={() => setPicker(null)}
        onConfirm={() => setPicker(null)}
        minimumDate={new Date()}
        maximumDate={addMonths(new Date(), 6)}
      />
      <DateTimePickerModal
        visible={picker === 'end'}
        date={customEnd}
        locale="de-DE"
        onChange={(date) => setCustomEnd(date)}
        onDismiss={() => setPicker(null)}
        onConfirm={() => {
          if (customEnd < customStart) {
            setCustomEnd(addDays(customStart, 1));
          }
          setPicker(null);
        }}
        minimumDate={customStart}
        maximumDate={addMonths(new Date(), 12)}
      />

      <Modal animationType="slide" transparent visible={Boolean(celebrationPause)} onRequestClose={closeCelebration}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', padding: spacing.l }}>
          {celebrationPause ? (
            <View style={{ width: '100%', borderRadius: radius.xl, backgroundColor: colors.light.surface, padding: spacing.l, gap: spacing.m }}>
              <View>
                <Text style={{ fontSize: 22, fontWeight: '700', color: colors.light.text }}>🎉 Pause erreicht!</Text>
                <InfoText>
                  {formatDateLabel(celebrationPause.startDate)} – {formatDateLabel(celebrationPause.endDate)} ({pauseDurationInDays(celebrationPause)} Tage)
                </InfoText>
              </View>
              <InfoText>Starker Fokus! Du hast deine geplante Konsumpause ohne Einträge geschafft.</InfoText>
              <View style={{ backgroundColor: colors.light.surfaceMuted, borderRadius: radius.l, padding: spacing.m, gap: spacing.xs }}>
                {(() => {
                  const stats = celebrationPause.stats || (profile ? calculatePauseStats(celebrationPause, profile) : undefined);
                  if (!stats) return null;
                  return (
                    <>
                      <Text style={{ fontWeight: '600', color: colors.light.text }}>Deine Bilanz</Text>
                      <InfoText>{formatCurrency(stats.savedMoney)} gespart</InfoText>
                      <InfoText>{formatNumber(stats.savedGrams)} g nicht konsumiert</InfoText>
                      <InfoText>{formatNumber(stats.savedTimeHours)} h Freizeit gewonnen</InfoText>
                    </>
                  );
                })()}
              </View>
              <ActionButton label="Zur Historie" onPress={() => {
                closeCelebration();
                navigation.navigate('PauseHistory');
              }} />
              <ActionButton label="Weiter" variant="ghost" onPress={closeCelebration} />
            </View>
          ) : null}
        </View>
      </Modal>
    </>
  );
}

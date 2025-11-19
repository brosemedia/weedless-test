import type { ImageSourcePropType } from 'react-native';
import { type Milestone, type MilestoneIconKey } from '../types/milestone';

const ICON_MAP: Record<MilestoneIconKey, ImageSourcePropType> = {
  streakSeed: require('../../assets/cannabis_icons/Cannabis_2.png'),
  streakSprout: require('../../assets/cannabis_icons/Cannabis_4.png'),
  streakBloom: require('../../assets/cannabis_icons/Cannabis_6.png'),
  streakCanopy: require('../../assets/cannabis_icons/Cannabis_8.png'),
  streakForest: require('../../assets/cannabis_icons/Cannabis_10.png'),
  streakSummit: require('../../assets/cannabis_icons/Cannabis_12.png'),
  streakLegend: require('../../assets/cannabis_icons/Cannabis_14.png'),
  countFirst: require('../../assets/cannabis_icons/Cannabis_17.png'),
  countHabit: require('../../assets/cannabis_icons/Cannabis_18.png'),
  countCommitted: require('../../assets/cannabis_icons/Cannabis_19.png'),
  countMastery: require('../../assets/cannabis_icons/Cannabis_20.png'),
  countCenturion: require('../../assets/cannabis_icons/Cannabis_21.png'),
  moneySeed: require('../../assets/cannabis_icons/Cannabis_24.png'),
  moneySapling: require('../../assets/cannabis_icons/Cannabis_25.png'),
  moneyGrowth: require('../../assets/cannabis_icons/Cannabis_26.png'),
  moneyHarvest: require('../../assets/cannabis_icons/Cannabis_27.png'),
  moneyTreasury: require('../../assets/cannabis_icons/Cannabis_28.png'),
  moneyLegacy: require('../../assets/cannabis_icons/Cannabis_29.png'),
};

export const DEFAULT_MILESTONES: Milestone[] = [
  {
    id: 'streak1',
    title: '1 Tag am Stück',
    description: 'Der erste Tag ohne Konsum.',
    points: 5,
    kind: 'streak',
    threshold: 1,
    icon: 'streakSeed',
  },
  {
    id: 'streak3',
    title: '3 Tage am Stück',
    description: 'Der erste Mini-Streak ist geschafft.',
    points: 10,
    kind: 'streak',
    threshold: 3,
    icon: 'streakSprout',
  },
  {
    id: 'streak7',
    title: '7 Tage am Stück',
    description: 'Eine ganze Woche – stark!',
    points: 20,
    kind: 'streak',
    threshold: 7,
    icon: 'streakBloom',
  },
  {
    id: 'streak14',
    title: '14 Tage am Stück',
    description: 'Zwei Wochen in Folge ohne Konsum.',
    points: 35,
    kind: 'streak',
    threshold: 14,
    icon: 'streakCanopy',
  },
  {
    id: 'streak30',
    title: '30 Tage am Stück',
    description: 'Ein ganzer Monat – neue Gewohnheiten entstehen.',
    points: 60,
    kind: 'streak',
    threshold: 30,
    icon: 'streakForest',
  },
  {
    id: 'streak60',
    title: '60 Tage am Stück',
    description: 'Zwei Monate konsequent drangeblieben.',
    points: 90,
    kind: 'streak',
    threshold: 60,
    icon: 'streakSummit',
  },
  {
    id: 'streak100',
    title: '100 Tage am Stück',
    description: 'Dreistellige Serie – du bist ein Vorbild.',
    points: 150,
    kind: 'streak',
    threshold: 100,
    icon: 'streakLegend',
  },
  {
    id: 'count5',
    title: '5 Tracken gesamt',
    description: 'Dranbleiben beginnt mit Regelmäßigkeit.',
    points: 6,
    kind: 'count',
    threshold: 5,
    icon: 'countFirst',
  },
  {
    id: 'count10',
    title: '10 Tracken gesamt',
    description: 'Zehnmal reflektiert – super Fortschritt.',
    points: 12,
    kind: 'count',
    threshold: 10,
    icon: 'countHabit',
  },
  {
    id: 'count25',
    title: '25 Tracken gesamt',
    description: 'Ein verlässlicher Rhythmus.',
    points: 25,
    kind: 'count',
    threshold: 25,
    icon: 'countCommitted',
  },
  {
    id: 'count50',
    title: '50 Tracken gesamt',
    description: 'Halbwegs zu 100 – stark durchgezogen.',
    points: 50,
    kind: 'count',
    threshold: 50,
    icon: 'countMastery',
  },
  {
    id: 'count100',
    title: '100 Tracken gesamt',
    description: 'Tagebuch-Profi mit echter Routine.',
    points: 90,
    kind: 'count',
    threshold: 100,
    icon: 'countCenturion',
  },
  {
    id: 'money100',
    title: '100 € gespart',
    description: 'Ein erster finanzieller Puffer entsteht.',
    points: 18,
    kind: 'money',
    threshold: 100,
    icon: 'moneySeed',
  },
  {
    id: 'money250',
    title: '250 € gespart',
    description: 'Ein Viertel Tausender mehr im Portemonnaie.',
    points: 35,
    kind: 'money',
    threshold: 250,
    icon: 'moneySapling',
  },
  {
    id: 'money500',
    title: '500 € gespart',
    description: 'Halbes Monatsgehalt gesichert.',
    points: 70,
    kind: 'money',
    threshold: 500,
    icon: 'moneyGrowth',
  },
  {
    id: 'money1000',
    title: '1.000 € gespart',
    description: 'Vierstellig – ein starkes Polster.',
    points: 120,
    kind: 'money',
    threshold: 1000,
    icon: 'moneyHarvest',
  },
  {
    id: 'money2500',
    title: '2.500 € gespart',
    description: 'Mehr als zwei Monatsmieten gesichert.',
    points: 220,
    kind: 'money',
    threshold: 2500,
    icon: 'moneyTreasury',
  },
  {
    id: 'money5000',
    title: '5.000 € gespart',
    description: 'Eine beachtliche Reserve – Chapeau!',
    points: 360,
    kind: 'money',
    threshold: 5000,
    icon: 'moneyLegacy',
  },
];

const defaultIds = new Set(DEFAULT_MILESTONES.map((m) => m.id));

function shallowEqualMilestone(a: Milestone, b: Milestone) {
  return (
    a.id === b.id &&
    a.title === b.title &&
    a.description === b.description &&
    a.points === b.points &&
    a.icon === b.icon &&
    a.kind === b.kind &&
    a.threshold === b.threshold &&
    a.achievedAt === b.achievedAt
  );
}

export function mergeMilestonesWithDefaults(existing?: Milestone[] | null): Milestone[] {
  const current = existing ?? [];
  const byId = new Map(current.map((m) => [m.id, m]));

  const mergedDefaults = DEFAULT_MILESTONES.map((base) => {
    const stored = byId.get(base.id);
    if (!stored) return { ...base };
    return {
      ...base,
      achievedAt: stored.achievedAt,
      points: stored.points ?? base.points,
    };
  });

  const custom = current.filter((m) => !defaultIds.has(m.id));
  return [...mergedDefaults, ...custom];
}

export function milestonesDiffer(a?: Milestone[] | null, b?: Milestone[] | null): boolean {
  if (!a && !b) return false;
  if (!a || !b) return true;
  if (a.length !== b.length) return true;
  return a.some((item) => {
    const other = b.find((m) => m.id === item.id);
    if (!other) return true;
    return !shallowEqualMilestone(item, other);
  });
}

export function resolveMilestoneIcon(key?: MilestoneIconKey): ImageSourcePropType | undefined {
  if (!key) return undefined;
  return ICON_MAP[key];
}

import type { SharedValue } from 'react-native-reanimated';
import type { Circle, Rect } from './physics';

export type SessionResult = {
  dateISO: string;
  durationSec: number;
  score: number;
};

export type Obstacle = {
  id: number;
  x: number;
  gapY: number;
  gapHeight: number;
  passed: boolean;
  active: boolean;
  topRect: Rect;
  bottomRect: Rect;
};

export type EngineConfig = {
  width: number;
  height: number;
  obstacleWidth: number;
  poolSize: number;
  gapMargin: number;
  playerX: number;
  playerSize: number;
  groundHeight: number;
  spawnSpacingTime: number;
  spawnPadding: number;
};

export type EnginePublicApi = {
  start: () => void;
  stop: () => void;
  reset: () => void;
  flap: () => void;
  step: (dt: number) => void;
  playerY: SharedValue<number>;
  velocity: SharedValue<number>;
  obstacles: SharedValue<Obstacle[]>;
  playerCircle: SharedValue<Circle>;
  score: number;
  isRunning: boolean;
  isGameOver: boolean;
  config: EngineConfig;
};

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import type { EngineConfig, EnginePublicApi, Obstacle, SessionResult } from '../types';
import {
  Circle,
  clamp,
  circleRectCollides,
  PLAYER_RADIUS_FACTOR,
} from '../physics';

const PHYS = {
  GRAVITY: 2150,
  FLAP_IMPULSE: -780,
  TERMINAL_FALL: 1280,
  TERMINAL_RISE: -880,
  DRAG: 0.0007,
  HORIZ_SPEED_START: 170,
  HORIZ_SPEED_MAX: 240,
  GAP_START: 320,
  GAP_MIN: 260,
  COLLISION_PADDING: 2,
} as const;

const TAP_BUFFER_SEC = 0.09;
const TAP_COOLDOWN_SEC = 0.11;
const GRAVITY_RAMP_SEC = 0.8;
const SPEED_RAMP_SEC = 90;
const GAP_RAMP_SEC = 75;

const lerp = (start: number, end: number, t: number) => start + (end - start) * t;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);

const randomBetween = (min: number, max: number, randomSeed: () => number = Math.random) =>
  min + randomSeed() * (max - min);

type PlayerBody = {
  x: number;
  y: number;
  w: number;
  h: number;
  vy: number;
};

type EngineState = {
  elapsed: number;
  tapQueued: boolean;
  tapQueuedAge: number;
  lastTapTime: number;
  running: boolean;
  nextObstacleId: number;
  player: PlayerBody;
  obstacles: Obstacle[];
};

const computeGapHeight = (elapsedSec: number, randomSeed: () => number = Math.random) => {
  const progress = clamp(elapsedSec / GAP_RAMP_SEC, 0, 1);
  const target = lerp(PHYS.GAP_START, PHYS.GAP_MIN, progress);
  const variance = Math.min(target * 0.1, 32);
  const delta = variance > 0 ? randomBetween(-variance, variance, randomSeed) : 0;
  return clamp(target + delta, PHYS.GAP_MIN, target + variance);
};

const buildConfig = (width: number, height: number, reduceMotion?: boolean): EngineConfig => {
  const safeWidth = Math.max(320, Number.isFinite(width) ? width : 0);
  const safeHeight = Math.max(500, Number.isFinite(height) ? height : 0);
  const playerSize = Math.max(42, Math.min(safeWidth, safeHeight) * 0.085);
  const playerX = Math.max(70, safeWidth * 0.24);
  const groundHeight = Math.max(0, safeHeight * 0.06);
  const obstacleWidth = Math.max(64, safeWidth * 0.18);
  const gapMargin = Math.max(120, safeHeight * 0.22);
  const spawnSpacingTime = reduceMotion ? 1.75 : 1.65;
  const spawnPadding = Math.max(obstacleWidth * 1.25, 96);
  const poolSize = 4;
  return {
    width: safeWidth,
    height: safeHeight,
    playerSize,
    playerX,
    groundHeight,
    obstacleWidth,
    poolSize,
    gapMargin,
    spawnSpacingTime,
    spawnPadding,
  };
};

const ensureGapY = (
  config: EngineConfig,
  gapHeight: number,
  randomSeed: () => number = Math.random
) => {
  const halfGap = gapHeight / 2;
  const padding = PHYS.COLLISION_PADDING;
  const min = config.gapMargin + halfGap + padding;
  const max = config.height - config.gapMargin - config.groundHeight - halfGap - padding;
  return clamp(randomBetween(min, max, randomSeed), min, max);
};

const updateObstacleRects = (obstacle: Obstacle, config: EngineConfig) => {
  const groundTop = config.height - config.groundHeight;
  const gapHalf = obstacle.gapHeight / 2;
  const gapTopEdge = obstacle.gapY - gapHalf;
  const gapBottomEdge = obstacle.gapY + gapHalf;
  obstacle.topRect = {
    x: obstacle.x,
    y: 0,
    w: config.obstacleWidth,
    h: Math.max(0, gapTopEdge),
  };
  const bottomY = Math.min(groundTop, gapBottomEdge);
  obstacle.bottomRect = {
    x: obstacle.x,
    y: bottomY,
    w: config.obstacleWidth,
    h: Math.max(0, groundTop - bottomY),
  };
};

const createInitialObstacles = (
  config: EngineConfig,
  randomSeed: () => number = Math.random
): Obstacle[] => {
  const obstacles: Obstacle[] = [];
  let cursor = config.width + config.spawnPadding;
  for (let i = 0; i < config.poolSize; i++) {
    const gapHeight = computeGapHeight(0, randomSeed);
    const gapY = ensureGapY(config, gapHeight, randomSeed);
    const obstacle: Obstacle = {
      id: i,
      x: cursor,
      gapY,
      gapHeight,
      passed: false,
      active: true,
      topRect: { x: cursor, y: 0, w: config.obstacleWidth, h: 0 },
      bottomRect: { x: cursor, y: 0, w: config.obstacleWidth, h: 0 },
    };
    updateObstacleRects(obstacle, config);
    obstacles.push(obstacle);
    cursor += PHYS.HORIZ_SPEED_START * config.spawnSpacingTime;
  }
  return obstacles;
};

const createPlayer = (config: EngineConfig): PlayerBody => ({
  x: config.playerX,
  y: config.height / 2 - config.playerSize / 2,
  w: config.playerSize,
  h: config.playerSize,
  vy: 0,
});

const derivePlayerCircle = (player: PlayerBody): Circle => {
  const radius = Math.min(player.w, player.h) * PLAYER_RADIUS_FACTOR;
  return {
    x: player.x + player.w * 0.5,
    y: player.y + player.h * 0.5,
    r: radius,
  };
};

const cloneObstacle = (obstacle: Obstacle): Obstacle => ({
  ...obstacle,
  topRect: { ...obstacle.topRect },
  bottomRect: { ...obstacle.bottomRect },
});

export function useZenGlideEngine({
  width,
  height,
  reduceMotion,
  onGameOver,
}: {
  width: number;
  height: number;
  reduceMotion?: boolean;
  onGameOver?: (result: SessionResult) => void;
}): EnginePublicApi {
  const config = useMemo(() => buildConfig(width, height, reduceMotion), [width, height, reduceMotion]);
  const [score, setScore] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  const buildInitialState = useCallback((): EngineState => {
    const player = createPlayer(config);
    const obstacles = createInitialObstacles(config);
    return {
      elapsed: 0,
      tapQueued: false,
      tapQueuedAge: 0,
      lastTapTime: -TAP_COOLDOWN_SEC,
      running: false,
      nextObstacleId: obstacles.length,
      player,
      obstacles,
    };
  }, [config]);

  const initialState = useMemo(() => buildInitialState(), [buildInitialState]);
  const stateRef = useRef<EngineState>(initialState);

  const playerY = useSharedValue(initialState.player.y);
  const velocity = useSharedValue(0);
  const playerCircle = useSharedValue<Circle>(derivePlayerCircle(initialState.player));
  const obstaclesSV = useSharedValue<Obstacle[]>(initialState.obstacles.map(cloneObstacle));

  const scoreRef = useRef(0);
  const sessionStartRef = useRef<number | null>(null);
  const sessionStopRef = useRef<number | null>(null);
  const endHandledRef = useRef(false);
  const onGameOverRef = useRef<typeof onGameOver | undefined>(undefined);

  useEffect(() => {
    onGameOverRef.current = onGameOver;
  }, [onGameOver]);

  const updateSharedValues = useCallback(
    (state: EngineState = stateRef.current, circleOverride?: Circle) => {
      playerY.value = state.player.y;
      velocity.value = state.player.vy;
      playerCircle.value = circleOverride ?? derivePlayerCircle(state.player);
      obstaclesSV.value = state.obstacles.map(cloneObstacle);
    },
    [obstaclesSV, playerCircle, playerY, velocity]
  );

  useEffect(() => {
    stateRef.current = buildInitialState();
    scoreRef.current = 0;
    setScore(0);
    setIsRunning(false);
    setIsGameOver(false);
    endHandledRef.current = false;
    sessionStartRef.current = null;
    sessionStopRef.current = null;
    updateSharedValues(stateRef.current);
  }, [buildInitialState, updateSharedValues]);

  const stop = useCallback(() => {
    const state = stateRef.current;
    state.running = false;
    state.tapQueued = false;
    state.tapQueuedAge = 0;
    sessionStopRef.current = Date.now();
    setIsRunning(false);
  }, []);

  const performReset = useCallback(() => {
    stop();
    const next = buildInitialState();
    stateRef.current = next;
    scoreRef.current = 0;
    setScore(0);
    setIsGameOver(false);
    endHandledRef.current = false;
    sessionStartRef.current = null;
    sessionStopRef.current = null;
    updateSharedValues(next);
  }, [buildInitialState, stop, updateSharedValues]);

  const finishGame = useCallback(
    (finalScore: number) => {
      if (endHandledRef.current) return;
      endHandledRef.current = true;
      stop();
      setIsGameOver(true);
      const now = Date.now();
      const start = sessionStartRef.current ?? now;
      const end = sessionStopRef.current ?? now;
      const durationSec = Math.max(1, Math.round((end - start) / 1000));
      const payload: SessionResult = {
        dateISO: new Date(start).toISOString(),
        durationSec,
        score: finalScore,
      };
      onGameOverRef.current?.(payload);
    },
    [stop]
  );

  const start = useCallback(() => {
    performReset();
    const state = stateRef.current;
    state.running = true;
    sessionStartRef.current = Date.now();
    sessionStopRef.current = null;
    setIsRunning(true);
    setIsGameOver(false);
  }, [performReset]);

  const reset = useCallback(() => {
    performReset();
  }, [performReset]);

  const flap = useCallback(() => {
    const state = stateRef.current;
    if (!state.running) return;
    state.tapQueued = true;
    state.tapQueuedAge = 0;
  }, []);

  const step = useCallback(
    (dt: number) => {
      const state = stateRef.current;
      if (!state.running) {
        return;
      }

      state.elapsed += dt;
      const elapsed = state.elapsed;

      if (state.tapQueued) {
        state.tapQueuedAge += dt;
        const sinceLastTap = elapsed - state.lastTapTime;
        if (state.tapQueuedAge <= TAP_BUFFER_SEC && sinceLastTap >= TAP_COOLDOWN_SEC) {
          state.player.vy = PHYS.FLAP_IMPULSE;
          state.lastTapTime = elapsed;
          state.tapQueued = false;
          state.tapQueuedAge = 0;
        } else if (state.tapQueuedAge > TAP_BUFFER_SEC) {
          state.tapQueued = false;
          state.tapQueuedAge = 0;
        }
      }

      const gravityRamp = easeOutCubic(elapsed / GRAVITY_RAMP_SEC);
      const dragFactor = Math.max(0, 1 - PHYS.DRAG * dt);
      let velocityY = state.player.vy + PHYS.GRAVITY * gravityRamp * dt;
      velocityY = clamp(velocityY, PHYS.TERMINAL_RISE, PHYS.TERMINAL_FALL);
      velocityY *= dragFactor;
      state.player.vy = velocityY;
      state.player.y += state.player.vy * dt;

      if (state.player.y < 0) {
        state.player.y = 0;
        state.player.vy = Math.min(state.player.vy, 0);
      }

      const groundTop = config.height - config.groundHeight;
      const maxY = groundTop - state.player.h;
      if (state.player.y > maxY) {
        state.player.y = maxY;
      }

      const playerCircleSnapshot = derivePlayerCircle(state.player);
      const groundCollision = playerCircleSnapshot.y + playerCircleSnapshot.r >= groundTop;
      if (groundCollision) {
        finishGame(scoreRef.current);
        return;
      }

      const speedProgress = clamp(elapsed / SPEED_RAMP_SEC, 0, 1);
      const currentSpeed = lerp(PHYS.HORIZ_SPEED_START, PHYS.HORIZ_SPEED_MAX, speedProgress);
      const spacingPx = currentSpeed * config.spawnSpacingTime;
      const playerLeft = state.player.x;
      let maxX = -Infinity;
      let triggeredGameOver = false;

      for (let i = 0; i < state.obstacles.length; i++) {
        const obstacle = state.obstacles[i];
        if (!obstacle.active) continue;

        obstacle.x -= currentSpeed * dt;
        updateObstacleRects(obstacle, config);

        if (!triggeredGameOver) {
          const hitTop = circleRectCollides(playerCircleSnapshot, obstacle.topRect);
          const hitBottom = circleRectCollides(playerCircleSnapshot, obstacle.bottomRect);
          if (hitTop || hitBottom) {
            triggeredGameOver = true;
          }
        }

        const obstacleRight = obstacle.x + config.obstacleWidth;
        if (!obstacle.passed && obstacleRight < playerLeft) {
          obstacle.passed = true;
          scoreRef.current += 1;
          setScore(scoreRef.current);
        }

        if (obstacleRight < -config.spawnPadding) {
          const gapHeight = computeGapHeight(elapsed);
          obstacle.x = (maxX === -Infinity ? config.width : maxX) + spacingPx;
          obstacle.gapHeight = gapHeight;
          obstacle.gapY = ensureGapY(config, gapHeight);
          obstacle.passed = false;
          obstacle.id = state.nextObstacleId;
          state.nextObstacleId += 1;
          updateObstacleRects(obstacle, config);
        }

        maxX = Math.max(maxX, obstacle.x);
      }

      if (triggeredGameOver) {
        finishGame(scoreRef.current);
        return;
      }

      updateSharedValues(state, playerCircleSnapshot);
    },
    [config, finishGame, updateSharedValues]
  );

  useEffect(() => {
    const onChange = (nextState: AppStateStatus) => {
      if (nextState !== 'active') {
        stop();
      }
    };
    const subscription = AppState.addEventListener('change', onChange);
    return () => subscription.remove();
  }, [stop]);

  return {
    start,
    stop,
    reset,
    flap,
    step,
    playerY,
    velocity,
    obstacles: obstaclesSV,
    playerCircle,
    score,
    isRunning,
    isGameOver,
    config,
  };
}

export type UseZenGlideEngineReturn = ReturnType<typeof useZenGlideEngine>;

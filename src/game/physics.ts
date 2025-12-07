export type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Circle = {
  x: number;
  y: number;
  r: number;
};

export const HITBOX_SHRINK = 8;
export const PLAYER_RADIUS_FACTOR = 0.42;
export const FIXED_DT = 1 / 120;
export const MAX_FRAME_DT = 0.05;

export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export function circleRectCollides(circle: Circle, rect: Rect, inset = 0): boolean {
  const rx = rect.x + inset;
  const ry = rect.y + inset;
  const rw = rect.w - inset * 2;
  const rh = rect.h - inset * 2;

  if (rw <= 0 || rh <= 0) {
    return false;
  }

  const nearestX = clamp(circle.x, rx, rx + rw);
  const nearestY = clamp(circle.y, ry, ry + rh);
  const dx = circle.x - nearestX;
  const dy = circle.y - nearestY;
  return dx * dx + dy * dy <= circle.r * circle.r;
}

export const stepWithSubsteps = (
  frameDt: number,
  stepFn: (dt: number) => void,
  dt: number = FIXED_DT
) => {
  const clamped = Math.min(frameDt, MAX_FRAME_DT);
  let accumulator = clamped;
  while (accumulator >= dt) {
    stepFn(dt);
    accumulator -= dt;
  }
  if (accumulator > 1e-6) {
    stepFn(accumulator);
  }
};

export const makeStepper = () => {
  let accumulator = 0;
  return (frameDt: number, stepFn: (dt: number) => void, fixedDt: number = FIXED_DT) => {
    const clamped = Math.min(frameDt, MAX_FRAME_DT);
    accumulator += clamped;
    while (accumulator >= fixedDt) {
      stepFn(fixedDt);
      accumulator -= fixedDt;
    }
  };
};

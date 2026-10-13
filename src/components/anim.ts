import { Easing, interpolate, spring } from 'remotion';
import { FPS } from '../theme';

export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

export const pop = (frame: number, delay = 0, config: Partial<{ damping: number; stiffness: number; mass: number }> = {}) =>
  spring({ frame: frame - delay, fps: FPS, config: { damping: 12, stiffness: 160, mass: 0.8, ...config } });

export const ease = (frame: number, from: number, to: number, out: [number, number] = [0, 1], easing = Easing.bezier(0.16, 1, 0.3, 1)) =>
  interpolate(frame, [from, to], out, { ...clamp, easing });

export const easeIn = (frame: number, from: number, to: number, out: [number, number] = [0, 1]) =>
  interpolate(frame, [from, to], out, { ...clamp, easing: Easing.bezier(0.7, 0, 0.84, 0) });

// Deterministic pseudo-random in [0,1)
export const rand = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

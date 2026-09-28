import {Easing, interpolate} from 'remotion';
import {FPS} from './theme';

export const f = (sec: number) => Math.round(sec * FPS);

export const ease = Easing.bezier(0.22, 1, 0.36, 1); // expo-out, premium feel
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

export const lerp = (frame: number, input: number[], output: number[], e = ease) =>
  interpolate(frame, input, output, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e});

// 0 -> 1 in, hold, 1 -> 0 out over a clip of `dur` frames.
export const inOut = (frame: number, dur: number, fadeIn = 10, fadeOut = 10) =>
  Math.min(lerp(frame, [0, fadeIn], [0, 1]), lerp(frame, [dur - fadeOut, dur], [1, 0], easeInOut));

import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { ease } from './anim';

export type Wipe = 'none' | 'circle' | 'zoom' | 'up' | 'diagonal' | 'slide';

export const TRANSITION_FRAMES = 14;

// Animates a scene in over the previous one during its first frames.
export const Enter: React.FC<{ type: Wipe; origin?: [number, number]; children: React.ReactNode }> = ({ type, origin = [540, 960], children }) => {
  const f = useCurrentFrame();
  const p = ease(f, 0, TRANSITION_FRAMES);
  let style: React.CSSProperties = {};
  if (type === 'circle') style = { clipPath: `circle(${p * 2300}px at ${origin[0]}px ${origin[1]}px)` };
  if (type === 'zoom') style = { transform: `scale(${1.35 - 0.35 * p})`, opacity: Math.min(1, p * 1.6), filter: `blur(${(1 - p) * 18}px)` };
  if (type === 'up') style = { clipPath: `inset(${(1 - p) * 100}% 0 0 0)`, transform: `translateY(${(1 - p) * 200}px)` };
  if (type === 'diagonal') {
    const x = -1200 + p * 3400;
    style = { clipPath: `polygon(0 0, ${x}px 0, ${x - 1100}px 1920px, 0 1920px)` };
  }
  if (type === 'slide') style = { transform: `translateX(${(1 - p) * 1080}px)` };
  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};

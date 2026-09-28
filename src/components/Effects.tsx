import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {AccentDef, ZOOMS} from '../config';
import {C, FPS, H, W} from '../theme';
import {ease, easeInOut, f, lerp} from '../lib';

const zoomEase = Easing.bezier(0.33, 0, 0.67, 1);

export const zoomAt = (srcSec: number) => {
  const z = ZOOMS.find((d) => srcSec >= d.at && srcSec < d.at + d.dur);
  if (!z) return {s: 1, ox: 0.5, oy: 0.5};
  const s = interpolate(srcSec, [z.at, z.at + z.dur], [z.from, z.to], {easing: zoomEase, extrapolateRight: 'clamp'});
  return {s, ox: z.ox, oy: z.oy};
};

// Everything inside moves with the camera, so accents stay locked to the burned-in text.
export const ZoomLayer: React.FC<{srcOffsetSec?: number; hold?: number; children: React.ReactNode}> = ({srcOffsetSec = 0, hold, children}) => {
  const frame = useCurrentFrame();
  const sec = hold ?? srcOffsetSec + frame / FPS;
  const {s, ox, oy} = zoomAt(sec);
  return (
    <AbsoluteFill style={{transform: `scale(${s})`, transformOrigin: `${ox * 100}% ${oy * 100}%`}}>{children}</AbsoluteFill>
  );
};

export const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      background: 'radial-gradient(120% 85% at 50% 42%, transparent 55%, rgba(5,14,36,.42) 100%)',
      pointerEvents: 'none',
    }}
  />
);

// Royal-blue / orange light leak laid over the original's own swipe transitions.
export const LightLeak: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const o = Math.min(lerp(frame, [0, dur * 0.35], [0, 1]), lerp(frame, [dur * 0.35, dur], [1, 0], easeInOut));
  const x = lerp(frame, [0, dur], [-10, 110], (t) => t);
  return (
    <AbsoluteFill style={{mixBlendMode: 'screen', opacity: o * 0.85, pointerEvents: 'none'}}>
      <AbsoluteFill style={{background: `radial-gradient(45% 60% at ${x}% 35%, rgba(91,140,255,.75) 0%, transparent 70%)`}} />
      <AbsoluteFill style={{background: `radial-gradient(30% 40% at ${x + 18}% 70%, rgba(242,140,40,.55) 0%, transparent 70%)`}} />
    </AbsoluteFill>
  );
};

// Animated corner brackets + a light glint across the original's own key phrase.
export const TextAccent: React.FC<{def: AccentDef}> = ({def}) => {
  const frame = useCurrentFrame();
  const dur = f(def.dur);
  const {x, y, w, h} = def.box;
  const inP = lerp(frame, [0, 10], [0, 1], ease);
  const outP = lerp(frame, [dur - 8, dur], [0, 1], easeInOut);
  const o = inP * (1 - outP);
  const spread = (1 - inP) * 40;
  const glint = lerp(frame, [6, 24], [-0.3, 1.3], (t) => t);
  const L = Math.min(56, h * 0.45);
  const corner = (cx: number, cy: number, sx: number, sy: number, color: string) => (
    <path
      d={`M ${cx + sx * L} ${cy} L ${cx} ${cy} L ${cx} ${cy + sy * L}`}
      transform={`translate(${-sx * spread} ${-sy * spread})`}
      fill="none"
      stroke={color}
      strokeWidth={6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: w,
          height: h,
          overflow: 'hidden',
          mixBlendMode: 'overlay',
          opacity: 1 - outP,
          background: `linear-gradient(110deg, transparent ${glint * 100 - 14}%, rgba(255,255,255,.9) ${glint * 100}%, transparent ${glint * 100 + 14}%)`,
        }}
      />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: o, filter: 'drop-shadow(0 0 10px rgba(36,81,214,.8))'}}>
        {corner(x, y, 1, 1, C.white)}
        {corner(x + w, y, -1, 1, C.orange)}
        {corner(x, y + h, 1, -1, C.orange)}
        {corner(x + w, y + h, -1, -1, C.white)}
      </svg>
    </AbsoluteFill>
  );
};

import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C } from '../theme';
import { ease } from './anim';
import { Plane } from './Plane';

// A big plane streaking across the frame with a contrail, used to sell scene cuts.
export const PlaneFlyover: React.FC<{ reverse?: boolean }> = ({ reverse = false }) => {
  const f = useCurrentFrame();
  const t = ease(f, 0, 30, [0, 1]);
  const x0 = reverse ? 1500 : -500;
  const x1 = reverse ? -500 : 1500;
  const x = x0 + (x1 - x0) * t;
  const y = 1500 - t * 1100;
  const angle = (Math.atan2(-1100, x1 - x0) * 180) / Math.PI + 90;
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <line x1={x0} y1={1500} x2={x} y2={y} stroke="#fff" strokeWidth={70} strokeLinecap="round" opacity={0.35 * (1 - ease(f, 18, 34))} />
        <line x1={x0} y1={1500} x2={x} y2={y} stroke={C.orange} strokeWidth={22} strokeLinecap="round" opacity={0.9 * (1 - ease(f, 18, 34))} />
      </svg>
      <Plane size={520} color="#fff" angle={angle} style={{ left: x, top: y, filter: 'drop-shadow(0 30px 40px rgba(0,0,0,0.35))' }} />
    </AbsoluteFill>
  );
};

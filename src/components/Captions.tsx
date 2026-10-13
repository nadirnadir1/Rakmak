import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { CHUNKS } from '../captions';
import { AR, C, FPS } from '../theme';
import { clamp, pop } from './anim';

export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const chunk = CHUNKS.find((c) => t >= c.start - 0.05 && t < c.end + 0.15);
  if (!chunk) return null;
  const cIn = Math.round(chunk.start * FPS);
  const cOut = Math.round(chunk.end * FPS);
  const enter = pop(frame, cIn - 2, { damping: 14, stiffness: 220 });
  const exit = interpolate(frame, [cOut - 1, cOut + 4], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 250, pointerEvents: 'none' }}>
      <div
        dir="rtl"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '4px 26px',
          maxWidth: 940,
          padding: '18px 34px 26px',
          borderRadius: 34,
          background: 'rgba(0, 16, 48, 0.62)',
          border: '2px solid rgba(255,255,255,0.14)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
          transform: `translateY(${(1 - enter) * 40}px) scale(${0.9 + enter * 0.1})`,
          opacity: Math.min(enter, exit),
        }}
      >
        {chunk.words.map((w, i) => {
          const wf = Math.round(w.start * FPS);
          const active = t >= w.start && t < w.end + 0.05;
          const spoken = t >= w.start;
          const p = pop(frame, wf - 2, { damping: 10, stiffness: 260 });
          return (
            <span
              key={i}
              style={{
                fontFamily: AR,
                fontWeight: 900,
                fontSize: 74,
                lineHeight: 1.35,
                color: active ? C.orangeLight : '#fff',
                opacity: spoken ? 1 : 0.42,
                transform: `scale(${spoken ? 1 + (active ? 0.05 : 0) * p : 0.96})`,
                display: 'inline-block',
                textShadow: active ? `0 0 28px rgba(242,131,0,0.75), 0 4px 0 rgba(0,0,0,0.25)` : '0 4px 0 rgba(0,0,0,0.25)',
              }}
            >
              {w.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { NavyBackground } from '../components/Background';
import { Crew } from '../components/Crew';
import { clamp, ease, pop } from '../components/anim';
import { AR, C, GRAD_STAT, LAT } from '../theme';

export const Graduates: React.FC = () => {
  const f = useCurrentFrame();
  const count = Math.round(interpolate(f, [6, 54], [0, GRAD_STAT], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 3) }));
  const ring = ease(f, 6, 54, [0, GRAD_STAT / 100]);
  const enter = pop(f, 0, { damping: 12 });
  const up = ease(f, 56, 76);
  const R = 250;
  const circ = 2 * Math.PI * R;
  const label = pop(f, 70, { damping: 13 });
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <NavyBackground glow="#1463F3" />
      <div style={{ position: 'absolute', left: 540, top: 820 - up * 180, transform: `translate(-50%,-50%) scale(${enter * (1 - up * 0.28)})` }}>
        <svg width={620} height={620} viewBox="0 0 620 620" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="gr" x1="0" x2="1">
              <stop offset="0" stopColor={C.orangeLight} />
              <stop offset="1" stopColor={C.orange} />
            </linearGradient>
          </defs>
          <circle cx={310} cy={310} r={R} fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" strokeWidth={34} />
          <circle
            cx={310}
            cy={310}
            r={R}
            fill="none"
            stroke="url(#gr)"
            strokeWidth={34}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - ring)}
            transform="rotate(-90 310 310)"
            style={{ filter: `drop-shadow(0 0 24px ${C.orange})` }}
          />
          {Array.from({ length: 60 }, (_, i) => {
            const a = (i / 60) * Math.PI * 2;
            return (
              <line
                key={i}
                x1={310 + Math.cos(a) * 292}
                y1={310 + Math.sin(a) * 292}
                x2={310 + Math.cos(a) * (i % 5 === 0 ? 306 : 300)}
                y2={310 + Math.sin(a) * (i % 5 === 0 ? 306 : 300)}
                stroke="rgba(255,255,255,0.35)"
                strokeWidth={3}
              />
            );
          })}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: LAT, fontWeight: 900, fontSize: 190, color: '#fff', lineHeight: 1, letterSpacing: -4 }}>
            <span style={{ color: C.orange, fontSize: 130 }}>+</span>
            {count}%
          </span>
          <span dir="rtl" style={{ fontFamily: AR, fontWeight: 800, fontSize: 50, color: 'rgba(255,255,255,0.85)', marginTop: 10 }}>
            من خريجي المدرسة
          </span>
        </div>
      </div>
      {/* Crew line-up */}
      <div style={{ position: 'absolute', top: 1000, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 4 }}>
        {[0, 1, 2, 3, 4].map((i) => {
          const p = pop(f, 60 + Math.abs(i - 2) * 4, { damping: 10, stiffness: 150 });
          const sz = i === 2 ? 210 : i % 2 ? 180 : 160;
          return (
            <div key={i} style={{ transform: `translateY(${(1 - p) * 300}px)`, opacity: Math.min(1, p * 2) }}>
              <Crew female={i % 2 === 0} size={sz} skin={['#E9B98F', '#C98E64', '#F1C9A5', '#B57B52', '#E2AE84'][i]} />
            </div>
          );
        })}
      </div>
      <div
        dir="rtl"
        style={{
          position: 'absolute',
          top: 1286,
          left: 540,
          transform: `translateX(-50%) scale(${label})`,
          padding: '10px 40px 16px',
          borderRadius: 60,
          background: C.orange,
          fontFamily: AR,
          fontWeight: 900,
          fontSize: 50,
          color: '#fff',
          whiteSpace: 'nowrap',
          boxShadow: '0 16px 40px rgba(242,131,0,0.45)',
        }}
      >
        مضيفات ومضيفين الطيران ✈
      </div>
    </AbsoluteFill>
  );
};

import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { NavyBackground } from '../components/Background';
import { Headline } from '../components/Headline';
import { ease, pop } from '../components/anim';
import { AR, C, LAT } from '../theme';

const Tail: React.FC<{ colors: [string, string]; x: number; p: number }> = ({ colors, x, p }) => (
  <svg width={150} height={190} viewBox="0 0 150 190" style={{ position: 'absolute', left: x, bottom: 0, transform: `translateY(${(1 - p) * 220}px)` }}>
    <path d="M20 190 L95 10 L140 10 L120 190 Z" fill={colors[0]} />
    <path d="M58 100 L134 60 L128 110 L52 150 Z" fill={colors[1]} />
  </svg>
);

const items = [
  { label: 'شركات الطيران العالمية', sub: 'AIRLINES', at: 38 },
  { label: 'الفنادق الكبرى', sub: 'LUXURY HOTELS', at: 78 },
];

export const Requirements: React.FC = () => {
  const f = useCurrentFrame();
  const card = pop(f, 6, { damping: 13, stiffness: 120 });
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <NavyBackground glow="#0F52DE" />
      <div style={{ position: 'absolute', top: 250, left: 40, right: 40 }}>
        <Headline text="كتحضّرك *للشروط" size={118} delay={0} />
      </div>
      <div
        style={{
          position: 'absolute',
          top: 560,
          left: 90,
          width: 900,
          height: 620,
          borderRadius: 44,
          background: '#fff',
          boxShadow: '0 40px 100px rgba(0,0,0,0.45)',
          transform: `perspective(1600px) rotateX(${(1 - card) * -60}deg) translateY(${(1 - card) * 300}px)`,
          opacity: Math.min(1, card * 2),
          overflow: 'hidden',
        }}
      >
        <div style={{ height: 120, background: `linear-gradient(90deg, ${C.blue}, #0B57D8)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 46px' }}>
          <span style={{ fontFamily: LAT, fontWeight: 900, fontSize: 40, color: '#fff', letterSpacing: 4 }}>STANDARDS</span>
          <span dir="rtl" style={{ fontFamily: AR, fontWeight: 900, fontSize: 50, color: '#fff' }}>
            معايير عالمية
          </span>
        </div>
        {items.map((it, i) => {
          const p = pop(f, it.at, { damping: 10, stiffness: 200 });
          const row = ease(f, it.at - 8, it.at + 6);
          return (
            <div
              key={i}
              dir="rtl"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 36,
                margin: '58px 50px 0',
                padding: '24px 30px',
                borderRadius: 30,
                background: p > 0.5 ? '#FFF4E6' : '#F2F5FB',
                opacity: 0.35 + row * 0.65,
                transform: `translateX(${(1 - row) * -60}px)`,
              }}
            >
              <div style={{ width: 110, height: 110, borderRadius: 30, background: p > 0.05 ? C.orange : '#DCE3F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width={70} height={70} viewBox="0 0 24 24">
                  <path d="M4 12.5 L10 18 L20 6" stroke="#fff" strokeWidth={3.4} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={30} strokeDashoffset={30 * (1 - Math.min(1, p))} />
                </svg>
              </div>
              <div>
                <div style={{ fontFamily: AR, fontWeight: 900, fontSize: 56, color: C.blue, lineHeight: 1.3 }}>{it.label}</div>
                <div style={{ fontFamily: LAT, fontWeight: 700, fontSize: 26, color: C.orange, letterSpacing: 5 }}>{it.sub}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1180, height: 200 }}>
        {(
          [
            [C.orange, '#fff'],
            ['#fff', C.orange],
            ['#0B57D8', C.orangeLight],
            ['#7FA7FF', '#fff'],
            [C.orangeLight, C.blue],
          ] as [string, string][]
        ).map((c, i) => (
          <Tail key={i} colors={c} x={80 + i * 190} p={pop(f, 20 + i * 5, { damping: 13 })} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

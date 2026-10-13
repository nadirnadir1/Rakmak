import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Zellige } from '../components/Zellige';
import { ease, pop, rand } from '../components/anim';
import { AR, C, LAT } from '../theme';

export const Open: React.FC = () => {
  const f = useCurrentFrame();
  const stamp = pop(f, 3, { damping: 9, stiffness: 260, mass: 1.1 });
  const sub = pop(f, 12, { damping: 11 });
  const shake = f > 5 && f < 14 ? Math.sin(f * 3) * (14 - f) * 1.6 : 0;
  return (
    <AbsoluteFill style={{ overflow: 'hidden', background: C.orange, transform: `translate(${shake}px, ${-shake * 0.6}px)` }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, #FFC067 0%, ${C.orange} 45%, #D86400 100%)` }} />
      <Zellige id="z-open" color="#fff" opacity={0.12} offset={f * 2} size={200} />
      {/* Shockwaves */}
      {[0, 6, 12].map((d, i) => {
        const r = ease(f, 4 + d, 34 + d, [0, 1300]);
        return <div key={i} style={{ position: 'absolute', left: 540 - r / 2, top: 860 - r / 2, width: r, height: r, borderRadius: '50%', border: `${10 - i * 3}px solid rgba(255,255,255,${0.6 - ease(f, 4 + d, 34 + d) * 0.6})` }} />;
      })}
      {/* Light rays */}
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, opacity: 0.18, transform: `rotate(${f * 0.6}deg)`, transformOrigin: '540px 860px' }}>
        {Array.from({ length: 16 }, (_, i) => {
          const a = (i / 16) * Math.PI * 2;
          const b = a + 0.12;
          return <path key={i} d={`M540 860 L${540 + Math.cos(a) * 2000} ${860 + Math.sin(a) * 2000} L${540 + Math.cos(b) * 2000} ${860 + Math.sin(b) * 2000} Z`} fill="#fff" />;
        })}
      </svg>
      {/* Confetti */}
      {Array.from({ length: 70 }, (_, i) => {
        const side = i % 2 ? 1 : -1;
        const t = Math.max(0, f - 4) / 30;
        const vx = (300 + rand(i) * 900) * -side;
        const vy = -(900 + rand(i + 1) * 1100);
        const x = (side > 0 ? 1080 : 0) + vx * t;
        const y = 1500 + vy * t + 1700 * t * t;
        const rot = f * (8 + rand(i + 2) * 12) * side;
        const colors = ['#fff', C.blue, '#FFE08A', '#0B57D8'];
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: 14 + rand(i + 3) * 16,
              height: 26 + rand(i + 4) * 18,
              background: colors[i % 4],
              borderRadius: 4,
              transform: `rotate(${rot}deg) rotateX(${rot * 2}deg)`,
              opacity: f < 4 ? 0 : 1,
            }}
          />
        );
      })}
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', paddingBottom: 260 }}>
        <div
          style={{
            transform: `scale(${2.6 - 1.6 * stamp}) rotate(${-6 + (1 - stamp) * -10}deg)`,
            opacity: Math.min(1, stamp * 3),
            border: '12px solid #fff',
            borderRadius: 40,
            padding: '10px 50px 30px',
            textAlign: 'center',
            background: 'rgba(0,58,156,0.92)',
            boxShadow: '0 30px 80px rgba(120,40,0,0.45)',
          }}
          dir="rtl"
        >
          <div style={{ fontFamily: AR, fontWeight: 900, fontSize: 118, color: '#fff', lineHeight: 1.35 }}>التسجيلات</div>
          <div style={{ fontFamily: AR, fontWeight: 900, fontSize: 150, color: C.orangeLight, lineHeight: 1.1 }}>مفتوحة</div>
        </div>
        <div style={{ marginTop: 40, transform: `scale(${sub})`, display: 'flex', alignItems: 'center', gap: 24 }}>
          <span style={{ fontFamily: LAT, fontWeight: 900, fontSize: 40, color: '#fff', letterSpacing: 6 }}>INSCRIPTIONS OUVERTES</span>
          <span dir="rtl" style={{ fontFamily: AR, fontWeight: 900, fontSize: 64, color: C.blue, background: '#fff', borderRadius: 20, padding: '0 24px 8px' }}>
            دابا!
          </span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

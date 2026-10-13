import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { NavyBackground } from '../components/Background';
import { Headline } from '../components/Headline';
import { clamp, ease, easeIn, pop, rand } from '../components/anim';
import { AR, C, LAT } from '../theme';

const BacCard: React.FC<{ f: number }> = ({ f }) => {
  const p = pop(f, 2, { damping: 13, stiffness: 120 });
  const seal = pop(f, 16, { damping: 9, stiffness: 200 });
  const back = pop(f, 26, { damping: 14 });
  const out = easeIn(f, 52, 66);
  return (
    <div style={{ position: 'absolute', left: 540, top: 900, transform: `translate(-50%,-50%) translateY(${-out * 1400}px) rotate(${out * -25}deg)` }}>
      {/* "Niveau bac" card behind */}
      <div
        style={{
          position: 'absolute',
          left: -330 + 120 * back,
          top: -200 - 60 * back,
          width: 620,
          height: 400,
          borderRadius: 36,
          background: `linear-gradient(135deg, ${C.orange}, #FF9F2E)`,
          transform: `rotate(${-14 * back}deg) scale(${back})`,
          boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
          padding: 34,
          boxSizing: 'border-box',
        }}
      >
        <span style={{ fontFamily: LAT, fontWeight: 900, fontSize: 46, color: '#fff', letterSpacing: 2 }}>NIVEAU BAC</span>
      </div>
      <div
        style={{
          position: 'absolute',
          left: -310,
          top: -200,
          width: 620,
          height: 400,
          borderRadius: 36,
          background: '#fff',
          boxShadow: '0 40px 100px rgba(0,0,0,0.5)',
          transform: `perspective(1400px) rotateX(${(1 - p) * 70}deg) rotateZ(${4 + (1 - p) * 30}deg) scale(${0.4 + 0.6 * p})`,
          opacity: Math.min(1, p * 2),
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', inset: 18, border: `4px solid ${C.blue}`, borderRadius: 24, opacity: 0.2 }} />
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 26, background: C.orange }} />
        <div style={{ position: 'absolute', left: 70, top: 64, fontFamily: LAT, fontWeight: 900, fontSize: 150, color: C.blue, letterSpacing: 6 }}>BAC</div>
        <div style={{ position: 'absolute', left: 74, top: 250, fontFamily: LAT, fontWeight: 600, fontSize: 34, color: '#5570A8', letterSpacing: 4 }}>
          BACCALAURÉAT
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ position: 'absolute', left: 74, top: 310 + i * 22, width: 300 - i * 70, height: 8, borderRadius: 4, background: '#E2E8F5' }} />
        ))}
        <div
          style={{
            position: 'absolute',
            right: 50,
            top: 190,
            width: 150,
            height: 150,
            borderRadius: 100,
            background: `radial-gradient(circle, ${C.orangeLight}, ${C.orange})`,
            transform: `scale(${seal}) rotate(${(1 - seal) * -180}deg)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 30px rgba(242,131,0,0.5)',
          }}
        >
          <svg width="80" height="80" viewBox="0 0 24 24">
            <path d="M4 12.5 L10 18 L20 6" stroke="#fff" strokeWidth={3.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
};

const Opportunities: React.FC<{ f: number }> = ({ f }) => {
  const local = f - 57;
  if (local < -5 || f > 118) return null;
  const out = easeIn(f, 106, 118);
  const bars = [0.32, 0.48, 0.44, 0.66, 0.82, 1];
  const line = ease(local, 4, 34);
  return (
    <div style={{ position: 'absolute', left: 140, top: 640, width: 800, height: 560, opacity: 1 - out, transform: `scale(${1 - out * 0.2})` }}>
      {bars.map((h, i) => {
        const p = pop(local, i * 3, { damping: 12 });
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              bottom: 0,
              left: i * 135,
              width: 96,
              height: 520 * h * p,
              borderRadius: '22px 22px 6px 6px',
              background: i === bars.length - 1 ? `linear-gradient(${C.orangeLight}, ${C.orange})` : 'linear-gradient(rgba(255,255,255,0.9), rgba(255,255,255,0.35))',
              boxShadow: i === bars.length - 1 ? `0 0 60px ${C.orange}` : 'none',
            }}
          />
        );
      })}
      <svg width={800} height={560} style={{ position: 'absolute', overflow: 'visible' }}>
        <path
          d="M48 420 L183 330 L318 350 L453 230 L588 140 L723 -20"
          fill="none"
          stroke={C.orangeLight}
          strokeWidth={12}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={1000}
          strokeDashoffset={1000 * (1 - line)}
        />
        <g transform={`translate(723 -20) scale(${line > 0.98 ? pop(local, 34) : 0})`}>
          <circle r={40} fill={C.orange} />
          <path d="M-16 8 L0 -12 L16 8" stroke="#fff" strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
      {['💼', '✈️', '🏨'].map((e, i) => {
        const p = pop(local, 12 + i * 6, { damping: 9 });
        return (
          <div key={i} style={{ position: 'absolute', left: 60 + i * 230, top: -60 - (i % 2) * 70, fontSize: 90, transform: `scale(${p}) rotate(${(1 - p) * 40}deg)` }}>
            {e}
          </div>
        );
      })}
    </div>
  );
};

const Confused: React.FC<{ f: number }> = ({ f }) => {
  const local = f - 110;
  if (local < 0) return null;
  return (
    <AbsoluteFill>
      {Array.from({ length: 14 }, (_, i) => {
        const p = pop(local, i * 1.5, { damping: 8, stiffness: 180 });
        const ang = (i / 14) * Math.PI * 2 + local / 30;
        const rad = 300 + rand(i) * 200 + local * 2;
        const x = 540 + Math.cos(ang) * rad;
        const y = 920 + Math.sin(ang) * rad * 1.15;
        const size = 70 + rand(i + 9) * 110;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              fontFamily: AR,
              fontWeight: 900,
              fontSize: size,
              color: i % 3 === 0 ? C.orange : '#fff',
              opacity: (i % 3 === 0 ? 1 : 0.65) * p,
              transform: `translate(-50%,-50%) scale(${p}) rotate(${Math.sin(local / 6 + i) * 18}deg)`,
            }}
          >
            ؟
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const shake = f >= 110 && f < 145 ? Math.sin(f * 2.2) * 6 * interpolate(f, [110, 145], [1, 0.2], clamp) : 0;
  const zoom = easeIn(f, 145, 172, [1, 1.6]);
  const head = (from: number, to: number) => (f >= from && f < to ? 1 : 0);
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <NavyBackground />
      <AbsoluteFill style={{ transform: `scale(${zoom}) translateX(${shake}px)` }}>
        <BacCard f={f} />
        <Opportunities f={f} />
        <Confused f={f} />
        <div style={{ position: 'absolute', top: 260, left: 60, right: 60 }}>
          {head(0, 57) ? <Headline text="عندك *الباك؟" size={150} delay={0} /> : null}
          {head(57, 110) ? <Headline text="فرص *الشغل كثيرة" size={132} delay={57} /> : null}
          {head(110, 145) ? <Headline text="حاير فين *تقرا؟" size={140} delay={110} /> : null}
        </div>
        {f >= 143 && (
          <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
            <Headline text="*الحل قدامك" size={180} delay={143} stagger={3} />
          </AbsoluteFill>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

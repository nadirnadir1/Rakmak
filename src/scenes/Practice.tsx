import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { NavyBackground } from '../components/Background';
import { Headline } from '../components/Headline';
import { ease, easeIn, pop } from '../components/anim';
import { AR, C, LAT } from '../theme';

// Cabin aisle in one-point perspective, camera dollying forward.
const Cabin: React.FC<{ f: number }> = ({ f }) => {
  const vx = 540;
  const vy = 760;
  const rows = 9;
  const travel = (f * 0.035) % 1;
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <linearGradient id="floor" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#0A2A6E" />
          <stop offset="1" stopColor="#1B4FB8" />
        </linearGradient>
        <radialGradient id="end" r="50%">
          <stop offset="0" stopColor="#FFE9C7" />
          <stop offset="1" stopColor="rgba(255,233,199,0)" />
        </radialGradient>
      </defs>
      <path d={`M0 1920 L${vx - 60} ${vy + 40} L${vx + 60} ${vy + 40} L1080 1920 Z`} fill="url(#floor)" />
      <path d={`M${vx - 18} ${vy + 40} L${vx + 18} ${vy + 40} L700 1920 L380 1920 Z`} fill={C.orange} opacity={0.5} />
      <path d={`M0 0 L${vx - 60} ${vy - 70} L${vx + 60} ${vy - 70} L1080 0 Z`} fill="#E9EEF8" opacity={0.12} />
      <circle cx={vx} cy={vy - 10} r={140} fill="url(#end)" />
      {Array.from({ length: rows }, (_, i) => {
        const d = (i + 1 - travel) / rows; // 0 far .. 1 near
        const z = Math.pow(d, 2.2);
        const sx = 60 + z * 520;
        const top = vy - 30 - z * 640;
        const h = 30 + z * 1100;
        const w = 20 + z * 420;
        const op = Math.min(1, d * 1.6);
        return (
          <g key={i} opacity={op}>
            {[-1, 1].map((side) => (
              <g key={side}>
                <rect x={vx + side * sx - (side < 0 ? w : 0)} y={top + h * 0.35} width={w} height={h * 0.6} rx={14 * z + 2} fill="#0E3B9E" />
                <rect x={vx + side * sx - (side < 0 ? w : 0)} y={top + h * 0.35} width={w} height={h * 0.12} rx={10 * z + 2} fill={C.orange} />
                <rect
                  x={vx + side * (sx + w * 0.55) - (side < 0 ? w * 0.25 : 0)}
                  y={top - h * 0.12}
                  width={w * 0.25}
                  height={h * 0.18}
                  rx={w * 0.1}
                  fill="#CFE0FF"
                  opacity={0.5}
                />
              </g>
            ))}
          </g>
        );
      })}
    </svg>
  );
};

const CHIPS = [
  { t: 'CV', icon: '📄', at: 58 },
  { t: 'ENTRETIEN', icon: '🤝', at: 66 },
  { t: 'SIMULATION', icon: '🎤', at: 74 },
];

export const Practice: React.FC = () => {
  const f = useCurrentFrame();
  const split = 48;
  const cabinOut = easeIn(f, split - 6, split + 8);
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <NavyBackground glow="#1352D8" />
      {f < split + 8 && (
        <AbsoluteFill style={{ opacity: 1 - cabinOut, transform: `scale(${1 + cabinOut * 0.5 + f * 0.003})` }}>
          <Cabin f={f} />
          <div style={{ position: 'absolute', top: 230, left: 40, right: 40 }}>
            <Headline text="تكوين *تطبيقي" size={140} delay={2} />
          </div>
        </AbsoluteFill>
      )}
      {f >= split - 4 && (
        <AbsoluteFill>
          <div style={{ position: 'absolute', top: 250, left: 40, right: 40 }}>
            <Headline text="تحضير *مقابلات" size={124} delay={split - 2} />
            <Headline text="التوظيف" size={124} delay={split + 4} />
          </div>
          <div style={{ position: 'absolute', top: 700, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34 }}>
            {CHIPS.map((c, i) => {
              const p = pop(f, c.at, { damping: 11, stiffness: 170 });
              const chk = ease(f, c.at + 8, c.at + 18);
              return (
                <div
                  key={i}
                  style={{
                    width: 760,
                    height: 140,
                    borderRadius: 70,
                    background: 'rgba(255,255,255,0.1)',
                    border: '3px solid rgba(255,255,255,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 22px',
                    gap: 30,
                    transform: `translateX(${(1 - p) * (i % 2 ? 900 : -900)}px)`,
                  }}
                >
                  <div style={{ width: 100, height: 100, borderRadius: 50, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56 }}>{c.icon}</div>
                  <span style={{ flex: 1, fontFamily: LAT, fontWeight: 900, fontSize: 52, color: '#fff', letterSpacing: 3 }}>{c.t}</span>
                  <div style={{ width: 96, height: 96, borderRadius: 48, background: chk > 0 ? C.orange : 'transparent', border: `4px solid ${C.orange}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width={56} height={56} viewBox="0 0 24 24">
                      <path d="M4 12.5 L10 18 L20 6" stroke="#fff" strokeWidth={3.6} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={30} strokeDashoffset={30 * (1 - chk)} />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

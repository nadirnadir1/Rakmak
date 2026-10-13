import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { evolvePath, getLength, getPointAtLength } from '@remotion/paths';
import { NavyBackground } from '../components/Background';
import { Headline } from '../components/Headline';
import { Plane } from '../components/Plane';
import { clamp, ease, easeIn, pop } from '../components/anim';
import { AR, C, LAT } from '../theme';

const Wings: React.FC<{ f: number }> = ({ f }) => {
  const shield = pop(f, 4, { damping: 10 });
  const shimmer = interpolate(f, [30, 70], [-300, 1300], clamp);
  const feather = (side: 1 | -1, i: number) => {
    const p = ease(f, 10 + i * 4, 30 + i * 4);
    const len = 360 - i * 52;
    const y = -40 + i * 26;
    return (
      <g key={`${side}${i}`} transform={`scale(${side} 1)`}>
        <path
          d={`M60 ${y} L${60 + len * p} ${y - 34 + i * 6} Q ${70 + len * p} ${y - 10 + i * 6} ${60 + len * p - 10} ${y + 12 + i * 2} L60 ${y + 22} Z`}
          fill={`url(#gold${i % 2})`}
          opacity={p > 0 ? 1 : 0}
        />
      </g>
    );
  };
  return (
    <svg width={1000} height={420} viewBox="-500 -210 1000 420" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="gold0" x1="0" x2="1">
          <stop offset="0" stopColor="#FFE2A8" />
          <stop offset="1" stopColor={C.orange} />
        </linearGradient>
        <linearGradient id="gold1" x1="0" x2="1">
          <stop offset="0" stopColor="#FFF3D6" />
          <stop offset="1" stopColor={C.orangeLight} />
        </linearGradient>
        <linearGradient id="shine" x1="0" x2="1">
          <stop offset="0" stopColor="rgba(255,255,255,0)" />
          <stop offset="0.5" stopColor="rgba(255,255,255,0.85)" />
          <stop offset="1" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <clipPath id="wingClip">
          <rect x={-480} y={-200} width={960} height={400} />
        </clipPath>
      </defs>
      {[0, 1, 2, 3, 4].map((i) => feather(1, i))}
      {[0, 1, 2, 3, 4].map((i) => feather(-1, i))}
      <g transform={`scale(${shield})`}>
        <path d="M0 -150 L95 -110 L95 10 C95 80 40 120 0 150 C-40 120 -95 80 -95 10 L-95 -110 Z" fill={C.blue} stroke="#FFE2A8" strokeWidth={10} />
        <text y={20} textAnchor="middle" fill="#fff" fontFamily="Montserrat" fontWeight={900} fontSize={64} letterSpacing={4}>
          EFH
        </text>
        <path d="M-40 60 L0 40 L40 60" stroke={C.orange} strokeWidth={8} fill="none" strokeLinecap="round" />
      </g>
      <rect x={shimmer - 500} y={-200} width={160} height={400} fill="url(#shine)" transform="skewX(-20)" opacity={0.7} clipPath="url(#wingClip)" style={{ mixBlendMode: 'overlay' }} />
    </svg>
  );
};

const STEP_PATH = 'M 870 300 C 700 80, 560 520, 540 300 C 520 80, 380 520, 210 300';

const Method: React.FC<{ f: number }> = ({ f }) => {
  const draw = ease(f, 6, 60);
  const len = getLength(STEP_PATH);
  const pt = getPointAtLength(STEP_PATH, len * draw) ?? { x: 0, y: 0 };
  const ahead = getPointAtLength(STEP_PATH, Math.min(len, len * draw + 4)) ?? pt;
  const ang = (Math.atan2(ahead.y - pt.y, ahead.x - pt.x) * 180) / Math.PI + 90;
  const { strokeDasharray, strokeDashoffset } = evolvePath(draw, STEP_PATH);
  const steps = [
    { icon: '📘', x: 870, at: 4 },
    { icon: '🧑‍✈️', x: 540, at: 30 },
    { icon: '🎓', x: 210, at: 56 },
  ];
  return (
    <div style={{ position: 'absolute', top: 640, left: 0, width: 1080, height: 600 }}>
      <svg width={1080} height={600} style={{ position: 'absolute', overflow: 'visible' }}>
        <path d={STEP_PATH} stroke="rgba(255,255,255,0.18)" strokeWidth={8} fill="none" strokeDasharray="4 18" strokeLinecap="round" />
        <path d={STEP_PATH} stroke={C.orange} strokeWidth={8} fill="none" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
      </svg>
      {steps.map((s, i) => {
        const p = pop(f, s.at, { damping: 9, stiffness: 170 });
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: s.x,
              top: 300,
              width: 190,
              height: 190,
              borderRadius: 100,
              background: '#fff',
              transform: `translate(-50%,-50%) scale(${p})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 96,
              boxShadow: `0 0 0 14px rgba(242,131,0,${0.25 * p}), 0 20px 50px rgba(0,0,0,0.4)`,
            }}
          >
            {s.icon}
            <span style={{ position: 'absolute', top: -14, right: -6, width: 58, height: 58, borderRadius: 30, background: C.orange, color: '#fff', fontFamily: LAT, fontWeight: 900, fontSize: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {i + 1}
            </span>
          </div>
        );
      })}
      {draw > 0 && draw < 1 && <Plane size={110} color="#fff" angle={ang} style={{ left: pt.x, top: pt.y }} />}
    </div>
  );
};

export const Trainers: React.FC = () => {
  const f = useCurrentFrame();
  const split = 143;
  const outA = easeIn(f, split - 10, split + 4);
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <NavyBackground glow="#1A5BE8" />
      {f < split + 6 && (
        <AbsoluteFill style={{ opacity: 1 - outA, transform: `scale(${1 + outA * 0.3})` }}>
          <div style={{ position: 'absolute', top: 230, left: 40, right: 40 }}>
            <Headline text="أطر *محترفة" size={140} delay={4} />
            <Headline text="بخبرة كبيرة فالطيران" size={70} delay={40} color="rgba(255,255,255,0.85)" weight={800} />
          </div>
          <div style={{ position: 'absolute', top: 640, left: 40 }}>
            <Wings f={f - 8} />
          </div>
          <div style={{ position: 'absolute', top: 1110, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 18 }}>
            {[0, 1, 2, 3, 4].map((i) => {
              const p = pop(f, 56 + i * 5, { damping: 8, stiffness: 220 });
              return (
                <svg key={i} width={90} height={90} viewBox="0 0 24 24" style={{ transform: `scale(${p}) rotate(${(1 - p) * 180}deg)` }}>
                  <path d="M12 2 L14.9 8.6 L22 9.3 L16.6 14 L18.2 21 L12 17.3 L5.8 21 L7.4 14 L2 9.3 L9.1 8.6 Z" fill={C.orangeLight} />
                </svg>
              );
            })}
          </div>
        </AbsoluteFill>
      )}
      {f >= split - 4 && (
        <AbsoluteFill>
          <div style={{ position: 'absolute', top: 260, left: 40, right: 40 }}>
            <Headline text="منهجية *خاصة" size={140} delay={split - 2} />
            <Headline text="فالتكوين" size={80} delay={split + 8} color="rgba(255,255,255,0.85)" weight={800} />
          </div>
          <Method f={f - split} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

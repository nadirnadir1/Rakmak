import React from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { LightBackground } from '../components/Background';
import { Skyline } from '../components/Skyline';
import { clamp, ease, pop } from '../components/anim';
import { AR, C, LAT } from '../theme';

const LOGO_W = 2362;
const LOGO_H = 680;
const SCALE = 960 / LOGO_W;

export const Brand: React.FC = () => {
  const f = useCurrentFrame();
  const icon = pop(f, 4, { damping: 10, stiffness: 120 });
  const mark = ease(f, 12, 30);
  const text = ease(f, 22, 40);
  const pin = pop(f, 44, { damping: 9, stiffness: 180 });
  const city = ease(f, 50, 66);
  const sky = ease(f, 34, 76);
  const ring = ease(f, 70, 112, [0, 1]);
  const ringPop = pop(f, 66, { damping: 12 });
  const pct = Math.round(interpolate(f, [70, 112], [0, 100], clamp));
  const tagline = pop(f, 82, { damping: 14 });
  const float = Math.sin(f / 14) * 6;
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <LightBackground />
      {/* Sunset glow behind skyline */}
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 100%, rgba(242,131,0,${0.35 * sky}) 0%, transparent 55%)` }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
        <Skyline progress={sky} color={C.terracotta} mountain="rgba(0,58,156,0.14)" />
      </div>

      {/* Logo */}
      <div style={{ position: 'absolute', left: 60, top: 300 + float, width: LOGO_W * SCALE, height: LOGO_H * SCALE }}>
        <Img
          src={staticFile('efh-icon.png')}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 660 * SCALE,
            transformOrigin: '50% 60%',
            transform: `scale(${icon}) rotate(${(1 - icon) * -120}deg) translateX(${(1 - icon) * -300}px)`,
          }}
        />
        <Img
          src={staticFile('efh-mark.png')}
          style={{ position: 'absolute', left: 660 * SCALE, top: 0, width: 1000 * SCALE, clipPath: `inset(0 ${(1 - mark) * 100}% 0 0)`, transform: `translateY(${(1 - mark) * 30}px)` }}
        />
        <Img
          src={staticFile('efh-text.png')}
          style={{ position: 'absolute', left: 1660 * SCALE, top: 0, width: 702 * SCALE, clipPath: `inset(${(1 - text) * 100}% 0 0 0)`, opacity: text }}
        />
      </div>

      {/* Location */}
      <div
        style={{
          position: 'absolute',
          top: 640,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 22,
        }}
      >
        <svg width={86} height={110} viewBox="0 0 40 52" style={{ transform: `translateY(${(1 - pin) * -200}px) scale(${0.5 + pin * 0.5})`, opacity: Math.min(1, pin * 2) }}>
          <path d="M20 0 C9 0 0 9 0 20 C0 35 20 52 20 52 C20 52 40 35 40 20 C40 9 31 0 20 0 Z" fill={C.orange} />
          <circle cx={20} cy={19} r={8} fill="#fff" />
        </svg>
        <div style={{ clipPath: `inset(0 0 0 ${(1 - city) * 100}%)`, display: 'flex', alignItems: 'baseline', gap: 20 }} dir="rtl">
          <span style={{ fontFamily: AR, fontWeight: 900, fontSize: 92, color: C.blue }}>مراكش</span>
          <span style={{ fontFamily: LAT, fontWeight: 800, fontSize: 44, color: C.orange, letterSpacing: 8 }}>MARRAKECH</span>
        </div>
      </div>

      {/* 100% aviation badge */}
      <div style={{ position: 'absolute', top: 820, left: 540, transform: `translateX(-50%) scale(${ringPop})` }}>
        <svg width={340} height={340} viewBox="0 0 340 340" style={{ overflow: 'visible' }}>
          <circle cx={170} cy={170} r={150} fill="#fff" stroke="#E3EAF8" strokeWidth={22} />
          <circle
            cx={170}
            cy={170}
            r={150}
            fill="none"
            stroke={C.orange}
            strokeWidth={22}
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 150}
            strokeDashoffset={2 * Math.PI * 150 * (1 - ring)}
            transform="rotate(-90 170 170)"
          />
          <g transform={`rotate(${ring * 360 - 90} 170 170)`}>
            <g transform="translate(320 170) rotate(90)">
              <path d="M0 -26 L7 -8 L26 4 L26 9 L7 3 L5 18 L12 24 L12 27 L0 24 L-12 27 L-12 24 L-5 18 L-7 3 L-26 9 L-26 4 L-7 -8 Z" fill={C.blue} />
            </g>
          </g>
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: LAT, fontWeight: 900, fontSize: 104, color: C.blue, lineHeight: 1 }}>{pct}%</span>
          <span style={{ fontFamily: AR, fontWeight: 800, fontSize: 40, color: C.orange }}>طيران</span>
        </div>
      </div>
      <div
        dir="rtl"
        style={{
          position: 'absolute',
          top: 1190,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: AR,
          fontWeight: 800,
          fontSize: 56,
          color: C.blue,
          opacity: tagline,
          transform: `translateY(${(1 - tagline) * 30}px)`,
        }}
      >
        مدرسة متخصصة فمجال <span style={{ color: C.orange }}>الطيران</span>
      </div>
    </AbsoluteFill>
  );
};

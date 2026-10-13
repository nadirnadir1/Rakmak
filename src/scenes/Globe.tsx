import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { NavyBackground } from '../components/Background';
import { clamp, ease, pop } from '../components/anim';
import landDots from '../data/land-dots.json';
import { AR, C, LAT } from '../theme';

type V3 = [number, number, number];
const rad = (d: number) => (d * Math.PI) / 180;
const toVec = (lat: number, lon: number): V3 => [Math.cos(rad(lat)) * Math.sin(rad(lon)), Math.sin(rad(lat)), Math.cos(rad(lat)) * Math.cos(rad(lon))];

const RAK = { lat: 31.63, lon: -8.0 };
const CITIES = [
  { name: 'PARIS', lat: 48.85, lon: 2.35, at: 4, lx: 16, ly: 30 },
  { name: 'DUBAI', lat: 25.2, lon: 55.27, at: 10, lx: 16, ly: -14 },
  { name: 'LONDON', lat: 51.5, lon: -0.12, at: 16, lx: -130, ly: -16 },
  { name: 'NEW YORK', lat: 40.7, lon: -74.0, at: 22, lx: -60, ly: -22 },
  { name: 'ISTANBUL', lat: 41.0, lon: 28.97, at: 28, lx: 16, ly: -14 },
  { name: 'JEDDAH', lat: 21.5, lon: 39.2, at: 34, lx: -40, ly: 40 },
];

const slerp = (a: V3, b: V3, t: number): V3 => {
  const dot = Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]);
  const om = Math.acos(dot);
  const so = Math.sin(om);
  const k1 = Math.sin((1 - t) * om) / so;
  const k2 = Math.sin(t * om) / so;
  return [a[0] * k1 + b[0] * k2, a[1] * k1 + b[1] * k2, a[2] * k1 + b[2] * k2];
};

const CARDS = [
  { icon: '✈️', label: 'شركات الطيران', at: 8 },
  { icon: '🛫', label: 'المطارات', at: 64 },
  { icon: '🏨', label: 'الفنادق الفخمة', at: 112 },
];

export const Globe: React.FC = () => {
  const f = useCurrentFrame();
  const R = 400 * (1 - ease(f, 54, 90) * 0.12);
  const cx = 540;
  const cy = 820 - ease(f, 54, 90) * 60;
  const lon0 = interpolate(f, [0, 160], [-28, 18], clamp);
  const lat0 = 28;
  const enter = pop(f, 0, { damping: 15, stiffness: 90 });

  const project = (v: V3, scale = 1) => {
    const x1 = v[0] * Math.cos(rad(-lon0)) + v[2] * Math.sin(rad(-lon0));
    const z1 = -v[0] * Math.sin(rad(-lon0)) + v[2] * Math.cos(rad(-lon0));
    const y2 = v[1] * Math.cos(rad(lat0)) - z1 * Math.sin(rad(lat0));
    const z2 = v[1] * Math.sin(rad(lat0)) + z1 * Math.cos(rad(lat0));
    return { x: cx + x1 * R * scale * enter, y: cy - y2 * R * scale * enter, z: z2 };
  };

  const rak = toVec(RAK.lat, RAK.lon);
  const rakP = project(rak);

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <NavyBackground glow="#0D4BD0" pattern={0.04} />
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <radialGradient id="globeFill" cx="40%" cy="35%" r="70%">
            <stop offset="0" stopColor="#1C5BD8" />
            <stop offset="0.6" stopColor="#0A2F86" />
            <stop offset="1" stopColor="#031848" />
          </radialGradient>
          <radialGradient id="atmo" r="50%">
            <stop offset="0.82" stopColor="rgba(80,150,255,0)" />
            <stop offset="0.9" stopColor="rgba(80,150,255,0.35)" />
            <stop offset="1" stopColor="rgba(80,150,255,0)" />
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cy} r={R * enter * 1.12} fill="url(#atmo)" />
        <circle cx={cx} cy={cy} r={R * enter} fill="url(#globeFill)" />
        {(landDots as [number, number][]).map(([lat, lon], i) => {
          const p = project(toVec(lat, lon));
          if (p.z <= 0.02) return null;
          return <circle key={i} cx={p.x} cy={p.y} r={3.4 * (0.45 + 0.55 * p.z)} fill="#9CC2FF" opacity={0.25 + 0.6 * p.z} />;
        })}
        {/* Routes */}
        {CITIES.map((c, i) => {
          const b = toVec(c.lat, c.lon);
          const draw = ease(f, c.at, c.at + 26);
          if (draw <= 0) return null;
          const N = 48;
          const pts: { x: number; y: number; z: number }[] = [];
          for (let k = 0; k <= N * draw; k++) {
            const t = k / N;
            pts.push(project(slerp(rak, b, t), 1 + 0.18 * Math.sin(Math.PI * t)));
          }
          const d = pts.map((p, k) => `${k ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
          const head = pts[pts.length - 1];
          const end = project(b);
          const label = pop(f, c.at + 24, { damping: 12 });
          const travel = ((f - c.at) / 50) % 1;
          const tp = project(slerp(rak, b, travel), 1 + 0.18 * Math.sin(Math.PI * travel));
          return (
            <g key={c.name}>
              <path d={d} stroke={C.orange} strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.95} style={{ filter: `drop-shadow(0 0 8px ${C.orange})` }} />
              {draw < 1 && <circle cx={head.x} cy={head.y} r={9} fill="#fff" />}
              {draw >= 1 && <circle cx={tp.x} cy={tp.y} r={7} fill="#fff" opacity={0.9} />}
              {draw >= 1 && end.z > 0 && (
                <g transform={`translate(${end.x} ${end.y}) scale(${label})`}>
                  <circle r={10} fill={C.orangeLight} />
                  <circle r={10 + ((f * 0.8 + i * 9) % 26)} fill="none" stroke={C.orangeLight} strokeWidth={2} opacity={1 - ((f * 0.8 + i * 9) % 26) / 26} />
                  <text x={c.lx} y={c.ly} fill="#fff" fontFamily="Montserrat" fontWeight={800} fontSize={26} letterSpacing={2}>
                    {c.name}
                  </text>
                </g>
              )}
            </g>
          );
        })}
        {/* Marrakech hub */}
        <g transform={`translate(${rakP.x} ${rakP.y})`}>
          <circle r={18} fill={C.orange} />
          <circle r={18 + (f % 30)} fill="none" stroke={C.orange} strokeWidth={4} opacity={1 - (f % 30) / 30} />
          <circle r={7} fill="#fff" />
          <g transform="translate(-22 46)">
            <rect x={-150} y={-30} width={170} height={52} rx={26} fill="#fff" />
            <text x={-65} y={6} textAnchor="middle" fill={C.blue} fontFamily="Montserrat" fontWeight={900} fontSize={26} letterSpacing={2}>
              RAK
            </text>
          </g>
        </g>
      </svg>
      <div style={{ position: 'absolute', top: 170, left: 0, right: 0, textAlign: 'center' }}>
        <div dir="rtl" style={{ fontFamily: AR, fontWeight: 900, fontSize: 96, color: '#fff', opacity: ease(f, 0, 14), transform: `translateY(${(1 - ease(f, 0, 14)) * 40}px)` }}>
          أكبر شركات <span style={{ color: C.orange }}>الطيران</span>
        </div>
        <div style={{ fontFamily: LAT, fontWeight: 800, fontSize: 34, color: 'rgba(255,255,255,0.6)', letterSpacing: 10, marginTop: -6, opacity: ease(f, 8, 22) }}>
          AROUND THE WORLD
        </div>
      </div>
      {/* Career cards */}
      <div dir="rtl" style={{ position: 'absolute', top: 1230, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 26 }}>
        {CARDS.map((c, i) => {
          const p = pop(f, c.at, { damping: 11, stiffness: 150 });
          const active = f >= c.at && (i === CARDS.length - 1 || f < CARDS[i + 1].at);
          return (
            <div
              key={i}
              style={{
                width: 300,
                height: 230,
                borderRadius: 34,
                background: active ? `linear-gradient(160deg, ${C.orangeLight}, ${C.orange})` : 'rgba(255,255,255,0.12)',
                border: '2px solid rgba(255,255,255,0.25)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `perspective(900px) rotateY(${(1 - p) * 90}deg) scale(${active ? 1.06 : 0.96})`,
                opacity: Math.min(1, p * 2),
                boxShadow: active ? '0 20px 50px rgba(242,131,0,0.45)' : 'none',
              }}
            >
              <span style={{ fontSize: 86, lineHeight: 1.2 }}>{c.icon}</span>
              <span style={{ fontFamily: AR, fontWeight: 900, fontSize: 42, color: '#fff' }}>{c.label}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

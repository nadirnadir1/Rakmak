import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C} from '../theme';
import {lerp} from '../lib';

// Stylised aircraft cabin interior with a slow forward dolly: fuselage walls, overhead bins with
// mood lighting, windows, seat rows with headrest covers and orange floor path lighting.
// Pure vector illustration — never presented as real EFH footage.
export const Cabin: React.FC<{w: number; h: number; dur: number}> = ({w, h, dur}) => {
  const frame = useCurrentFrame();
  const cx = w / 2;
  const cy = h * 0.4;
  const fl = Math.min(w, h) * 0.62;
  const travel = lerp(frame, [0, dur], [0, 2.4], (t) => t);
  const A = 0.42; // aisle half width
  const WALL = 2.3;
  const F = 1.2; // floor below eye
  const BELT = -0.25; // window belt / bottom of bins
  const CEIL = 1.05;
  const BIN_IN = A + 0.55;
  const spacing = 1.25;
  const ZN = 0.35;
  const ZF = 40;

  const P = (x: number, y: number, z: number) => [cx + (x * fl) / z, cy + (y * fl) / z] as const;
  const pts = (...p: (readonly [number, number])[]) => p.map((q) => q.join(',')).join(' ');
  const quad = (x1: number, y1: number, x2: number, y2: number) =>
    pts(P(x1, y1, ZN), P(x2, y2, ZN), P(x2, y2, ZF), P(x1, y1, ZF));

  const rows: number[] = [];
  for (let k = 0; k < 26; k++) {
    const z = 0.9 + k * spacing - (travel % spacing);
    if (z > 0.55) rows.push(z);
  }
  rows.sort((a, b) => b - a);
  const signOn = frame > 8;
  const fog = (z: number) => lerp(z, [6, 22], [0, 0.85], (t) => t);

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id="cWall" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#c9d3e8" />
          <stop offset="100%" stopColor="#8f9cbc" />
        </linearGradient>
        <linearGradient id="cSeat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2d58c4" />
          <stop offset="100%" stopColor="#0f2458" />
        </linearGradient>
        <radialGradient id="cFog" cx="50%" cy="40%" r="30%">
          <stop offset="0%" stopColor="#b8ccff" stopOpacity={0.9} />
          <stop offset="100%" stopColor="#b8ccff" stopOpacity={0} />
        </radialGradient>
        <filter id="cGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      <rect width={w} height={h} fill="#1a2b52" />
      {/* ceiling */}
      <polygon points={quad(-BIN_IN, -CEIL, BIN_IN, -CEIL)} fill="#e6ebf5" />
      {/* overhead bins, both sides */}
      {[-1, 1].map((s) => (
        <polygon key={`b${s}`} points={pts(P(s * WALL, BELT - 0.1, ZN), P(s * BIN_IN, -CEIL, ZN), P(s * BIN_IN, -CEIL, ZF), P(s * WALL, BELT - 0.1, ZF))} fill="#f3f6fc" />
      ))}
      {/* side walls (window belt) */}
      {[-1, 1].map((s) => (
        <polygon key={`w${s}`} points={pts(P(s * WALL, BELT - 0.1, ZN), P(s * WALL, F, ZN), P(s * WALL, F, ZF), P(s * WALL, BELT - 0.1, ZF))} fill="url(#cWall)" />
      ))}
      {/* floor + aisle carpet */}
      <polygon points={quad(-WALL, F, WALL, F)} fill="#16244a" />
      <polygon points={quad(-A, F, A, F)} fill="#0c1733" />
      {/* royal-blue mood lighting under the bins */}
      {[-1, 1].map((s) => {
        const [x1, y1] = P(s * WALL, BELT - 0.1, ZN);
        const [x2, y2] = P(s * WALL, BELT - 0.1, ZF);
        return <line key={`m${s}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.royalLight} strokeWidth={10} filter="url(#cGlow)" />;
      })}
      {rows.map((z) => {
        const near = lerp(z, [0.55, 0.9], [0, 1], (t) => t);
        return (
          <g key={z.toFixed(3)} opacity={near * (1 - fog(z))}>
            {[-1, 1].map((s) => {
              // bin seam + window for this row
              const [sx1, sy1] = P(s * WALL, BELT - 0.1, z);
              const [sx2, sy2] = P(s * BIN_IN, -CEIL, z);
              const [wx, wy] = P(s * WALL, BELT + 0.28, z + spacing / 2);
              const wr = (0.16 * fl) / (z + spacing / 2);
              // seat back (outer seats of the row), seen from behind
              const [x1, yTop] = P(s * (A + 0.08), F - 1.25, z);
              const [x2, yBot] = P(s * (WALL - 0.12), F, z);
              const left = Math.min(x1, x2);
              const width = Math.abs(x2 - x1);
              const ht = yBot - yTop;
              const [lx, ly] = P(s * (A - 0.04), F, z + 0.6);
              return (
                <g key={s}>
                  <line x1={sx1} y1={sy1} x2={sx2} y2={sy2} stroke="#b7c2da" strokeWidth={Math.max(1, (0.02 * fl) / z)} />
                  <rect x={wx - wr * 0.62} y={wy - wr} width={wr * 1.24} height={wr * 2} rx={wr * 0.6} fill="#9cc2ff" stroke="#e9eef9" strokeWidth={Math.max(1, (0.04 * fl) / z)} />
                  {/* two seats per side with a gap */}
                  {[0, 1].map((k) => (
                    <g key={k}>
                      <rect x={left + (width * k) / 2 + width * 0.02} y={yTop} width={width / 2 - width * 0.04} height={ht} rx={width * 0.07} fill="url(#cSeat)" />
                      <rect x={left + (width * k) / 2 + width * 0.06} y={yTop + ht * 0.04} width={width / 2 - width * 0.12} height={ht * 0.2} rx={width * 0.03} fill="#f5f7fc" />
                      <rect x={left + (width * k) / 2 + width * 0.06} y={yTop + ht * 0.235} width={width / 2 - width * 0.12} height={ht * 0.025} fill={C.orange} />
                    </g>
                  ))}
                  <circle cx={lx} cy={ly} r={Math.max(1.5, (0.035 * fl) / z)} fill={C.orange} />
                </g>
              );
            })}
          </g>
        );
      })}
      <rect width={w} height={h} fill="url(#cFog)" opacity={0.35} />
      {/* fasten-seatbelt sign */}
      <g transform={`translate(${cx}, ${h * 0.1})`}>
        <rect x={-64} y={-30} width={128} height={60} rx={14} fill="#0a142c" stroke="#33466f" strokeWidth={3} />
        <g fill={signOn ? C.white : '#3a4a6e'} style={{filter: signOn ? 'drop-shadow(0 0 8px #fff)' : undefined}}>
          <circle cx={-24} cy={-9} r={8} />
          <rect x={-35} y={2} width={22} height={20} rx={6} />
          <rect x={4} y={-6} width={44} height={7} rx={3.5} />
          <rect x={4} y={8} width={44} height={7} rx={3.5} />
        </g>
      </g>
    </svg>
  );
};

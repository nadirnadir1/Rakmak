import React from 'react';
import {random, useCurrentFrame} from 'remotion';
import {C, latinFont} from '../theme';
import {lerp} from '../lib';

// Split-flap airport departures board. Generic destinations, no airline / flight claims.
const ROWS: [string, string, string][] = [
  ['08:40', 'PARIS', 'ON TIME'],
  ['09:15', 'DUBAI', 'BOARDING'],
  ['10:05', 'ISTANBUL', 'ON TIME'],
  ['11:30', 'DOHA', 'ON TIME'],
  ['12:10', 'LONDON', 'GATE OPEN'],
  ['13:45', 'MONTREAL', 'ON TIME'],
];
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

const Flap: React.FC<{ch: string; settle: number; seed: string; size: number}> = ({ch, settle, seed, size}) => {
  const frame = useCurrentFrame();
  const flipping = frame < settle;
  const shown = flipping && /[A-Z0-9]/.test(ch) ? GLYPHS[Math.floor(random(`${seed}-${Math.floor(frame / 2)}`) * GLYPHS.length)] : ch;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size * 0.72,
        height: size * 1.18,
        margin: 2,
        borderRadius: 6,
        background: ch === ' ' ? 'transparent' : 'linear-gradient(#10244d 0%, #10244d 49%, #0a1a3a 51%, #0a1a3a 100%)',
        color: C.white,
        fontSize: size,
        fontFamily: latinFont,
        fontWeight: 700,
        boxShadow: ch === ' ' ? 'none' : 'inset 0 -2px 0 rgba(0,0,0,.4)',
      }}
    >
      {shown}
    </span>
  );
};

export const Departures: React.FC<{w: number; h: number; dur: number}> = ({w, h}) => {
  const frame = useCurrentFrame();
  const size = Math.min(w / 22, h / 15.5);
  return (
    <div
      style={{
        width: w,
        height: h,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: size * 0.8,
        boxSizing: 'border-box',
        background: `radial-gradient(120% 90% at 50% 0%, #0d2250 0%, ${C.navyDeep} 70%)`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          color: C.orange,
          fontFamily: latinFont,
          fontWeight: 800,
          letterSpacing: 6,
          fontSize: size * 0.8,
          marginBottom: size * 0.6,
          opacity: lerp(frame, [0, 10], [0, 1]),
        }}
      >
        <svg width={size * 1.2} height={size * 1.2} viewBox="0 0 24 24">
          <path fill={C.orange} d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" />
        </svg>
        DEPARTURES
      </div>
      {ROWS.map((row, i) => {
        const rowIn = lerp(frame, [i * 3, i * 3 + 10], [0, 1]);
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              opacity: rowIn,
              transform: `translateY(${(1 - rowIn) * 20}px)`,
              marginBottom: size * 0.25,
            }}
          >
            {row.map((cell, j) => (
              <div key={j} style={{display: 'flex'}}>
                {cell.split('').map((ch, k) => (
                  <Flap key={k} ch={ch} size={size * (j === 1 ? 0.9 : 0.62)} seed={`${i}-${j}-${k}`} settle={3 + i * 1.5 + j * 2 + k * 0.8} />
                ))}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};

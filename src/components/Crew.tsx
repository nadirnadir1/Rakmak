import React from 'react';
import { C } from '../theme';

// Stylised cabin-crew avatar.
export const Crew: React.FC<{ female?: boolean; skin?: string; size?: number }> = ({ female = true, skin = '#E9B98F', size = 170 }) => (
  <svg width={size} height={size * 1.35} viewBox="0 0 100 135">
    <defs>
      <linearGradient id="jacket" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#0B4FC4" />
        <stop offset="1" stopColor={C.blue} />
      </linearGradient>
    </defs>
    <path d="M10 135 C10 100 24 84 50 84 C76 84 90 100 90 135 Z" fill="url(#jacket)" />
    <path d="M38 85 L50 112 L62 85 Z" fill="#fff" />
    {female ? <path d="M38 86 L50 100 L62 86 L56 104 L50 98 L44 104 Z" fill={C.orange} /> : <path d="M47 92 L53 92 L55 118 L50 124 L45 118 Z" fill={C.orange} />}
    <rect x={43} y={66} width={14} height={22} rx={6} fill={skin} />
    {female && <circle cx={50} cy={22} r={13} fill="#2B1B12" />}
    <ellipse cx={50} cy={50} rx={21} ry={24} fill={skin} />
    {female ? (
      <path d="M29 50 C27 28 38 24 50 24 C62 24 73 28 71 50 C68 40 60 34 50 34 C40 34 32 40 29 50 Z" fill="#2B1B12" />
    ) : (
      <path d="M30 44 C30 30 40 26 50 26 C60 26 70 30 70 44 C66 37 58 34 50 34 C42 34 34 37 30 44 Z" fill="#1E140E" />
    )}
    {/* Cap */}
    <path d="M28 32 C30 16 70 16 72 32 Z" fill={C.blue} />
    <rect x={27} y={30} width={46} height={7} rx={3} fill={C.orange} />
    <circle cx={50} cy={24} r={3.2} fill="#FFD27A" />
    <circle cx={42} cy={52} r={2.3} fill="#2B1B12" />
    <circle cx={58} cy={52} r={2.3} fill="#2B1B12" />
    <path d="M43 61 Q50 67 57 61" stroke="#9A4A3A" strokeWidth={2.4} fill="none" strokeLinecap="round" />
    <path d="M60 96 L76 96" stroke="#FFD27A" strokeWidth={3} strokeLinecap="round" />
  </svg>
);

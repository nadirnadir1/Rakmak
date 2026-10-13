import React from 'react';

// Moroccan zellige-style eight-point star lattice.
export const Zellige: React.FC<{ color: string; opacity: number; size?: number; offset?: number; id: string }> = ({
  color,
  opacity,
  size = 160,
  offset = 0,
  id,
}) => {
  const h = size / 2;
  const r = size * 0.36;
  const sq = (rot: number) => {
    const pts = [0, 1, 2, 3].map((i) => {
      const a = ((i * 90 + rot + 45) * Math.PI) / 180;
      return `${h + r * Math.cos(a)},${h + r * Math.sin(a)}`;
    });
    return pts.join(' ');
  };
  return (
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity }}>
      <defs>
        <pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse" patternTransform={`translate(${offset} ${offset * 0.6})`}>
          <polygon points={sq(0)} fill="none" stroke={color} strokeWidth={2} />
          <polygon points={sq(45)} fill="none" stroke={color} strokeWidth={2} />
          <circle cx={h} cy={h} r={r * 0.32} fill="none" stroke={color} strokeWidth={2} />
          <line x1={0} y1={0} x2={size * 0.16} y2={size * 0.16} stroke={color} strokeWidth={2} />
          <line x1={size} y1={0} x2={size * 0.84} y2={size * 0.16} stroke={color} strokeWidth={2} />
          <line x1={0} y1={size} x2={size * 0.16} y2={size * 0.84} stroke={color} strokeWidth={2} />
          <line x1={size} y1={size} x2={size * 0.84} y2={size * 0.84} stroke={color} strokeWidth={2} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
};

import React from 'react';
import { C } from '../theme';

// Marrakech skyline: Atlas peaks, ramparts, Koutoubia minaret and palms.
export const Skyline: React.FC<{ width?: number; color?: string; mountain?: string; progress?: number; style?: React.CSSProperties }> = ({
  width = 1080,
  color = C.terracotta,
  mountain = 'rgba(255,255,255,0.18)',
  progress = 1,
  style,
}) => {
  const rise = (1 - progress) * 220;
  const palm = (x: number, h: number, lean: number, key: string) => (
    <g key={key} transform={`translate(${x} ${400 - h})`}>
      <path d={`M0 ${h} Q ${lean * 0.4} ${h * 0.5} ${lean} 0`} stroke={color} strokeWidth={9} fill="none" strokeLinecap="round" />
      {[-70, -30, 10, 50, 95, 140, 180].map((a, i) => {
        const r = 62 + (i % 2) * 14;
        const rad = ((a - 90) * Math.PI) / 180;
        const ex = lean + Math.cos(rad) * r;
        const ey = Math.sin(rad) * r * 0.75 + 12;
        const cx = lean + Math.cos(rad) * r * 0.5;
        const cy = Math.sin(rad) * r * 0.5 - 16;
        return <path key={i} d={`M${lean} 0 Q ${cx} ${cy} ${ex} ${ey}`} stroke={color} strokeWidth={8} fill="none" strokeLinecap="round" />;
      })}
    </g>
  );
  const crenels = Array.from({ length: 28 }, (_, i) => (
    <rect key={i} x={i * 40} y={318} width={22} height={18} fill={color} />
  ));
  return (
    <svg width={width} height={(width * 400) / 1080} viewBox="0 0 1080 400" style={{ display: 'block', overflow: 'visible', ...style }}>
      <g transform={`translate(0 ${rise * 0.35})`}>
        <path d="M0 290 L120 190 L210 240 L330 140 L430 220 L520 170 L640 250 L760 150 L880 230 L980 180 L1080 230 L1080 400 L0 400 Z" fill={mountain} />
        <path d="M300 160 L330 140 L360 162 L345 166 L330 156 L314 168 Z M735 168 L760 150 L788 170 L772 172 L760 163 L748 174 Z" fill="rgba(255,255,255,0.55)" />
      </g>
      <g transform={`translate(0 ${rise})`}>
        {crenels}
        <rect x={0} y={334} width={1080} height={70} fill={color} />
        {/* Gate */}
        <path d="M150 404 L150 300 L250 300 L250 404 Z" fill={color} />
        <path d="M172 404 L172 352 Q200 318 228 352 L228 404 Z" fill="rgba(0,0,0,0.28)" />
        {/* Koutoubia minaret */}
        <g transform="translate(640 0)">
          <rect x={-58} y={92} width={116} height={260} fill={color} />
          {[0, 1, 2].map((r) =>
            [-1, 0, 1].map((c) => <rect key={`${r}${c}`} x={c * 34 - 9} y={128 + r * 62} width={18} height={34} rx={9} fill="rgba(0,0,0,0.25)" />),
          )}
          {[-58, -34, -10, 14, 38].map((x) => (
            <rect key={x} x={x} y={78} width={20} height={16} fill={color} />
          ))}
          <rect x={-26} y={34} width={52} height={46} fill={color} />
          <rect x={-10} y={46} width={20} height={26} rx={10} fill="rgba(0,0,0,0.25)" />
          <path d="M-30 36 L0 14 L30 36 Z" fill={color} />
          <line x1={0} y1={14} x2={0} y2={-30} stroke={color} strokeWidth={5} />
          {[-12, -20, -27].map((y, i) => (
            <circle key={i} cx={0} cy={y} r={7 - i * 1.5} fill={C.orangeLight} />
          ))}
        </g>
        {palm(80, 230, 26, 'p1')}
        {palm(400, 270, -30, 'p2')}
        {palm(470, 200, 22, 'p3')}
        {palm(860, 250, 30, 'p4')}
        {palm(960, 190, -18, 'p5')}
      </g>
    </svg>
  );
};

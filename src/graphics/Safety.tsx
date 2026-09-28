import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C} from '../theme';
import {lerp} from '../lib';

// Line-art cabin safety pictograms that draw themselves (stroke-dash animation).
// Icons only, no claims about course content.
const ICONS: {key: string; paths: string[]}[] = [
  {
    key: 'mask', // oxygen mask + tube
    paths: ['M30 38 Q50 30 70 38 L66 64 Q50 74 34 64 Z', 'M50 30 L50 12 Q50 6 58 6 L78 6', 'M34 44 L18 40 M66 44 L82 40'],
  },
  {
    key: 'vest', // life vest
    paths: ['M36 14 L28 20 L24 70 Q24 82 36 84 L46 84 L46 36 Z', 'M64 14 L72 20 L76 70 Q76 82 64 84 L54 84 L54 36 Z', 'M36 14 Q50 26 64 14', 'M46 60 L54 60'],
  },
  {
    key: 'exit', // door + arrow
    paths: ['M20 12 L56 12 L56 88 L20 88 Z', 'M44 50 L46 50', 'M62 50 L88 50 M78 40 L88 50 L78 60'],
  },
  {
    key: 'aid', // first aid
    paths: ['M18 22 Q18 16 24 16 L76 16 Q82 16 82 22 L82 78 Q82 84 76 84 L24 84 Q18 84 18 78 Z', 'M42 32 L58 32 L58 42 L68 42 L68 58 L58 58 L58 68 L42 68 L42 58 L32 58 L32 42 L42 42 Z'],
  },
];

export const Safety: React.FC<{w: number; h: number; dur: number}> = ({w, h}) => {
  const frame = useCurrentFrame();
  const cell = Math.min(w / 2.3, h / 2.3);
  return (
    <div
      style={{
        width: w,
        height: h,
        display: 'grid',
        gridTemplateColumns: `repeat(2, ${cell}px)`,
        gridAutoRows: `${cell}px`,
        placeContent: 'center',
        gap: cell * 0.12,
        background: `radial-gradient(100% 80% at 50% 30%, #102a5e 0%, ${C.navyDeep} 75%)`,
      }}
    >
      {ICONS.map((icon, i) => {
        const start = i * 6;
        const draw = lerp(frame, [start, start + 24], [0, 1]);
        const pop = lerp(frame, [start, start + 12], [0.8, 1]);
        return (
          <div
            key={icon.key}
            style={{
              borderRadius: cell * 0.14,
              background: 'rgba(36,81,214,0.16)',
              border: `2px solid rgba(91,140,255,${0.25 + 0.35 * draw})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `scale(${pop})`,
              opacity: lerp(frame, [start, start + 6], [0, 1]),
            }}
          >
            <svg width={cell * 0.62} height={cell * 0.62} viewBox="0 0 100 100">
              {icon.paths.map((d, k) => (
                <path
                  key={k}
                  d={d}
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1 - draw}
                  fill="none"
                  stroke={k === icon.paths.length - 1 ? C.orange : C.white}
                  strokeWidth={4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
            </svg>
          </div>
        );
      })}
    </div>
  );
};

import React from 'react';
import { useCurrentFrame } from 'remotion';
import { AR, C } from '../theme';
import { pop } from './anim';

// Arabic headline that rises in word by word. Words wrapped in *stars* get the accent colour.
export const Headline: React.FC<{
  text: string;
  delay?: number;
  size?: number;
  color?: string;
  accent?: string;
  stagger?: number;
  style?: React.CSSProperties;
  weight?: number;
}> = ({ text, delay = 0, size = 120, color = '#fff', accent = C.orange, stagger = 4, style, weight = 900 }) => {
  const f = useCurrentFrame();
  const words = text.split(' ');
  return (
    <div
      dir="rtl"
      style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: `0 ${size * 0.22}px`, fontFamily: AR, fontWeight: weight, fontSize: size, lineHeight: 1.25, ...style }}
    >
      {words.map((w, i) => {
        const p = pop(f, delay + i * stagger, { damping: 11, stiffness: 170 });
        const isAccent = w.startsWith('*');
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              color: isAccent ? accent : color,
              transform: `translateY(${(1 - p) * size * 0.7}px) scale(${0.6 + 0.4 * p})`,
              opacity: Math.min(1, p * 1.4),
              filter: `blur(${Math.max(0, (1 - p) * 10)}px)`,
            }}
          >
            {w.replace(/\*/g, '')}
          </span>
        );
      })}
    </div>
  );
};

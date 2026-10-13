import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C } from '../theme';
import { rand } from './anim';
import { Zellige } from './Zellige';

export const NavyBackground: React.FC<{ glow?: string; pattern?: number; energy?: number }> = ({ glow = C.blueBright, pattern = 0.07, energy = 0 }) => {
  const f = useCurrentFrame();
  const gx = 50 + Math.sin(f / 70) * 18;
  const gy = 38 + Math.cos(f / 90) * 10;
  return (
    <AbsoluteFill style={{ background: C.midnight, overflow: 'hidden' }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${gx}% ${gy}%, ${glow} 0%, ${C.blue} 22%, ${C.navy} 55%, ${C.midnight} 100%)`,
          opacity: 0.9 + energy * 0.1,
        }}
      />
      <AbsoluteFill style={{ background: `radial-gradient(circle at 15% 105%, rgba(242,131,0,${0.35 + energy * 0.25}) 0%, transparent 45%)` }} />
      <Zellige id={`z-${glow.replace('#', '')}`} color="#ffffff" opacity={pattern} offset={f * 0.6} size={180} />
      <Particles />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)' }} />
    </AbsoluteFill>
  );
};

export const Particles: React.FC<{ count?: number; color?: string }> = ({ count = 36, color = '#fff' }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      {Array.from({ length: count }, (_, i) => {
        const x = rand(i) * 1080;
        const speed = 0.4 + rand(i + 100) * 1.4;
        const y = (((rand(i + 200) * 2100 - f * speed) % 2100) + 2100) % 2100 - 90;
        const r = 2 + rand(i + 300) * 5;
        const tw = 0.3 + 0.7 * Math.abs(Math.sin(f / 18 + i));
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: r,
              height: r,
              borderRadius: r,
              background: i % 5 === 0 ? C.orangeLight : color,
              opacity: 0.35 * tw,
              boxShadow: `0 0 ${r * 3}px ${i % 5 === 0 ? C.orange : color}`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

export const LightBackground: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: '#ffffff', overflow: 'hidden' }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% ${30 + Math.sin(f / 50) * 4}%, #ffffff 0%, #EEF3FF 50%, #DCE6FB 100%)` }} />
      <Zellige id="z-light" color={C.blue} opacity={0.06} offset={-f * 0.5} size={180} />
    </AbsoluteFill>
  );
};

import React from 'react';
import { AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { Captions } from './components/Captions';
import { PlaneFlyover } from './components/PlaneFlyover';
import { Enter, TRANSITION_FRAMES, Wipe } from './components/Transition';
import { clamp } from './components/anim';
import { Brand } from './scenes/Brand';
import { Cta } from './scenes/Cta';
import { EndCard } from './scenes/EndCard';
import { Globe } from './scenes/Globe';
import { Graduates } from './scenes/Graduates';
import { Hook } from './scenes/Hook';
import { Languages } from './scenes/Languages';
import { Open } from './scenes/Open';
import { Practice } from './scenes/Practice';
import { Requirements } from './scenes/Requirements';
import { Trainers } from './scenes/Trainers';
import { C, DURATION, s } from './theme';

type SceneDef = { start: number; C: React.FC; wipe: Wipe; origin?: [number, number]; light?: boolean };

// Scene starts follow the voice-over beats.
const SCENES: SceneDef[] = [
  { start: 0, C: Hook, wipe: 'none' },
  { start: s(5.4), C: Brand, wipe: 'circle', light: true },
  { start: s(9.76), C: Graduates, wipe: 'circle', origin: [540, 990] },
  { start: s(13.88), C: Globe, wipe: 'zoom' },
  { start: s(19.0), C: Trainers, wipe: 'up' },
  { start: s(26.6), C: Requirements, wipe: 'diagonal' },
  { start: s(30.2), C: Languages, wipe: 'circle', origin: [540, 700] },
  { start: s(36.4), C: Practice, wipe: 'zoom' },
  { start: s(39.6), C: Open, wipe: 'circle' },
  { start: s(41.0), C: Cta, wipe: 'slide' },
  { start: s(46.0), C: EndCard, wipe: 'circle', light: true },
];

const Hud: React.FC = () => {
  const f = useCurrentFrame();
  const onLight = SCENES.some((sc, i) => sc.light && f >= sc.start && f < (SCENES[i + 1]?.start ?? DURATION));
  const intro = interpolate(f, [s(5.6), s(6.2)], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, height: 10, width: `${(f / DURATION) * 100}%`, background: `linear-gradient(90deg, ${C.orangeLight}, ${C.orange})` }} />
      <Img
        src={staticFile(onLight ? 'efh-logo.png' : 'efh-logo-white.png')}
        style={{ position: 'absolute', top: 48, left: 44, width: 300, opacity: intro * (f >= s(46) ? 0 : 1) * (onLight && f < s(9.76) ? 0 : 0.9) }}
      />
    </AbsoluteFill>
  );
};

export const EFHPromo: React.FC = () => (
  <AbsoluteFill style={{ background: C.midnight }}>
    <Audio src={staticFile('voice.mp3')} />
    {SCENES.map((sc, i) => {
      const next = SCENES[i + 1]?.start ?? DURATION;
      const dur = next - sc.start + (i < SCENES.length - 1 ? TRANSITION_FRAMES : 0);
      return (
        <Sequence key={i} from={sc.start} durationInFrames={dur} name={sc.C.name}>
          <Enter type={sc.wipe} origin={sc.origin}>
            <sc.C />
          </Enter>
        </Sequence>
      );
    })}
    <Sequence from={s(5.4) - 16} durationInFrames={40} name="Flyover 1">
      <PlaneFlyover />
    </Sequence>
    <Sequence from={s(46.0) - 16} durationInFrames={40} name="Flyover 2">
      <PlaneFlyover reverse />
    </Sequence>
    <Hud />
    <Captions />
  </AbsoluteFill>
);

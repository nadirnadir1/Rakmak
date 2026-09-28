import React from 'react';
import {AbsoluteFill, Audio, Freeze, OffthreadVideo, Sequence, staticFile} from 'remotion';
import {ACCENTS, CUTAWAYS, END_CARD_AT, END_HOLD_SEC, HOOKS, SOURCE, STING_OVERLAP_SEC, STING_SEC, TRANSITIONS} from './config';
import {f} from './lib';
import {HookStat, HookWindow, hookFrames} from './components/Hook';
import {BrandSting} from './components/BrandSting';
import {CutawayPanel} from './components/CutawayPanel';
import {LightLeak, TextAccent, Vignette, ZoomLayer} from './components/Effects';

export const timeline = (hookId: 'A' | 'B') => {
  const hook = f(HOOKS[hookId].srcEnd - HOOKS[hookId].srcStart);
  const sting = f(STING_SEC);
  const mainStart = hook + sting - f(STING_OVERLAP_SEC);
  const main = f(SOURCE.duration);
  const hold = f(END_HOLD_SEC);
  return {hook, sting, mainStart, main, hold, total: mainStart + main + hold};
};

const Sfx: React.FC<{at: number; file: string; volume: number}> = ({at, file, volume}) => (
  <Sequence from={Math.max(0, at)} layout="none">
    <Audio src={staticFile(`sfx/${file}`)} volume={volume} />
  </Sequence>
);

// The original video, graded, with camera moves, caption accents, light leaks and cutaways.
const EnhancedOriginal: React.FC = () => (
  <AbsoluteFill>
    <ZoomLayer>
      <OffthreadVideo src={staticFile(SOURCE.video)} muted />
      {ACCENTS.map((a) => (
        <Sequence key={a.at} from={f(a.at)} durationInFrames={f(a.dur)}>
          <TextAccent def={a} />
        </Sequence>
      ))}
    </ZoomLayer>
    <Vignette />
    {TRANSITIONS.map((t) => (
      <Sequence key={t} from={f(t) - 6} durationInFrames={20}>
        <LightLeak dur={20} />
      </Sequence>
    ))}
    {CUTAWAYS.map((c) => (
      <Sequence key={c.at} from={f(c.at)} durationInFrames={f(c.dur)}>
        <CutawayPanel def={c} />
      </Sequence>
    ))}
    {/* original soundtrack, untouched and continuous (voice + music) */}
    <Audio src={staticFile(SOURCE.audio)} />
    {/* sound design, kept well under the voice */}
    {CUTAWAYS.map((c) =>
      c.chained?.fromPrev ? (
        <Sfx key={`s${c.at}`} at={f(c.at)} file="tick.wav" volume={0.3} />
      ) : (
        <Sfx key={`s${c.at}`} at={f(c.at) - 4} file="whoosh.wav" volume={0.22} />
      )
    )}
    {CUTAWAYS.filter((c) => c.kind === 'cabin').map((c) => (
      <Sfx key={`c${c.at}`} at={f(c.at) + 6} file="chime.wav" volume={0.1} />
    ))}
    {ACCENTS.map((a) => (
      <Sfx key={`a${a.at}`} at={f(a.at) + 4} file="shimmer.wav" volume={0.3} />
    ))}
    {TRANSITIONS.map((t) => (
      <Sfx key={`t${t}`} at={f(t) - 8} file="whoosh.wav" volume={0.16} />
    ))}
    <Sfx at={f(END_CARD_AT)} file="brand.wav" volume={0.55} />
  </AbsoluteFill>
);

export const EnhancedReel: React.FC<{hookId: 'A' | 'B'}> = ({hookId}) => {
  const hook = HOOKS[hookId];
  const tl = timeline(hookId);
  const Hook = hook.style === 'stat' ? HookStat : HookWindow;
  return (
    <AbsoluteFill style={{backgroundColor: '#050E24'}}>
      <Sequence durationInFrames={hookFrames(hook)}>
        <Hook hook={hook} />
      </Sequence>
      <Sequence from={tl.mainStart} durationInFrames={tl.main}>
        <EnhancedOriginal />
      </Sequence>
      {/* end card hold: last frame of the original end card, camera move settled */}
      <Sequence from={tl.mainStart + tl.main} durationInFrames={tl.hold}>
        <Freeze frame={tl.main - 1}>
          <ZoomLayer hold={SOURCE.duration - 0.001}>
            <OffthreadVideo src={staticFile(SOURCE.video)} muted />
          </ZoomLayer>
          <Vignette />
        </Freeze>
      </Sequence>
      <Sequence from={tl.hook} durationInFrames={tl.sting}>
        <BrandSting dur={tl.sting} />
      </Sequence>
      <Sfx at={tl.hook - 3} file="whoosh.wav" volume={0.45} />
      <Sfx at={tl.hook + 3} file="shimmer.wav" volume={0.35} />
    </AbsoluteFill>
  );
};

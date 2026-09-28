import React from 'react';
import {AbsoluteFill, Audio, Easing, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {C, latinFont} from './theme';
import {f, lerp} from './lib';

// 8-second style preview, "premium editorial" direction:
// full-frame original footage, cinematic grade (baked in scripts/cut_segments.sh), camera moves,
// one restrained typographic signature, a light-bloom transition and hard editorial cuts.
// Upper-frame B-roll slots are marked where licensed aviation footage will be cut in.

type Shot = {src: string; from: number; dur: number; zoom: [number, number]; zoomEase?: (t: number) => number; oy?: number};

const BLACK = 6;
const SHOTS: Shot[] = [
  // Hook: the speaker's strongest line, "+90% من خريجي المدرسة…", as a flash-forward
  {src: 'seg/hook90.mov', from: BLACK, dur: 62, zoom: [1.16, 1.05], zoomEase: Easing.bezier(0.16, 1, 0.3, 1), oy: 0.5},
  // Return to the natural start of the original: "عندك ال BAC / NIVEAU BAC"
  {src: 'seg/open.mov', from: BLACK + 62, dur: 67, zoom: [1.0, 1.04], oy: 0.42},
  // "خدمو كمضيفات ومضيفي الطيران / فأكبر شركات الطيران فالعالم"
  {src: 'seg/crew.mov', from: BLACK + 62 + 67, dur: 105, zoom: [1.0, 1.04], oy: 0.45},
];
export const PREVIEW_FRAMES = BLACK + 62 + 67 + 105; // 240 = 8.0 s

const ShotLayer: React.FC<{shot: Shot}> = ({shot}) => {
  const frame = useCurrentFrame();
  const s = interpolate(frame, [0, shot.dur], shot.zoom, {easing: shot.zoomEase ?? Easing.bezier(0.33, 0, 0.67, 1), extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{transform: `scale(${s})`, transformOrigin: `50% ${(shot.oy ?? 0.5) * 100}%`}}>
      <OffthreadVideo
        src={staticFile(shot.src)}
        volume={(fr) => Math.min(lerp(fr, [0, 3], [0, 1], (t) => t), lerp(fr, [shot.dur - 3, shot.dur], [1, 0], (t) => t))}
      />
    </AbsoluteFill>
  );
};

// Exposure bloom + anamorphic streak across a cut (centred on `at`).
const LightBloom: React.FC<{at: number}> = ({at}) => {
  const frame = useCurrentFrame() - at;
  const o = interpolate(frame, [-5, 0, 6], [0, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.45, 0, 0.55, 1)});
  if (o <= 0) return null;
  const x = interpolate(frame, [-5, 6], [-30, 130]);
  return (
    <AbsoluteFill style={{mixBlendMode: 'screen', pointerEvents: 'none'}}>
      <AbsoluteFill style={{background: `rgba(220,230,255,${0.42 * o})`}} />
      <div
        style={{
          position: 'absolute',
          top: 700,
          left: `${x - 60}%`,
          width: '120%',
          height: 6,
          background: `linear-gradient(90deg, transparent, rgba(160,190,255,${o}), #fff, rgba(160,190,255,${o}), transparent)`,
          boxShadow: `0 0 60px 20px rgba(91,140,255,${0.6 * o})`,
        }}
      />
    </AbsoluteFill>
  );
};

// Brand signature: one line of widely tracked type with hairlines — nothing more.
const Signature: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [4, 26], [0, 1], {easing: Easing.bezier(0.16, 1, 0.3, 1), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const out = lerp(frame, [dur - 8, dur], [1, 0]);
  return (
    <>
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 380, opacity: p * out, background: 'linear-gradient(180deg, rgba(5,14,36,.62) 0%, rgba(5,14,36,.28) 55%, transparent 100%)'}} />
    <div
      style={{
        position: 'absolute',
        top: 150,
        left: 0,
        right: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 26,
        opacity: p * out,
        fontFamily: latinFont,
        fontWeight: 500,
        fontSize: 27,
        letterSpacing: `${0.62 - 0.2 * p}em`,
        color: C.white,
        textShadow: '0 2px 18px rgba(5,14,36,.55)',
      }}
    >
      <span style={{width: 70 * p, height: 1.5, background: 'rgba(255,255,255,.8)'}} />
      ÉCOLE FLY HYANI PRIVÉ
      <span style={{width: 70 * p, height: 1.5, background: C.orange}} />
    </div>
    </>
  );
};

// Marks where licensed aviation B-roll is cut in over the upper frame (speaker's subtitle band
// and voice stay visible/audible). Replaced by the real clip once footage is supplied.
const BrollSlot: React.FC<{id: string; brief: string; seconds: string}> = ({id, brief, seconds}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: 1040,
          background: `linear-gradient(180deg, ${C.navyDeep} 0%, #0b1d45 ${60 + Math.sin(frame / 12) * 4}%, rgba(11,29,69,0) 100%)`,
          WebkitMaskImage: 'linear-gradient(180deg, #000 88%, transparent 100%)',
          maskImage: 'linear-gradient(180deg, #000 88%, transparent 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 110,
          right: 110,
          top: 330,
          height: 360,
          border: '1.5px solid rgba(220,230,255,.35)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 18,
          fontFamily: latinFont,
          color: C.white,
        }}
      >
        <div style={{fontWeight: 700, fontSize: 30, letterSpacing: '0.4em', color: C.orange}}>{id}</div>
        <div style={{fontWeight: 500, fontSize: 40, textAlign: 'center', lineHeight: 1.25, padding: '0 40px'}}>{brief}</div>
        <div style={{fontWeight: 500, fontSize: 24, letterSpacing: '0.25em', opacity: 0.6}}>{seconds}</div>
      </div>
    </AbsoluteFill>
  );
};

const Sfx: React.FC<{at: number; file: string; volume: number}> = ({at, file, volume}) => (
  <Sequence from={at} layout="none">
    <Audio src={staticFile(`sfx/${file}`)} volume={volume} />
  </Sequence>
);

export const Preview: React.FC = () => {
  const frame = useCurrentFrame();
  const [hook, open, crew] = SHOTS;
  const fadeOut = lerp(frame, [PREVIEW_FRAMES - 8, PREVIEW_FRAMES], [0, 1]);
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      {SHOTS.map((s) => (
        <Sequence key={s.src} from={s.from} durationInFrames={s.dur}>
          <ShotLayer shot={s} />
        </Sequence>
      ))}
      {/* B-roll slot 01 over "خدمو كمضيفات ومضيفي الطيران" (source 12.10–13.75) */}
      <Sequence from={crew.from} durationInFrames={f(13.75 - 12.1)}>
        <BrollSlot id="B-ROLL 01" brief="Cabin crew walking the aisle of an airliner" seconds="1.7 S  ·  SLOW MOTION" />
      </Sequence>
      <AbsoluteFill style={{background: 'radial-gradient(120% 85% at 50% 42%, transparent 58%, rgba(0,0,0,.38) 100%)', pointerEvents: 'none'}} />
      <Sequence from={hook.from} durationInFrames={hook.dur}>
        <Signature dur={hook.dur} />
      </Sequence>
      <LightBloom at={open.from} />
      <AbsoluteFill style={{background: '#000', opacity: fadeOut}} />
      {/* restrained sound design, well under the voice */}
      <Sfx at={hook.from} file="impact.wav" volume={0.32} />
      <Sfx at={open.from - 22} file="riser.wav" volume={0.12} />
      <Sfx at={open.from - 6} file="whoosh.wav" volume={0.22} />
    </AbsoluteFill>
  );
};

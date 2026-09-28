import React from 'react';
import {AbsoluteFill, Audio, Easing, Freeze, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {C, kufiFont, plexFont} from './theme';

// Three 4.7 s hook previews for "واش كتخيل راسك هنا؟".
// 0–2.5 s: hook (original footage only: the airliner passes from the original's own transitions,
// or its first frame); 2.5 s: into the original opening with the speaker's real voice.
// On-screen question = new copy supplied by EFH; no spoken dialogue is invented.

export const HOOK = 75; // 2.5 s
const OPEN = 67; // original 0.00–2.24 s: "عندك ال BAC / عندك ال NIVEAU BAC"
export const HOOK_PREVIEW_FRAMES = HOOK + OPEN;

const expo = Easing.bezier(0.16, 1, 0.3, 1);
const smooth = Easing.bezier(0.45, 0, 0.55, 1);
const k = (frame: number, i: number[], o: number[], e = expo) =>
  interpolate(frame, i, o, {easing: e, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

const Sfx: React.FC<{at: number; file: string; volume: number | ((f: number) => number); dur?: number; startFrom?: number}> = ({
  at,
  file,
  volume,
  dur,
  startFrom,
}) => (
  <Sequence from={at} durationInFrames={dur} layout="none">
    <Audio src={staticFile(`sfx/${file}`)} volume={volume} startFrom={startFrom} />
  </Sequence>
);

// The original opening, graded, with the speaker's own voice.
const Original: React.FC = () => (
  <Sequence from={HOOK} durationInFrames={OPEN}>
    <OffthreadVideo src={staticFile('seg/open.mov')} volume={(f) => k(f, [0, 2], [0, 1], (t) => t)} />
  </Sequence>
);

// Word-by-word Arabic reveal: whole words only, so letter-joining is never broken.
const Words: React.FC<{words: string[]; start: number; gap: number; font: string; weight: number; size: number; color: string; accentLast?: string}> = ({
  words,
  start,
  gap,
  font,
  weight,
  size,
  color,
  accentLast,
}) => {
  const frame = useCurrentFrame();
  return (
    <div dir="rtl" style={{display: 'flex', justifyContent: 'center', flexWrap: 'wrap', columnGap: size * 0.26, fontFamily: font, fontWeight: weight, fontSize: size, lineHeight: 1.5}}>
      {words.map((w, i) => {
        const p = k(frame, [start + i * gap, start + i * gap + 14], [0, 1]);
        const last = i === words.length - 1;
        return (
          <span
            key={w}
            style={{
              display: 'inline-block',
              color: last && accentLast ? accentLast : color,
              opacity: p,
              filter: `blur(${(1 - p) * 8}px)`,
              transform: `translateY(${(1 - p) * size * 0.18}px)`,
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 1 · FLY-PAST — widescreen film band. The airliner crosses her in slow motion,
// the question settles in the lower bar, then the letterbox opens into the original.
// ─────────────────────────────────────────────────────────────────────────────
const BAND_TOP = 160;
const BAND_BOTTOM = 1070;

export const HookFlyPast: React.FC = () => {
  const frame = useCurrentFrame();
  const open = k(frame, [HOOK, HOOK + 12], [0, 1], Easing.bezier(0.7, 0, 0.2, 1));
  const top = BAND_TOP * (1 - open);
  const bottom = (1920 - BAND_BOTTOM) * (1 - open);
  const push = k(frame, [0, HOOK], [1.0, 1.07], (t) => t);
  const bandIn = k(frame, [0, 10], [0, 1]);
  const textOut = k(frame, [HOOK - 8, HOOK], [1, 0], smooth);
  const rule = k(frame, [44, 68], [0, 1]);
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <AbsoluteFill style={{clipPath: `inset(${top}px 0px ${bottom}px 0px)`}}>
        <Sequence durationInFrames={HOOK}>
          <AbsoluteFill style={{transform: `scale(${push})`, transformOrigin: '50% 34%', opacity: bandIn}}>
            <OffthreadVideo src={staticFile('seg/fly_slow.mov')} muted />
          </AbsoluteFill>
        </Sequence>
        <Original />
      </AbsoluteFill>
      {/* the question, in the lower bar */}
      <div style={{position: 'absolute', left: 60, right: 60, top: BAND_BOTTOM + 120, opacity: textOut}}>
        <Words words={['واش', 'كتخيل', 'راسك', 'هنا؟']} start={30} gap={6} font={plexFont} weight={300} size={100} color={C.white} />
        <div style={{margin: '26px auto 0', width: 180 * rule, height: 2, background: C.orange}} />
      </div>
      {/* brand signature in the upper bar */}
      <div
        style={{
          position: 'absolute',
          top: BAND_TOP - 88,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: 'Montserrat',
          fontWeight: 500,
          fontSize: 24,
          letterSpacing: '0.5em',
          color: 'rgba(255,255,255,.75)',
          opacity: k(frame, [12, 30], [0, 1]) * textOut,
        }}
      >
        EFH · ÉCOLE FLY HYANI PRIVÉ
      </div>
      <Sfx at={0} file="jet_flyby.wav" volume={0.85} startFrom={15} />
      <Sfx at={26} file="swell.wav" volume={(f) => 0.35 * k(f, [40, 49], [1, 0], (t) => t)} dur={52} />
      <Sfx at={HOOK - 4} file="whoosh.wav" volume={0.2} />
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 2 · LIVERY — the nose comes straight at camera, the fuselage fills the frame and
// becomes the canvas; the question is lettered on it like an airline livery.
// ─────────────────────────────────────────────────────────────────────────────
const NOSE = 29; // nose_slow.mov: source 30.12–30.36 at 1/4 speed (34 frames); starts at frame 5, once the nose covers the frame

export const HookLivery: React.FC = () => {
  const frame = useCurrentFrame();
  const push = k(frame, [0, NOSE], [1.04, 1.16], (t) => t);
  // diagonal wipe (fuselage angle) revealing the original
  const wipe = k(frame, [HOOK - 2, HOOK + 10], [0, 1], Easing.bezier(0.7, 0, 0.25, 1));
  const edge = 140 - wipe * 200; // % across
  const canvasClip = `polygon(0% 0%, ${edge}% 0%, ${edge - 35}% 100%, 0% 100%)`;
  const line1 = k(frame, [NOSE + 4, NOSE + 18], [0, 1]);
  const line2 = k(frame, [NOSE + 12, NOSE + 28], [0, 1]);
  const stripe = k(frame, [NOSE + 2, NOSE + 26], [0, 1], Easing.bezier(0.65, 0, 0.35, 1));
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <Original />
      <AbsoluteFill style={{clipPath: canvasClip}}>
        <Sequence durationInFrames={NOSE}>
          <AbsoluteFill style={{transform: `scale(${push})`, transformOrigin: '42% 40%'}}>
            <OffthreadVideo src={staticFile('seg/nose_slow.mov')} muted startFrom={5} />
          </AbsoluteFill>
        </Sequence>
        <Sequence from={NOSE} durationInFrames={HOOK - NOSE + 12}>
          {/* the real fuselage, held and defocused into a clean white canvas */}
          <AbsoluteFill style={{transform: `scale(${1.9 + (frame - NOSE) * 0.002}) rotate(-8deg)`, transformOrigin: '55% 55%', filter: 'blur(26px) brightness(1.12) saturate(0.6)'}}>
            <Freeze frame={33}>
              <OffthreadVideo src={staticFile('seg/nose_slow.mov')} muted />
            </Freeze>
          </AbsoluteFill>
          <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(255,255,255,.55) 0%, rgba(240,244,252,.25) 60%, rgba(200,210,230,.35) 100%)'}} />
        </Sequence>
        {frame >= NOSE && (
          <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
            <div dir="rtl" style={{fontFamily: kufiFont, color: C.navy, textAlign: 'center', lineHeight: 1.25, marginTop: -80}}>
              <div style={{overflow: 'hidden', paddingBottom: 10}}>
                <div style={{fontWeight: 800, fontSize: 104, transform: `translateY(${(1 - line1) * 110}%)`}}>واش كتخيل راسك</div>
              </div>
              <div style={{overflow: 'hidden', paddingBottom: 20}}>
                <div style={{fontWeight: 900, fontSize: 250, transform: `translateY(${(1 - line2) * 110}%)`}}>
                  هنا<span style={{color: C.orange}}>؟</span>
                </div>
              </div>
            </div>
            {/* livery cheatline */}
            <div style={{position: 'absolute', top: 1330, left: 0, width: `${stripe * 100}%`, height: 16, background: C.navy}} />
            <div style={{position: 'absolute', top: 1356, left: 0, width: `${stripe * 100}%`, height: 6, background: C.orange}} />
          </AbsoluteFill>
        )}
      </AbsoluteFill>
      {/* soft shadow along the wipe edge */}
      {wipe > 0 && wipe < 1 && (
        <AbsoluteFill style={{background: `linear-gradient(106deg, transparent ${edge - 22}%, rgba(0,0,0,.25) ${edge - 18}%, transparent ${edge - 12}%)`}} />
      )}
      <Sfx at={0} file="jet_approach.wav" volume={0.9} dur={NOSE} />
      <Sfx at={NOSE} file="impact.wav" volume={0.3} />
      <Sfx at={NOSE + 6} file="chime.wav" volume={0.22} />
      <Sfx at={HOOK - 5} file="whoosh.wav" volume={0.35} />
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 3 · PORTRAIT — sound-led. Cabin ambience and the PA chime over her first frame,
// held as a portrait; the question lands; the freeze releases into her first words.
// ─────────────────────────────────────────────────────────────────────────────
export const HookPortrait: React.FC = () => {
  const frame = useCurrentFrame();
  const scale = k(frame, [0, HOOK], [1.16, 1.0], smooth); // pull back to exactly the original framing
  const focus = k(frame, [0, 26], [1, 0]);
  const scrim = k(frame, [22, 40], [0, 1]) * k(frame, [HOOK - 6, HOOK + 4], [1, 0], smooth);
  const textOut = k(frame, [HOOK - 7, HOOK], [1, 0], smooth);
  const hunaP = k(frame, [50, 66], [0, 1]);
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <Sequence durationInFrames={HOOK}>
        <AbsoluteFill style={{transform: `scale(${scale})`, transformOrigin: '50% 30%', filter: `blur(${focus * 16}px) brightness(${1 + focus * 0.7})`}}>
          <Img src={staticFile('seg/frame0.png')} style={{width: 1080, height: 1920}} />
        </AbsoluteFill>
      </Sequence>
      <Original />
      <AbsoluteFill style={{opacity: scrim, background: 'linear-gradient(180deg, transparent 50%, rgba(5,14,36,.55) 68%, rgba(5,14,36,.85) 100%)'}} />
      <div style={{position: 'absolute', left: 60, right: 60, top: 1330, opacity: textOut}}>
        <Words words={['واش', 'كتخيل', 'راسك']} start={28} gap={6} font={plexFont} weight={500} size={84} color={C.white} />
        <div
          dir="rtl"
          style={{
            textAlign: 'center',
            fontFamily: plexFont,
            fontWeight: 600,
            fontSize: 190,
            lineHeight: 1.2,
            color: C.white,
            opacity: hunaP,
            filter: `blur(${(1 - hunaP) * 10}px)`,
            transform: `scale(${1.08 - 0.08 * hunaP})`,
          }}
        >
          هنا<span style={{color: C.orange}}>؟</span>
        </div>
      </div>
      <Sfx at={0} file="cabin_amb.wav" volume={(f) => 0.6 * k(f, [HOOK - 4, HOOK + 8], [1, 0], (t) => t)} dur={HOOK + 10} />
      <Sfx at={4} file="chime.wav" volume={0.4} />
      <Sfx at={48} file="swell.wav" volume={(f) => 0.3 * k(f, [18, 27], [1, 0], (t) => t)} dur={30} startFrom={40} />
    </AbsoluteFill>
  );
};

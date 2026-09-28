import React from 'react';
import {AbsoluteFill, Audio, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {HookDef, Rect, SOURCE} from '../config';
import {arabicFont, C, latinFont} from '../theme';
import {ease, easeInOut, f, lerp} from '../lib';
import {Globe} from '../graphics/Globe';

export const hookFrames = (h: HookDef) => f(h.srcEnd - h.srcStart);

// A window onto the original footage, cropped so the burned-in captions stay out of frame.
const CroppedClip: React.FC<{hook: HookDef; w: number; h: number; push: number}> = ({hook, w, h, push}) => {
  const c: Rect = hook.crop;
  const s = Math.max(w / c.w, h / c.h) * push;
  const offX = (w - c.w * s) / 2 - c.x * s;
  const offY = (h - c.h * s) / 2 - c.y * s;
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
      <OffthreadVideo
        src={staticFile(SOURCE.video)}
        startFrom={f(hook.srcStart)}
        muted
        style={{position: 'absolute', left: offX, top: offY, width: 1080 * s, height: 1920 * s, maxWidth: 'none'}}
      />
    </div>
  );
};

// Kinetic Arabic headline. Words animate as whole units so Arabic letter-joining is never broken.
const KineticArabic: React.FC<{hook: HookDef; size: number; maxWidth: number}> = ({hook, size, maxWidth}) => {
  const frame = useCurrentFrame();
  return (
    <div
      dir="rtl"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        columnGap: size * 0.28,
        rowGap: size * 0.05,
        maxWidth,
        fontFamily: arabicFont,
        fontWeight: 900,
        fontSize: size,
        lineHeight: 1.35,
      }}
    >
      {hook.words.map((wd) => {
        const t = frame - f(wd.at);
        const p = lerp(t, [0, 9], [0, 1], ease);
        const under = lerp(t, [4, 14], [0, 1], ease);
        return (
          <span
            key={wd.text}
            style={{
              position: 'relative',
              display: 'inline-block',
              color: wd.accent ? C.orange : C.white,
              opacity: p,
              transform: `translateY(${(1 - p) * size * 0.45}px) scale(${0.9 + 0.1 * p})`,
              filter: `blur(${(1 - p) * 10}px)`,
              textShadow: '0 6px 30px rgba(0,0,0,.45)',
            }}
          >
            {wd.text}
            {wd.accent && (
              <span
                style={{
                  position: 'absolute',
                  right: 0,
                  bottom: size * 0.08,
                  height: size * 0.07,
                  width: `${under * 100}%`,
                  borderRadius: size,
                  background: C.orange,
                }}
              />
            )}
          </span>
        );
      })}
    </div>
  );
};

const Kicker: React.FC<{text: string; y: number}> = ({text, y}) => {
  const frame = useCurrentFrame();
  const p = lerp(frame, [2, 14], [0, 1]);
  return (
    <div
      style={{
        position: 'absolute',
        top: y,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 18,
        fontFamily: latinFont,
        fontWeight: 700,
        fontSize: 28,
        letterSpacing: 8 + (1 - p) * 10,
        color: C.ice,
        opacity: p * 0.9,
      }}
    >
      <span style={{width: 46 * p, height: 3, background: C.orange, borderRadius: 2}} />
      {text}
      <span style={{width: 46 * p, height: 3, background: C.orange, borderRadius: 2}} />
    </div>
  );
};

const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${C.navy} 0%, ${C.navyDeep} 100%)`}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(55% 35% at ${30 + frame * 0.4}% 25%, rgba(36,81,214,.55) 0%, transparent 70%), radial-gradient(40% 30% at ${80 - frame * 0.3}% 80%, rgba(36,81,214,.35) 0%, transparent 70%)`,
        }}
      />
      {/* fine aviation-chart grid */}
      <AbsoluteFill
        style={{
          opacity: 0.1,
          backgroundImage: 'linear-gradient(rgba(220,230,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(220,230,255,1) 1px, transparent 1px)',
          backgroundSize: '90px 90px',
          backgroundPosition: `0 ${frame * 1.5}px`,
        }}
      />
    </AbsoluteFill>
  );
};

const Sfx: React.FC<{at: number; file: string; volume: number}> = ({at, file, volume}) => (
  <Sequence from={Math.max(0, at)} layout="none">
    <Audio src={staticFile(`sfx/${file}`)} volume={volume} />
  </Sequence>
);

const HookAudio: React.FC<{hook: HookDef}> = ({hook}) => {
  const n = hookFrames(hook);
  return (
    <Audio
      src={staticFile(SOURCE.audio)}
      startFrom={f(hook.srcStart)}
      endAt={f(hook.srcEnd)}
      volume={(fr) => Math.min(lerp(fr, [0, 3], [0, 1], (t) => t), lerp(fr, [n - 4, n], [1, 0], (t) => t))}
    />
  );
};

// HOOK A — "+90% من خريجي المدرسة…" stat reveal with a counting number.
export const HookStat: React.FC<{hook: HookDef}> = ({hook}) => {
  const frame = useCurrentFrame();
  const n = hookFrames(hook);
  const cardIn = lerp(frame, [0, 14], [0, 1], ease);
  const flash = lerp(frame, [0, 8], [0.9, 0], easeInOut);
  const count = Math.round(lerp(frame, [2, 20], [0, 90], easeInOut));
  const numP = lerp(frame, [1, 10], [0, 1], ease);
  const dots = frame > n - 22;
  const cw = 900;
  const ch = Math.round((cw * hook.crop.h) / hook.crop.w);
  return (
    <AbsoluteFill>
      <Backdrop />
      <Kicker text={hook.kicker} y={150} />
      <div
        style={{
          position: 'absolute',
          left: (1080 - cw) / 2,
          top: 230,
          width: cw,
          height: ch,
          borderRadius: 48,
          overflow: 'hidden',
          transform: `scale(${1.12 - 0.12 * cardIn})`,
          boxShadow: '0 40px 100px rgba(0,0,0,.55), 0 0 0 3px rgba(91,140,255,.6), 0 0 60px rgba(36,81,214,.45)',
        }}
      >
        <CroppedClip hook={hook} w={cw} h={ch} push={1 + frame * 0.0012} />
        <AbsoluteFill style={{background: 'linear-gradient(180deg, transparent 60%, rgba(5,14,36,.55) 100%)'}} />
      </div>
      <div
        style={{
          position: 'absolute',
          top: 1000,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: latinFont,
          fontWeight: 800,
          fontSize: 250,
          lineHeight: 1,
          color: C.white,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: -6,
          opacity: numP,
          transform: `scale(${1.25 - 0.25 * numP})`,
          textShadow: '0 10px 50px rgba(36,81,214,.7)',
        }}
      >
        <span style={{color: C.orange}}>+</span>
        {count}
        <span style={{color: C.royalLight}}>%</span>
      </div>
      <div style={{position: 'absolute', top: 1275, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <KineticArabic hook={hook} size={104} maxWidth={940} />
      </div>
      {dots && (
        <div style={{position: 'absolute', top: 1470, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 22}}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                background: C.orange,
                opacity: 0.35 + 0.65 * Math.abs(Math.sin((frame - i * 4) / 5)),
              }}
            />
          ))}
        </div>
      )}
      <AbsoluteFill style={{background: C.white, opacity: flash}} />
      <HookAudio hook={hook} />
      <Sfx at={0} file="impact.wav" volume={0.55} />
      {[3, 7, 11, 15, 19].map((t) => (
        <Sfx key={t} at={t} file="tick.wav" volume={0.35} />
      ))}
      <Sfx at={n - 14} file="riser.wav" volume={0.3} />
    </AbsoluteFill>
  );
};

// HOOK B — "فأكبر شركات الطيران فالعالم" seen through an aircraft window over a route globe.
export const HookWindow: React.FC<{hook: HookDef}> = ({hook}) => {
  const frame = useCurrentFrame();
  const n = hookFrames(hook);
  const ww = 680;
  const wh = 800;
  const shade = lerp(frame, [2, 14], [1, 0], easeInOut); // window blind lifts
  const winIn = lerp(frame, [0, 12], [0, 1], ease);
  return (
    <AbsoluteFill>
      <Backdrop />
      <div style={{position: 'absolute', left: 0, top: 1180, width: 1080, height: 1100, opacity: 0.9}}>
        <Globe w={1080} h={1100} dur={n + 20} hero />
      </div>
      <AbsoluteFill style={{background: `linear-gradient(180deg, transparent 55%, ${C.navyDeep} 100%)`}} />
      <Kicker text={hook.kicker} y={120} />
      {/* aircraft window: bezel + footage + blind */}
      <div
        style={{
          position: 'absolute',
          left: (1080 - ww) / 2 - 26,
          top: 190 - 26,
          width: ww + 52,
          height: wh + 52,
          borderRadius: (ww + 52) / 2,
          background: 'linear-gradient(145deg, #f4f7ff 0%, #b9c5e0 55%, #eef2fb 100%)',
          boxShadow: '0 40px 100px rgba(0,0,0,.6), inset 0 0 18px rgba(0,0,0,.35)',
          transform: `scale(${1.1 - 0.1 * winIn})`,
          opacity: winIn,
        }}
      >
        <div style={{position: 'absolute', left: 26, top: 26, width: ww, height: wh, borderRadius: ww / 2, overflow: 'hidden', boxShadow: 'inset 0 0 30px rgba(0,0,0,.6)'}}>
          <CroppedClip hook={hook} w={ww} h={wh} push={1 + frame * 0.0015} />
          <AbsoluteFill style={{background: 'linear-gradient(160deg, rgba(255,255,255,.18) 0%, transparent 35%)'}} />
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              height: `${shade * 100}%`,
              background: 'linear-gradient(180deg, #e9edf6 0%, #cfd7e8 92%, #9aa6c2 100%)',
              boxShadow: '0 6px 16px rgba(0,0,0,.35)',
            }}
          />
        </div>
      </div>
      <div style={{position: 'absolute', top: 1060, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <KineticArabic hook={hook} size={112} maxWidth={900} />
      </div>
      <HookAudio hook={hook} />
      <Sfx at={0} file="chime.wav" volume={0.35} />
      <Sfx at={0} file="impact.wav" volume={0.3} />
      <Sfx at={n - 14} file="riser.wav" volume={0.3} />
    </AbsoluteFill>
  );
};

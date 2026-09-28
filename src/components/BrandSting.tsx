import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {LOGO_FILE} from '../config';
import {C, latinFont} from '../theme';
import {ease, easeInOut, lerp} from '../lib';

// Official logo on a white pill (as in the original). Falls back to a clean placeholder slot.
export const LogoPill: React.FC<{width: number}> = ({width}) => (
  <div
    style={{
      width,
      height: width * 0.3,
      borderRadius: width * 0.15,
      background: C.white,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 20px 60px rgba(0,0,0,.35), 0 0 0 3px rgba(91,140,255,.5)',
    }}
  >
    {LOGO_FILE ? (
      <Img src={staticFile(LOGO_FILE)} style={{width: width * 0.8}} />
    ) : (
      <div
        style={{
          width: width * 0.8,
          height: width * 0.18,
          border: `3px dashed ${C.royal}`,
          borderRadius: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: latinFont,
          fontWeight: 700,
          color: C.royal,
          letterSpacing: 6,
          fontSize: width * 0.05,
        }}
      >
        EFH LOGO
      </div>
    )}
  </div>
);

// Diagonal navy wipe with an orange flight streak; reveals the original video underneath.
export const BrandSting: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const inP = lerp(frame, [0, 9], [0, 1], ease);
  const outP = lerp(frame, [dur - 9, dur], [0, 1], easeInOut);
  const logoP = lerp(frame, [3, 13], [0, 1], ease);
  // polygon sweeps in from the right, then out to the left
  const a = 130 - 160 * inP - 160 * outP;
  const poly = `polygon(${a}% 0%, ${a + 160}% 0%, ${a + 130}% 100%, ${a - 30}% 100%)`;
  const streakX = lerp(frame, [0, dur], [1200, -300], (t) => t);
  return (
    <AbsoluteFill style={{clipPath: poly}}>
      <AbsoluteFill style={{background: `linear-gradient(160deg, ${C.royal} 0%, ${C.navy} 45%, ${C.navyDeep} 100%)`}} />
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: streakX,
          width: 14,
          background: `linear-gradient(180deg, transparent, ${C.orange}, transparent)`,
          transform: 'skewX(-12deg)',
          boxShadow: `0 0 40px ${C.orange}`,
        }}
      />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <div style={{opacity: logoP * (1 - outP), transform: `scale(${0.82 + 0.18 * logoP})`}}>
          <LogoPill width={760} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

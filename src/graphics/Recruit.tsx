import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C} from '../theme';
import {lerp} from '../lib';

// Candidate profile card with checklist ticks — a neutral "recruitment / application" visual.
export const Recruit: React.FC<{w: number; h: number; dur: number}> = ({w, h}) => {
  const frame = useCurrentFrame();
  const cw = Math.min(w * 0.78, h * 0.62);
  const chh = cw * 1.1;
  const flip = lerp(frame, [0, 16], [70, 0]);
  const u = cw / 100;
  return (
    <div
      style={{
        width: w,
        height: h,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: 1400,
        background: `radial-gradient(100% 80% at 50% 30%, #102a5e 0%, ${C.navyDeep} 75%)`,
      }}
    >
      <div
        style={{
          width: cw,
          height: chh,
          borderRadius: u * 6,
          background: 'linear-gradient(160deg, #ffffff 0%, #e8eefc 100%)',
          boxShadow: '0 40px 80px rgba(0,0,0,.45)',
          transform: `rotateY(${flip}deg)`,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div style={{height: u * 26, background: `linear-gradient(90deg, ${C.navy}, ${C.royal})`, position: 'relative'}}>
          <div style={{position: 'absolute', right: 0, top: 0, bottom: 0, width: u * 3, background: C.orange}} />
        </div>
        <div
          style={{
            position: 'absolute',
            top: u * 12,
            left: u * 8,
            width: u * 26,
            height: u * 26,
            borderRadius: '50%',
            background: '#c9d6f5',
            border: `${u * 1.2}px solid white`,
            overflow: 'hidden',
          }}
        >
          <svg viewBox="0 0 100 100" width="100%" height="100%">
            <circle cx={50} cy={40} r={18} fill={C.navy} fillOpacity={0.55} />
            <path d="M16 100 Q50 52 84 100 Z" fill={C.navy} fillOpacity={0.55} />
          </svg>
        </div>
        <div style={{padding: `${u * 16}px ${u * 8}px 0`}}>
          {[0, 1, 2, 3].map((i) => {
            const t = lerp(frame, [14 + i * 7, 26 + i * 7], [0, 1]);
            return (
              <div key={i} style={{display: 'flex', alignItems: 'center', gap: u * 4, marginBottom: u * 6}}>
                <div
                  style={{
                    width: u * 9,
                    height: u * 9,
                    borderRadius: u * 2.5,
                    background: t > 0.5 ? C.royal : 'transparent',
                    border: `${u * 0.8}px solid ${C.royal}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <svg viewBox="0 0 24 24" width="80%" height="80%">
                    <path d="M5 12.5 L10 17 L19 7" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - t} />
                  </svg>
                </div>
                <div style={{flex: 1}}>
                  <div style={{height: u * 3, width: `${[78, 62, 70, 54][i]}%`, borderRadius: u, background: '#b8c6e8'}} />
                  <div style={{height: u * 2.2, width: `${[46, 38, 52, 30][i]}%`, borderRadius: u, background: '#d7e0f4', marginTop: u * 1.6}} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

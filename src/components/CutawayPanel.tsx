import React from 'react';
import {useCurrentFrame} from 'remotion';
import {CutawayDef, PANEL} from '../config';
import {C} from '../theme';
import {ease, easeInOut, f, lerp} from '../lib';
import {Globe} from '../graphics/Globe';
import {Departures} from '../graphics/Departures';
import {Cabin} from '../graphics/Cabin';
import {Safety} from '../graphics/Safety';
import {Recruit} from '../graphics/Recruit';

const GRAPHICS = {globe: Globe, departures: Departures, cabin: Cabin, safety: Safety, recruit: Recruit};

// Explanatory cutaway: a glass-edged panel that opens over the lower third while the original
// picture, captions and voice continue. Chained cutaways swap graphics inside an open panel.
export const CutawayPanel: React.FC<{def: CutawayDef}> = ({def}) => {
  const frame = useCurrentFrame();
  const dur = f(def.dur);
  const {x, y, w, h} = PANEL;
  const opens = !def.chained?.fromPrev;
  const closes = !def.chained?.toNext;
  const inP = opens ? lerp(frame, [0, 14], [0, 1], ease) : 1;
  const outP = closes ? lerp(frame, [dur - 10, dur], [0, 1], easeInOut) : 0;
  const reveal = inP * (1 - outP);
  const swapIn = opens ? 1 : lerp(frame, [0, 7], [0, 1], ease);
  const Graphic = GRAPHICS[def.kind];
  const sweep = lerp(frame, [4, 26], [-0.4, 1.4]);
  const radius = 44;

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        borderRadius: radius,
        overflow: 'hidden',
        background: C.navyDeep,
        clipPath: `inset(${(1 - reveal) * 50}% 0% ${(1 - reveal) * 50}% 0% round ${radius}px)`,
        transform: `scale(${0.94 + 0.06 * inP}) translateY(${outP * 30}px)`,
        boxShadow: '0 30px 90px rgba(0,0,0,.55)',
      }}
    >
      <div style={{position: 'absolute', inset: 0, opacity: swapIn, transform: `scale(${1.04 - 0.04 * swapIn})`}}>
        <Graphic w={w} h={h} dur={dur} />
      </div>
      {opens && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(115deg, transparent ${sweep * 100 - 12}%, rgba(255,255,255,.16) ${sweep * 100}%, transparent ${sweep * 100 + 12}%)`,
          }}
        />
      )}
      {/* hairline frame + orange tab */}
      <div style={{position: 'absolute', inset: 0, borderRadius: radius, border: '2px solid rgba(91,140,255,.55)'}} />
      <div style={{position: 'absolute', left: radius, top: 0, width: 90, height: 5, borderRadius: 3, background: C.orange}} />
    </div>
  );
};

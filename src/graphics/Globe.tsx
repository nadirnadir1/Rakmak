import React, {useMemo} from 'react';
import {useCurrentFrame} from 'remotion';
import {geoGraticule10, geoInterpolate, geoOrthographic, geoPath} from 'd3-geo';
import {feature} from 'topojson-client';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore json import
import land110 from 'world-atlas/land-110m.json';
import {C, latinFont} from '../theme';
import {lerp} from '../lib';

// Real coastline data (Natural Earth via world-atlas), orthographic projection.
const land = feature(land110 as any, (land110 as any).objects.land) as any;
const graticule = geoGraticule10();

type City = {name: string; lonlat: [number, number]; below?: boolean};
const HUB: City = {name: 'CASABLANCA', lonlat: [-7.59, 33.57]};
const DESTS: City[] = [
  {name: 'PARIS', lonlat: [2.35, 48.86]},
  {name: 'LONDON', lonlat: [-0.12, 51.5]},
  {name: 'ISTANBUL', lonlat: [28.97, 41.0]},
  {name: 'DOHA', lonlat: [51.53, 25.29], below: true},
  {name: 'DUBAI', lonlat: [55.27, 25.2]},
  {name: 'MONTRÉAL', lonlat: [-73.57, 45.5]},
];

export const Globe: React.FC<{w: number; h: number; dur: number; hero?: boolean}> = ({w, h, dur, hero}) => {
  const frame = useCurrentFrame();
  // hero: whole globe; panel: close-up on Morocco -> Europe -> Gulf that fills a wide frame
  const r = hero ? Math.min(w, h) * 0.46 : h * 1.05;
  const cyG = hero ? h / 2 + h * 0.03 : h * 0.62;
  const rot = hero ? lerp(frame, [0, dur], [18, 2]) : lerp(frame, [0, dur], [-6, -16]); // slow cinematic drift
  const projection = useMemo(
    () => geoOrthographic().scale(r).translate([w / 2, cyG]).rotate([rot, hero ? -30 : -36]).clipAngle(90),
    [r, w, cyG, rot, hero]
  );
  const path = geoPath(projection);

  const arcs = DESTS.map((d, i) => {
    const start = hero ? 8 + i * 5 : 2 + i * 3;
    const p = lerp(frame, [start, start + 22], [0, 1]);
    const interp = geoInterpolate(HUB.lonlat, d.lonlat);
    const pts: [number, number][] = [];
    const n = 48;
    for (let k = 0; k <= n * p; k++) pts.push(interp(k / n));
    const head = interp(Math.max(p, 0.001));
    const headXY = projection(head);
    const endXY = projection(d.lonlat);
    return {d, p, line: pts.length > 1 ? path({type: 'LineString', coordinates: pts}) : null, headXY, endXY, start};
  });
  const hubXY = projection(HUB.lonlat);
  const pulse = (frame % 30) / 30;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <radialGradient id="ocean" cx="40%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#15356f" />
          <stop offset="100%" stopColor={C.navyDeep} />
        </radialGradient>
        <radialGradient id="atmo" cx="50%" cy="50%" r="50%">
          <stop offset="85%" stopColor={C.royalLight} stopOpacity={0} />
          <stop offset="100%" stopColor={C.royalLight} stopOpacity={0.35} />
        </radialGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle cx={w / 2} cy={cyG} r={r * 1.06} fill="url(#atmo)" />
      <path d={path({type: 'Sphere'}) || ''} fill="url(#ocean)" />
      <path d={path(graticule) || ''} fill="none" stroke={C.royalLight} strokeOpacity={0.14} strokeWidth={1} />
      <path d={path(land) || ''} fill={C.royal} fillOpacity={0.55} stroke={C.ice} strokeOpacity={0.5} strokeWidth={1.2} />
      {arcs.map(({d, line, headXY, endXY, p}) => (
        <g key={d.name}>
          {line && <path d={line} fill="none" stroke={C.orange} strokeWidth={4} strokeLinecap="round" filter="url(#glow)" />}
          {headXY && p > 0 && p < 1 && <circle cx={headXY[0]} cy={headXY[1]} r={7} fill={C.white} filter="url(#glow)" />}
          {endXY && p >= 1 && (
            <g opacity={lerp(p, [0.9, 1], [0, 1])}>
              <circle cx={endXY[0]} cy={endXY[1]} r={8} fill={C.white} />
              <text
                x={d.below ? endXY[0] - 14 : endXY[0] + 14}
                y={d.below ? endXY[1] + 34 : endXY[1] - 12}
                textAnchor={d.below ? 'end' : 'start'}
                fill={C.white}
                fontFamily={latinFont}
                fontWeight={700}
                fontSize={hero ? Math.round(r * 0.075) : 26}
                letterSpacing={2}
              >
                {d.name}
              </text>
            </g>
          )}
        </g>
      ))}
      {hubXY && (
        <g>
          <circle cx={hubXY[0]} cy={hubXY[1]} r={10 + pulse * 30} fill="none" stroke={C.orange} strokeOpacity={1 - pulse} strokeWidth={3} />
          <circle cx={hubXY[0]} cy={hubXY[1]} r={11} fill={C.orange} />
        </g>
      )}
    </svg>
  );
};

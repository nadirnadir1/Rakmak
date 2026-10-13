import React from 'react';

// Top-down airliner silhouette, nose pointing up, centred in a 200x200 box.
export const PLANE_PATH =
  'M100 4 C108 4 111 16 111 30 L111 78 L186 118 L186 132 L111 110 L110 156 L134 174 L134 184 L104 177 L100 190 L96 177 L66 184 L66 174 L90 156 L89 110 L14 132 L14 118 L89 78 L89 30 C89 16 92 4 100 4 Z';

export const Plane: React.FC<{ size: number; color?: string; style?: React.CSSProperties; angle?: number; shadow?: boolean }> = ({
  size,
  color = '#fff',
  style,
  angle = 90,
  shadow = true,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 200 200"
    style={{ position: 'absolute', overflow: 'visible', transform: `translate(-50%, -50%) rotate(${angle}deg)`, ...style }}
  >
    {shadow && <path d={PLANE_PATH} fill="rgba(0,0,0,0.25)" transform="translate(10 14)" />}
    <path d={PLANE_PATH} fill={color} />
    <rect x={52} y={104} width={9} height={22} rx={4} fill={color} opacity={0.85} />
    <rect x={139} y={104} width={9} height={22} rx={4} fill={color} opacity={0.85} />
  </svg>
);

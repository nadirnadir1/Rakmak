import React from 'react';

export const Flag: React.FC<{ code: 'fr' | 'gb' | 'es'; size: number }> = ({ code, size }) => (
  <svg width={size} height={size} viewBox="0 0 60 60" style={{ borderRadius: '50%', boxShadow: '0 0 0 6px #fff, 0 12px 30px rgba(0,0,0,0.35)' }}>
    <defs>
      <clipPath id={`c-${code}`}>
        <circle cx={30} cy={30} r={30} />
      </clipPath>
    </defs>
    <g clipPath={`url(#c-${code})`}>
      {code === 'fr' && (
        <>
          <rect width={20} height={60} fill="#0055A4" />
          <rect x={20} width={20} height={60} fill="#fff" />
          <rect x={40} width={20} height={60} fill="#EF4135" />
        </>
      )}
      {code === 'es' && (
        <>
          <rect width={60} height={60} fill="#AA151B" />
          <rect y={15} width={60} height={30} fill="#F1BF00" />
        </>
      )}
      {code === 'gb' && (
        <>
          <rect width={60} height={60} fill="#012169" />
          <path d="M0 0 L60 60 M60 0 L0 60" stroke="#fff" strokeWidth={12} />
          <path d="M0 0 L60 60 M60 0 L0 60" stroke="#C8102E" strokeWidth={4} />
          <path d="M30 0 V60 M0 30 H60" stroke="#fff" strokeWidth={18} />
          <path d="M30 0 V60 M0 30 H60" stroke="#C8102E" strokeWidth={10} />
        </>
      )}
    </g>
  </svg>
);

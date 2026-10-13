import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { LightBackground } from '../components/Background';
import { Skyline } from '../components/Skyline';
import { WhatsAppIcon } from '../components/WhatsApp';
import { ease, pop } from '../components/anim';
import { AR, C, LAT, PHONE_1, PHONE_2, WEBSITE } from '../theme';

export const EndCard: React.FC = () => {
  const f = useCurrentFrame();
  const logo = pop(f, 2, { damping: 12, stiffness: 120 });
  const sky = ease(f, 0, 30);
  const row = (i: number) => pop(f, 14 + i * 6, { damping: 13 });
  const shine = ease(f, 20, 60, [-400, 1400]);
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <LightBackground />
      <AbsoluteFill style={{ background: `linear-gradient(180deg, transparent 55%, rgba(242,131,0,${0.28 * sky}) 100%)` }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
        <Skyline progress={sky} color={C.blue} mountain="rgba(242,131,0,0.25)" />
      </div>
      <div style={{ position: 'absolute', top: 260, left: 60, width: 960, transform: `scale(${logo})`, overflow: 'hidden' }}>
        <Img src={staticFile('efh-logo.png')} style={{ width: '100%', display: 'block' }} />
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: shine, width: 160, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)', transform: 'skewX(-20deg)' }} />
      </div>
      <div dir="rtl" style={{ position: 'absolute', top: 600, left: 0, right: 0, textAlign: 'center', fontFamily: AR, fontWeight: 900, fontSize: 62, color: C.blue, opacity: ease(f, 10, 24) }}>
        مستقبلك فالطيران <span style={{ color: C.orange }}>كيبدا هنا</span>
      </div>
      <div style={{ position: 'absolute', top: 760, left: 120, right: 120, display: 'flex', flexDirection: 'column', gap: 26 }}>
        {[PHONE_1, PHONE_2].map((n, i) => (
          <div
            key={n}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 26,
              padding: '16px 30px',
              borderRadius: 30,
              background: '#fff',
              boxShadow: '0 16px 40px rgba(0,58,156,0.15)',
              transform: `translateX(${(1 - row(i)) * 900}px)`,
            }}
          >
            <div style={{ width: 86, height: 86, borderRadius: 24, background: C.whatsapp, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <WhatsAppIcon size={58} />
            </div>
            <span style={{ fontFamily: LAT, fontWeight: 900, fontSize: 56, color: C.blue }}>{n}</span>
          </div>
        ))}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 26,
            padding: '16px 30px',
            borderRadius: 30,
            background: C.blue,
            boxShadow: '0 16px 40px rgba(0,58,156,0.3)',
            transform: `translateX(${(1 - row(2)) * 900}px)`,
          }}
        >
          <div style={{ width: 86, height: 86, borderRadius: 24, background: C.orange, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={54} height={54} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2}>
              <circle cx={12} cy={12} r={10} />
              <path d="M2 12h20M12 2c3 3.2 3 16.8 0 20M12 2c-3 3.2-3 16.8 0 20" />
            </svg>
          </div>
          <span style={{ fontFamily: LAT, fontWeight: 900, fontSize: 54, color: '#fff' }}>{WEBSITE}</span>
        </div>
        <div
          dir="rtl"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 10, transform: `scale(${row(3)})` }}
        >
          <svg width={44} height={56} viewBox="0 0 40 52">
            <path d="M20 0 C9 0 0 9 0 20 C0 35 20 52 20 52 C20 52 40 35 40 20 C40 9 31 0 20 0 Z" fill={C.orange} />
            <circle cx={20} cy={19} r={8} fill="#fff" />
          </svg>
          <span style={{ fontFamily: AR, fontWeight: 900, fontSize: 56, color: C.blue }}>مراكش</span>
          <span style={{ fontFamily: LAT, fontWeight: 800, fontSize: 36, color: C.orange, letterSpacing: 6 }}>MARRAKECH</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

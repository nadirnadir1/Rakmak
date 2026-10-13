import React from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { NavyBackground } from '../components/Background';
import { Headline } from '../components/Headline';
import { WhatsAppIcon } from '../components/WhatsApp';
import { clamp, ease, pop } from '../components/anim';
import { AR, C, LAT, PHONE_1, PHONE_2 } from '../theme';

const typed = (text: string, f: number, start: number, cps = 1.4) => text.slice(0, Math.max(0, Math.floor((f - start) * cps)));

const Field: React.FC<{ label: string; value: string; f: number; start: number; dir?: 'rtl' | 'ltr' }> = ({ label, value, f, start, dir = 'ltr' }) => {
  const v = typed(value, f, start);
  const focused = f >= start - 4 && v.length < value.length;
  return (
    <div style={{ marginBottom: 26 }}>
      <div dir="rtl" style={{ fontFamily: AR, fontWeight: 700, fontSize: 30, color: '#6B7FA8', marginBottom: 8 }}>
        {label}
      </div>
      <div
        dir={dir}
        style={{
          height: 84,
          borderRadius: 22,
          border: `3px solid ${focused ? C.orange : '#DCE3F2'}`,
          background: '#F6F8FD',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          fontFamily: dir === 'rtl' ? AR : LAT,
          fontWeight: 800,
          fontSize: 36,
          color: C.blue,
        }}
      >
        {v}
        {focused && Math.floor(f / 8) % 2 === 0 && <span style={{ width: 3, height: 40, background: C.orange, marginInline: 4 }} />}
      </div>
    </div>
  );
};

export const Cta: React.FC = () => {
  const f = useCurrentFrame();
  const phone = pop(f, 0, { damping: 14, stiffness: 100 });
  const press = f >= 66 && f < 74 ? 0.93 : 1;
  const done = pop(f, 74, { damping: 10 });
  const ripple = ease(f, 66, 90);
  const toWa = ease(f, 84, 104);
  const wa = pop(f, 88, { damping: 10, stiffness: 160 });
  const pulse = 1 + Math.sin(f / 4) * 0.03 * (f > 100 ? 1 : 0);
  const cursorX = interpolate(f, [40, 62, 100, 118], [900, 540, 540, 620], clamp);
  const cursorY = interpolate(f, [40, 62, 100, 118], [1500, 1270, 1270, 1500 - toWa * 0], clamp);
  const tap = (f >= 62 && f < 70) || (f >= 120 && f < 128);
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <NavyBackground glow="#1A5AE6" />
      <div style={{ position: 'absolute', top: 120, left: 40, right: 40 }}>
        {f < 84 ? <Headline text="عمّر *الفورمولير" size={110} delay={2} /> : <Headline text="ولا تواصل *فالواتساب" size={100} delay={84} accent={C.whatsapp} />}
      </div>
      {/* Phone */}
      <div
        style={{
          position: 'absolute',
          left: 540,
          top: 330,
          width: 600,
          height: 1100,
          marginLeft: -300,
          borderRadius: 80,
          background: '#0A0F1E',
          padding: 18,
          boxSizing: 'border-box',
          boxShadow: '0 60px 120px rgba(0,0,0,0.6), inset 0 0 0 4px #2A3554',
          transform: `perspective(2000px) translateY(${(1 - phone) * 900}px) rotateY(${(1 - phone) * 30 - toWa * 8}deg) rotateZ(${(1 - phone) * 10}deg) scale(${1 - toWa * 0.08})`,
        }}
      >
        <div style={{ width: '100%', height: '100%', borderRadius: 64, background: '#fff', overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 16, left: '50%', marginLeft: -70, width: 140, height: 36, borderRadius: 20, background: '#0A0F1E' }} />
          <div style={{ padding: '80px 44px 0' }}>
            <Img src={staticFile('efh-logo.png')} style={{ width: '100%' }} />
            <div dir="rtl" style={{ fontFamily: AR, fontWeight: 900, fontSize: 44, color: C.blue, margin: '26px 0 22px', textAlign: 'center' }}>
              سجّل دابا ✈
            </div>
            <Field label="الاسم الكامل" value="Salma El Amrani" f={f} start={10} />
            <Field label="الهاتف" value="06 •• •• •• ••" f={f} start={32} />
            <Field label="المستوى الدراسي" value="Bac" f={f} start={52} />
            <div
              style={{
                position: 'relative',
                height: 100,
                borderRadius: 50,
                marginTop: 10,
                background: done > 0.01 ? '#1BB55C' : `linear-gradient(90deg, ${C.orange}, #FF9F2E)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `scale(${press})`,
                overflow: 'hidden',
              }}
            >
              <div style={{ position: 'absolute', width: 900 * ripple, height: 900 * ripple, borderRadius: '50%', background: 'rgba(255,255,255,0.35)', opacity: 1 - ripple }} />
              <span dir="rtl" style={{ fontFamily: AR, fontWeight: 900, fontSize: 44, color: '#fff' }}>
                {done > 0.01 ? '✓ تم التسجيل' : 'إرسال'}
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* WhatsApp numbers */}
      <div style={{ position: 'absolute', top: 1080, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
        {[PHONE_1, PHONE_2].map((n, i) => {
          const p = pop(f, 90 + i * 8, { damping: 10, stiffness: 160 });
          return (
            <div
              key={n}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 22,
                padding: '18px 40px 18px 22px',
                borderRadius: 70,
                background: C.whatsapp,
                boxShadow: `0 0 0 ${8 + Math.sin(f / 5 + i) * 6}px rgba(37,211,102,0.25), 0 20px 50px rgba(0,0,0,0.4)`,
                transform: `translateY(${(1 - p) * 400}px) scale(${p * (i === 0 ? pulse : 1)})`,
                opacity: Math.min(1, p * 2) * (wa > 0 ? 1 : 0),
              }}
            >
              <div style={{ width: 84, height: 84, borderRadius: 42, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <WhatsAppIcon size={62} />
              </div>
              <span style={{ fontFamily: LAT, fontWeight: 900, fontSize: 54, color: '#fff', letterSpacing: 1, direction: 'ltr' }}>{n}</span>
            </div>
          );
        })}
      </div>
      {/* Hand cursor */}
      <div style={{ position: 'absolute', left: cursorX, top: cursorY, fontSize: 110, transform: `scale(${tap ? 0.85 : 1}) rotate(-15deg)`, opacity: f > 40 && f < 140 ? 1 : 0, filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.4))' }}>
        👆
      </div>
    </AbsoluteFill>
  );
};

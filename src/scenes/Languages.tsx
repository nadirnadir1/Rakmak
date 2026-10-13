import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { NavyBackground } from '../components/Background';
import { Flag } from '../components/Flags';
import { Headline } from '../components/Headline';
import { Plane } from '../components/Plane';
import { ease, pop, rand } from '../components/anim';
import { AR, C, LAT } from '../theme';

const BoardingPass: React.FC<{ f: number }> = ({ f }) => {
  const p = pop(f, 2, { damping: 14, stiffness: 110 });
  const tear = ease(f, 40, 60);
  const shrink = ease(f, 84, 104);
  const fld = (k: string, v: string, delay: number) => (
    <div style={{ opacity: ease(f, delay, delay + 10), transform: `translateY(${(1 - ease(f, delay, delay + 10)) * 16}px)` }}>
      <div style={{ fontFamily: LAT, fontWeight: 700, fontSize: 20, color: '#8095C0', letterSpacing: 3 }}>{k}</div>
      <div style={{ fontFamily: LAT, fontWeight: 900, fontSize: 38, color: C.blue }}>{v}</div>
    </div>
  );
  return (
    <div
      style={{
        position: 'absolute',
        left: 540,
        top: 860 - shrink * 300,
        width: 940,
        height: 420,
        transform: `translate(-50%,-50%) scale(${p * (1 - shrink * 0.42)}) rotate(${(1 - p) * -12 - 2 + shrink * 2}deg)`,
        display: 'flex',
        filter: 'drop-shadow(0 40px 60px rgba(0,0,0,0.45))',
      }}
    >
      <div style={{ flex: 1, background: '#fff', borderRadius: '36px 0 0 36px', padding: '30px 40px', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: LAT, fontWeight: 900, fontSize: 26, color: C.orange, letterSpacing: 5 }}>BOARDING PASS</span>
          <span dir="rtl" style={{ fontFamily: AR, fontWeight: 800, fontSize: 30, color: C.blue }}>
            بطاقة الركوب
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24 }}>
          <div>
            <div style={{ fontFamily: LAT, fontWeight: 900, fontSize: 92, color: C.blue, lineHeight: 1 }}>BAC</div>
            <div style={{ fontFamily: LAT, fontWeight: 600, fontSize: 22, color: '#8095C0', letterSpacing: 2 }}>DÉPART</div>
          </div>
          <div style={{ position: 'relative', flex: 1, height: 60, margin: '0 26px' }}>
            <div style={{ position: 'absolute', top: 30, left: 0, right: 0, borderTop: '4px dashed #C9D5EE' }} />
            <Plane size={70} color={C.orange} shadow={false} style={{ left: `${10 + ease(f, 10, 50) * 80}%`, top: 32 }} />
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: LAT, fontWeight: 900, fontSize: 64, color: C.orange, lineHeight: 1.2 }}>CARRIÈRE</div>
            <div style={{ fontFamily: LAT, fontWeight: 600, fontSize: 22, color: '#8095C0', letterSpacing: 2 }}>DESTINATION</div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 34 }}>
          {fld('DURÉE', '2 ANS', 18)}
          {fld('GATE', 'EFH', 24)}
          {fld('VILLE', 'RAK', 30)}
          {fld('CLASSE', 'PRO', 36)}
        </div>
      </div>
      <div
        style={{
          width: 200,
          background: `linear-gradient(180deg, ${C.orange}, #E06E00)`,
          borderRadius: '0 36px 36px 0',
          borderLeft: '6px dashed rgba(255,255,255,0.7)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `translateX(${tear * 30}px) rotate(${tear * 6}deg)`,
          transformOrigin: '0% 100%',
        }}
      >
        <span style={{ fontFamily: AR, fontWeight: 900, fontSize: 82, color: '#fff', lineHeight: 1 }}>2</span>
        <span dir="rtl" style={{ fontFamily: AR, fontWeight: 900, fontSize: 44, color: '#fff' }}>
          عامين
        </span>
        <div style={{ display: 'flex', gap: 3, marginTop: 16 }}>
          {Array.from({ length: 22 }, (_, i) => (
            <div key={i} style={{ width: rand(i) > 0.5 ? 4 : 2, height: 60, background: 'rgba(255,255,255,0.9)' }} />
          ))}
        </div>
      </div>
    </div>
  );
};

const LANGS = [
  { code: 'fr' as const, hello: 'Bonjour', ar: 'الفرنسية', at: 100, x: 250, y: 1020 },
  { code: 'gb' as const, hello: 'Hello', ar: 'الإنجليزية', at: 130, x: 540, y: 1160 },
  { code: 'es' as const, hello: '¡Hola!', ar: 'الإسبانية', at: 156, x: 830, y: 1020 },
];

export const Languages: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <NavyBackground glow="#1E62F0" />
      <div style={{ position: 'absolute', top: 220, left: 40, right: 40 }}>
        {f < 90 ? <Headline text="تكوين فـ *عامين" size={136} delay={0} /> : <Headline text="*3 لغات" size={150} delay={90} />}
      </div>
      <BoardingPass f={f} />
      {LANGS.map((l, i) => {
        const p = pop(f, l.at, { damping: 9, stiffness: 160 });
        const bob = Math.sin((f - l.at) / 10 + i) * 8;
        return (
          <div
            key={l.code}
            style={{
              position: 'absolute',
              left: l.x,
              top: l.y + bob,
              transform: `translate(-50%,-50%) scale(${p})`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <div
              style={{
                padding: '8px 30px 12px',
                borderRadius: 40,
                background: '#fff',
                fontFamily: LAT,
                fontWeight: 900,
                fontSize: 40,
                color: C.blue,
                position: 'relative',
                boxShadow: '0 14px 30px rgba(0,0,0,0.3)',
              }}
            >
              {l.hello}
              <div style={{ position: 'absolute', bottom: -14, left: '50%', marginLeft: -14, width: 0, height: 0, borderLeft: '14px solid transparent', borderRight: '14px solid transparent', borderTop: '16px solid #fff' }} />
            </div>
            <Flag code={l.code} size={150} />
            <div dir="rtl" style={{ fontFamily: AR, fontWeight: 900, fontSize: 46, color: '#fff' }}>
              {l.ar}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

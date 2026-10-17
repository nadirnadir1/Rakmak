// Scenes 4 – 7
// ======================================================================
// SCENE 4 — new airport, new faces, a different experience (10.95 – 14.9)
// ======================================================================
const s4 = scene('s4', 10.95, 14.92, '#FFF6EA');
tl.fromTo(s4, { x: -1080 }, { x: 0, duration: 0.42, ease: 'power3.inOut' }, 10.95);
tl.to(s3, { x: 1080, duration: 0.42, ease: 'power3.inOut' }, 10.95);
{
  const id = 'zp' + (_pid++);
  el(`<svg class="abs" style="left:0;top:0;opacity:.12" width="1080" height="1920"><defs>${zelligeTile(id, 140)}</defs><rect width="1080" height="1920" fill="url(#${id})"/></svg>`, s4);
  sunburstLayer(s4, 540, 800, 2600, 'rgba(255,190,120,.22)', 'rgba(255,255,255,0)', 1, 6);
  const items = [
    { y: 480, t: 11.08, text: 'مطار جديد', bg: 'linear-gradient(135deg,#38B6FF,#1E7FFF)', icon: 'plane', ic: '#1E7FFF', from: -1250 },
    { y: 810, t: 12.12, text: 'وجوه جديدة', bg: 'linear-gradient(135deg,#FF9466,#FF5F4D)', icon: 'users', ic: '#FF5F4D', from: 1250 },
    { y: 1140, t: 13.26, text: 'تجربة مختلفة', bg: 'linear-gradient(135deg,#2FD3BD,#11A493)', icon: 'star', ic: '#11A493', from: -1250 },
  ];
  items.forEach((it, i) => {
    const c = box(s4, 540, it.y, 900, 260, `<div class="rtl" style="position:absolute;left:0;top:0;width:900px;height:260px;border-radius:48px;background:${it.bg};box-shadow:0 12px 0 rgba(11,46,122,.12),0 28px 50px rgba(11,46,122,.22);overflow:hidden">
       <div style="position:absolute;left:-60px;top:-60px;width:260px;height:260px;border-radius:50%;background:rgba(255,255,255,.14)"></div>
       <div style="position:absolute;right:36px;top:40px;width:180px;height:180px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;color:${it.ic}"><div class="ico" style="width:104px;height:104px">${fit(ICON[it.icon])}</div></div>
       <div class="lal" style="position:absolute;right:250px;top:0;line-height:278px;font-size:108px;color:#fff;text-shadow:0 6px 0 rgba(0,0,0,.12);white-space:nowrap">${it.text}</div>
     </div>`);
    tl.fromTo(c, { x: it.from, rotation: it.from > 0 ? 9 : -9 }, { x: 0, rotation: 0, duration: 0.55, ease: 'back.out(1.5)' }, it.t);
    tl.fromTo(c.querySelector('.ico'), { scale: 0, rotation: -120 }, { scale: 1, rotation: 0, duration: 0.5, ease: 'back.out(3)' }, it.t + 0.22);
    confetti(s4, it.from > 0 ? 160 : 920, it.y, it.t + 0.3, 10, { vel: [400, 900] });
    floaty(c, 6, 1.8, i * 1.7);
    // extras hanging off the card's left edge
    if (i === 0) {
      const tag = box(c, 120, 30, 190, 74, `<div class="pop" style="width:190px;height:74px;border-radius:37px;background:#FFC21A;color:#0B2E7A;font-weight:900;font-size:36px;line-height:78px;text-align:center;box-shadow:0 8px 16px rgba(0,0,0,.15)">GATE A7</div>`);
      tl.fromTo(tag, { scale: 0, rotation: -30 }, { scale: 1, rotation: -8, duration: 0.4, ease: 'back.out(3)' }, it.t + 0.4);
    }
    if (i === 1) {
      [['assets/crew_f.png', 640, 420, '#FFC2D1'], ['assets/crew_m.png', 630, 380, '#FFE7A3'], [null, 0, 0, '#9FE0FF']].forEach(([src, fx_, fy, bgc], j) => {
        const inner = src ? faceCircle(src, 116, 0.2, fx_, fy) : `<div style="width:116px;height:116px;border-radius:50%;background:#59C3FF;color:#fff;display:flex;align-items:center;justify-content:center"><div style="width:70px;height:70px">${fit(ICON.users)}</div></div>`;
        const av = box(c, 70 + j * 84, 30, 128, 128, `<div style="width:128px;height:128px;border-radius:50%;background:${bgc};border:6px solid #fff;box-shadow:0 8px 16px rgba(0,0,0,.18);overflow:hidden">${inner}</div>`);
        tl.fromTo(av, { scale: 0, y: 60 }, { scale: 1, y: 0, duration: 0.4, ease: 'back.out(2.6)' }, it.t + 0.35 + j * 0.12);
      });
    }
    if (i === 2) {
      [[60, 20, 90, '#FFC21A'], [170, -10, 56, '#fff'], [130, 70, 40, '#FF7A59']].forEach(([x, y, s, col], j) => {
        const st = box(c, x, y, s, s, fit(star8(50, col)));
        tl.fromTo(st, { scale: 0 }, { scale: 1, duration: 0.4, ease: 'back.out(3)' }, it.t + 0.35 + j * 0.1);
        ambient.push(t => gsap.set(st, { rotation: t * (j % 2 ? -70 : 70) }));
      });
    }
  });
}

// ======================================================================
// SCENE 5 — this is the cabin-crew profession (14.9 – 18.95)
// ======================================================================
const s5 = scene('s5', 14.88, 18.98, 'linear-gradient(180deg,#3DB3FF 0%,#8BD8FF 50%,#E3F7FF 100%)');
{ // plane fly-by wipe
  const big = el(`<div class="abs" style="left:0;top:0;width:1500px;height:516px;visibility:hidden">
     <div class="ct" style="position:absolute;right:92%;top:38%;width:3600px;height:70px;border-radius:35px;background:linear-gradient(90deg,rgba(255,255,255,0) 0%,#fff 18%)"></div>
     <div style="position:absolute;inset:0">${fit(airplane())}</div></div>`, fx);
  tl.set(big, { visibility: 'visible' }, 14.35);
  tl.fromTo(big, { x: -1600, y: 760, rotation: -3 }, { x: 1250, y: 640, rotation: -1, duration: 0.6, ease: 'power1.in' }, 14.35);
  tl.fromTo(big.querySelector('.ct'), { scaleY: 1 }, { scaleY: 44, duration: 0.32, ease: 'power2.in' }, 14.6);
  tl.to(big, { opacity: 0, duration: 0.4, ease: 'power1.out' }, 14.95);
  tl.set(big, { visibility: 'hidden' }, 15.4);
}
{
  sunburstLayer(s5, 540, 760, 2700, 'rgba(255,255,255,.35)', 'rgba(255,255,255,0)', 1, 6);
  clouds(s5, [[160, 560, 260, 18, 0.9], [920, 1180, 220, 26, 0.85], [300, 1330, 300, 22, 0.9]]);
  const sky = skyline(s5, { kx: 975, kh: 470, p3: 60, p1: 150, p2: 920 });
  tl.fromTo(sky.g, { y: 700 }, { y: 0, duration: 0.8, ease: 'power3.out' }, 15.0);
  const af = arch(s5, { cx: 300, top: 490, Wb: 420, h: 640, img: 'assets/crew_f.png', imgW: 560, imgDy: 24, bg: 'linear-gradient(180deg,#FFE0E8 0%,#FF9FB2 100%)', tile: { star: '#FF7A59', cross: '#0A4BC4' } });
  const am = arch(s5, { cx: 780, top: 490, Wb: 420, h: 640, img: 'assets/crew_m.png', imgW: 560, imgDy: 24, bg: 'linear-gradient(180deg,#FFF0B8 0%,#FFB65A 100%)' });
  const wf = el(`<div class="abs" style="left:0;top:0"></div>`, s5); wf.appendChild(af.el);
  const wm = el(`<div class="abs" style="left:0;top:0"></div>`, s5); wm.appendChild(am.el);
  tl.fromTo(af.el, { y: 1300, rotation: -8 }, { y: 0, rotation: 0, duration: 0.8, ease: 'back.out(1.3)' }, 14.95);
  tl.fromTo(am.el, { y: 1300, rotation: 8 }, { y: 0, rotation: 0, duration: 0.8, ease: 'back.out(1.3)' }, 15.08);
  floaty(wf, 10, 1.3, 0); floaty(wm, 10, 1.3, 2.2);
  const title = box(s5, 540, 360, 1060, 190, `<div class="pop" style="text-align:center;font-weight:900;font-size:138px;line-height:190px;color:#fff;white-space:nowrap">${'CABIN CREW'.split('').map(ch => `<span class="lt" style="display:inline-block;text-shadow:0 9px 0 #0A4BC4,0 20px 30px rgba(10,75,196,.35)">${ch === ' ' ? '&nbsp;' : ch}</span>`).join('')}</div>`);
  title.querySelectorAll('.lt').forEach((l, i) => tl.fromTo(l, { y: -520, rotation: R(-50, 50), opacity: 0 }, { y: 0, rotation: 0, opacity: 1, duration: 0.5, ease: 'back.out(2)' }, 15.88 + i * 0.035));
  confetti(s5, 540, 360, 16.2, 26);
  const rib = box(s5, 540, 1250, 880, 150, `<div class="lal rtl" style="width:880px;height:150px;background:#FFC21A;color:#0B2E7A;font-size:94px;line-height:166px;text-align:center;clip-path:polygon(0 0,100% 0,95% 50%,100% 100%,0 100%,5% 50%)">طاقم الضيافة الجوية</div>`);
  tl.fromTo(rib, { clipPath: 'inset(0% 0% 0% 100%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.55, ease: 'power3.out' }, 17.0);
  tl.fromTo(rib, { scale: 0.85 }, { scale: 1, duration: 0.6, ease: 'back.out(2)' }, 17.0);
  confetti(s5, 540, 1250, 17.3, 18, { spread: [200, 340] });
  [[180, 600], [420, 560], [660, 620], [900, 580], [260, 900], [820, 940], [540, 760]].forEach(([x, y], i) => sparkle(s5, x, y, 16.6 + i * 0.22, R(46, 80), i % 2 ? '#FFC21A' : '#fff'));
}

// ======================================================================
// SCENE 6 — "is it only travel and nice photos?" … "No."  (18.55 – 22.6)
// ======================================================================
const s6 = scene('s6', 18.55, 22.62, 'radial-gradient(circle at 50% 40%, #FFEA8F 0%, #FFD03F 60%, #FFB923 100%)');
tl.fromTo(s6, { y: 1920 }, { y: 0, duration: 0.42, ease: 'power3.out' }, 18.55);
tl.to(s5, { y: -600, duration: 0.42, ease: 'power3.in' }, 18.55);
{
  el(`<div class="full" style="background-image:radial-gradient(rgba(255,255,255,.38) 20%, transparent 22%);background-size:46px 46px"></div>`, s6);
  sunburstLayer(s6, 540, 880, 2700, 'rgba(255,255,255,.22)', 'rgba(255,255,255,0)', 1, 9);
  const polK = () => `<div style="position:relative;width:100%;height:100%;background:linear-gradient(180deg,#FF9A5A,#FFD27A)">
      <div style="position:absolute;left:40px;top:120px;width:150px;height:150px;border-radius:50%;background:#FFF1A8"></div>
      <div style="position:absolute;left:190px;top:40px;width:96px;height:400px">${fit(koutoubia('#E8744A', '#F59A6A', '#C9573A'))}</div>
      <div style="position:absolute;left:10px;top:150px;width:110px;height:230px">${fit(palm(1, 0))}</div></div>`;
  const polWindow = () => `<div style="position:relative;width:100%;height:100%;background:#E7EEF8;display:flex;align-items:center;justify-content:center">
      <div style="position:relative;width:250px;height:310px;border-radius:120px;border:16px solid #fff;overflow:hidden;background:linear-gradient(180deg,#4FC0FF,#CFF1FF);box-shadow:inset 0 0 0 6px #C9D6EA">
        <div style="position:absolute;left:-40px;top:150px;width:240px">${fit(cloud(240))}</div>
        <div style="position:absolute;left:60px;top:40px;width:180px">${fit(cloud(180))}</div>
        <svg class="abs" style="left:0;top:0" width="220" height="280"><path d="M0 230 L220 170 L220 200 L0 280Z" fill="#fff"/><path d="M0 250 L220 190" stroke="#F38100" stroke-width="6"/></svg></div></div>`;
  const polPhoto = (src, bg) => `<div style="position:relative;width:100%;height:100%;background:${bg};overflow:hidden"><img src="${src}" style="position:absolute;width:420px;left:-32px;top:6px"></div>`;
  const polDunes = () => `<div style="position:relative;width:100%;height:100%;background:linear-gradient(180deg,#FFD9A0,#FFB86B)">
      <div style="position:absolute;left:200px;top:70px;width:110px;height:110px;border-radius:50%;background:#FFF1A8"></div>
      <svg class="abs" style="left:0;top:0" width="356" height="356"><path d="M0 230 Q120 150 230 230 T356 210 V356 H0Z" fill="#F7A25A"/><path d="M0 290 Q150 200 260 280 T356 270 V356 H0Z" fill="#EE8240"/><path d="M0 330 Q100 290 200 330 T356 320 V356 H0Z" fill="#E06A30"/></svg></div>`;
  const pols = [
    { x: 300, y: 640, r: -11, cap: 'مراكش ♥', inner: polK() },
    { x: 780, y: 600, r: 9, cap: 'فوق السحاب', inner: polWindow() },
    { x: 290, y: 1100, r: 8, cap: 'سيلفي ✈', inner: polPhoto('assets/crew_m.png', '#9FE0FF') },
    { x: 790, y: 1070, r: -8, cap: 'ستايل', inner: polPhoto('assets/crew_f.png', '#FFC2D1') },
    { x: 540, y: 860, r: 3, cap: 'أكافاي', inner: polDunes() },
  ];
  const pn = pols.map((p, i) => {
    const n = box(s6, p.x, p.y, 400, 480, `<div style="width:400px;height:480px;background:#fff;border-radius:10px;padding:22px;box-shadow:0 22px 40px rgba(120,60,0,.28)">
      <div style="width:356px;height:356px;overflow:hidden;border-radius:4px">${p.inner}</div>
      <div style="font-family:Marhey;font-weight:600;font-size:46px;color:#0B2E7A;text-align:center;line-height:80px;direction:rtl">${p.cap}</div></div>`);
    tl.fromTo(n, { y: -1500, rotation: p.r - 40 }, { y: 0, rotation: p.r, duration: 0.6, ease: 'back.out(1.25)' }, 18.75 + i * 0.25);
    return n;
  });
  const q = box(s6, 930, 380, 220, 300, `<div class="lal" style="font-size:300px;line-height:300px;color:#0B2E7A;text-align:center;text-shadow:0 10px 0 #fff">؟</div>`);
  tl.fromTo(q, { scale: 0, rotation: -60 }, { scale: 1, rotation: 0, duration: 0.5, ease: 'back.out(3)' }, 20.25);
  ambient.push(t => gsap.set(q.firstElementChild, { rotation: Math.sin(t * 6) * 10 }));
  const cam = box(s6, 160, 400, 190, 190, `<div style="width:190px;height:190px;border-radius:50%;background:#fff;color:#FF5F4D;display:flex;align-items:center;justify-content:center;box-shadow:0 14px 28px rgba(120,60,0,.25)"><div style="width:110px;height:110px">${fit(ICON.camera)}</div></div>`);
  tl.fromTo(cam, { scale: 0, rotation: 60 }, { scale: 1, rotation: 0, duration: 0.45, ease: 'back.out(3)' }, 20.75);
  [20.86, 21.3].forEach(t => {
    tl.fromTo(flash, { opacity: 0.85 }, { opacity: 0, duration: 0.28, ease: 'power2.out', immediateRender: false }, t);
    tl.fromTo(cam, { scale: 1.25 }, { scale: 1, duration: 0.25, immediateRender: false }, t);
  });
  for (let i = 0; i < 10; i++) {
    const hx = R(160, 920), hy = R(760, 1250), sz = R(60, 110);
    const h = box(s6, hx, hy, sz, sz, `<div style="color:${i % 2 ? '#FF4F6D' : '#FF7A59'};filter:drop-shadow(0 6px 6px rgba(0,0,0,.15))">${fit(ICON.heart)}</div>`, 'visibility:hidden');
    tl.set(h, { visibility: 'visible' }, 20.9 + i * 0.09);
    tl.fromTo(h, { scale: 0, y: 0 }, { scale: 1, y: -520, duration: 1.1, ease: 'power1.out' }, 20.9 + i * 0.09);
    tl.to(h, { opacity: 0, duration: 0.3 }, 21.7 + i * 0.09);
  }
  const like = box(s6, 760, 330, 300, 104, `<div class="pop" style="width:300px;height:104px;border-radius:52px;background:#fff;color:#FF4F6D;font-weight:900;font-size:52px;line-height:110px;text-align:center;box-shadow:0 10px 24px rgba(120,60,0,.25)">♥ 2.4K</div>`);
  tl.fromTo(like, { scale: 0 }, { scale: 1, duration: 0.4, ease: 'back.out(3)' }, 21.0);
  // "لا" slam
  const no = box(s6, 540, 860, 900, 700, `<div class="lal" style="font-size:640px;line-height:700px;text-align:center;color:#FF4F3A;text-shadow:12px 0 0 #fff,-12px 0 0 #fff,0 12px 0 #fff,0 -12px 0 #fff,9px 9px 0 #fff,-9px 9px 0 #fff,9px -9px 0 #fff,-9px -9px 0 #fff,0 34px 0 #C7321F,0 50px 60px rgba(120,20,0,.35)">لا</div>`, 'visibility:hidden');
  const ring = box(s6, 540, 880, 600, 600, `<div style="width:600px;height:600px;border-radius:50%;border:26px solid #fff"></div>`, 'visibility:hidden');
  tl.set([no, ring], { visibility: 'visible' }, 22.02);
  tl.fromTo(no, { scale: 4.5, opacity: 0, rotation: -12 }, { scale: 1, opacity: 1, rotation: 0, duration: 0.16, ease: 'power4.in' }, 22.02);
  tl.fromTo(ring, { scale: 0.3, opacity: 1 }, { scale: 2.6, opacity: 0, duration: 0.45, ease: 'power2.out' }, 22.18);
  shake(s6, 22.18, 30, 0.34);
  pn.forEach((n, i) => {
    const p = pols[i], dx = i === 4 ? 70 : p.x - 540, dy = i === 4 ? -330 : p.y - 860;
    tl.to(n, { x: dx * 4, y: dy * 4, rotation: p.r + (dx > 0 ? 140 : -140), duration: 0.5, ease: 'power3.out' }, 22.18);
  });
  tl.to([q, cam, like], { scale: 0, duration: 0.25, ease: 'back.in(2)' }, 22.18);
  tl.fromTo(flash, { opacity: 0 }, { opacity: 1, duration: 0.1, ease: 'none', immediateRender: false }, 22.48);
  tl.to(flash, { opacity: 0, duration: 0.35, ease: 'power1.out' }, 22.62);
}

// ======================================================================
// SCENE 7 — behind the elegance: discipline, communication… (22.6 – 28.75)
// ======================================================================
const s7 = scene('s7', 22.58, 28.75, 'linear-gradient(180deg,#FFFFFF 0%,#FFF2E2 100%)');
{
  sunburstLayer(s7, 540, 560, 2600, 'rgba(255,205,150,.30)', 'rgba(255,255,255,0)', 1, 5);
  ['left', 'right'].forEach((side, i) => {
    const id = 'zp' + (_pid++);
    const n = el(`<svg class="abs" style="${side}:0;top:0" width="64" height="1920"><defs>${zelligeTile(id, 64, { star: '#14B8A6', cross: '#FF7A59' })}</defs><rect width="64" height="1920" fill="url(#${id})"/><rect x="${i ? 0 : 58}" width="6" height="1920" fill="#FFC21A"/></svg>`, s7);
    tl.fromTo(n, { y: i ? 1920 : -1920 }, { y: 0, duration: 0.6, ease: 'power3.out' }, 22.6);
  });
  const a = arch(s7, { cx: 540, top: 330, Wb: 600, h: 860, img: 'assets/crew_f.png', imgW: 780, imgDy: 30, bg: 'linear-gradient(180deg,#DDF6FF 0%,#9FDCFF 100%)', tile: { star: '#14B8A6', cross: '#FF7A59' } });
  tl.fromTo(a.el, { scale: 0.3, y: 500, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: 0.6, ease: 'back.out(1.5)' }, 22.6);
  tl.fromTo(a.photo, { y: 420 }, { y: 0, duration: 0.6, ease: 'power3.out' }, 22.72);
  [[380, 560], [720, 500], [640, 760], [420, 880], [770, 930]].forEach(([x, y], i) => sparkle(s7, x, y, 23.3 + i * 0.09, R(56, 96), i % 2 ? '#FFC21A' : '#fff'));
  tl.to(a.el, { scale: 0.55, duration: 0.6, ease: 'power3.inOut', transformOrigin: '50% 0%' }, 23.92);
  const rows = [
    { t: 24.33, ck: 24.75, text: 'انضباط', icon: ICON.clock, c: '#0A4BC4' },
    { t: 25.08, ck: 25.45, text: 'تواصل', icon: ICON.chat, c: '#FF7A59' },
    { t: 25.80, ck: 26.2, text: 'مسؤولية', icon: ICON.badge, c: '#14B8A6' },
    { t: 26.88, ck: 27.8, text: 'تكوين على السلامة', icon: ICON.buoy, c: '#F38100' },
  ];
  rows.forEach((r, i) => {
    const y = 885 + i * 134;
    const n = box(s7, 540, y, 860, 118, `<div class="rtl" style="position:relative;width:860px;height:118px;border-radius:59px;background:#fff;box-shadow:0 7px 0 rgba(11,46,122,.08),0 16px 30px rgba(11,46,122,.16)">
      <div style="position:absolute;right:12px;top:12px;width:94px;height:94px;border-radius:50%;background:${r.c};color:#fff;display:flex;align-items:center;justify-content:center"><div style="width:58px;height:58px">${fit(r.icon)}</div></div>
      <div class="lal" style="position:absolute;right:132px;top:0;line-height:132px;font-size:80px;color:#0B2E7A;white-space:nowrap">${r.text}</div>
      <div class="ck" style="position:absolute;left:14px;top:14px;width:90px;height:90px;border-radius:50%;background:#22B45E;color:#fff;display:flex;align-items:center;justify-content:center"><div style="width:52px;height:52px">${fit(ICON.check)}</div></div></div>`);
    tl.fromTo(n, { x: 1000, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.4)' }, r.t);
    tl.fromTo(n.querySelector('.ck'), { scale: 0, rotation: -180 }, { scale: 1, rotation: 0, duration: 0.4, ease: 'back.out(3)' }, r.ck);
  });
}

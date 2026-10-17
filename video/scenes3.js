// Scenes 8 – 10, captions, seek()
// ======================================================================
// SCENE 8 — the best part: you too, step by step (28.3 – 33.65)
// ======================================================================
const s8 = scene('s8', 28.3, 33.66, 'linear-gradient(180deg,#6CCEFF 0%,#BEEBFF 55%,#FFF1DE 100%)');
iris(s8, 28.3, 0.5, 540, 560);
{
  sunburstLayer(s8, 540, 520, 2600, 'rgba(255,255,255,.32)', 'rgba(255,255,255,0)', 1, 7);
  clouds(s8, [[200, 760, 260, 20, 0.9], [900, 330, 200, 26, 0.85], [760, 1180, 260, 18, 0.9]]);
  const sw = box(s8, 540, 540, 600, 600, '');
  const st = el(`<div style="width:600px;height:600px">${fit(star8(50, '#FFC21A'))}</div>`, sw);
  ambient.push(t => gsap.set(st, { rotation: t * 40 }));
  tl.fromTo(sw, { scale: 0 }, { scale: 1, duration: 0.45, ease: 'back.out(2)' }, 28.42);
  const ajmal = box(s8, 540, 540, 960, 280, `<div class="lal rtl" style="text-align:center;font-size:200px;line-height:280px;color:#fff;text-shadow:0 10px 0 #0A4BC4,0 20px 34px rgba(10,75,196,.3)">والأجمل</div>`);
  tl.fromTo(ajmal, { scale: 0.3, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2.5)' }, 28.5);
  for (let i = 0; i < 6; i++) sparkle(s8, 540 + Math.cos(i) * 360, 540 + Math.sin(i * 1.7) * 260, 28.55 + i * 0.07, R(50, 90), i % 2 ? '#fff' : '#FF7A59');
  tl.to([sw, ajmal], { scale: 0, opacity: 0, duration: 0.25, ease: 'back.in(2)' }, 29.08);

  const tg = el(`<div class="abs" style="left:0;top:0;width:1080px;height:1920px"></div>`, s8);
  const hatta = box(tg, 540, 360, 600, 160, `<div class="lal rtl" style="text-align:center;font-size:118px;line-height:160px;color:#0B2E7A">حتى</div>`);
  const anta = box(tg, 540, 545, 760, 320, `<div class="lal" style="text-align:center;font-size:280px;line-height:320px;color:#FF5F4D;text-shadow:9px 0 0 #fff,-9px 0 0 #fff,0 9px 0 #fff,0 -9px 0 #fff,7px 7px 0 #fff,-7px 7px 0 #fff,7px -7px 0 #fff,-7px -7px 0 #fff,0 22px 0 #C7321F">أنت</div>`);
  const circ = box(tg, 540, 560, 680, 330, `<svg viewBox="0 0 680 330" width="100%" height="100%"><path d="M600 70 C760 150 560 320 330 312 C100 304 -20 190 90 82 C190 -12 450 -4 640 100" fill="none" stroke="#FFC21A" stroke-width="18" stroke-linecap="round"/></svg>`);
  tl.fromTo(hatta, { y: -90, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'power3.out' }, 29.22);
  tl.fromTo(anta, { scale: 0, rotation: -12 }, { scale: 1, rotation: 0, duration: 0.45, ease: 'back.out(3)' }, 29.55);
  tl.fromTo(circ.querySelector('path'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.45, ease: 'power2.inOut' }, 29.72);
  tl.to(tg, { scale: 0.62, x: -235, y: -40, transformOrigin: '540px 470px', duration: 0.6, ease: 'power3.inOut' }, 30.15);

  // aircraft + boarding stairs
  const fus = box(s8, 470 + 450, 610 + 180, 900, 360, `<svg viewBox="0 0 900 360" width="100%" height="100%">
     <rect x="0" y="10" width="1100" height="330" rx="165" fill="#fff"/>
     <path d="M0 230 H1100 V340 H160 Q60 340 20 270Z" fill="#E3ECF8"/>
     <rect x="60" y="208" width="1100" height="12" fill="#F38100"/><rect x="60" y="222" width="1100" height="12" fill="#0A4BC4"/>
     <path d="M36 120 Q60 84 104 80 L118 80 L112 124 Z" fill="#0B2E7A"/>
     ${Array.from({ length: 8 }, (_, i) => `<rect x="${330 + i * 72}" y="96" width="34" height="44" rx="16" fill="#0B2E7A" opacity=".85"/>`).join('')}
     <text x="420" y="300" font-family="Poppins" font-weight="900" font-size="64" fill="#0A4BC4">EFH</text>
     <rect class="door" x="140" y="56" width="140" height="232" rx="26" fill="#FFE27A" stroke="#C9D6EA" stroke-width="8"/>
     <rect x="160" y="76" width="100" height="70" rx="14" fill="#fff" opacity=".7"/></svg>`);
  tl.fromTo(fus, { x: 800 }, { x: 0, duration: 0.7, ease: 'power3.out' }, 29.95);
  const doorGlow = box(s8, 470 + 210, 610 + 172, 300, 360, `<div style="width:100%;height:100%;border-radius:60px;background:radial-gradient(ellipse,rgba(255,230,120,.95) 0%,rgba(255,230,120,0) 70%)"></div>`, 'opacity:0');
  // stairs
  const top = 890, x0 = 610, run = 74, rise = 72, n = 6;
  let svg = `<svg width="1080" height="1920" class="abs" style="left:0;top:0">`;
  svg += `<path d="M${x0 + 120} ${top} L${x0 - n * run} ${top + n * rise} L${x0 - n * run + 70} ${top + n * rise + 40} L${x0 + 160} ${top + 40} Z" fill="#C9D6EA"/>`;
  svg += `<line x1="${x0 + 110}" y1="${top - 90}" x2="${x0 - n * run + 10}" y2="${top + n * rise - 90}" stroke="#0B2E7A" stroke-width="12" stroke-linecap="round"/>`;
  for (let i = 0; i <= n; i++) svg += `<line x1="${x0 + 100 - i * run}" y1="${top - 90 + i * rise}" x2="${x0 + 100 - i * run}" y2="${top + i * rise}" stroke="#0B2E7A" stroke-width="7"/>`;
  svg += `<rect x="${x0 - 10}" y="${top - 12}" width="160" height="24" rx="8" fill="#fff" stroke="#C9D6EA" stroke-width="5"/>`;
  svg += `<rect x="${x0 - n * run - 40}" y="${top + n * rise + 30}" width="${n * run + 240}" height="70" rx="20" fill="#FFC21A"/>`;
  svg += `<rect x="${x0 - n * run + 260}" y="${top + n * rise - 40}" width="180" height="100" rx="18" fill="#FFC21A"/><rect x="${x0 - n * run + 280}" y="${top + n * rise - 24}" width="80" height="50" rx="10" fill="#BDEBFF"/>`;
  svg += `<circle cx="${x0 - n * run + 40}" cy="${top + n * rise + 108}" r="34" fill="#0B2E7A"/><circle cx="${x0 + 110}" cy="${top + n * rise + 108}" r="34" fill="#0B2E7A"/></svg>`;
  const stairs = el(`<div class="abs" style="left:0;top:0;width:1080px;height:1920px">${svg}</div>`, s8);
  const ground = el(`<div class="abs" style="left:0;top:${top + n * rise + 130}px;width:1080px;height:400px;background:linear-gradient(180deg,#DCE6F2,#C8D6EA)"><div style="position:absolute;left:0;top:40px;width:100%;height:12px;background:repeating-linear-gradient(90deg,#FFC21A 0 80px,transparent 80px 140px)"></div></div>`, s8);
  tl.fromTo([stairs, ground], { y: 1300 }, { y: 0, duration: 0.7, ease: 'power3.out' }, 30.05);
  const stepT = [30.6, 31.0, 31.4, 31.85, 32.41, 32.66];
  for (let i = 0; i < n; i++) {
    const k = n - 1 - i; // light from the bottom step upwards
    const sx = x0 - (k + 1) * run, sy = top + (k + 1) * rise - rise;
    const tread = el(`<div class="abs" style="left:${sx}px;top:${sy - 6}px;width:${run + 14}px;height:${rise + 6}px;border-radius:10px;background:#fff;box-shadow:inset 0 -10px 0 #DCE6F2"></div>`, stairs);
    const lit = el(`<div class="abs" style="left:${sx}px;top:${sy - 6}px;width:${run + 14}px;height:${rise + 6}px;border-radius:10px;background:#FFC21A;box-shadow:0 0 30px 8px rgba(255,194,26,.7);opacity:0"></div>`, stairs);
    const ft = box(stairs, sx + run / 2 + 6, sy + 22, 46, 46, `<div style="color:#0B2E7A;transform:rotate(${i % 2 ? 20 : -20}deg)">${fit(ICON.foot)}</div>`, 'opacity:0');
    tl.to(lit, { opacity: 1, duration: 0.15 }, stepT[i]);
    tl.fromTo(ft, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.25, ease: 'back.out(3)' }, stepT[i] + 0.05);
    tl.fromTo(tread, { y: 0 }, { y: 6, duration: 0.08, yoyo: true, repeat: 1, immediateRender: false }, stepT[i]);
  }
  tl.to(doorGlow, { opacity: 1, duration: 0.3 }, 32.85);
  tl.fromTo(fus.querySelector('.door'), { attr: { fill: '#FFE27A' } }, { attr: { fill: '#FFF6C9' }, duration: 0.3 }, 32.85);
  confetti(s8, 690, 780, 32.9, 22);
  for (let i = 0; i < 5; i++) sparkle(s8, 600 + R(-100, 200), 700 + R(-80, 200), 32.85 + i * 0.08, R(50, 80), '#FFC21A');
}

// ======================================================================
// SCENE 9 — logo reveal, Marrakech, training flight attendants (33.6 – 39.0)
// ======================================================================
{
  ['#F38100', '#FFC21A', '#59C3FF', '#FFFFFF'].forEach((c, i) => {
    const r = box(fx, 540, 960, 200, 200, `<div style="width:200px;height:200px;border-radius:50%;background:${c}"></div>`, 'visibility:hidden');
    tl.set(r, { visibility: 'visible' }, 33.02 + i * 0.08);
    tl.fromTo(r, { scale: 0 }, { scale: 24, duration: 0.55, ease: 'power2.in' }, 33.02 + i * 0.08);
    tl.set(r, { visibility: 'hidden' }, 33.68);
  });
}
const s9 = scene('s9', 33.6, 39.02, 'radial-gradient(circle at 50% 30%, #FFFFFF 0%, #FFF7EE 65%, #FFE9D0 100%)');
{
  sunburstLayer(s9, 540, 520, 2700, 'rgba(255,214,170,.32)', 'rgba(255,255,255,0)', 1, 6);
  const sky = skyline(s9, { kx: 540, kh: 700, gate: false });
  tl.fromTo(sky.g, { y: 700 }, { y: 0, duration: 0.9, ease: 'power3.out' }, 33.9);
  tl.fromTo(sky.k, { y: 800 }, { y: 0, duration: 0.9, ease: 'back.out(1.1)' }, 35.4);
  // logo built from its parts
  const k = 0.625, LX = 60, LY = 520 - 221 * k;
  const parts = { icon: [0, 431], E: [445, 195], F: [660, 190], H: [870, 205], bar: [1080, 34], text: [1115, 421] };
  const lw = el(`<div class="abs" style="left:0;top:0;width:1080px;height:1920px"></div>`, s9);
  const P = {};
  for (const [nm, [x, w]] of Object.entries(parts)) {
    P[nm] = el(`<img class="abs" src="assets/logo_blue_${nm}.png" style="left:${LX + x * k}px;top:${LY}px;width:${w * k}px;height:${442 * k}px">`, lw);
  }
  tl.fromTo(P.icon, { scale: 0, rotation: -200, opacity: 0 }, { scale: 1, rotation: 0, opacity: 1, duration: 0.95, ease: 'elastic.out(1,0.6)' }, 33.78);
  ['E', 'F', 'H'].forEach((nm, i) => {
    tl.fromTo(P[nm], { y: -700, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }, 34.0 + i * 0.1);
    tl.fromTo(P[nm], { scaleY: 1 }, { scaleY: 0.82, scaleX: 1.1, transformOrigin: '50% 100%', duration: 0.07, yoyo: true, repeat: 1, immediateRender: false }, 34.32 + i * 0.1);
  });
  tl.fromTo(P.bar, { scaleY: 0 }, { scaleY: 1, duration: 0.35, ease: 'power3.out' }, 34.38);
  tl.fromTo(P.text, { clipPath: 'inset(0% 100% 0% 0%)', x: -40 }, { clipPath: 'inset(0% 0% 0% 0%)', x: 0, duration: 0.55, ease: 'power3.out' }, 34.5);
  const shine = el(`<div class="abs" style="left:${LX}px;top:${LY}px;width:${1536 * k}px;height:${442 * k}px;-webkit-mask-image:url(assets/logo_blue.png);-webkit-mask-size:100% 100%;mask-image:url(assets/logo_blue.png);mask-size:100% 100%;overflow:hidden">
     <div class="sh" style="position:absolute;left:0;top:-50px;width:160px;height:400px;background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.85),rgba(255,255,255,0));transform:skewX(-20deg)"></div></div>`, lw);
  [35.1, 37.9].forEach(t => tl.fromTo(shine.querySelector('.sh'), { x: -300 }, { x: 1200, duration: 0.7, ease: 'power2.inOut', immediateRender: false }, t));
  gsap.set(shine.querySelector('.sh'), { x: -300 });
  floaty(lw, 6, 1.5, 0);
  confetti(s9, 540, 520, 34.6, 26);
  // Marrakech pin
  const pin = box(s9, 540, 765, 480, 124, `<div class="card rtl" style="width:480px;height:124px;border-radius:62px;display:flex;align-items:center;justify-content:center;gap:14px">
     <div style="width:62px;height:62px;color:#FF5A3C">${fit(ICON.pin)}</div>
     <div class="lal" style="font-size:78px;line-height:1;color:#0B2E7A;margin-top:12px">مراكش</div>
     <div class="lal" style="font-size:40px;background:#FFC21A;color:#0B2E7A;border-radius:18px;padding:0 16px 6px;margin-top:6px">المغرب</div></div>`);
  tl.fromTo(pin, { y: -500, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: 'bounce.out' }, 35.45);
  // training ribbon
  const rib = box(s9, 540, 905, 820, 104, `<div class="pop" style="width:820px;height:104px;background:linear-gradient(90deg,#1E78FF,#0A4BC4);color:#fff;font-weight:900;font-size:46px;letter-spacing:3px;line-height:110px;text-align:center;clip-path:polygon(0 0,100% 0,96% 50%,100% 100%,0 100%,4% 50%)">CABIN CREW TRAINING</div>`);
  tl.fromTo(rib, { clipPath: 'inset(0% 50% 0% 50%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.5, ease: 'power3.out' }, 36.0);
  // portraits
  [[300, 'assets/crew_f.png', 640, 600, '#FFC2D1', 37.0, 'مضيفة طيران', '#FF5F4D'], [780, 'assets/crew_m.png', 630, 560, '#FFE7A3', 37.38, 'مضيف طيران', '#0A4BC4']].forEach(([x, src, fx_, fy, bg, t, lab, lc], i) => {
    const pc = box(s9, x, 1110, 290, 290, `<div style="width:290px;height:290px;border-radius:50%;background:${bg};border:10px solid #fff;box-shadow:0 0 0 10px #FFC21A,0 22px 36px rgba(11,46,122,.25);overflow:hidden">${faceCircle(src, 270, 0.42, fx_, fy)}</div>`);
    tl.fromTo(pc, { scale: 0, rotation: i ? 30 : -30 }, { scale: 1, rotation: 0, duration: 0.55, ease: 'back.out(2.2)' }, t);
    floaty(pc, 8, 1.6, i * 2);
    const lb = box(s9, x, 1322, 330, 92, `<div style="text-align:center"><div class="lal pill rtl" style="display:inline-block;background:${lc};font-size:52px;line-height:80px;box-shadow:0 8px 16px rgba(11,46,122,.2)">${lab}</div></div>`);
    tl.fromTo(lb, { scale: 0, y: -40 }, { scale: 1, y: 0, duration: 0.4, ease: 'back.out(2.6)' }, t + 0.18);
    confetti(s9, x, 1110, t + 0.1, 10, { vel: [400, 800] });
  });
}

// ======================================================================
// SCENE 10 — registration open, limited seats, contact us (38.62 – 45)
// ======================================================================
const s10 = scene('s10', 38.62, 45.2, 'linear-gradient(180deg,#5CC6FF 0%,#B5E9FF 55%,#FFF0DC 100%)');
tl.fromTo(s10, { x: -1080 }, { x: 0, duration: 0.42, ease: 'power3.inOut' }, 38.62);
tl.to(s9, { x: 1080, duration: 0.42, ease: 'power3.inOut' }, 38.62);
{
  sunburstLayer(s10, 540, 800, 2700, 'rgba(255,255,255,.32)', 'rgba(255,255,255,0)', 1, 6);
  clouds(s10, [[180, 700, 260, 20, 0.9], [920, 360, 200, 26, 0.85], [820, 1350, 260, 18, 0.9]]);
  const sky = skyline(s10, { kx: 900, kh: 560 });
  // hanging "registration open" sign
  const pivot = el(`<div class="abs" style="left:540px;top:0;width:0;height:0"></div>`, s10);
  el(`<div class="abs" style="left:-300px;top:-200px;width:8px;height:540px;background:#0B2E7A;border-radius:4px"></div>`, pivot);
  el(`<div class="abs" style="left:292px;top:-200px;width:8px;height:540px;background:#0B2E7A;border-radius:4px"></div>`, pivot);
  el(`<div class="abs rtl" style="left:-420px;top:320px;width:840px;height:300px;background:#fff;border-radius:44px;border:12px solid #22B45E;box-shadow:0 26px 40px rgba(11,46,122,.22);text-align:center">
      <div class="lal" style="font-size:124px;line-height:190px;color:#16A34A">التسجيل مفتوح</div>
      <div class="pop" style="font-weight:800;font-size:36px;letter-spacing:3px;color:#0B2E7A;margin-top:-14px">INSCRIPTIONS OUVERTES</div>
      <div class="dot" style="position:absolute;left:40px;top:40px;width:40px;height:40px;border-radius:50%;background:#22B45E;box-shadow:0 0 0 10px rgba(34,180,94,.25)"></div></div>`, pivot);
  ['-300', '292'].forEach(x => el(`<div class="abs" style="left:${+x - 10}px;top:310px;width:28px;height:28px;border-radius:50%;background:#FFC21A;border:6px solid #0B2E7A"></div>`, pivot));
  tl.fromTo(pivot, { y: -900, rotation: 12 }, { y: 0, rotation: 0, duration: 1.7, ease: 'elastic.out(1,0.38)' }, 38.82);
  const dot = pivot.querySelector('.dot');
  ambient.push(t => gsap.set(dot, { scale: 1 + 0.18 * Math.abs(Math.sin(t * 4)) }));
  // limited seats map
  const seats = box(s10, 540, 1040, 780, 500, `<div class="card" style="position:relative;width:780px;height:500px;border-radius:44px"></div>`);
  const sc = seats.firstElementChild;
  const seatSvg = (a, b) => `<svg viewBox="0 0 86 86" width="86" height="86"><rect x="10" y="2" width="66" height="58" rx="18" fill="${a}"/><rect x="2" y="48" width="82" height="32" rx="14" fill="${b}"/></svg>`;
  const cells = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) {
    const x = 52 + c * 100 + (c >= 3 ? 76 : 0) - (c >= 3 ? 24 : 0), y = 70 + r * 102;
    const base = el(`<div class="abs" style="left:${x}px;top:${y}px;width:86px;height:86px">${seatSvg('#9FDCFF', '#59C3FF')}</div>`, sc);
    const occ = el(`<div class="abs" style="left:${x}px;top:${y}px;width:86px;height:86px;opacity:0">${seatSvg('#FF9A7A', '#FF5F4D')}</div>`, sc);
    cells.push({ base, occ });
  }
  el(`<div class="abs pop" style="left:366px;top:24px;width:48px;font-weight:900;font-size:26px;color:#9AA9C7;text-align:center;line-height:40px">${[1, 2, 3, 4].map(n => `<div style="height:102px;line-height:${n === 1 ? 140 : 102}px">${n}</div>`).join('')}</div>`, sc);
  const head = box(s10, 540, 790, 560, 112, `<div class="lal pill rtl" style="background:#FF5F4D;font-size:68px;line-height:96px;text-align:center;box-shadow:0 10px 20px rgba(255,95,77,.35)">الأماكن محدودة!</div>`);
  tl.fromTo(seats, { y: 1400 }, { y: 0, duration: 0.55, ease: 'back.out(1.3)' }, 40.12);
  tl.fromTo(head, { scale: 0, rotation: -10 }, { scale: 1, rotation: -3, duration: 0.45, ease: 'back.out(3)' }, 40.3);
  const order = cells.map((_, i) => i).sort(() => rnd() - 0.5);
  const free = new Set(order.slice(0, 3));
  order.slice(3).forEach((ci, j) => {
    const t = 40.45 + j * 0.04;
    tl.fromTo(cells[ci].occ, { opacity: 0, scale: 1.4 }, { opacity: 1, scale: 1, duration: 0.18, ease: 'back.out(2)' }, t);
  });
  [...free].forEach((ci, j) => {
    const ring = el(`<div class="abs" style="left:${parseFloat(cells[ci].base.style.left) - 8}px;top:${parseFloat(cells[ci].base.style.top) - 8}px;width:102px;height:102px;border-radius:24px;border:6px solid #FFC21A;opacity:0"></div>`, sc);
    tl.to(ring, { opacity: 1, duration: 0.2 }, 41.2);
    ambient.push(t => gsap.set(ring, { scale: 1 + 0.08 * Math.sin(t * 8 + j) }));
  });
  // out: sign up, seats down
  tl.to(pivot, { y: -1000, duration: 0.45, ease: 'power3.in' }, 41.36);
  tl.to([seats, head], { y: 1400, duration: 0.45, ease: 'power3.in' }, 41.36);

  // boarding pass
  const tk = box(s10, 540, 830, 940, 1000, '');
  tk.innerHTML = `<div style="position:relative;width:940px;height:1000px;filter:drop-shadow(0 30px 40px rgba(11,46,122,.28))">
   <div class="tbody" style="position:absolute;inset:0;background:#fff;border-radius:46px;overflow:hidden;
        -webkit-mask:radial-gradient(circle at 0 578px,transparent 34px,#000 35px) left/51% 100% no-repeat,radial-gradient(circle at 100% 578px,transparent 34px,#000 35px) right/51% 100% no-repeat">
     <div style="position:absolute;left:0;top:0;width:100%;height:200px;background:linear-gradient(90deg,#0A4BC4,#1E78FF)">
       <img src="assets/logo_white.png" style="position:absolute;left:30px;top:44px;width:390px">
       <div class="lal rtl" style="position:absolute;right:40px;top:26px;font-size:66px;color:#fff;white-space:nowrap">بطاقة الصعود</div>
       <div class="pop" style="position:absolute;right:40px;top:122px;font-weight:800;font-size:28px;letter-spacing:4px;color:rgba(255,255,255,.85)">BOARDING PASS</div></div>
     <div class="route" style="position:absolute;left:0;top:200px;width:100%;height:250px">
       <div style="position:absolute;right:56px;top:26px;text-align:right">
         <div class="rtl" style="font-family:Cairo;font-weight:800;font-size:32px;color:#8A9BC0">من</div>
         <div class="pop" style="font-weight:900;font-size:108px;line-height:1;color:#0B2E7A">RAK</div>
         <div class="lal rtl" style="font-size:50px;color:#FF5F4D;margin-top:2px">مراكش</div></div>
       <div style="position:absolute;left:56px;top:26px;text-align:left">
         <div class="rtl" style="font-family:Cairo;font-weight:800;font-size:32px;color:#8A9BC0;text-align:left">إلى</div>
         <div style="width:108px;height:108px;color:#0B2E7A">${fit(ICON.globe)}</div>
         <div class="lal rtl" style="font-size:50px;color:#FF5F4D;margin-top:2px;text-align:left">العالم</div></div>
       <div style="position:absolute;left:260px;top:124px;width:420px;height:0;border-top:7px dashed #BFD0EA"></div>
       <div class="tplane" style="position:absolute;left:440px;top:92px;width:64px;height:64px;color:#F38100;transform:rotate(-90deg)">${fit(ICON.plane)}</div></div>
     <div style="position:absolute;left:0;top:450px;width:100%;height:100px;display:flex;justify-content:space-around;align-items:center;font-family:Poppins">
       ${[['FLIGHT', 'EFH01'], ['GATE', 'A1'], ['SEAT', '1A'], ['CLASS', 'CREW']].map(([a, b]) => `<div style="text-align:center"><div style="font-weight:700;font-size:24px;letter-spacing:2px;color:#8A9BC0">${a}</div><div style="font-weight:900;font-size:44px;color:#0B2E7A;line-height:1.1">${b}</div></div>`).join('')}</div>
     <div style="position:absolute;left:50px;top:575px;width:840px;border-top:7px dashed #D5DFEE"></div>
     <div class="contact" style="position:absolute;left:0;top:610px;width:100%;height:380px"></div>
     <div class="shine" style="position:absolute;left:0;top:-100px;width:200px;height:1300px;background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.75),rgba(255,255,255,0));transform:skewX(-18deg)"></div>
   </div></div>`;
  const ct = tk.querySelector('.contact');
  const rowsC = [['phone', '+212 777 771 314', '#0B2E7A'], ['phone', '+212 777 771 712', '#0B2E7A'], ['globe', 'www.flyhyani.ma', '#0A4BC4']];
  rowsC.forEach(([ic, txt, col], i) => {
    const r = el(`<div class="abs" style="left:96px;top:${22 + i * 118}px;height:100px;display:flex;align-items:center;gap:30px">
       <div class="ic" style="width:96px;height:96px;border-radius:50%;background:#FFC21A;color:#0B2E7A;display:flex;align-items:center;justify-content:center;flex:none"><div style="width:56px;height:56px">${fit(ICON[ic])}</div></div>
       <div class="pop" style="font-weight:800;font-size:${i === 2 ? 66 : 64}px;color:${col};direction:ltr;white-space:nowrap;line-height:1">${txt}</div></div>`, ct);
    tl.fromTo(r, { x: -120, opacity: 0 }, { x: 0, opacity: 1, duration: 0.45, ease: 'back.out(2)' }, 41.95 + i * 0.22);
    const icn = r.querySelector('.ic');
    ambient.push(t => gsap.set(icn, { rotation: t > 43 ? Math.sin(t * 9 + i) * 8 * Math.max(0, Math.sin(t * 1.6 + i)) : 0 }));
  });
  tl.fromTo(tk, { y: 1900, rotation: 10 }, { y: 0, rotation: 0, duration: 0.75, ease: 'back.out(1.15)' }, 41.5);
  const tp = tk.querySelector('.tplane');
  ambient.push(t => gsap.set(tp, { x: Math.sin(t * 1.8) * 150 }));
  const sh = tk.querySelector('.shine');
  gsap.set(sh, { x: -400 });
  [43.35, 44.35].forEach(t => tl.fromTo(sh, { x: -400 }, { x: 1300, duration: 0.8, ease: 'power2.inOut', immediateRender: false }, t));
  confetti(s10, 540, 380, 42.15, 26);
  // call to action
  const cta = box(s10, 540, 1462, 600, 140, `<div class="lal rtl" style="width:600px;height:140px;border-radius:70px;background:linear-gradient(180deg,#FFD23F,#FFB300);color:#0B2E7A;font-size:86px;line-height:150px;text-align:center;box-shadow:0 10px 0 #E08E00,0 22px 40px rgba(224,142,0,.4)">سجّل دابا!</div>`);
  tl.fromTo(cta, { scale: 0, rotation: -8 }, { scale: 1, rotation: 0, duration: 0.5, ease: 'back.out(2.6)' }, 43.2);
  ambient.push(t => gsap.set(cta.firstElementChild, { scale: t > 43.7 ? 1 + 0.045 * Math.sin((t - 43.7) * 6) : 1 }));
  const hand = box(s10, 800, 1530, 120, 120, `<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#fff" stroke="#0B2E7A" stroke-width="1.2" d="M9 11V4.5a1.5 1.5 0 0 1 3 0V10l.1-1.4a1.5 1.5 0 0 1 3 .2v1.5a1.5 1.5 0 0 1 3 .3V12a1.5 1.5 0 0 1 3 .3V16c0 3.3-2.7 6-6 6h-1.6c-1.8 0-3.4-.8-4.5-2.2L4.4 15a1.6 1.6 0 0 1 2.4-2.1L9 15z"/></svg>`);
  tl.fromTo(hand, { scale: 0, x: 80, y: 80 }, { scale: 1, x: 0, y: 0, duration: 0.4, ease: 'back.out(2)' }, 43.55);
  ambient.push(t => gsap.set(hand.firstElementChild, { y: t > 44 ? -Math.abs(Math.sin((t - 44) * 4)) * 18 : 0 }));
}

// ======================================================================
// CAPTIONS (word-synced Arabic)
// ======================================================================
function buildCaptions() {
  const capLayer = el(`<div id="caps"></div>`);
  CAPTIONS.forEach((ln, i) => {
    const c = el(`<div class="cap"></div>`, capLayer);
    const hl = el(`<div class="hl"></div>`, c);
    const spans = ln.words.map(w => { const s = document.createElement('span'); s.className = 'w'; s.textContent = w.w; return s; });
    spans.forEach((s, j) => { c.appendChild(s); if (j < spans.length - 1) c.appendChild(document.createTextNode(' ')); });
    let fs = 70;
    while (c.offsetWidth > 990 && fs > 40) { fs -= 2; c.style.fontSize = fs + 'px'; }
    gsap.set(c, { xPercent: -50, yPercent: -50 });
    const pos = spans.map(s => ({ x: s.offsetLeft, w: s.offsetWidth }));
    const tIn = Math.max(0, ln.s - 0.06), tOut = ln.out - 0.12;
    tl.fromTo(c, { autoAlpha: 0, scale: 0.6, y: 40, rotation: i % 2 ? 2 : -2 }, { autoAlpha: 1, scale: 1, y: 0, rotation: 0, duration: 0.28, ease: 'back.out(2.2)' }, tIn);
    tl.to(c, { autoAlpha: 0, scale: 0.9, y: -16, duration: 0.12, ease: 'power2.in' }, tOut);
    gsap.set(hl, { x: pos[0].x, width: pos[0].w, scaleX: 0 });
    ln.words.forEach((w, j) => {
      const t = Math.max(tIn, w.s - 0.03);
      if (j === 0) tl.fromTo(hl, { x: pos[0].x, width: pos[0].w, scaleX: 0 }, { scaleX: 1, duration: 0.15, ease: 'back.out(2)' }, t);
      else tl.to(hl, { x: pos[j].x, width: pos[j].w, duration: 0.14, ease: 'power2.out' }, t);
      tl.to(spans[j], { opacity: 1, duration: 0.08 }, t);
      tl.fromTo(spans[j], { scale: 1 }, { scale: 1.1, duration: 0.1, yoyo: true, repeat: 1, ease: 'power1.out', immediateRender: false }, t);
    });
  });
}

// ======================================================================
// boot
// ======================================================================
window.seek = function (t) {
  tl.seek(t, false);
  for (const f of ambient) f(t);
};
(async () => {
  const fams = ['70px Cairo', '900 70px Cairo', '80px Lalezar', '700 40px "Reem Kufi"', '600 40px Marhey', '700 40px Poppins', '800 40px Poppins', '900 40px Poppins'];
  await Promise.all(fams.map(f => document.fonts.load(f, 'abc أبج')));
  await document.fonts.ready;
  const srcs = ['assets/crew_m.png', 'assets/crew_f.png', 'assets/logo_blue.png', 'assets/logo_white.png'];
  await Promise.all(srcs.map(src => new Promise(r => { const im = new Image(); im.onload = im.onerror = r; im.src = src; })));
  await Promise.all([...document.images].map(i => i.decode().catch(() => { })));
  buildCaptions();
  window.seek(0);
  window.__ready = true;
  if (!location.search.includes('render')) {
    const au = new Audio('assets/mix.wav');
    document.body.addEventListener('click', () => { au.currentTime = 0; au.play(); });
    const loop = () => { if (!au.paused) window.seek(au.currentTime); requestAnimationFrame(loop); };
    loop();
  }
})();

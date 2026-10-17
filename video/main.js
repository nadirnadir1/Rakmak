/* EFH – École Fly Hyani Privé · Marrakech spot (1080x1920, 45 s)
   Every frame is a pure function of time: window.seek(t) renders it. */
gsap.registerPlugin(MotionPathPlugin, DrawSVGPlugin, Physics2DPlugin, CustomEase);

const W = 1080, H = 1920, DURATION = 45.0;
window.DURATION = DURATION;
const stage = document.getElementById('stage');
const tl = gsap.timeline({ paused: true });
const ambient = [];

// seeded random so every render worker draws identical frames
let _s = 20261017;
function rnd() { _s |= 0; _s = (_s + 0x6D2B79F5) | 0; let t = Math.imul(_s ^ (_s >>> 15), 1 | _s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
const R = (a, b) => a + rnd() * (b - a);
const PAL = ['#FFC21A', '#FF7A59', '#14B8A6', '#0A4BC4', '#F38100', '#FF8FA3', '#59C3FF'];

function el(html, parent = stage) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  const n = t.content.firstElementChild;
  parent.appendChild(n);
  return n;
}
function box(parent, x, y, w, h, inner = '', style = '', cls = '') {
  const n = el(`<div class="abs ${cls}" style="left:${x - w / 2}px;top:${y - h / 2}px;width:${w}px;height:${h}px;${style}">${inner}</div>`, parent);
  return n;
}
function fit(svg) { return svg.replace('<svg ', '<svg width="100%" height="100%" '); }
function scene(id, tIn, tOut, bg) {
  const s = el(`<div class="scene" id="${id}" style="background:${bg}"></div>`);
  tl.set(s, { visibility: 'visible' }, tIn);
  tl.set(s, { visibility: 'hidden' }, tOut);
  return s;
}
function sunburstLayer(parent, x, y, size, a, b, op = 1, speed = 6) {
  const n = box(parent, x, y, size, size, fit(sunburst(28, a, b)), `opacity:${op}`);
  ambient.push(t => gsap.set(n, { rotation: t * speed }));
  return n;
}
function clouds(parent, list) {
  return list.map(([x, y, w, sp, op]) => {
    const n = box(parent, x, y, w, w * 0.45, fit(cloud(w)), `opacity:${op || 1}`);
    ambient.push(t => gsap.set(n, { x: (((x + t * sp + 400) % 1880) - 400) - x }));
    return n;
  });
}
function floaty(n, amp = 12, sp = 1.6, ph = 0, rot = 0) {
  ambient.push(t => gsap.set(n, { y: Math.sin(t * sp + ph) * amp, rotation: rot ? Math.sin(t * sp * 0.8 + ph) * rot : 0 }));
}
function starPoly(cx, cy, r, inner = 0.74) {
  const p = [];
  for (let i = 0; i < 16; i++) {
    const a = i * Math.PI / 8 - Math.PI / 2, rr = i % 2 ? r * inner : r;
    p.push(`${(cx + Math.cos(a) * rr).toFixed(1)}px ${(cy + Math.sin(a) * rr).toFixed(1)}px`);
  }
  return `polygon(${p.join(',')})`;
}
function iris(sc, t, dur = 0.6, cx = 540, cy = 960) {
  tl.fromTo(sc, { clipPath: starPoly(cx, cy, 1) }, { clipPath: starPoly(cx, cy, 1900), duration: dur, ease: 'power2.in' }, t);
}
function shake(n, t, amt = 22, dur = 0.32) {
  const k = [];
  const steps = Math.round(dur / 0.04);
  for (let i = 0; i < steps; i++) {
    const f = 1 - i / steps;
    k.push({ x: R(-amt, amt) * f, y: R(-amt, amt) * f, rotation: R(-1.2, 1.2) * f, duration: 0.04 });
  }
  k.push({ x: 0, y: 0, rotation: 0, duration: 0.04 });
  tl.to(n, { keyframes: k, ease: 'none' }, t);
}
function confetti(parent, x, y, t, n = 22, o = {}) {
  const spread = o.spread || [0, 360], vel = o.vel || [500, 1100], grav = o.grav ?? 1500;
  for (let i = 0; i < n; i++) {
    const s = R(16, 38), c = PAL[i % PAL.length];
    const kind = i % 3;
    const inner = kind === 0 ? fit(star8(50, c)) :
      kind === 1 ? `<div style="width:100%;height:100%;border-radius:50%;background:${c}"></div>` :
        `<div style="width:100%;height:60%;margin-top:20%;border-radius:4px;background:${c}"></div>`;
    const p = box(parent, x, y, s, s, inner, 'visibility:hidden');
    tl.set(p, { visibility: 'visible' }, t);
    tl.to(p, { physics2D: { velocity: R(vel[0], vel[1]), angle: R(spread[0], spread[1]), gravity: grav }, rotation: R(-540, 540), duration: R(1.1, 1.7), ease: 'none' }, t);
    tl.to(p, { opacity: 0, duration: 0.35 }, t + R(0.75, 1.3));
  }
}
function sparkle(parent, x, y, t, size = 70, color = '#FFFFFF') {
  const s = box(parent, x, y, size, size, `<svg viewBox="-50 -50 100 100" width="100%" height="100%"><path d="M0 -50 Q6 -6 50 0 Q6 6 0 50 Q-6 6 -50 0 Q-6 -6 0 -50Z" fill="${color}"/></svg>`, 'visibility:hidden');
  tl.set(s, { visibility: 'visible' }, t);
  tl.fromTo(s, { scale: 0, rotation: -45 }, { scale: 1, rotation: 45, duration: 0.25, ease: 'back.out(3)' }, t);
  tl.to(s, { scale: 0, rotation: 120, duration: 0.3, ease: 'power2.in' }, t + 0.35);
  return s;
}
function faceCircle(src, size, scale, fx, fy) { // fx,fy = point in the 1254px photo to centre
  const bs = 1254 * scale;
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:url(${src}) no-repeat;background-size:${bs}px ${bs}px;background-position:${size / 2 - fx * scale}px ${size / 2 - fy * scale}px"></div>`;
}

// ---------- horseshoe arch with zellige frame ----------
let _pid = 0;
function archD(Wb, h, d) {
  const r = Wb / 2, yc = r + Math.sqrt(r * r - (r - d) * (r - d));
  return `M${d} ${h} L${d} ${yc.toFixed(1)} A${r} ${r} 0 1 1 ${Wb - d} ${yc.toFixed(1)} L${Wb - d} ${h} Z`;
}
function arch(parent, o) {
  const { cx, top, Wb, h, img, imgW, bg, band = 30 } = o;
  const d = Wb * 0.07, id = 'zp' + (_pid++);
  const outer = archD(Wb + band * 2, h + band, d);
  const inner = archD(Wb, h, d);
  const a = el(`<div class="abs" style="left:${cx - Wb / 2}px;top:${top}px;width:${Wb}px;height:${h}px;filter:drop-shadow(0 26px 26px rgba(11,46,122,.28))">
    <svg class="abs" style="left:${-band}px;top:${-band}px" width="${Wb + band * 2}" height="${h + band}">
      <defs>${zelligeTile(id, 64, o.tile || {})}</defs>
      <path d="${outer}" fill="url(#${id})" stroke="#FFC21A" stroke-width="10"/>
    </svg>
    <div class="abs inner" style="left:0;top:0;width:${Wb}px;height:${h}px;clip-path:path('${inner}');background:${bg}">
      <div class="abs ib" style="left:${Wb / 2 - 900}px;top:${h * 0.35 - 900}px;width:1800px;height:1800px;opacity:.55">${fit(sunburst(20, 'rgba(255,255,255,.55)', 'rgba(255,255,255,0)'))}</div>
      <img class="abs photo" src="${img}" style="width:${imgW}px;left:${(Wb - imgW) / 2}px;top:${h - imgW + (o.imgDy || 0)}px">
    </div>
    <svg class="abs" style="left:0;top:0" width="${Wb}" height="${h}"><path d="${inner}" fill="none" stroke="#fff" stroke-width="9"/></svg>
  </div>`, parent);
  const ib = a.querySelector('.ib');
  ambient.push(t => gsap.set(ib, { rotation: t * 10 }));
  return { el: a, photo: a.querySelector('.photo') };
}

// ---------- Marrakech skyline ----------
function skyline(parent, o = {}) {
  const kx = o.kx ?? 850, kh = o.kh ?? 640, base = o.base ?? 1800;
  const g = el(`<div class="abs" style="left:0;top:0;width:1080px;height:1920px;pointer-events:none"></div>`, parent);
  // distant medina
  let med = `<svg viewBox="0 0 1080 300" width="1080" height="300">`;
  let x = -20; const rr = () => R(0, 1);
  while (x < 1100) {
    const w = 60 + rr() * 90, hh = 70 + rr() * 120;
    med += `<rect x="${x}" y="${300 - hh}" width="${w}" height="${hh}" fill="#F9BE93"/>`;
    if (rr() > 0.6) med += `<circle cx="${x + w / 2}" cy="${300 - hh}" r="${w * 0.28}" fill="#F9BE93"/>`;
    if (rr() > 0.7) med += `<rect x="${x + w * 0.3}" y="${300 - hh - 60}" width="${w * 0.25}" height="60" fill="#F9BE93"/>`;
    x += w + 4;
  }
  med += '</svg>';
  const medina = el(`<div class="abs" style="left:0;top:${base - 300 - 40}px;width:1080px;height:300px">${med}</div>`, g);
  const k = el(`<div class="abs" style="left:${kx - kh * 0.12}px;top:${base - kh}px;width:${kh * 0.24}px;height:${kh}px">${fit(koutoubia())}</div>`, g);
  const palms = [[o.p1 ?? 80, 470, -1], [o.p2 ?? 215, 380, 1], [o.p3 ?? 1010, 430, -1]].map(([px, ph, lean], i) => {
    const p = el(`<div class="abs" style="left:${px - ph * 0.25}px;top:${base - ph + 10}px;width:${ph * 0.5}px;height:${ph}px">${fit(palm(lean, i % 2))}</div>`, g);
    const crown = p.querySelector('.crown');
    ambient.push(t => gsap.set(crown, { rotation: Math.sin(t * 1.4 + i * 2) * 3.5 }));
    return p;
  });
  const wall = el(`<div class="abs" style="left:0;top:${base - 150}px;width:1080px;height:${1920 - base + 150}px">${ramparts(1080, 1920 - base + 150, '#EA7E4E', '#F59A6A', '#D2643A', o.gate !== false).replace('<svg ', '<svg width="1080" height="' + (1920 - base + 150) + '" ')}</div>`, g);
  return { g, k, palms, wall, medina };
}

// ======================================================================
// GLOBAL LAYERS
// ======================================================================
const fx = el(`<div id="fx" class="full"></div>`);
const flash = el(`<div id="flash" class="full"></div>`);

// logo bug (top)
const bug = el(`<div id="bug" class="abs" style="left:${540 - 175}px;top:150px;width:350px;height:104px;background:#fff;border-radius:52px;box-shadow:0 8px 0 rgba(11,46,122,.08),0 14px 30px rgba(11,46,122,.18);visibility:hidden">
  <img src="assets/logo_blue.png" style="position:absolute;left:28px;top:12px;width:294px"></div>`);
tl.set(bug, { visibility: 'visible' }, 0.35);
tl.fromTo(bug, { y: -220, scale: 0.6 }, { y: 0, scale: 1, duration: 0.6, ease: 'back.out(1.8)' }, 0.35);
tl.to(bug, { y: -340, duration: 0.4, ease: 'power3.in' }, 33.05);

// ======================================================================
// SCENE 1 — saving for months to travel one week  (0 – 3.72)
// ======================================================================
const s1 = scene('s1', 0, 3.72, 'radial-gradient(circle at 50% 38%, #FFFDF8 0%, #FFEBD2 55%, #FFD7AE 100%)');
{
  const sb = sunburstLayer(s1, 540, 760, 2700, '#FFE2BC', '#FFF4E3', 1, 8);
  tl.fromTo(sb, { scale: 0.2, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.7, ease: 'power3.out' }, 0);
  // floating decorative stars
  [[110, 470, 70, '#FFC21A'], [980, 420, 56, '#14B8A6'], [120, 1240, 50, '#FF7A59'], [960, 1260, 74, '#0A4BC4'], [930, 880, 36, '#F38100'], [150, 860, 40, '#59C3FF']].forEach(([x, y, s, c], i) => {
    const n = box(s1, x, y, s, s, fit(star8(50, c)));
    tl.fromTo(n, { scale: 0 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' }, 0.15 + i * 0.07);
    ambient.push(t => gsap.set(n, { rotation: t * (i % 2 ? 40 : -40), y: Math.sin(t * 2 + i) * 10 }));
  });

  const save = el(`<div class="abs" style="left:0;top:0;width:1080px;height:1920px"></div>`, s1);
  // calendar
  const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'ماي', 'يونيو'];
  const cal = box(save, 560, 730, 560, 600, '', '', 'card');
  el(`<div class="abs" style="left:0;top:0;width:560px;height:150px;border-radius:40px 40px 0 0;background:linear-gradient(180deg,#FF915F,#EA6A3A)">
      <div class="lal abs rtl" style="left:0;top:28px;width:100%;text-align:center;color:#fff;font-size:78px;line-height:1">التوفير</div></div>`, cal);
  [150, 410].forEach(x => el(`<div class="abs" style="left:${x - 14}px;top:-34px;width:28px;height:80px;border-radius:14px;background:#0B2E7A"></div>`, cal));
  const pagesWrap = el(`<div class="abs" style="left:30px;top:172px;width:500px;height:400px;perspective:1400px"></div>`, cal);
  const pages = months.map((m, i) => {
    const dots = months.map((_, j) => `<span style="display:inline-block;width:34px;height:34px;margin:0 6px;border-radius:50%;background:${j <= i ? '#FFC21A' : '#FFE9C4'}"></span>`).join('');
    return el(`<div class="abs rtl" style="left:0;top:0;width:500px;height:400px;background:#fff;border-radius:26px;border:4px solid #FFE3C8;z-index:${10 - i};text-align:center">
       <div class="lal" style="font-size:150px;line-height:1.25;color:#0B2E7A;margin-top:34px">${m}</div>
       <div style="margin-top:10px">${dots}</div></div>`, pagesWrap);
  });
  tl.fromTo(cal, { y: -1300, rotation: -12 }, { y: 0, rotation: 0, duration: 0.75, ease: 'back.out(1.3)' }, 0.05);
  for (let i = 0; i < 5; i++) {
    const t = 0.72 + i * 0.27;
    tl.to(pages[i], { rotationX: 105, transformOrigin: '50% 0%', opacity: 0, duration: 0.24, ease: 'power2.in' }, t);
  }
  // coin jar
  const jar = box(save, 300, 1030, 250, 310, `<svg viewBox="0 0 240 300" width="100%" height="100%">
     <defs><clipPath id="jarclip"><path d="M40 70 Q22 88 22 125 V252 Q22 288 60 288 H180 Q218 288 218 252 V125 Q218 88 200 70 Z"/></clipPath></defs>
     <path d="M40 70 Q22 88 22 125 V252 Q22 288 60 288 H180 Q218 288 218 252 V125 Q218 88 200 70 Z" fill="#E6F7FF"/>
     <g clip-path="url(#jarclip)"><g id="coinfill">${Array.from({ length: 9 }, (_, i) => `<ellipse cx="${120 + (i % 2 ? 6 : -6)}" cy="${280 - i * 22}" rx="92" ry="16" fill="${i % 2 ? '#FFC21A' : '#F5A700'}"/>`).join('')}</g></g>
     <path d="M40 70 Q22 88 22 125 V252 Q22 288 60 288 H180 Q218 288 218 252 V125 Q218 88 200 70 Z" fill="none" stroke="#7CCBF0" stroke-width="7"/>
     <path d="M46 120 Q44 200 52 250" stroke="#fff" stroke-width="12" stroke-linecap="round" fill="none" opacity=".9"/>
     <rect x="34" y="40" width="172" height="34" rx="12" fill="#F38100"/><rect x="48" y="16" width="144" height="30" rx="10" fill="#FFC21A"/>
     <rect x="64" y="150" width="112" height="70" rx="16" fill="#fff" opacity=".95"/>
     <text x="120" y="200" text-anchor="middle" font-family="Poppins" font-weight="900" font-size="40" fill="#F38100">DH</text></svg>`);
  const fill = jar.querySelector('#coinfill');
  gsap.set(fill, { y: 210 });
  tl.fromTo(jar, { scale: 0, rotation: 20 }, { scale: 1, rotation: 0, duration: 0.55, ease: 'back.out(2)' }, 0.3);
  for (let i = 0; i < 7; i++) {
    const t = 0.55 + i * 0.22;
    const c = box(save, 300 + R(-40, 40), 820, 92, 92, `<svg viewBox="0 0 100 100" width="100%" height="100%"><circle cx="50" cy="50" r="46" fill="#FFC21A" stroke="#E39A00" stroke-width="6"/><circle cx="50" cy="50" r="30" fill="none" stroke="#FFE38A" stroke-width="5"/><text x="50" y="62" text-anchor="middle" font-family="Poppins" font-weight="900" font-size="30" fill="#C97F00">DH</text></svg>`, 'visibility:hidden');
    tl.set(c, { visibility: 'visible' }, t);
    tl.fromTo(c, { y: -900, rotation: R(-200, 200), scaleX: 1 }, { y: 0, rotation: 0, duration: 0.32, ease: 'power2.in' }, t);
    tl.to(c, { scale: 0.3, y: 90, opacity: 0, duration: 0.12 }, t + 0.32);
    tl.to(fill, { y: 210 - (i + 1) * 28, duration: 0.18, ease: 'back.out(2)' }, t + 0.34);
    tl.fromTo(jar, { scaleY: 1 }, { scaleY: 0.94, duration: 0.07, yoyo: true, repeat: 1, transformOrigin: '50% 100%', immediateRender: false }, t + 0.32);
  }
  // shrink the savings to the right, suitcase arrives on the left
  tl.to(save, { scale: 0.58, x: 220, y: -40, transformOrigin: '540px 800px', duration: 0.55, ease: 'power3.inOut' }, 2.08);
  const suit = box(s1, 300, 760, 330, 440, `<svg viewBox="0 0 320 430" width="100%" height="100%">
     <path d="M118 74 V34 Q118 14 140 14 H180 Q202 14 202 34 V74" fill="none" stroke="#0B2E7A" stroke-width="18" stroke-linecap="round"/>
     <rect x="18" y="70" width="284" height="310" rx="44" fill="#14B8A6"/>
     <rect x="18" y="70" width="284" height="310" rx="44" fill="url(#none)" stroke="#0E9C8C" stroke-width="8"/>
     <rect x="78" y="70" width="30" height="310" fill="#5FD9C9"/><rect x="212" y="70" width="30" height="310" fill="#5FD9C9"/>
     <circle cx="160" cy="170" r="42" fill="#FFC21A"/><path d="M160 140 l8 20 22 2 -17 14 6 22 -19 -12 -19 12 6 -22 -17 -14 22 -2z" fill="#fff"/>
     <rect x="112" y="244" width="96" height="70" rx="14" fill="#fff"/><g transform="translate(160 279) rotate(-90) scale(2.3) translate(-12 -12)"><path fill="#0A4BC4" d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></g>
     <circle cx="80" cy="398" r="20" fill="#0B2E7A"/><circle cx="240" cy="398" r="20" fill="#0B2E7A"/></svg>`);
  const tag = box(s1, 220, 740, 190, 120, `<div style="position:absolute;left:150px;top:-60px;width:6px;height:80px;background:#0B2E7A;border-radius:3px;transform:rotate(30deg)"></div>
     <div class="lal rtl" style="width:190px;height:110px;background:#fff;border-radius:22px;border:6px solid #FF7A59;color:#0B2E7A;font-size:66px;line-height:110px;text-align:center;box-shadow:0 10px 20px rgba(0,0,0,.12)">7 أيام</div>`, 'transform-origin:150px -40px');
  tl.fromTo(suit, { x: -800, rotation: -25 }, { x: 0, rotation: 0, duration: 0.6, ease: 'back.out(1.6)' }, 2.25);
  tl.fromTo(tag, { x: -800, rotation: -40 }, { x: 0, rotation: 0, duration: 0.6, ease: 'back.out(1.6)' }, 2.3);
  ambient.push(t => gsap.set(tag.firstElementChild.nextElementSibling, { rotation: Math.sin(t * 5) * 6 }));
  const arrow = box(s1, 540, 470, 300, 160, `<svg viewBox="0 0 300 160" width="100%" height="100%"><path class="ar" d="M270 130 Q150 -20 40 110" fill="none" stroke="#0B2E7A" stroke-width="14" stroke-linecap="round"/><path class="ah" d="M18 86 L38 130 L72 98" fill="none" stroke="#0B2E7A" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/></svg>`);
  tl.fromTo(arrow.querySelector('.ar'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.4, ease: 'power2.out' }, 2.5);
  tl.fromTo(arrow.querySelector('.ah'), { opacity: 0, scale: 0, transformOrigin: '38px 110px' }, { opacity: 1, scale: 1, duration: 0.2, ease: 'back.out(3)' }, 2.85);
  const p1 = box(s1, 780, 1110, 380, 100, `<div class="lal pill rtl" style="background:#F38100;font-size:60px;text-align:center;line-height:84px">6 شهور توفير</div>`);
  const p2 = box(s1, 300, 1110, 380, 100, `<div class="lal pill rtl" style="background:#0A4BC4;font-size:60px;text-align:center;line-height:84px">أسبوع سفر</div>`);
  tl.fromTo(p1, { scale: 0 }, { scale: 1, duration: 0.4, ease: 'back.out(2.5)' }, 2.45);
  tl.fromTo(p2, { scale: 0 }, { scale: 1, duration: 0.4, ease: 'back.out(2.5)' }, 2.8);
  floaty(suit, 8, 2.2, 0);
}

// zellige band wipe (s1 -> s2)
function bandWipe(t, colors) {
  const g = el(`<div class="abs" style="left:0;top:-300px;width:3400px;height:2520px;visibility:hidden"></div>`, fx);
  const id = 'zw' + (_pid++);
  let x = 0;
  colors.slice(0, 3).forEach(c => { el(`<div class="abs" style="left:${x}px;top:0;width:150px;height:100%;background:${c}"></div>`, g); x += 150; });
  el(`<div class="abs" style="left:${x}px;top:0;width:2000px;height:100%"><svg width="2000" height="2520"><defs>${zelligeTile(id, 150, { bg: '#FFF7EC' })}</defs><rect width="2000" height="2520" fill="url(#${id})"/></svg></div>`, g); x += 2000;
  colors.slice(3).forEach(c => { el(`<div class="abs" style="left:${x}px;top:0;width:150px;height:100%;background:${c}"></div>`, g); x += 150; });
  gsap.set(g, { skewX: -12 });
  tl.set(g, { visibility: 'visible' }, t);
  tl.fromTo(g, { x: 1400 }, { x: -3700, duration: 1.0, ease: 'power2.inOut' }, t);
  tl.set(g, { visibility: 'hidden' }, t + 1.0);
}
bandWipe(3.22, ['#0A4BC4', '#FFC21A', '#FF7A59', '#14B8A6', '#F38100', '#59C3FF']);

// ======================================================================
// SCENE 2 — travel is their job, and they get paid  (3.72 – 7.42)
// ======================================================================
const s2 = scene('s2', 3.70, 7.9, 'linear-gradient(180deg,#3FB6FF 0%,#86D6FF 50%,#DDF5FF 100%)');
{
  sunburstLayer(s2, 540, 640, 2600, 'rgba(255,255,255,.28)', 'rgba(255,255,255,0)', 1, 7);
  clouds(s2, [[200, 380, 300, 22, 0.95], [880, 520, 240, 30, 0.9], [150, 1180, 260, 26, 0.9], [900, 1300, 320, 18, 0.95]]);
  const a = arch(s2, { cx: 540, top: 360, Wb: 640, h: 900, img: 'assets/crew_m.png', imgW: 820, imgDy: 40, bg: 'linear-gradient(180deg,#FFE7A3 0%,#FFC86B 60%,#FF9F5A 100%)' });
  tl.fromTo(a.el, { scale: 0.15, rotation: -10, y: 300 }, { scale: 1, rotation: 0, y: 0, duration: 0.7, ease: 'back.out(1.4)' }, 3.72);
  tl.fromTo(a.photo, { y: 520 }, { y: 0, duration: 0.7, ease: 'power3.out' }, 3.98);
  floaty(a.el, 8, 1.4, 0);
  const icons = [[150, 560, 'plane', '#0A4BC4'], [935, 640, 'globe', '#14B8A6'], [140, 1010, 'suitcase', '#FF7A59'], [940, 1080, 'pin', '#F38100']];
  icons.forEach(([x, y, ic, c], i) => {
    const n = box(s2, x, y, 150, 150, `<div style="width:150px;height:150px;border-radius:50%;background:#fff;box-shadow:0 8px 0 rgba(11,46,122,.1),0 14px 28px rgba(11,46,122,.22);display:flex;align-items:center;justify-content:center;color:${c}"><div style="width:84px;height:84px">${fit(ICON[ic])}</div></div>`);
    tl.fromTo(n, { scale: 0, rotation: -90 }, { scale: 1, rotation: 0, duration: 0.5, ease: 'back.out(2.4)' }, 4.45 + i * 0.16);
    floaty(n, 14, 2 + i * 0.3, i * 1.3, 6);
  });
  // "paid" stamp
  const st = box(s2, 790, 1150, 330, 330, `<svg viewBox="-170 -170 340 340" width="100%" height="100%">
     <circle r="160" fill="#fff" opacity=".96"/><circle r="150" fill="none" stroke="#18A957" stroke-width="12"/><circle r="122" fill="none" stroke="#18A957" stroke-width="5" stroke-dasharray="10 9"/>
     <text y="-62" text-anchor="middle" font-family="Poppins" font-weight="900" font-size="38" fill="#18A957" letter-spacing="4">PAID ✓</text></svg>
     <div class="lal abs rtl" style="left:0;top:118px;width:330px;text-align:center;font-size:96px;line-height:1;color:#18A957">مخلّص</div>`, 'visibility:hidden');
  tl.set(st, { visibility: 'visible' }, 6.08);
  tl.fromTo(st, { scale: 3.2, rotation: 18, opacity: 0 }, { scale: 1, rotation: -14, opacity: 1, duration: 0.2, ease: 'power4.in' }, 6.08);
  shake(s2, 6.28, 18, 0.3);
  confetti(s2, 790, 1150, 6.28, 14, { vel: [600, 1200] });
  for (let i = 0; i < 8; i++) {
    const c = box(s2, 790, 1150, 76, 76, `<svg viewBox="0 0 100 100" width="100%" height="100%"><circle cx="50" cy="50" r="46" fill="#FFC21A" stroke="#E39A00" stroke-width="6"/><text x="50" y="62" text-anchor="middle" font-family="Poppins" font-weight="900" font-size="30" fill="#C97F00">DH</text></svg>`, 'visibility:hidden');
    tl.set(c, { visibility: 'visible' }, 6.28);
    tl.to(c, { physics2D: { velocity: R(700, 1200), angle: R(200, 340), gravity: 2200 }, rotation: R(-400, 400), duration: 1.1, ease: 'none' }, 6.28);
  }
}

// ======================================================================
// SCENE 3 — imagine: today Marrakech, tomorrow another city (7.42 – 11.3)
// ======================================================================
const s3 = scene('s3', 7.30, 11.3, 'linear-gradient(180deg,#4FC0FF 0%,#A8E6FF 55%,#FFE5C4 100%)');
iris(s3, 7.30, 0.55);
{
  const sun = box(s3, 300, 1250, 380, 380, `<div style="width:100%;height:100%;border-radius:50%;background:radial-gradient(circle,#FFF3A8 0%,#FFD84A 55%,#FFC21A 100%);box-shadow:0 0 120px 40px rgba(255,214,74,.55)"></div>`);
  tl.fromTo(sun, { y: 900 }, { y: 0, duration: 1.2, ease: 'power3.out' }, 8.2);
  sunburstLayer(s3, 300, 1250, 2600, 'rgba(255,255,255,.22)', 'rgba(255,255,255,0)', 1, 5);
  clouds(s3, [[180, 640, 280, 20, .95], [900, 820, 230, 28, .9], [700, 380, 200, 16, .85]]);
  // dream zoom: clouds rushing past
  for (let i = 0; i < 7; i++) {
    const ang = i / 7 * Math.PI * 2 + 0.4;
    const c = box(s3, 540, 900, 300, 135, fit(cloud(300)), 'visibility:hidden');
    tl.set(c, { visibility: 'visible' }, 7.4);
    tl.fromTo(c, { scale: 0.2, x: 0, y: 0, opacity: 1 }, { scale: 3.4, x: Math.cos(ang) * 900, y: Math.sin(ang) * 1100, opacity: 0, duration: 1.0, ease: 'power2.in' }, 7.4 + i * 0.05);
  }
  const imag = box(s3, 540, 860, 900, 300, `<div class="lal rtl" style="text-align:center;font-size:250px;line-height:300px;color:#fff;text-shadow:0 10px 0 #0A4BC4,0 22px 40px rgba(10,75,196,.35)">تخيّل</div>`, 'visibility:hidden');
  tl.set(imag, { visibility: 'visible' }, 7.47);
  tl.fromTo(imag, { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(2)' }, 7.47);
  tl.to(imag, { scale: 3.5, opacity: 0, duration: 0.4, ease: 'power2.in' }, 8.12);
  for (let i = 0; i < 6; i++) sparkle(s3, R(160, 920), R(600, 1100), 7.6 + i * 0.1, R(40, 80));

  const sky = skyline(s3, { kx: 850, kh: 640 });
  tl.fromTo(sky.g, { y: 700 }, { y: 0, duration: 0.8, ease: 'power3.out' }, 8.25);
  tl.fromTo(sky.k, { y: 700 }, { y: 0, duration: 0.9, ease: 'back.out(1.2)' }, 8.35);
  // pin + label
  const pin = box(s3, 850, 1060, 120, 150, `<div style="color:#FF5A3C;filter:drop-shadow(0 8px 6px rgba(0,0,0,.2))">${fit(ICON.pin)}</div>`, 'visibility:hidden');
  tl.set(pin, { visibility: 'visible' }, 8.55);
  tl.fromTo(pin, { y: -900 }, { y: 0, duration: 0.5, ease: 'bounce.out' }, 8.55);
  const lab = box(s3, 520, 1060, 420, 150, `<div class="card rtl" style="width:420px;height:150px;border-radius:34px;display:flex;align-items:center;justify-content:center;gap:18px">
     <div class="lal" style="background:#FFC21A;color:#0B2E7A;border-radius:22px;padding:2px 20px 10px;font-size:50px">اليوم</div>
     <div class="lal" style="color:#0B2E7A;font-size:92px;line-height:1">مراكش</div></div>`, 'visibility:hidden');
  tl.set(lab, { visibility: 'visible' }, 8.9);
  tl.fromTo(lab, { scale: 0, x: 200 }, { scale: 1, x: 0, duration: 0.45, ease: 'back.out(2)' }, 8.9);
  // departures board
  const cities = ['دبي', 'باريس', 'إسطنبول', 'لندن', 'الدوحة', 'نيويورك'];
  const board = box(s3, 540, 450, 900, 300, `<div class="card" style="width:900px;height:300px;overflow:hidden">
     <div style="height:96px;background:linear-gradient(90deg,#0A4BC4,#1E78FF);display:flex;align-items:center;justify-content:space-between;padding:0 40px;color:#fff">
       <div class="pop" style="font-weight:900;font-size:40px;letter-spacing:3px">DEPARTURES</div>
       <div class="lal" style="font-size:58px">رحلات الغد ✈</div></div>
     <div style="position:relative;height:204px;display:flex;align-items:center;justify-content:space-between;padding:0 40px">
       <div class="pop" style="font-weight:800;font-size:56px;color:#F38100">08:45</div>
       <div class="flipwrap" style="position:relative;width:520px;height:150px;perspective:900px"></div></div></div>`, 'visibility:hidden');
  const fw = board.querySelector('.flipwrap');
  const cards = cities.map(c => el(`<div class="abs lal rtl" style="left:0;top:0;width:520px;height:150px;background:#EAF4FF;border-radius:20px;text-align:center;font-size:104px;line-height:160px;color:#0B2E7A;backface-visibility:hidden;visibility:hidden">${c}<div style="position:absolute;left:0;top:74px;width:100%;height:3px;background:rgba(11,46,122,.15)"></div></div>`, fw));
  tl.set(board, { visibility: 'visible' }, 9.3);
  tl.fromTo(board, { y: -800, rotation: 6 }, { y: 0, rotation: 0, duration: 0.6, ease: 'back.out(1.5)' }, 9.3);
  cards.forEach((c, i) => {
    const t = 9.55 + i * 0.22;
    tl.set(c, { visibility: 'visible' }, t);
    tl.fromTo(c, { rotationX: -90 }, { rotationX: 0, duration: 0.12, ease: 'power2.out', transformOrigin: '50% 50%' }, t);
    if (i < cards.length - 1) tl.to(c, { rotationX: 90, duration: 0.1, ease: 'power2.in' }, t + 0.12);
    if (i < cards.length - 1) tl.set(c, { visibility: 'hidden' }, t + 0.22);
  });
  // plane takes off over the medina
  const trail = el(`<svg class="abs" style="left:0;top:0" width="1080" height="1920"><path id="tk" d="M980 1300 C760 1180 520 900 -260 520" fill="none" stroke="#fff" stroke-width="14" stroke-linecap="round" stroke-dasharray="1 28" opacity=".95"/></svg>`, s3);
  const tr2 = el(`<svg class="abs" style="left:0;top:0" width="1080" height="1920"><path d="M980 1300 C760 1180 520 900 -260 520" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="26" stroke-linecap="round"/></svg>`, s3);
  const pl = box(s3, 0, 0, 420, 145, `<div style="width:100%;height:100%;transform:scaleY(-1)">${fit(airplane())}</div>`, 'visibility:hidden;left:0;top:0');
  tl.set(pl, { visibility: 'visible' }, 9.55);
  tl.fromTo(pl, { scale: 0.35 }, { scale: 1.3, duration: 1.55, ease: 'power1.in' }, 9.55);
  tl.to(pl, { motionPath: { path: '#tk', align: '#tk', alignOrigin: [0.5, 0.5], autoRotate: true }, duration: 1.55, ease: 'power1.in' }, 9.55);
  tl.fromTo(tr2.querySelector('path'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.55, ease: 'power1.in' }, 9.55);
  tl.to(tr2, { opacity: 0, duration: 0.6 }, 10.6);
  gsap.set(trail, { opacity: 0 });
}

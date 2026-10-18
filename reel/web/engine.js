'use strict';
// ============================================================================
//  EFH reel — tiny deterministic motion-graphics engine (canvas 2D)
//  Every frame is a pure function of time, so frames can render in parallel.
// ============================================================================
const W = 1080, H = 1920, FPS = 30;
const OFF = 0.20;          // voice-over starts this many seconds into the video
const DUR = 62.5;          // total video length (s)
const C = {
  navy: '#06142E', navy2: '#0B2353', navy3: '#102C66', blue: '#023A9C', blue2: '#1F5BFF',
  sky: '#7CC6F0', orange: '#F78105', orange2: '#FFA53A', white: '#FFFFFF', red: '#E8353B',
  green: '#20C46B', gold: '#FFC83D', ink: '#081634', maRed: '#C1272D', maGreen: '#006233',
};
const TAU = Math.PI * 2;
const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const Ez = {
  lin: t => t,
  inQ: t => t * t, outQ: t => 1 - (1 - t) * (1 - t), ioQ: t => (t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  inC: t => t * t * t, outC: t => 1 - Math.pow(1 - t, 3), ioC: t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outQuint: t => 1 - Math.pow(1 - t, 5),
  inExpo: t => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
  outExpo: t => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  ioExpo: t => (t === 0 ? 0 : t === 1 ? 1 : t < .5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2),
  outBack: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  outBack2: t => { const c1 = 2.8, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  inBack: t => { const c1 = 1.70158, c3 = c1 + 1; return c3 * t * t * t - c1 * t * t; },
  outElastic: t => { const c4 = TAU / 3; return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - .75) * c4) + 1; },
  ioSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
};
const ease = (t, a, b, fn = Ez.outC) => fn(prog(t, a, b));
// damped spring 0->1
const spring = (t, f = 2.2, d = 7) => (t <= 0 ? 0 : 1 - Math.exp(-d * t) * Math.cos(f * TAU * t));
function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
const rnd = (i, j = 0) => hash(i * 12.9898 + j * 78.233 + 0.123);
function noise1(x) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(rnd(i), rnd(i + 1), u) * 2 - 1; }
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

// ---------------------------------------------------------------- assets ----
const IMG = {};
let MAP = null;
async function loadImage(src) { const im = new Image(); im.src = src; await im.decode(); return im; }

async function loadAll() {
  const list = {
    logoW: 'assets/logo_white.png', logoB: 'assets/logo_blue.png', passport: 'assets/passport.png',
    flagUS: 'assets/flag_us.png', flagUK: 'assets/flag_uk.png', flagFR: 'assets/flag_fr.png', flagMA: 'assets/flag_ma.png',
    map: 'assets/map_grade.jpg', morocco: 'assets/morocco_map.png',
  };
  await Promise.all(Object.entries(list).map(async ([k, v]) => { IMG[k] = await loadImage(v); }));
  MAP = await (await fetch('assets/mapdots.json')).json();
  IMG.flagES = makeSpain();
  const faces = [
    ['900', 'Cairo'], ['800', 'Cairo'], ['700', 'Cairo'], ['900', 'Tajawal'], ['800', 'Tajawal'], ['400', 'Lalezar'],
    ['900', 'Montserrat'], ['800', 'Montserrat'], ['700', 'Montserrat'], ['500', 'Montserrat'], ['400', 'Bebas Neue'],
    ['700', 'Caveat'], ['800', 'JetBrains Mono'], ['700', 'JetBrains Mono'],
  ];
  for (const [w, f] of faces) {
    await document.fonts.load(`${w} 40px "${f}"`, 'ABC abc 123');
    await document.fonts.load(`${w} 40px "${f}"`, 'مرحبا بكم');
  }
  buildStatics();
}

function makeSpain() {
  const c = mk(900, 600), g = c.getContext('2d');
  g.fillStyle = '#AA151B'; g.fillRect(0, 0, 900, 600);
  g.fillStyle = '#F1BF00'; g.fillRect(0, 150, 900, 300);
  return c;
}

let VIG, GRAIN = [], SM1, SM2, SM3;
function buildStatics() {
  VIG = mk(W, H);
  const g = VIG.getContext('2d');
  const rg = g.createRadialGradient(W / 2, H / 2, H * 0.28, W / 2, H / 2, H * 0.72);
  rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(1, 'rgba(0,0,0,0.55)');
  g.fillStyle = rg; g.fillRect(0, 0, W, H);
  for (let k = 0; k < 4; k++) {
    const n = mk(360, 640), ng = n.getContext('2d'), id = ng.createImageData(360, 640);
    for (let i = 0; i < id.data.length; i += 4) {
      const v = Math.floor(rnd(i * 0.25 + k * 1e6) * 255);
      id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255;
    }
    ng.putImageData(id, 0, 0); GRAIN.push(n);
  }
  SM1 = mk(270, 480); SM2 = mk(68, 120); SM3 = mk(34, 60);
}

// ------------------------------------------------------------ video frames --
const NFR = 240, SRC_FPS = 24;
const FC = new Map();
let NEED = new Set(), USED = new Set(), TICK = 0;
const fkey = (clip, n) => `${clip}/${String(n).padStart(4, '0')}`;
function vframe(clip, n) {
  n = clamp(n, 0, NFR - 1);
  const k = fkey(clip, n), e = FC.get(k);
  USED.add(k);
  if (e && e.ok) { e.used = TICK; return e.img; }
  NEED.add(k); return null;
}
function fetchFrame(k) {
  let e = FC.get(k);
  if (e) return e.p;
  const img = new Image();
  e = { img, ok: false, used: TICK, p: null };
  img.src = `frames/${k}.jpg`;
  e.p = img.decode().then(() => { e.ok = true; }).catch(() => { e.ok = true; });
  FC.set(k, e);
  return e.p;
}
function evict() {
  if (FC.size < 260) return;
  const arr = [...FC.entries()].filter(([, e]) => e.ok).sort((a, b) => a[1].used - b[1].used);
  for (let i = 0; i < arr.length - 200; i++) FC.delete(arr[i][0]);
}

// draw image to cover a rect; fx/fy = focus point of the source (0..1)
function cover(ctx, img, x, y, w, h, o = {}) {
  if (!img) return;
  const iw = img.width || img.videoWidth, ih = img.height || img.videoHeight;
  const z = o.zoom || 1;
  const s = Math.max(w / iw, h / ih) * z;
  const dw = iw * s, dh = ih * s;
  const fx = o.fx ?? 0.5, fy = o.fy ?? 0.5;
  let dx = x + w / 2 - fx * dw + (o.px || 0), dy = y + h / 2 - fy * dh + (o.py || 0);
  dx = clamp(dx, x + w - dw, x); dy = clamp(dy, y + h - dh, y);
  ctx.drawImage(img, dx, dy, dw, dh);
}

// draw a clip at clip-time ct, with 24->30 fps frame blending
function clip(ctx, name, ct, x, y, w, h, o = {}) {
  const f = ct * SRC_FPS;
  const n0 = Math.floor(f), fr = f - n0;
  const a = vframe(name, n0);
  const b = fr > 0.08 && n0 + 1 < NFR ? vframe(name, n0 + 1) : null;
  ctx.save();
  if (o.clipPath !== false) { ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); }
  if (o.filter) ctx.filter = o.filter;
  const ga = ctx.globalAlpha;
  cover(ctx, a, x, y, w, h, o);
  if (b) { ctx.globalAlpha = ga * fr; cover(ctx, b, x, y, w, h, o); }
  ctx.restore();
}
// cheap heavy blur of a clip: draw tiny then upscale
function clipBlur(ctx, name, ct, x, y, w, h, o = {}, lvl = 2) {
  const S = lvl === 3 ? SM3 : lvl === 2 ? SM2 : SM1;
  const g = S.getContext('2d');
  g.clearRect(0, 0, S.width, S.height);
  clip(g, name, ct, 0, 0, S.width, S.height, Object.assign({}, o, { filter: null }));
  ctx.save(); ctx.imageSmoothingQuality = 'high';
  if (o.filter) ctx.filter = o.filter;
  ctx.drawImage(S, x, y, w, h);
  ctx.restore();
}
// snapshot of current canvas (for frosted glass)
function blurSnap(ctx) {
  const g1 = SM1.getContext('2d'); g1.clearRect(0, 0, 270, 480); g1.drawImage(ctx.canvas, 0, 0, 270, 480);
  const g2 = SM2.getContext('2d'); g2.clearRect(0, 0, 68, 120); g2.drawImage(SM1, 0, 0, 68, 120);
}
function frosted(ctx, x, y, w, h, r, o = {}) {
  ctx.save();
  rr(ctx, x, y, w, h, r); ctx.clip();
  const m = ctx.getTransform();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingQuality = 'high';
  ctx.globalAlpha *= 1;
  ctx.drawImage(o.lvl === 1 ? SM1 : SM2, 0, 0, W, H);
  ctx.setTransform(m);
  ctx.fillStyle = o.tint || 'rgba(8,22,56,0.55)';
  ctx.fillRect(x, y, w, h);
  const lg = ctx.createLinearGradient(x, y, x, y + h);
  lg.addColorStop(0, 'rgba(255,255,255,0.16)'); lg.addColorStop(0.5, 'rgba(255,255,255,0.03)'); lg.addColorStop(1, 'rgba(255,255,255,0.0)');
  ctx.fillStyle = lg; ctx.fillRect(x, y, w, h);
  ctx.restore();
  ctx.save(); rr(ctx, x + 1, y + 1, w - 2, h - 2, r); ctx.lineWidth = 2; ctx.strokeStyle = o.border || 'rgba(255,255,255,0.28)'; ctx.stroke(); ctx.restore();
}

// --------------------------------------------------------------- drawing ----
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); rrPath(ctx, x, y, w, h, r); }
function rrPath(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function font(f, w, s) { return `${w} ${s}px "${f}"`; }
const isAr = s => /[؀-ۿ]/.test(s);
function txt(ctx, s, x, y, o = {}) {
  ctx.save();
  ctx.font = font(o.f || (isAr(s) ? 'Cairo' : 'Montserrat'), o.w || 900, o.s || 60);
  ctx.textAlign = o.align || 'center';
  ctx.textBaseline = o.base || 'middle';
  ctx.direction = o.dir || (isAr(s) ? 'rtl' : 'ltr');
  if (o.ls) ctx.letterSpacing = o.ls + 'px';
  if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
  if (o.shadow) { ctx.shadowColor = o.shadow; ctx.shadowBlur = o.sb ?? 24; ctx.shadowOffsetY = o.sy ?? 6; }
  if (o.stroke) {
    ctx.lineJoin = 'round'; ctx.miterLimit = 2; ctx.lineWidth = o.stroke; ctx.strokeStyle = o.sc || C.ink;
    ctx.strokeText(s, x, y); ctx.shadowColor = 'transparent';
  }
  if (o.fill !== false) { ctx.fillStyle = o.color || '#fff'; ctx.fillText(s, x, y); }
  ctx.restore();
}
function tw(ctx, s, o = {}) {
  ctx.save(); ctx.font = font(o.f || (isAr(s) ? 'Cairo' : 'Montserrat'), o.w || 900, o.s || 60);
  ctx.direction = isAr(s) ? 'rtl' : 'ltr'; if (o.ls) ctx.letterSpacing = o.ls + 'px';
  const m = ctx.measureText(s).width; ctx.restore(); return m;
}
// pill label
function pill(ctx, x, y, label, o = {}) {
  const s = o.s || 40;
  const w = tw(ctx, label, { f: o.f, w: o.w || 800, s, ls: o.ls }) + (o.icon ? s * 1.25 : 0) + s * 1.3;
  const h = s * 1.75;
  ctx.save();
  ctx.translate(x, y);
  if (o.scale !== undefined) ctx.scale(o.scale, o.scale);
  if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
  ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 8;
  rr(ctx, -w / 2, -h / 2, w, h, h / 2); ctx.fillStyle = o.bg || C.orange; ctx.fill();
  ctx.shadowColor = 'transparent';
  if (o.border) { ctx.lineWidth = 3; ctx.strokeStyle = o.border; ctx.stroke(); }
  let tx = 0;
  if (o.icon) {
    const ix = isAr(label) ? w / 2 - s * 0.95 : -w / 2 + s * 0.95;
    o.icon(ctx, ix, 0, s * 0.95, o.ic || '#fff');
    tx = isAr(label) ? -s * 0.55 : s * 0.55;
  }
  txt(ctx, label, tx, s * (isAr(label) ? 0.06 : 0.04), { f: o.f, w: o.w || 800, s, color: o.color || '#fff', ls: o.ls });
  ctx.restore();
  return w;
}

// ------------------------------------------------------------------ icons ---
function iCheck(ctx, x, y, s, col, p = 1, lw) {
  if (p <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.lineWidth = lw || s * 0.16; ctx.strokeStyle = col;
  const pts = [[-0.38, 0.02], [-0.1, 0.3], [0.42, -0.28]];
  const L1 = Math.hypot(0.28, 0.28), L2 = Math.hypot(0.52, 0.58), tot = L1 + L2, d = p * tot;
  ctx.beginPath(); ctx.moveTo(pts[0][0] * s, pts[0][1] * s);
  if (d <= L1) { const k = d / L1; ctx.lineTo(lerp(pts[0][0], pts[1][0], k) * s, lerp(pts[0][1], pts[1][1], k) * s); }
  else { ctx.lineTo(pts[1][0] * s, pts[1][1] * s); const k = (d - L1) / L2; ctx.lineTo(lerp(pts[1][0], pts[2][0], k) * s, lerp(pts[1][1], pts[2][1], k) * s); }
  ctx.stroke(); ctx.restore();
}
function iCross(ctx, x, y, s, col, p = 1, lw) {
  if (p <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.lineCap = 'round'; ctx.lineWidth = lw || s * 0.16; ctx.strokeStyle = col;
  const a = clamp(p * 2), b = clamp(p * 2 - 1), r = s * 0.32;
  ctx.beginPath(); ctx.moveTo(-r, -r); ctx.lineTo(lerp(-r, r, a), lerp(-r, r, a)); ctx.stroke();
  if (b > 0) { ctx.beginPath(); ctx.moveTo(r, -r); ctx.lineTo(lerp(r, -r, b), lerp(-r, r, b)); ctx.stroke(); }
  ctx.restore();
}
const PLANE = [[0, -1], [0.07, -0.92], [0.095, -0.72], [0.095, -0.26], [0.98, 0.16], [0.98, 0.3], [0.095, 0.1], [0.08, 0.6], [0.38, 0.83], [0.38, 0.94], [0.04, 0.88], [0, 0.96]];
function iPlane(ctx, x, y, s, rot, col) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath();
  PLANE.forEach(([a, b], i) => (i ? ctx.lineTo(a * s, b * s) : ctx.moveTo(a * s, b * s)));
  for (let i = PLANE.length - 1; i >= 0; i--) ctx.lineTo(-PLANE[i][0] * s, PLANE[i][1] * s);
  ctx.closePath(); ctx.fillStyle = col; ctx.fill();
  // engines
  ctx.fillRect(0.32 * s, 0.02 * s, 0.09 * s, 0.22 * s); ctx.fillRect(-0.41 * s, 0.02 * s, 0.09 * s, 0.22 * s);
  ctx.restore();
}
function iPin(ctx, x, y, s, col, inner = '#fff') {
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath(); ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-s * 0.18, -s * 0.38, -s * 0.5, -s * 0.55, -s * 0.5, -s * 0.95);
  ctx.arc(0, -s * 0.95, s * 0.5, Math.PI, 0);
  ctx.bezierCurveTo(s * 0.5, -s * 0.55, s * 0.18, -s * 0.38, 0, 0);
  ctx.fillStyle = col; ctx.fill();
  ctx.beginPath(); ctx.arc(0, -s * 0.95, s * 0.2, 0, TAU); ctx.fillStyle = inner; ctx.fill();
  ctx.restore();
}
function iPhone(ctx, x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = s * 0.1;
  rr(ctx, -s * 0.28, -s * 0.45, s * 0.56, s * 0.9, s * 0.1); ctx.stroke();
  ctx.fillRect(-s * 0.09, -s * 0.36, s * 0.18, s * 0.05);
  ctx.beginPath(); ctx.arc(0, s * 0.32, s * 0.055, 0, TAU); ctx.fill();
  ctx.restore();
}
function iGlobe(ctx, x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = col; ctx.lineWidth = s * 0.08; const r = s * 0.42;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, 0, r * 0.45, r, 0, 0, TAU); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(r, 0); ctx.moveTo(0, -r); ctx.lineTo(0, r); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-r * 0.86, -r * 0.5); ctx.lineTo(r * 0.86, -r * 0.5); ctx.moveTo(-r * 0.86, r * 0.5); ctx.lineTo(r * 0.86, r * 0.5); ctx.stroke();
  ctx.restore();
}
function iInsta(ctx, x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = s * 0.09;
  rr(ctx, -s * 0.4, -s * 0.4, s * 0.8, s * 0.8, s * 0.22); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, s * 0.18, 0, TAU); ctx.stroke();
  ctx.beginPath(); ctx.arc(s * 0.22, -s * 0.22, s * 0.05, 0, TAU); ctx.fill();
  ctx.restore();
}
function iLock(ctx, x, y, s, col, open = 0) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = s * 0.1;
  ctx.save(); ctx.translate(s * 0.22, -s * 0.05); ctx.rotate(-open * 0.6); ctx.translate(-s * 0.22, s * 0.05 - open * s * 0.12);
  ctx.beginPath(); ctx.moveTo(-s * 0.22, -s * 0.02); ctx.lineTo(-s * 0.22, -s * 0.2); ctx.arc(0, -s * 0.2, s * 0.22, Math.PI, 0); ctx.lineTo(s * 0.22, -s * 0.02); ctx.stroke();
  ctx.restore();
  rr(ctx, -s * 0.34, -s * 0.04, s * 0.68, s * 0.5, s * 0.08); ctx.fill();
  ctx.restore();
}
function iDoc(ctx, x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = col; ctx.lineWidth = s * 0.08; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(-s * 0.3, -s * 0.42); ctx.lineTo(s * 0.12, -s * 0.42); ctx.lineTo(s * 0.3, -s * 0.24); ctx.lineTo(s * 0.3, s * 0.42); ctx.lineTo(-s * 0.3, s * 0.42); ctx.closePath(); ctx.stroke();
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-s * 0.16, -s * 0.08 + i * s * 0.16); ctx.lineTo(s * 0.16, -s * 0.08 + i * s * 0.16); ctx.stroke(); }
  ctx.restore();
}
function iCard(ctx, x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = s * 0.08;
  rr(ctx, -s * 0.44, -s * 0.3, s * 0.88, s * 0.6, s * 0.08); ctx.stroke();
  ctx.beginPath(); ctx.arc(-s * 0.18, -s * 0.04, s * 0.1, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(-s * 0.18, s * 0.17, s * 0.15, Math.PI, 0); ctx.fill();
  ctx.fillRect(s * 0.02, -s * 0.1, s * 0.28, s * 0.06); ctx.fillRect(s * 0.02, s * 0.04, s * 0.22, s * 0.06);
  ctx.restore();
}
function iPassport(ctx, x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = col; ctx.lineWidth = s * 0.08;
  rr(ctx, -s * 0.3, -s * 0.42, s * 0.6, s * 0.84, s * 0.06); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, -s * 0.06, s * 0.15, 0, TAU); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-s * 0.14, s * 0.26); ctx.lineTo(s * 0.14, s * 0.26); ctx.stroke();
  ctx.restore();
}
function iWarn(ctx, x, y, s, col, bg) {
  ctx.save(); ctx.translate(x, y); ctx.fillStyle = col; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(0, -s * 0.44); ctx.lineTo(s * 0.48, s * 0.38); ctx.lineTo(-s * 0.48, s * 0.38); ctx.closePath();
  ctx.lineWidth = s * 0.1; ctx.strokeStyle = col; ctx.stroke(); ctx.fill();
  ctx.fillStyle = bg || C.ink; ctx.fillRect(-s * 0.045, -s * 0.16, s * 0.09, s * 0.3); ctx.beginPath(); ctx.arc(0, s * 0.25, s * 0.055, 0, TAU); ctx.fill();
  ctx.restore();
}
function iSuitcase(ctx, x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = s * 0.08;
  rr(ctx, -s * 0.36, -s * 0.2, s * 0.72, s * 0.56, s * 0.08); ctx.fill();
  rr(ctx, -s * 0.14, -s * 0.36, s * 0.28, s * 0.2, s * 0.05); ctx.stroke();
  ctx.restore();
}
function iUmbrella(ctx, x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = s * 0.07; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(0, -s * 0.05, s * 0.44, Math.PI, 0); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(0, -s * 0.05); ctx.lineTo(0, s * 0.42); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-s * 0.36, s * 0.44); ctx.lineTo(s * 0.36, s * 0.44); ctx.stroke();
  ctx.restore();
}
function iWings(ctx, x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.fillStyle = col;
  for (const side of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      const y0 = -s * 0.12 + i * s * 0.07, len = s * (0.95 - i * 0.13);
      ctx.beginPath(); ctx.moveTo(side * s * 0.16, y0);
      ctx.quadraticCurveTo(side * len * 0.6, y0 - s * 0.1, side * len, y0 - s * 0.04 - i * s * 0.01);
      ctx.quadraticCurveTo(side * len * 0.6, y0 + s * 0.02, side * s * 0.16, y0 + s * 0.05);
      ctx.fill();
    }
  }
  ctx.beginPath(); ctx.arc(0, 0, s * 0.17, 0, TAU); ctx.fill();
  iPlane(ctx, 0, 0, s * 0.11, 0, C.blue);
  ctx.restore();
}
function iClock(ctx, x, y, s, col, t) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = col; ctx.lineWidth = s * 0.09; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(0, 0, s * 0.42, 0, TAU); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(t * 6) * s * 0.28, -Math.cos(t * 6) * s * 0.28); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(t * 0.5) * s * 0.18, -Math.cos(t * 0.5) * s * 0.18); ctx.stroke();
  ctx.restore();
}
function iCam(ctx, x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = col; ctx.lineWidth = s * 0.08;
  rr(ctx, -s * 0.42, -s * 0.24, s * 0.84, s * 0.56, s * 0.1); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, s * 0.04, s * 0.15, 0, TAU); ctx.stroke();
  ctx.fillStyle = col; ctx.fillRect(-s * 0.16, -s * 0.36, s * 0.32, s * 0.12);
  ctx.restore();
}

// waving flag (pole on the left)
function flag(ctx, img, x, y, w, h, t, o = {}) {
  const amp = o.amp ?? h * 0.06, n = Math.ceil(w / 5), sw = w / n;
  const iw = img.width, ih = img.height;
  ctx.save();
  if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
  if (o.shadow) { ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 14; }
  const k = o.k ?? 2.2, sp = o.sp ?? 5;
  for (let i = 0; i < n; i++) {
    const u = i / n, ph = u * TAU * k * 0.5 - t * sp;
    const off = Math.sin(ph) * amp * (0.25 + u * 0.75);
    ctx.drawImage(img, u * iw, 0, iw / n + 1, ih, x + i * sw, y + off, sw + 1, h);
  }
  ctx.shadowColor = 'transparent';
  for (let i = 0; i < n; i++) {
    const u = i / n, ph = u * TAU * k * 0.5 - t * sp;
    const off = Math.sin(ph) * amp * (0.25 + u * 0.75);
    const sh = Math.cos(ph) * (0.25 + u * 0.75);
    ctx.fillStyle = sh > 0 ? `rgba(255,255,255,${sh * 0.22})` : `rgba(0,0,0,${-sh * 0.32})`;
    ctx.fillRect(x + i * sw, y + off, sw + 1, h);
  }
  ctx.restore();
}

// ----------------------------------------------------------- transitions ----
const BUF_A = mk(W, H), BUF_B = mk(W, H);
const TRANS = {
  cut(ctx, A, B, p) { ctx.drawImage(p < 0.5 ? A : B, 0, 0); },
  fade(ctx, A, B, p) { ctx.drawImage(A, 0, 0); ctx.globalAlpha = Ez.ioQ(p); ctx.drawImage(B, 0, 0); ctx.globalAlpha = 1; },
  whip(ctx, A, B, p, tr) {
    const dx = tr.dx ?? -1, dy = tr.dy ?? 0;
    const e = Ez.ioExpo(p), v = (Ez.ioExpo(clamp(p + 0.02)) - Ez.ioExpo(clamp(p - 0.02))) / 0.04;
    const blur = Math.min(v * 0.05, 0.25);
    const N = 7;
    for (const [img, base] of [[A, 0], [B, 1]]) {
      for (let i = 0; i < N; i++) {
        const o = e - base + (i / (N - 1) - 0.5) * blur;
        ctx.globalAlpha = 1 / (i + 1);
        ctx.drawImage(img, o * dx * W, o * dy * H);
      }
    }
    ctx.globalAlpha = 1;
  },
  zoom(ctx, A, B, p) {
    const e = Ez.ioExpo(p);
    const N = 6;
    if (p < 0.5) {
      for (let i = 0; i < N; i++) { const s = 1 + e * 1.6 * (1 + i * 0.06); ctx.globalAlpha = 1 / (i + 1); ctx.drawImage(A, W / 2 - W * s / 2, H / 2 - H * s / 2, W * s, H * s); }
    } else {
      for (let i = 0; i < N; i++) { const s = (1 + (1 - e) * 0.9) * (1 + (1 - e) * i * 0.05); ctx.globalAlpha = 1 / (i + 1); ctx.drawImage(B, W / 2 - W * s / 2, H / 2 - H * s / 2, W * s, H * s); }
    }
    ctx.globalAlpha = 1;
    const fl = 1 - Math.abs(p - 0.5) * 2;
    ctx.fillStyle = `rgba(255,255,255,${Math.pow(fl, 3) * 0.7})`; ctx.fillRect(0, 0, W, H);
  },
  iris(ctx, A, B, p, tr) {
    ctx.drawImage(A, 0, 0);
    const e = Ez.ioC(p), r = e * Math.hypot(W, H) * 0.62;
    ctx.save(); ctx.beginPath(); ctx.arc(tr.cx ?? W / 2, tr.cy ?? H / 2, r, 0, TAU); ctx.clip(); ctx.drawImage(B, 0, 0); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.arc(tr.cx ?? W / 2, tr.cy ?? H / 2, r, 0, TAU); ctx.lineWidth = 14; ctx.strokeStyle = C.orange; ctx.globalAlpha = 1 - e; ctx.stroke(); ctx.restore();
  },
  slideUp(ctx, A, B, p) {
    const e = Ez.ioExpo(p);
    ctx.drawImage(A, 0, -e * H * 0.35);
    ctx.fillStyle = `rgba(0,0,0,${e * 0.5})`; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 50;
    ctx.drawImage(B, 0, (1 - e) * H); ctx.restore();
  },
  glitch(ctx, A, B, p) {
    const src = p < 0.5 ? A : B, k = Math.floor(p * 14);
    ctx.drawImage(src, 0, 0);
    const amt = 1 - Math.abs(p - 0.5) * 2;
    for (let i = 0; i < 9; i++) {
      const y = rnd(i, k) * H, h = 20 + rnd(i + 9, k) * 140, dx = (rnd(i + 3, k) - 0.5) * 220 * amt;
      ctx.drawImage(rnd(i + 5, k) > 0.5 ? A : B, 0, y, W, h, dx, y, W, h);
    }
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.35 * amt; ctx.drawImage(src, 18 * amt, 0); ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  },
};

// ------------------------------------------------------------ timeline ------
const SC = [], TR = [];
function scene(t0, t1, fn) { SC.push({ t0, t1, fn }); }
function trans(at, d, type, o = {}) { TR.push(Object.assign({ at, d, type }, o)); }
function sceneAt(vt) {
  for (const s of SC) if (vt >= s.t0 && vt < s.t1) return s;
  return vt < SC[0].t0 ? SC[0] : SC[SC.length - 1];
}
function renderScene(ctx, s, vt) {
  ctx.save(); s.fn(ctx, vt, vt - s.t0); ctx.restore();
}
function compose(ctx, vt) {
  for (const tr of TR) {
    const a = tr.at - tr.d / 2, b = tr.at + tr.d / 2;
    if (vt >= a && vt < b) {
      const A = sceneAt(tr.at - 1e-4), B = sceneAt(tr.at + 1e-4);
      for (const [buf, s] of [[BUF_A, A], [BUF_B, B]]) {
        const g = buf.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
        g.fillStyle = C.navy; g.fillRect(0, 0, W, H); renderScene(g, s, vt);
      }
      ctx.save(); TRANS[tr.type](ctx, BUF_A, BUF_B, (vt - a) / (b - a), tr); ctx.restore();
      return;
    }
  }
  renderScene(ctx, sceneAt(vt), vt);
}

// ----------------------------------------------------- shakes & flashes -----
const SHAKES = [], FLASHES = [];
function shakeAt(vt) {
  let x = 0, y = 0, r = 0, z = 0;
  for (const s of SHAKES) {
    const d = vt - s.t; if (d < 0 || d > s.d) continue;
    const k = Math.pow(1 - d / s.d, 2) * s.a;
    x += noise1(d * 38 + s.t * 7) * 26 * k; y += noise1(d * 41 + 99 + s.t * 3) * 26 * k; r += noise1(d * 30 + 50) * 0.012 * k;
    z += 0.035 * k;
  }
  return { x, y, r, z };
}
function flashes(ctx, vt) {
  for (const f of FLASHES) {
    const d = vt - f.t; if (d < -0.03 || d > f.d) continue;
    const a = d < 0 ? (1 + d / 0.03) * f.a : Math.pow(1 - d / f.d, 2.2) * f.a;
    ctx.fillStyle = f.c || '#fff'; ctx.globalAlpha = a; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
  }
}

// ------------------------------------------------------------- captions -----
let CAPS = [];
const CAP_Y = 1400;
function capAt(vt) {
  for (let i = 0; i < CAPS.length; i++) {
    const c = CAPS[i], nx = CAPS[i + 1];
    const s = c.w[0][1] - 0.06;
    const e = c.end ?? Math.min(nx ? nx.w[0][1] - 0.07 : 1e9, c.w[c.w.length - 1][2] + 0.45);
    if (vt >= s && vt < e) return { c, s, e };
  }
  return null;
}
function drawCaptions(ctx, vt) {
  const a = capAt(vt); if (!a || a.c.hide) return;
  const { c, s, e } = a;
  const fs = 82;
  ctx.save();
  ctx.font = font('Cairo', 900, fs); ctx.direction = 'rtl';
  const sp = fs * 0.3;
  const ws = c.w.map(w => ctx.measureText(w[0]).width);
  const total = ws.reduce((p, q) => p + q, 0) + sp * (ws.length - 1);
  const fit = Math.min(1, 880 / total);
  const ap = Ez.outBack2(prog(vt, s, s + 0.2));
  const ex = prog(vt, e - 0.08, e);
  const sc = fit * lerp(0.6, 1, ap) * (1 - ex * 0.15);
  ctx.translate(W / 2, CAP_Y + (1 - prog(vt, s, s + 0.16)) * 30);
  ctx.scale(sc, sc);
  ctx.globalAlpha = clamp(prog(vt, s, s + 0.08)) * (1 - ex);
  const pos = []; let x = total / 2;
  for (let k = 0; k < ws.length; k++) { pos.push(x - ws[k] / 2); x -= ws[k] + sp; }
  let ai = -1; for (let k = 0; k < c.w.length; k++) if (vt >= c.w[k][1] - 0.03) ai = k;
  // sliding highlight pill
  if (ai >= 0) {
    const t0 = c.w[ai][1] - 0.03, mv = Ez.outC(prog(vt, t0, t0 + 0.12));
    const from = ai > 0 ? ai - 1 : ai;
    const cx = lerp(pos[from], pos[ai], mv), ww = lerp(ws[from], ws[ai], mv) + 44;
    const pop = 1 + 0.12 * (1 - Ez.outBack(prog(vt, t0, t0 + 0.22)));
    ctx.save(); ctx.translate(cx, fs * 0.08); ctx.scale(pop, pop);
    ctx.shadowColor = 'rgba(247,129,5,0.55)'; ctx.shadowBlur = 30;
    rr(ctx, -ww / 2, -fs * 0.62, ww, fs * 1.3, 24);
    const g = ctx.createLinearGradient(0, -fs * 0.6, 0, fs * 0.6); g.addColorStop(0, '#FFA53A'); g.addColorStop(1, '#F06A00');
    ctx.fillStyle = g; ctx.fill(); ctx.restore();
  }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  for (let k = 0; k < c.w.length; k++) {
    const active = k === ai;
    const sz = active ? 1.06 : 1;
    ctx.save(); ctx.translate(pos[k], 0); ctx.scale(sz, sz);
    if (!active) {
      ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 5;
      ctx.lineWidth = 14; ctx.strokeStyle = C.ink; ctx.strokeText(c.w[k][0], 0, 0);
      ctx.shadowColor = 'transparent';
    }
    ctx.fillStyle = (k > ai && ai >= 0) ? '#F2F5FF' : '#FFFFFF';
    ctx.fillText(c.w[k][0], 0, 0);
    ctx.restore();
  }
  ctx.restore();
}

// --------------------------------------------------------------- overlays ---
let HEADER_HIDE = [], HEADER_BLUE = [];
function rangeMix(ranges, vt, f = 0.25) {
  let m = 0;
  for (const [a, b] of ranges) m = Math.max(m, prog(vt, a - f, a) * (1 - prog(vt, b, b + f)));
  return m;
}
// brand header: logo always on top, centered
function header(ctx, vt) {
  const vis = 1 - rangeMix(HEADER_HIDE, vt);
  if (vis <= 0) return;
  const lw = 330, lh = lw * IMG.logoW.height / IMG.logoW.width, x = 540 - lw / 2, y = 186 - lh / 2;
  const blue = rangeMix(HEADER_BLUE, vt);
  ctx.save(); ctx.globalAlpha = vis;
  if (blue < 1) {
    ctx.save(); ctx.globalAlpha *= 1 - blue; ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 3;
    ctx.drawImage(IMG.logoW, x, y, lw, lh); ctx.restore();
  }
  if (blue > 0) {
    ctx.save(); ctx.globalAlpha *= blue; ctx.shadowColor = 'rgba(255,255,255,0.8)'; ctx.shadowBlur = 18;
    ctx.drawImage(IMG.logoB, x, y, lw, lh); ctx.restore();
  }
  ctx.restore();
}
function overlays(ctx, vt, frameNo) {
  header(ctx, vt);
  drawCaptions(ctx, vt);
  flashes(ctx, vt);
  ctx.drawImage(VIG, 0, 0);
  // film grain
  ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.07;
  ctx.drawImage(GRAIN[frameNo % 4], 0, 0, W, H); ctx.restore();
}

// ----------------------------------------------------------------- frame ----
const CV = document.getElementById('c');
const CTX = CV.getContext('2d', { alpha: false });
CTX.imageSmoothingQuality = 'high';
function drawFrame(t) {
  const vt = t - OFF, ctx = CTX;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
  ctx.fillStyle = C.navy; ctx.fillRect(0, 0, W, H);
  const sh = shakeAt(vt);
  ctx.save();
  ctx.translate(W / 2 + sh.x, H / 2 + sh.y); ctx.rotate(sh.r); ctx.scale(1 + sh.z, 1 + sh.z); ctx.translate(-W / 2, -H / 2);
  compose(ctx, vt);
  ctx.restore();
  overlays(ctx, vt, Math.round(t * FPS));
}
async function renderAt(t) {
  TICK++;
  for (let pass = 0; pass < 4; pass++) {
    NEED = new Set(); USED = new Set();
    drawFrame(t);
    if (NEED.size === 0) break;
    await Promise.all([...NEED].map(fetchFrame));
  }
  // prefetch upcoming frames of clips in use
  for (const k of USED) {
    const [c, n] = k.split('/');
    for (let d = 1; d <= 3; d++) { const m = +n + d; if (m < NFR) fetchFrame(fkey(c, m)); }
  }
  evict();
  return true;
}
window.renderAt = renderAt;

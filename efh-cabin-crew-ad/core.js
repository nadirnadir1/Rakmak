// ---------- core: canvas, math, easing, shared drawing helpers ----------
const C = document.getElementById('c');
const X = C.getContext('2d');
const W = 1080, H = 1920, DURATION = 48.0;

const COL = {
  navy: '#050D24', navy2: '#0A1C4A', blue: '#0D3FA6', blue2: '#1E5BD8', sky: '#5AA8FF',
  orange: '#F7941D', orange2: '#FF6A00', gold: '#F6C15B', white: '#FFFFFF', ink: '#081433',
};

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const P = (t, a, b) => clamp((t - a) / (b - a));
const TAU = Math.PI * 2, D2R = Math.PI / 180;
const E = {
  lin: t => t,
  inQ: t => t * t,
  outQ: t => 1 - (1 - t) * (1 - t),
  inC: t => t * t * t,
  outC: t => 1 - Math.pow(1 - t, 3),
  ioC: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  outQuint: t => 1 - Math.pow(1 - t, 5),
  inExpo: t => t === 0 ? 0 : Math.pow(2, 10 * t - 10),
  outExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  ioExpo: t => t === 0 ? 0 : t === 1 ? 1 : t < .5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
  outBack: (t, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
  outElastic: t => t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - .75) * TAU / 3) + 1,
  smooth: t => t * t * (3 - 2 * t),
};
// window: rises 0->1 over [a,a+fi], falls 1->0 over [b-fo,b]
const win = (t, a, b, fi = .25, fo = .25) => Math.min(P(t, a, a + fi), 1 - P(t, b - fo, b));

function mulberry(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let r = Math.imul(seed ^ seed >>> 15, 1 | seed);
    r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r;
    return ((r ^ r >>> 14) >>> 0) / 4294967296;
  };
}
const R0 = mulberry(7);

function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function mixHex(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return `rgb(${Math.round(lerp(A[0], B[0], t))},${Math.round(lerp(A[1], B[1], t))},${Math.round(lerp(A[2], B[2], t))})`;
}
function rgba(h, a) { const c = hexToRgb(h); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }

function rr(x, y, w, h, r) { X.beginPath(); X.roundRect(x, y, w, h, r); }
function circle(x, y, r) { X.beginPath(); X.arc(x, y, Math.max(0, r), 0, TAU); }

// text helper
function T(s, x, y, o = {}) {
  X.save();
  X.font = o.font || '800 60px Cairo';
  X.textAlign = o.align || 'center';
  X.textBaseline = o.base || 'middle';
  X.direction = o.dir || 'ltr';
  if (o.ls !== undefined) X.letterSpacing = o.ls + 'px';
  if (o.alpha !== undefined) X.globalAlpha *= o.alpha;
  if (o.shadow) { X.shadowColor = o.shadow; X.shadowBlur = o.blur || 20; X.shadowOffsetY = o.sy || 0; }
  if (o.stroke) { X.lineJoin = 'round'; X.strokeStyle = o.stroke; X.lineWidth = o.lw || 8; X.strokeText(s, x, y); X.shadowColor = 'transparent'; }
  X.fillStyle = o.color || '#fff';
  X.fillText(s, x, y);
  X.restore();
}
function measure(s, font, ls = 0, dir = 'ltr') {
  X.save(); X.font = font; X.direction = dir; X.letterSpacing = ls + 'px';
  const w = X.measureText(s).width; X.restore(); return w;
}

// Top-view airliner, nose toward +x, spans x in [-1,1]
const PLANE_TOP = (() => {
  const up = [[1.0, 0], [0.95, -0.045], [0.82, -0.07], [0.22, -0.075], [-0.08, -0.64], [-0.22, -0.64], [-0.05, -0.075],
  [-0.62, -0.07], [-0.80, -0.30], [-0.92, -0.30], [-0.84, -0.06], [-0.96, -0.03], [-0.98, 0]];
  const lo = up.slice(1, -1).reverse().map(([x, y]) => [x, -y]);
  return up.concat(lo);
})();
function planeTop(x, y, size, ang, color = '#fff', alpha = 1) {
  X.save(); X.translate(x, y); X.rotate(ang); X.scale(size, size);
  X.globalAlpha *= alpha; X.fillStyle = color; X.beginPath();
  PLANE_TOP.forEach(([px, py], i) => i ? X.lineTo(px, py) : X.moveTo(px, py));
  X.closePath(); X.fill(); X.restore();
}
// Side-view airliner, nose toward +x, length L
function planeSide(x, y, L, ang, body = '#fff', accent = COL.orange) {
  X.save(); X.translate(x, y); X.rotate(ang); X.scale(L / 2, L / 2);
  // far wing
  X.fillStyle = '#9fb0cc';
  X.beginPath(); X.moveTo(0.1, 0.02); X.lineTo(-0.15, -0.28); X.lineTo(-0.26, -0.28); X.lineTo(-0.12, 0.02); X.fill();
  // fuselage
  X.fillStyle = body; X.beginPath();
  X.moveTo(1, 0.03); X.quadraticCurveTo(0.98, -0.1, 0.8, -0.11); X.lineTo(-0.75, -0.1);
  X.lineTo(-0.95, -0.42); X.lineTo(-1.04, -0.42); X.lineTo(-0.98, -0.06); X.lineTo(-1.0, 0.0);
  X.quadraticCurveTo(-0.9, 0.11, -0.7, 0.1); X.lineTo(0.85, 0.1); X.quadraticCurveTo(1.0, 0.1, 1, 0.03); X.fill();
  // tail accent
  X.fillStyle = accent; X.beginPath(); X.moveTo(-0.8, -0.12); X.lineTo(-0.95, -0.42); X.lineTo(-1.04, -0.42); X.lineTo(-0.99, -0.12); X.fill();
  // windows
  X.fillStyle = '#163a7a';
  for (let i = 0; i < 14; i++) { X.beginPath(); X.arc(0.62 - i * 0.095, -0.025, 0.018, 0, TAU); X.fill(); }
  X.beginPath(); X.moveTo(0.9, -0.05); X.lineTo(0.97, -0.03); X.lineTo(0.93, -0.0); X.lineTo(0.86, -0.02); X.fill();
  // near wing + engine
  X.fillStyle = '#dfe7f5';
  X.beginPath(); X.moveTo(0.18, 0.04); X.lineTo(-0.2, 0.42); X.lineTo(-0.32, 0.42); X.lineTo(-0.1, 0.05); X.fill();
  X.fillStyle = '#c7d3e8'; rr(-0.08, 0.13, 0.26, 0.09, 0.045); X.fill();
  X.restore();
}

function heart(x, y, s, color, alpha = 1) {
  X.save(); X.translate(x, y); X.scale(s, s); X.globalAlpha *= alpha; X.fillStyle = color;
  X.beginPath(); X.moveTo(0, 0.35);
  X.bezierCurveTo(-0.9, -0.25, -0.45, -0.95, 0, -0.45);
  X.bezierCurveTo(0.45, -0.95, 0.9, -0.25, 0, 0.35); X.fill(); X.restore();
}
function sparkle(x, y, r, alpha, color = '#fff') {
  if (alpha <= 0 || r <= 0) return;
  X.save(); X.translate(x, y); X.globalAlpha *= alpha; X.fillStyle = color;
  X.beginPath(); X.moveTo(0, -r); X.quadraticCurveTo(0, 0, r, 0); X.quadraticCurveTo(0, 0, 0, r);
  X.quadraticCurveTo(0, 0, -r, 0); X.quadraticCurveTo(0, 0, 0, -r); X.fill(); X.restore();
}
function pinIcon(x, y, s, color = COL.orange) {
  X.save(); X.translate(x, y); X.scale(s, s); X.fillStyle = color;
  X.beginPath(); X.moveTo(0, 0); X.bezierCurveTo(-6, -8, -14, -16, -14, -26); X.arc(0, -26, 14, Math.PI, 0); X.bezierCurveTo(14, -16, 6, -8, 0, 0); X.fill();
  X.fillStyle = '#fff'; circle(0, -26, 5.5); X.fill(); X.restore();
}
function checkMark(x, y, s, p, color = '#fff', lw = 10) {
  if (p <= 0) return;
  X.save(); X.translate(x, y); X.scale(s, s);
  X.strokeStyle = color; X.lineWidth = lw / s; X.lineCap = 'round'; X.lineJoin = 'round';
  const pts = [[-0.5, 0.0], [-0.15, 0.35], [0.55, -0.4]];
  const l1 = Math.hypot(.35, .35), l2 = Math.hypot(.7, .75), L = (l1 + l2) * p;
  X.beginPath(); X.moveTo(...pts[0]);
  if (L <= l1) X.lineTo(lerp(pts[0][0], pts[1][0], L / l1), lerp(pts[0][1], pts[1][1], L / l1));
  else { X.lineTo(...pts[1]); const q = (L - l1) / l2; X.lineTo(lerp(pts[1][0], pts[2][0], q), lerp(pts[1][1], pts[2][1], q)); }
  X.stroke(); X.restore();
}
function cloud(x, y, s, alpha = 1, color = '#fff') {
  X.save(); X.translate(x, y); X.scale(s, s); X.globalAlpha *= alpha; X.fillStyle = color; X.beginPath();
  [[0, 0, 60], [-70, 15, 45], [70, 18, 48], [-30, -30, 50], [35, -28, 45], [-110, 30, 30], [115, 32, 32]].forEach(([cx, cy, r]) => { X.moveTo(cx + r, cy); X.arc(cx, cy, r, 0, TAU); });
  X.rect(-120, 20, 240, 42);
  X.fill(); X.restore();
}

// Split-flap cell. changes: [[time, char], ...] sorted.
function flapCell(t, x, y, w, h, changes, font, o = {}) {
  let i = -1; for (let k = 0; k < changes.length; k++) if (changes[k][0] <= t) i = k;
  const cur = i >= 0 ? changes[i][1] : ' ';
  const prev = i > 0 ? changes[i - 1][1] : ' ';
  const dur = o.dur || 0.11;
  const p = i >= 0 ? clamp((t - changes[i][0]) / dur) : 1;
  const bg = o.bg || '#141d33', fg = o.fg || '#fff', r = o.r || 8;
  const mid = y + h / 2;
  const half = (ch, top) => {
    X.save(); X.beginPath(); X.rect(x - 2, top ? y - 2 : mid, w + 4, h / 2 + 2); X.clip();
    const g = X.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, o.bg2 || '#1f2b48'); g.addColorStop(.5, bg); g.addColorStop(1, o.bg3 || '#0d1426');
    X.fillStyle = g; rr(x, y, w, h, r); X.fill();
    X.fillStyle = fg; X.font = font; X.textAlign = 'center'; X.textBaseline = 'middle'; X.direction = o.dir || 'ltr';
    X.fillText(ch, x + w / 2, mid + (o.dy || 3));
    X.restore();
  };
  half(cur, true); half(p < 1 ? prev : cur, false);
  if (p < 1) {
    X.save(); X.translate(0, mid);
    if (p < .5) { X.scale(1, Math.cos(p * Math.PI)); X.translate(0, -mid); half(prev, true); X.fillStyle = `rgba(0,0,0,${p * .8})`; X.fillRect(x, y, w, h / 2); }
    else { X.scale(1, -Math.cos(p * Math.PI)); X.translate(0, -mid); half(cur, false); X.fillStyle = `rgba(0,0,0,${(1 - p) * .8})`; X.fillRect(x, mid, w, h / 2); }
    X.restore();
  }
  X.fillStyle = 'rgba(0,0,0,.55)'; X.fillRect(x, mid - 1.5, w, 3);
}

// Gold coin; flip = horizontal squash factor (-1..1), tilt = vertical squash (1 = facing camera)
function coin(x, y, r, flip = 1, tilt = 1, alpha = 1) {
  X.save(); X.translate(x, y); X.globalAlpha *= alpha; X.scale(Math.max(.06, Math.abs(flip)), tilt);
  const th = r * 0.22 * (1 - tilt) + 2;
  X.fillStyle = '#B86A00'; circle(0, th / Math.max(tilt, .2), r); X.fill();
  const g = X.createLinearGradient(-r, -r, r, r); g.addColorStop(0, '#FFE9A6'); g.addColorStop(.45, '#F9B934'); g.addColorStop(1, '#D9860B');
  X.fillStyle = g; circle(0, 0, r); X.fill();
  X.strokeStyle = 'rgba(160,90,0,.6)'; X.lineWidth = r * .09; circle(0, 0, r * .78); X.stroke();
  X.fillStyle = 'rgba(140,75,0,.85)'; X.font = `900 ${r * .62}px Montserrat`; X.textAlign = 'center'; X.textBaseline = 'middle'; X.fillText('DH', 0, r * .04);
  X.restore();
}

// images
const IMG = {};
function loadImg(name, src) { return new Promise(res => { const i = new Image(); i.onload = () => { IMG[name] = i; res(); }; i.onerror = () => res(); i.src = src; }); }

// offscreen canvas helper
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

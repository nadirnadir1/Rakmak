'use strict';
// ============================================================================
//  EFH reel — storyboard. All times are VOICE time (vt); video time = vt + OFF
// ============================================================================

// ------------------------------------------------------------ captions ------
// [word, start, end] (Darija, corrected from Whisper timings)
CAPS = [
  { w: [['واحد', 0.00, 0.42], ['كيقلب', 0.42, 0.88]] },
  { w: [['على', 0.88, 1.10], ['موعد', 1.10, 1.48], ['الفيزا', 1.48, 1.96]] },
  { w: [['باش', 1.96, 2.30], ['يسافر', 2.30, 2.58], ['لباريس', 2.58, 3.28]] },
  { w: [['وواحد', 3.55, 4.12], ['ممكن', 4.12, 4.66], ['يدخلها', 4.66, 5.28]] },
  { w: [['بلا', 5.28, 5.66], ['فيزا', 5.66, 6.00], ['سياحية', 6.00, 6.64]] },
  { w: [['غير', 6.64, 7.04], ['حيت', 7.04, 7.30], ['خدام', 7.30, 7.60]] },
  { w: [['فطاقم', 7.60, 8.10], ['الطائرة', 8.10, 8.64]] },
  { w: [['واللي', 8.95, 9.18], ['غادي', 9.18, 9.40], ['يفاجئك', 9.40, 9.97]] },
  { w: [['بجوجهم', 10.19, 10.78], ['مغاربة', 10.78, 11.45]] },
  { w: [['الفرق؟', 11.83, 12.33]], hide: true },
  { w: [['الثاني', 12.70, 13.10], ['خدام', 13.10, 13.50]] },
  { w: [['مضيف', 13.50, 13.88], ['طيران', 13.88, 14.54]] },
  { w: [['وهاشنو', 14.75, 15.32], ['فعلاً', 15.32, 15.96], ['كاين', 15.96, 16.32]] },
  { w: [['فوجهات', 16.54, 17.24], ['بحال', 17.24, 17.50]] },
  { w: [['فرانسا', 17.50, 18.12]] },
  { w: [['إسبانيا', 18.12, 18.80]] },
  { w: [['وبريطانيا', 18.80, 19.58]] },
  { w: [['طاقم', 19.58, 20.32], ['الطائرة', 20.32, 20.78], ['يقدر', 20.78, 21.22]] },
  { w: [['يستافد', 21.22, 21.72], ['من', 21.72, 21.88], ['إعفاءات', 21.88, 22.54]] },
  { w: [['خاصة', 22.54, 23.10], ['أثناء', 23.10, 23.40], ['الخدمة', 23.40, 24.02]] },
  { w: [['بشروط', 24.02, 24.70], ['ووثائق', 24.70, 25.40], ['محددة', 25.40, 26.06]] },
  { w: [['وهادي', 26.06, 26.82], ['غير', 26.82, 27.12], ['وحدة', 27.12, 27.50]] },
  { w: [['من', 27.50, 27.58], ['المميزات', 27.58, 28.32]] },
  { w: [['اللي', 28.32, 28.60], ['ماكيعرفوهاش', 28.60, 29.24]] },
  { w: [['بزاف', 29.24, 29.72], ['ديال', 29.72, 29.90], ['الناس', 29.90, 30.28]] },
  { w: [['على', 30.28, 30.42], ['هاد', 30.42, 30.62], ['المهنة', 30.62, 31.04]] },
  { w: [['السفر', 31.20, 31.92], ['لوجهات', 31.92, 32.42], ['مختلفة', 32.42, 33.30]] },
  { w: [['واكتشاف', 33.30, 33.94], ['مدن', 33.94, 34.24], ['جديدة', 34.24, 34.78]] },
  { w: [['خلال', 34.78, 35.16], ['بعض', 35.16, 35.54], ['التوقفات', 35.54, 36.34]] },
  { w: [['ولكن', 36.68, 37.00], ['هاد', 37.00, 37.30], ['التسهيلات', 37.30, 37.82]] },
  { w: [['مرتبطة', 37.82, 38.42], ['بالخدمة', 38.42, 38.96]] },
  { w: [['ماشي', 39.15, 39.36], ['بالسياحة', 39.36, 40.10]] },
  { w: [['وأمريكا', 40.44, 41.08], ['مثلاً', 41.08, 41.57]] },
  { w: [['ممكن', 41.78, 42.16], ['تطلب', 42.16, 42.56], ['فيزا', 42.56, 42.90]] },
  { w: [['خاصة', 42.90, 43.38], ['بالطاقم', 43.38, 44.04]] },
  { w: [['ودابا', 44.34, 44.86], ['السؤال', 44.86, 45.29]] },
  { w: [['واش', 45.47, 45.80], ['حتى', 45.80, 46.06], ['نتا', 46.06, 46.44], ['بغيتي', 46.44, 46.82]] },
  { w: [['تدخل', 46.82, 47.06], ['لعالم', 47.06, 47.44]] },
  { w: [['مضيفي', 47.44, 47.84], ['الطيران؟', 47.84, 48.50]] },
  { w: [['مدرسة', 48.82, 49.32], ['فلاي', 49.32, 49.58], ['حياني', 49.58, 50.14]] },
  { w: [['الخاصة', 50.14, 50.64], ['بمراكش', 50.64, 51.22]] },
  { w: [['كتقدم', 51.22, 51.98], ['ليك', 51.98, 52.18], ['تكوين', 52.18, 52.56]] },
  { w: [['مضيفات', 52.56, 53.26], ['ومضيفي', 53.26, 53.86], ['الطيران', 53.86, 54.61]], end: 54.66 },
  { w: [['التسجيل', 54.92, 55.34], ['مفتوح', 55.34, 56.05]], hide: true },
];

HEADER_HIDE = [[-10, -1], [48.45, 51.15]];   // big logo on screen (logo reveal, cover)
HEADER_BLUE = [[45.5, 48.25]];                // light background (aircraft door)

SHAKES.push(
  { t: 3.42, d: 0.3, a: 0.35 }, { t: 10.30, d: 0.55, a: 1.0 }, { t: 11.68, d: 0.6, a: 1.0 },
  { t: 17.45, d: 0.25, a: 0.5 }, { t: 18.08, d: 0.25, a: 0.5 }, { t: 18.76, d: 0.25, a: 0.5 },
  { t: 21.95, d: 0.5, a: 1.0 }, { t: 38.42, d: 0.25, a: 0.35 }, { t: 39.36, d: 0.35, a: 0.6 },
  { t: 48.52, d: 0.6, a: 0.9 }, { t: 54.92, d: 0.4, a: 0.7 }, { t: 55.34, d: 0.5, a: 1.0 }, { t: 56.62, d: 0.25, a: 0.35 },
);
FLASHES.push(
  { t: 11.68, d: 0.28, a: 0.85 }, { t: 17.45, d: 0.18, a: 0.5 }, { t: 18.08, d: 0.18, a: 0.5 }, { t: 18.76, d: 0.18, a: 0.5 },
  { t: 21.95, d: 0.14, a: 0.35 }, { t: 48.50, d: 0.4, a: 0.95 }, { t: 54.92, d: 0.15, a: 0.4 }, { t: 55.34, d: 0.2, a: 0.55 },
  { t: 60.80, d: 0.35, a: 0.3 },
);

// --------------------------------------------------------------- helpers ----
function full(ctx, name, ct, o = {}) { clip(ctx, name, ct, 0, 0, W, H, o); }
function darken(ctx, a, col = '6,20,46') { ctx.fillStyle = `rgba(${col},${a})`; ctx.fillRect(0, 0, W, H); }
// full-frame vertical gradient: colours hold beyond y0/y1, so there is never a hard edge
function gradV(ctx, y0, y1, c0, c1) {
  const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, c0); g.addColorStop(1, c1);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
function bgNavy(ctx, vt, glow = C.navy3) {
  const g = ctx.createRadialGradient(W / 2, H * 0.42, 50, W / 2, H * 0.42, H * 0.75);
  g.addColorStop(0, glow); g.addColorStop(1, '#030A1A');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
function rays(ctx, cx, cy, vt, col = '255,255,255', a = 0.06, n = 18, speed = 0.15) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(vt * speed); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const an = (i / n) * TAU, w = 0.05 + 0.04 * rnd(i, 3);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 2200, an - w, an + w); ctx.closePath();
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1500);
    g.addColorStop(0, `rgba(${col},${a * (0.6 + 0.4 * rnd(i, 7))})`); g.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = g; ctx.fill();
  }
  ctx.restore();
}
function bokeh(ctx, vt, n, seed, col = '255,200,140', amax = 0.5, rmax = 9) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const sp = 40 + rnd(i, seed) * 90;
    const x = rnd(i, seed + 1) * W + Math.sin(vt * 0.7 + i) * 30;
    const y = ((rnd(i, seed + 2) * (H + 200) - vt * sp) % (H + 200) + H + 200) % (H + 200) - 100;
    const r = 2 + rnd(i, seed + 3) * rmax;
    const a = amax * (0.4 + 0.6 * (0.5 + 0.5 * Math.sin(vt * 2 + i * 1.7)));
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.2);
    g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = g; ctx.fillRect(x - r * 2.2, y - r * 2.2, r * 4.4, r * 4.4);
  }
  ctx.restore();
}
function lightSweep(ctx, x, y, w, h, p, a = 0.45) {
  if (p <= 0 || p >= 1) return;
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  const cx = lerp(x - w * 0.6, x + w * 1.6, p);
  const g = ctx.createLinearGradient(cx - 160, y, cx + 160, y + h * 0.3);
  g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, `rgba(255,255,255,${a})`); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(x, y, w, h); ctx.restore();
}
function face(ctx, name, ct, fx, fy, src, x, y, r, ring = '#fff') {
  const im = vframe(name, Math.floor(ct * SRC_FPS));
  ctx.save();
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = C.navy2; ctx.fill(); ctx.clip();
  if (im) ctx.drawImage(im, fx * 1280 - src / 2, fy * 720 - src / 2, src, src, x - r, y - r, r * 2, r * 2);
  ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.lineWidth = 10; ctx.strokeStyle = ring; ctx.stroke(); ctx.restore();
}
function circleBadge(ctx, x, y, r, bg, icon, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fillStyle = bg; ctx.fill(); ctx.shadowColor = 'transparent';
  icon(ctx, 0, 0, r * 1.25); ctx.restore();
}
function moroccoStar(ctx, cx, cy, R, lw, p, col = C.maGreen) {
  if (p <= 0) return;
  const pts = [];
  for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + k * (TAU * 2 / 5); pts.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]); }
  let L = 0; const seg = [];
  for (let k = 0; k < 5; k++) { const d = Math.hypot(pts[k + 1][0] - pts[k][0], pts[k + 1][1] - pts[k][1]); seg.push(d); L += d; }
  ctx.save(); ctx.lineWidth = lw; ctx.strokeStyle = col; ctx.lineJoin = 'miter'; ctx.lineCap = p < 1 ? 'round' : 'butt';
  ctx.beginPath(); ctx.moveTo(...pts[0]);
  let rem = p * L;
  for (let k = 0; k < 5; k++) {
    if (rem >= seg[k]) { ctx.lineTo(...pts[k + 1]); rem -= seg[k]; }
    else { const u = rem / seg[k]; ctx.lineTo(lerp(pts[k][0], pts[k + 1][0], u), lerp(pts[k][1], pts[k + 1][1], u)); break; }
  }
  if (p >= 1) ctx.closePath();
  ctx.stroke(); ctx.restore();
}
function koutoubia(ctx, x, base, h, col) {
  const w = h * 0.24;
  ctx.save(); ctx.fillStyle = col; ctx.beginPath();
  const top = base - h * 0.74;
  ctx.rect(x - w / 2, top, w, h * 0.74);
  // merlons
  const m = 5, mw = w / (m * 2 - 1);
  for (let i = 0; i < m; i++) { const mx = x - w / 2 + i * mw * 2; ctx.moveTo(mx, top); ctx.lineTo(mx, top - mw * 0.9); ctx.lineTo(mx + mw * 0.5, top - mw * 1.5); ctx.lineTo(mx + mw, top - mw * 0.9); ctx.lineTo(mx + mw, top); }
  // lantern
  const lw = w * 0.38, lt = top - h * 0.17;
  ctx.rect(x - lw / 2, lt, lw, h * 0.17);
  ctx.moveTo(x - lw / 2, lt); ctx.quadraticCurveTo(x, lt - lw * 0.75, x + lw / 2, lt);
  ctx.fill();
  ctx.fillRect(x - w * 0.02, lt - lw * 0.62 - h * 0.08, w * 0.04, h * 0.08);
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(x, lt - lw * 0.62 - h * 0.012 - i * h * 0.024, w * (0.075 - i * 0.015), 0, TAU); ctx.fill(); }
  // window arches
  ctx.globalCompositeOperation = 'destination-out';
  for (let r = 0; r < 3; r++) {
    const yy = top + h * (0.14 + r * 0.2), aw = w * 0.22;
    ctx.beginPath(); ctx.rect(x - aw / 2, yy, aw, h * 0.08); ctx.arc(x, yy, aw / 2, Math.PI, 0); ctx.fill();
  }
  ctx.restore();
}
// split-flap character cell
const FLAP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
function flapCell(ctx, x, y, w, h, ch, vt, settle, id, col) {
  const flipping = vt < settle;
  let c = ch;
  if (flipping) {
    if (vt < settle - 0.9) c = ' ';
    else c = FLAP[Math.floor(rnd(id, Math.floor(vt * 22)) * FLAP.length)];
  }
  rr(ctx, x, y, w, h, 6); ctx.fillStyle = '#121620'; ctx.fill();
  const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, 'rgba(255,255,255,0.06)'); g.addColorStop(0.5, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.25)');
  ctx.fillStyle = g; ctx.fill();
  if (c !== ' ') {
    const ph = flipping ? (vt * 22) % 1 : 1;
    ctx.save(); ctx.translate(x + w / 2, y + h / 2);
    if (flipping) ctx.scale(1, 0.55 + 0.45 * Math.abs(Math.cos(ph * Math.PI)));
    ctx.font = font('JetBrains Mono', 800, h * 0.72); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = col; ctx.fillText(c, 0, h * 0.04); ctx.restore();
  }
  ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(x, y + h / 2 - 1.5, w, 3);
}
function confetti(ctx, vt, t0, n, ox, oy, seed) {
  const d = vt - t0; if (d < 0 || d > 4) return;
  const cols = [C.orange, '#fff', C.sky, C.gold, C.blue2, C.orange2];
  for (let i = 0; i < n; i++) {
    const an = -Math.PI / 2 + (rnd(i, seed) - 0.5) * 2.4, sp = 1300 + rnd(i, seed + 1) * 1500;
    const drag = 1.6, k = (1 - Math.exp(-drag * d)) / drag;
    const x = ox + Math.cos(an) * sp * k + Math.sin(d * 3 + i) * 30 * d;
    const y = oy + Math.sin(an) * sp * k + 0.5 * 1800 * d * d * 0.6;
    if (y > H + 50) continue;
    ctx.save(); ctx.translate(x, y); ctx.rotate(d * (4 + rnd(i, seed + 2) * 8) + i);
    ctx.scale(1, Math.cos(d * (6 + rnd(i, seed + 3) * 8) + i));
    ctx.globalAlpha = 1 - prog(d, 2.6, 4);
    ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(-11, -6, 22, 12); ctx.restore();
  }
}
function crewBadge(ctx, x, y, s, faceFn) {
  const w = 300 * s, h = 420 * s;
  ctx.save(); ctx.translate(x, y);
  ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 14;
  rr(ctx, -w / 2, 0, w, h, 26 * s); ctx.fillStyle = '#F7F9FF'; ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.save(); rr(ctx, -w / 2, 0, w, h, 26 * s); ctx.clip();
  const g = ctx.createLinearGradient(0, 0, 0, 120 * s); g.addColorStop(0, C.blue2); g.addColorStop(1, C.blue);
  ctx.fillStyle = g; ctx.fillRect(-w / 2, 0, w, 120 * s);
  ctx.fillStyle = C.orange; ctx.fillRect(-w / 2, 120 * s, w, 8 * s);
  ctx.restore();
  rr(ctx, -40 * s, 22 * s, 80 * s, 16 * s, 8 * s); ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fill();
  txt(ctx, 'CABIN CREW', 0, 84 * s, { s: 34 * s, w: 900, ls: 3 * s });
  faceFn(ctx, 0, 222 * s, 72 * s);
  ctx.fillStyle = '#C9D2E6'; rr(ctx, -95 * s, 318 * s, 190 * s, 14 * s, 7 * s); ctx.fill(); rr(ctx, -70 * s, 344 * s, 140 * s, 12 * s, 6 * s); ctx.fill();
  for (let i = 0; i < 26; i++) { const bw = (1 + Math.floor(rnd(i, 4) * 3)) * 2 * s; ctx.fillStyle = '#1A2238'; ctx.fillRect(-100 * s + i * 7.8 * s, 372 * s, bw, 30 * s); }
  ctx.restore();
}

// ================================================================ SCENES ====

// ---- S1: visa appointment struggle -----------------------------------------
function visaCard(ctx, vt, x, y, w, h) {
  frosted(ctx, x, y, w, h, 34, { tint: 'rgba(250,252,255,0.86)', border: 'rgba(255,255,255,0.9)' });
  // header
  ctx.save();
  flag(ctx, IMG.flagFR, x + 36, y + 34, 84, 56, vt, { amp: 3 });
  txt(ctx, 'Rendez-vous Visa', x + 146, y + 52, { align: 'left', s: 40, w: 800, color: C.ink });
  txt(ctx, 'Schengen · France', x + 146, y + 92, { align: 'left', s: 27, w: 500, color: '#5A6683' });
  // spinner / clock
  const err = vt >= 1.55;
  if (!err) {
    ctx.save(); ctx.translate(x + w - 70, y + 66); ctx.rotate(vt * 7);
    ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.strokeStyle = C.blue2;
    ctx.beginPath(); ctx.arc(0, 0, 24, 0, Math.PI * 1.4); ctx.stroke(); ctx.restore();
  } else iClock(ctx, x + w - 70, y + 66, 62, C.red, vt * 3);
  // grid
  const cols = 7, rows = 3, gx = x + 36, gy = y + 140, cw = (w - 72) / cols, chh = 78;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const i = r * cols + c, cx = gx + c * cw, cy = gy + r * (chh + 12);
    const ap = Ez.outBack(prog(vt, 0.12 + i * 0.018, 0.42 + i * 0.018));
    if (ap <= 0) continue;
    const scanT = 0.45 + i * 0.05, dead = vt > scanT;
    ctx.save(); ctx.translate(cx + cw / 2, cy + chh / 2); ctx.scale(ap, ap);
    rr(ctx, -cw / 2 + 5, -chh / 2, cw - 10, chh, 14);
    ctx.fillStyle = dead ? '#EEF0F5' : '#E3ECFF'; ctx.fill();
    if (Math.abs(vt - scanT) < 0.06) { ctx.lineWidth = 4; ctx.strokeStyle = C.blue2; ctx.stroke(); }
    txt(ctx, String(i + 3), 0, 2, { s: 34, w: 800, color: dead ? '#A9B0C2' : C.blue });
    if (dead) {
      const p = prog(vt, scanT, scanT + 0.1);
      ctx.strokeStyle = 'rgba(232,53,59,0.8)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-cw * 0.28, chh * 0.28); ctx.lineTo(lerp(-cw * 0.28, cw * 0.28, p), lerp(chh * 0.28, -chh * 0.28, p)); ctx.stroke();
    }
    ctx.restore();
  }
  // status
  const sy = y + h - 74;
  if (!err) {
    txt(ctx, 'Recherche de créneaux' + '...'.slice(0, 1 + Math.floor(vt * 4) % 3), x + w / 2, sy, { s: 32, w: 700, color: '#5A6683' });
  } else {
    const p = Ez.outBack2(prog(vt, 1.55, 1.8)), shx = Math.sin(vt * 70) * 12 * (1 - prog(vt, 1.55, 1.9));
    ctx.save(); ctx.translate(x + w / 2 + shx, sy); ctx.scale(p, p);
    rr(ctx, -330, -40, 660, 80, 40); ctx.fillStyle = C.red; ctx.fill();
    iCross(ctx, -282, 0, 44, '#fff', 1, 7);
    txt(ctx, 'Aucun créneau disponible', 22, 2, { s: 34, w: 800 });
    ctx.restore();
  }
  ctx.restore();
}
scene(-1, 3.40, (ctx, vt) => {
  const ct = 3.15 + (vt + 0.2) * 0.85;
  full(ctx, 'v7', ct, { fx: 0.37, zoom: 1.06 + (vt + 0.2) * 0.012 });
  gradV(ctx, 700, 1400, 'rgba(6,20,46,0)', 'rgba(6,20,46,0.55)');
  blurSnap(ctx);
  // card pops out of the laptop
  const ap = spring(vt + 0.12, 1.4, 6.5), out = Ez.inBack(prog(vt, 3.18, 3.4));
  ctx.save();
  ctx.translate(540, 1030); ctx.scale(lerp(0.4, 1, ap) * (1 - out * 0.7), lerp(0.4, 1, ap) * (1 - out * 0.7));
  ctx.rotate((1 - ap) * 0.12); ctx.globalAlpha = clamp(ap * 2) * (1 - out); ctx.translate(-540, -1030);
  visaCard(ctx, vt, 90, 790, 900, 480);
  ctx.restore();
  // hook headline
  const hk = prog(vt, 2.02, 2.28);
  gradV(ctx, 0, 620, `rgba(6,20,46,${0.7 * (1 - hk)})`, 'rgba(6,20,46,0)');
  const l1 = Ez.outBack2(prog(vt, -0.2, 0.05)), l2 = Ez.outBack2(prog(vt, 0.1, 0.35));
  ctx.save(); ctx.globalAlpha = 1 - hk;
  if (l1 > 0) { ctx.save(); ctx.translate(540, 330); ctx.scale(l1, l1); txt(ctx, 'علاش واحد خاصو الفيزا', 0, 0, { f: 'Lalezar', w: 400, s: 96, color: '#fff', shadow: 'rgba(0,0,0,0.75)', sb: 26 }); ctx.restore(); }
  if (l2 > 0) {
    ctx.save(); ctx.translate(540, 470); ctx.scale(l2, l2); ctx.rotate(-0.025);
    const ww = tw(ctx, 'والآخر لا؟', { f: 'Lalezar', w: 400, s: 104 }) + 70;
    rr(ctx, -ww / 2, -72, ww, 144, 30); const og = ctx.createLinearGradient(0, -72, 0, 72); og.addColorStop(0, C.orange2); og.addColorStop(1, '#E35F00');
    ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 24; ctx.fillStyle = og; ctx.fill(); ctx.shadowColor = 'transparent';
    txt(ctx, 'والآخر لا؟', 0, 8, { f: 'Lalezar', w: 400, s: 104, color: '#fff' });
    ctx.restore();
  }
  ctx.restore();
  // Paris dream polaroid
  const pp = spring(vt - 2.25, 1.5, 6), pout = prog(vt, 3.2, 3.4);
  if (vt > 2.25) {
    ctx.save(); ctx.translate(235, 600); ctx.rotate(-0.1 + (1 - pp) * 0.5); ctx.scale(pp * (1 - pout), pp * (1 - pout));
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
    ctx.fillStyle = '#fff'; ctx.fillRect(-170, -170, 340, 400); ctx.shadowColor = 'transparent';
    clip(ctx, 'v3', 0.3 + (vt - 2.25) * 0.8, -150, -150, 300, 300, { fx: 0.66 });
    txt(ctx, 'Paris ?', 0, 190, { f: 'Caveat', w: 700, s: 58, color: '#1B2340' });
    ctx.restore();
  }
});

// ---- S2: split screen — visa vs crew ---------------------------------------
scene(3.40, 8.75, (ctx, vt) => {
  const op = Ez.outExpo(prog(vt, 3.40, 3.9));
  const ex = Ez.ioExpo(prog(vt, 7.45, 7.95));
  const mid = lerp(lerp(H, 960, op), -40, ex);
  // top: still waiting (desaturated)
  if (mid > 0) {
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, mid); ctx.clip();
    full(ctx, 'v7', 3.15 + (vt + 0.2) * 0.85, { fx: 0.37, fy: 0.3, zoom: 1.06 + (vt + 0.2) * 0.012 });
    // label
    const lp = spring(vt - 3.6, 1.6, 6);
    if (vt > 3.6) {
      pill(ctx, 540, Math.max(300, mid - 150), 'VISA ?', { bg: C.red, s: 44, scale: lp, ls: 2, icon: (c, x, y, s, col) => iClock(c, x, y, s, col, vt * 2) });
    }
    ctx.restore();
  }
  // bottom: crew walks through
  ctx.save(); ctx.beginPath(); ctx.rect(0, mid, W, H - mid); ctx.clip();
  if (vt < 7.62) clip(ctx, 'v6', (vt - 3.40) * 0.93, 0, mid, W, H - mid, { fx: 0.35, fy: 0.38 });
  else full(ctx, 'v4', 2.55 + (vt - 7.62), { fx: 0.235, zoom: 1.04 });
  const blp = spring(vt - 3.75, 1.6, 6);
  if (vt > 3.75 && ex < 1) pill(ctx, 540, mid + 120, 'CREW', { bg: C.green, s: 44, scale: blp * (1 - ex), ls: 3, icon: (c, x, y, s, col) => iCheck(c, x, y, s, col) });
  // tourist visa chip gets struck out
  if (vt > 5.28 && vt < 7.7) {
    const cp = spring(vt - 5.28, 1.6, 6.5), sp = Ez.outC(prog(vt, 5.7, 6.0)), gp = Ez.outBack2(prog(vt, 6.05, 6.35));
    const go = 1 - prog(vt, 7.4, 7.65);
    ctx.save(); ctx.translate(800, mid + 245); ctx.rotate(-0.08); ctx.scale(cp * go, cp * go);
    ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10;
    rr(ctx, -150, -95, 300, 190, 22); ctx.fillStyle = '#F4F1E8'; ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.fillStyle = C.blue; rr(ctx, -150, -95, 300, 56, 22); ctx.fill(); ctx.fillRect(-150, -60, 300, 22);
    txt(ctx, 'TOURIST', 0, -66, { s: 26, w: 800, ls: 4 });
    txt(ctx, 'VISA', 0, 18, { s: 76, w: 900, color: C.blue, ls: 4 });
    ctx.strokeStyle = C.red; ctx.lineWidth = 14; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-130, 70); ctx.lineTo(lerp(-130, 130, sp), lerp(70, -60, sp)); ctx.stroke();
    if (gp > 0) circleBadge(ctx, 140, -90, 46, C.green, (c, x, y, s) => iCheck(c, x, y, s, '#fff'), gp);
    ctx.restore();
  }
  ctx.restore();
  // divider + VS
  if (op > 0 && ex < 1) {
    ctx.save();
    const lw = W * Ez.outExpo(prog(vt, 3.45, 3.85));
    ctx.shadowColor = C.orange; ctx.shadowBlur = 30; ctx.fillStyle = C.orange;
    ctx.fillRect(W / 2 - lw / 2, mid - 5, lw, 10);
    const vp = spring(vt - 3.62, 1.3, 5);
    ctx.translate(W / 2, mid); ctx.rotate((1 - vp) * -1.2); ctx.scale(vp, vp);
    ctx.beginPath(); ctx.arc(0, 0, 70, 0, TAU); ctx.fillStyle = C.orange; ctx.fill();
    ctx.lineWidth = 8; ctx.strokeStyle = '#fff'; ctx.stroke(); ctx.shadowColor = 'transparent';
    txt(ctx, 'VS', 0, 4, { s: 62, w: 900, color: '#fff' });
    ctx.restore();
  }
  // CABIN CREW badge after expansion
  if (vt > 7.7) {
    const bp = spring(vt - 7.72, 1.4, 6), by = 1170;
    ctx.save(); ctx.translate(540, by); ctx.scale(bp, bp);
    blurSnap(ctx);
    ctx.translate(-540, -by);
    frosted(ctx, 540 - 380, by - 72, 760, 144, 72, { tint: 'rgba(6,20,46,0.6)' });
    iWings(ctx, 262, by, 112, C.gold);
    txt(ctx, 'CABIN CREW', 640, by + 4, { s: 62, w: 900, ls: 4, color: '#fff' });
    ctx.restore();
  }
});

// ---- S3: both are Moroccan ---------------------------------------------------
const MAFLAG = mk(1080, 1920);
scene(8.75, 11.68, (ctx, vt) => {
  // build the flag with the star being drawn
  const g = MAFLAG.getContext('2d');
  g.fillStyle = C.maRed; g.fillRect(0, 0, 1080, 1920);
  const sp = Ez.ioC(prog(vt, 8.85, 9.75));
  moroccoStar(g, 540, 830, 330, 30, sp);
  const pz = 1 + 0.06 * Ez.outBack(prog(vt, 9.35, 9.6)) + (vt - 8.75) * 0.015;
  const suck = Ez.inExpo(prog(vt, 11.35, 11.68));
  ctx.save(); ctx.translate(540, 900); ctx.scale(pz * (1 - suck * 0.25), pz * (1 - suck * 0.25)); ctx.translate(-540, -900);
  flag(ctx, MAFLAG, -40, -60, W + 80, H + 120, vt, { amp: 34, k: 1.4, sp: 3.2 });
  // star glow
  if (sp > 0 && sp < 1) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5 * (1 - sp);
    moroccoStar(ctx, 540, 830, 330, 60, sp, 'rgba(120,255,170,0.6)'); ctx.restore();
  }
  lightSweep(ctx, 0, 0, W, H, prog(vt, 9.75, 10.4), 0.35);
  // passport + avatars
  const dk = Ez.outC(prog(vt, 10.0, 10.3));
  darken(ctx, 0.45 * dk, '20,0,0');
  if (vt > 10.02) {
    const f = Ez.outExpo(prog(vt, 10.02, 10.3));
    const pw = 400, ph = pw * IMG.passport.height / IMG.passport.width;
    ctx.save(); ctx.translate(540, lerp(-700, 860, f)); ctx.rotate(lerp(0.6, -0.05, f));
    ctx.scale(Math.max(0.05, Math.abs(Math.cos((1 - f) * Math.PI * 1.5))), 1);
    ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 26;
    ctx.drawImage(IMG.passport, -pw / 2, -ph / 2, pw, ph); ctx.shadowColor = 'transparent';
    ctx.save(); ctx.beginPath(); rr(ctx, -pw / 2 + 6, -ph / 2 + 6, pw - 12, ph - 12, 24); ctx.clip();
    lightSweep(ctx, -pw / 2, -ph / 2, pw, ph, prog(vt, 10.35, 10.95), 0.55); ctx.restore();
    ctx.restore();
  }
  const av = [[185, 1035, 'v7', 4.58, 0.335, 0.235, 280, 10.42, 'VISA ?', C.red], [895, 1035, 'v4', 8.58, 0.414, 0.27, 260, 10.55, 'CREW', C.green]];
  for (const [x, y, cl, ct, fx, fy, src, t0, lab, col] of av) {
    if (vt < t0) continue;
    const s = spring(vt - t0, 1.5, 6);
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    face(ctx, cl, ct, fx, fy, src, 0, 0, 125);
    pill(ctx, 0, 175, lab, { bg: col, s: 32, ls: 2 });
    const mp = Ez.outBack2(prog(vt, 10.8 + (x > 540 ? 0.1 : 0), 11.05 + (x > 540 ? 0.1 : 0)));
    if (mp > 0) {
      ctx.save(); ctx.translate(88, -88); ctx.scale(mp, mp);
      ctx.beginPath(); ctx.arc(0, 0, 46, 0, TAU); ctx.fillStyle = C.maRed; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#fff'; ctx.stroke();
      moroccoStar(ctx, 0, 3, 26, 5, 1); ctx.restore();
    }
    ctx.restore();
  }
  ctx.restore();
});

// ---- S4a: "الفرق؟" big type ------------------------------------------------
scene(11.68, 12.62, (ctx, vt) => {
  bgNavy(ctx, vt, '#16306a');
  rays(ctx, 540, 900, vt, '247,129,5', 0.10, 22, 0.35);
  bokeh(ctx, vt, 30, 11);
  const p = Ez.outExpo(prog(vt, 11.68, 11.95));
  const s = lerp(2.4, 1, p) * (1 + (vt - 11.68) * 0.06) * (1 + 3 * Ez.inExpo(prog(vt, 12.42, 12.62)));
  const rgb = (1 - p) * 40 + Math.max(0, Math.sin(vt * 40)) * 4;
  ctx.save(); ctx.translate(540, 880); ctx.scale(s, s);
  ctx.globalCompositeOperation = 'lighter';
  txt(ctx, 'الفرق؟', -rgb, 0, { f: 'Lalezar', w: 400, s: 270, color: 'rgba(255,40,60,0.75)' });
  txt(ctx, 'الفرق؟', rgb, 0, { f: 'Lalezar', w: 400, s: 270, color: 'rgba(40,200,255,0.75)' });
  ctx.globalCompositeOperation = 'source-over';
  txt(ctx, 'الفرق؟', 0, 0, { f: 'Lalezar', w: 400, s: 270, color: '#fff', shadow: 'rgba(247,129,5,0.8)', sb: 60, sy: 0 });
  ctx.restore();
  // underline swoosh
  const up = Ez.outExpo(prog(vt, 11.9, 12.2));
  ctx.save(); ctx.strokeStyle = C.orange; ctx.lineWidth = 18; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(540 + 300, 1080); ctx.quadraticCurveTo(540, 1130, lerp(840, 240, up), 1070 + 10 * up); ctx.stroke(); ctx.restore();
});

// ---- S4b: the second one is cabin crew --------------------------------------
scene(12.62, 14.65, (ctx, vt) => {
  const ct = 7.0 + (vt - 12.62);
  full(ctx, 'v4', ct, { fx: lerp(0.3, 0.47, Ez.ioQ(prog(ct, 7.0, 9.0))), zoom: 1.04 + (vt - 12.62) * 0.03 });
  gradV(ctx, 0, 500, 'rgba(6,20,46,0.55)', 'rgba(6,20,46,0)');
  // swinging crew badge
  if (vt > 13.4) {
    const d = vt - 13.4;
    const drop = Ez.outBack(prog(d, 0, 0.45));
    const ang = 0.55 * Math.exp(-2.6 * d) * Math.cos(d * 7.5);
    ctx.save(); ctx.translate(850, lerp(-760, -30, drop)); ctx.rotate(ang);
    ctx.fillStyle = C.blue2; ctx.fillRect(-14, 0, 28, 330);
    ctx.fillStyle = C.orange; ctx.fillRect(-14, 0, 6, 330);
    ctx.fillStyle = '#B9C2D6'; rr(ctx, -26, 318, 52, 34, 8); ctx.fill();
    crewBadge(ctx, 0, 345, 1.0, (c, x, y, r) => face(c, 'v4', 8.58, 0.414, 0.27, 240, x, y, r, C.orange));
    ctx.restore();
  }
});

// ---- S5: Morocco (full territory, flag map) -> routes to Europe -------------
const DEST = { MAD: ['724', 16.25, 'MADRID'], CDG: ['250', 16.42, 'PARIS'], LHR: ['826', 16.6, 'LONDON'] };
const MA_TMP = mk(760, 820);
function cam(ctx, cx, cy, s, sx, sy) { ctx.translate(sx, sy); ctx.scale(s, s); ctx.translate(-cx, -cy); }
scene(14.65, 17.45, (ctx, vt) => {
  bgNavy(ctx, vt, '#0E2A60');
  const cs = MAP.cities, rak = cs.RAK, [mx, my, mw, mh] = MAP.ma;
  // camera A: the whole of Morocco; camera B: Morocco's north + western Europe
  const A = { cx: mx + mw / 2, cy: my + mh / 2, s: Math.min(900 / mw, 1000 / mh) * (1 + 0.035 * prog(vt, 14.65, 15.9)), sy: 790 };
  const B = { cx: 505, cy: 905, s: 0.99, sy: 800 };
  const k = Ez.ioC(prog(vt, 15.88, 16.5));
  const cx = lerp(A.cx, B.cx, k), cy = lerp(A.cy, B.cy, k), s = lerp(A.s, B.s, k) * (1 + 0.02 * prog(vt, 16.5, 17.45)), sy = lerp(A.sy, B.sy, k);
  ctx.save(); cam(ctx, cx, cy, s, 540, sy);
  // neighbour dots ripple out from Marrakech
  const R = (vt - 14.55) * 1300;
  const arrived = {};
  for (const v of Object.values(DEST)) arrived[v[0]] = prog(vt, v[1] + 0.45, v[1] + 0.7);
  for (const [x, y, id] of MAP.dots) {
    if (id === '504' || id === '732') continue;
    const a = clamp((R - Math.hypot(x - rak[0], y - rak[1])) / 220);
    if (a <= 0) continue;
    const ar = arrived[id] || 0;
    ctx.fillStyle = ar > 0
      ? `rgba(${Math.round(lerp(90, 255, ar))},${Math.round(lerp(130, 200, ar))},${Math.round(lerp(220, 120, ar))},${a * lerp(0.42, 1, ar)})`
      : `rgba(90,130,220,${a * 0.42})`;
    ctx.beginPath(); ctx.arc(x, y, 4.6, 0, TAU); ctx.fill();
  }
  // Morocco — the school's map, full territory
  const mp = Ez.outBack(prog(vt, 14.62, 15.05)), ma = clamp(prog(vt, 14.6, 14.85));
  const glow = 0.55 + 0.25 * Math.sin(vt * 5);
  ctx.save(); ctx.translate(mx + mw / 2, my + mh / 2); ctx.scale(lerp(0.9, 1, mp), lerp(0.9, 1, mp)); ctx.translate(-(mx + mw / 2), -(my + mh / 2));
  ctx.globalAlpha = ma;
  ctx.shadowColor = `rgba(255,70,60,${glow * 0.55})`; ctx.shadowBlur = 26;
  ctx.drawImage(IMG.morocco, mx, my, mw, mh);
  ctx.restore();
  // light sweep clipped to the country shape
  const sw = prog(vt, 15.05, 15.75);
  if (sw > 0 && sw < 1) {
    const g = MA_TMP.getContext('2d'); g.clearRect(0, 0, 760, 820);
    g.globalCompositeOperation = 'source-over'; g.drawImage(IMG.morocco, 0, 0, 760, 820);
    g.globalCompositeOperation = 'source-atop';
    const bx = lerp(-300, 1060, sw), lg = g.createLinearGradient(bx - 150, 0, bx + 150, 260);
    lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(0.5, 'rgba(255,255,255,0.55)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = lg; g.fillRect(0, 0, 760, 820);
    g.globalCompositeOperation = 'destination-in'; g.drawImage(IMG.morocco, 0, 0, 760, 820);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.8; ctx.drawImage(MA_TMP, mx, my, mw, mh); ctx.restore();
  }
  // arcs to Europe
  for (const [key, [id, t0, label]] of Object.entries(DEST)) {
    const c = cs[key]; const p = Ez.ioC(prog(vt, t0, t0 + 0.5));
    if (p <= 0) continue;
    const qx = (rak[0] + c[0]) / 2 - 170, qy = (rak[1] + c[1]) / 2 - 40;
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 5 / s; ctx.setLineDash([16 / s, 12 / s]); ctx.lineDashOffset = -vt * 60;
    ctx.beginPath(); ctx.moveTo(rak[0], rak[1]);
    const N = 40; let px = rak[0], py = rak[1], ang = 0;
    for (let i = 1; i <= N * p; i++) {
      const u = i / N, x = (1 - u) * (1 - u) * rak[0] + 2 * (1 - u) * u * qx + u * u * c[0], y = (1 - u) * (1 - u) * rak[1] + 2 * (1 - u) * u * qy + u * u * c[1];
      ang = Math.atan2(y - py, x - px); px = x; py = y; ctx.lineTo(x, y);
    }
    ctx.stroke(); ctx.restore();
    if (p < 1) iPlane(ctx, px, py, 30 / s, ang + Math.PI / 2, '#fff');
    const pp = Ez.outBack2(prog(vt, t0 + 0.45, t0 + 0.7));
    if (pp > 0) {
      ctx.save(); ctx.translate(c[0], c[1]); ctx.scale(pp / s, pp / s);
      ctx.beginPath(); ctx.arc(0, 0, 16, 0, TAU); ctx.fillStyle = C.gold; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = '#fff'; ctx.stroke();
      txt(ctx, label, 30, 0, { align: 'left', s: 40, w: 900, ls: 3, color: '#fff', shadow: 'rgba(0,0,0,0.7)', sb: 12, sy: 3 });
      ctx.restore();
    }
  }
  // Marrakech pin
  ctx.save(); ctx.translate(rak[0], rak[1]); ctx.scale(1 / s, 1 / s);
  if (vt > 14.95) for (let i = 0; i < 3; i++) {
    const ph = ((vt * 0.9 + i / 3) % 1);
    ctx.beginPath(); ctx.arc(0, 0, 20 + ph * 110, 0, TAU); ctx.strokeStyle = `rgba(255,200,60,${(1 - ph) * 0.85})`; ctx.lineWidth = 5; ctx.stroke();
  }
  const pinP = spring(vt - 14.95, 1.6, 6);
  ctx.scale(pinP, pinP);
  iPin(ctx, 0, 0, 86, C.orange);
  txt(ctx, 'MARRAKECH', 0, 52, { s: 40, w: 900, ls: 4, color: '#fff', shadow: 'rgba(0,0,0,0.75)', sb: 12, sy: 3 });
  ctx.restore();
  ctx.restore();
});

// ---- S6: France / Spain / UK -------------------------------------------------
const CITIES = [
  [17.45, 'v3', 0.55, 0.69, 'flagFR', 'FRANCE'],
  [18.08, 'v3', 3.45, 0.56, 'flagES', 'ESPAÑA'],
  [18.76, 'v3', 6.75, 0.8, 'flagUK', 'UNITED KINGDOM'],
];
scene(17.45, 19.55, (ctx, vt) => {
  let k = 0; for (let i = 0; i < 3; i++) if (vt >= CITIES[i][0]) k = i;
  const [t0, cl, c0, fx, fk, name] = CITIES[k];
  const d = vt - t0;
  full(ctx, cl, c0 + d * 0.9, { fx, zoom: lerp(1.18, 1.0, Ez.outExpo(prog(d, 0, 0.45))) + d * 0.04 });
  gradV(ctx, 0, 420, 'rgba(6,20,46,0.55)', 'rgba(6,20,46,0)');
  gradV(ctx, 720, 1500, 'rgba(6,20,46,0)', 'rgba(6,20,46,0.7)');
  // progress dots
  for (let i = 0; i < 3; i++) {
    const x = 540 + (i - 1) * 46;
    ctx.beginPath(); ctx.arc(x, 815, i === k ? 13 : 9, 0, TAU); ctx.fillStyle = i <= k ? C.orange : 'rgba(255,255,255,0.45)'; ctx.fill();
  }
  // flag card
  const fp = spring(d, 1.7, 6.5);
  const img = IMG[fk];
  ctx.save(); ctx.translate(540, 1005); ctx.scale(fp, fp); ctx.rotate((1 - fp) * 0.2);
  flag(ctx, img, -210, -140, 420, 280, vt, { amp: 13, shadow: true, k: 1.6, sp: 6 });
  ctx.restore();
  const np = Ez.outExpo(prog(d, 0.06, 0.4));
  ctx.save(); ctx.globalAlpha = np;
  txt(ctx, name, 540, 1235 + (1 - np) * 50, { s: name.length > 8 ? 70 : 92, w: 900, ls: 8, color: '#fff', shadow: 'rgba(0,0,0,0.7)', sb: 24 });
  ctx.restore();
});

// ---- S7a: passport stamp ------------------------------------------------------
scene(19.55, 23.95, (ctx, vt) => {
  const ct = vt - 15.617;
  full(ctx, 'v6', ct, { fx: ct < 4.17 ? 0.42 : 0.5, zoom: 1.04 + (vt - 19.55) * 0.025 });
  gradV(ctx, 0, 1000, 'rgba(6,20,46,0.45)', 'rgba(6,20,46,0)');
  if (vt > 21.78) {
    const p = Ez.inC(prog(vt, 21.78, 21.95));
    const s = lerp(2.8, 1, p), a = clamp(p * 1.4);
    const settle = 1 + 0.04 * Math.sin((vt - 21.95) * 30) * Math.exp(-(vt - 21.95) * 12) * (vt > 21.95 ? 1 : 0);
    ctx.save(); ctx.translate(540, 620); ctx.rotate(-0.16); ctx.scale(s * settle, s * settle); ctx.globalAlpha = a;
    const ink = '#22E07F';
    ctx.save(); rr(ctx, -340, -180, 680, 360, 46); ctx.fillStyle = 'rgba(4,16,30,0.55)'; ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 40; ctx.fill(); ctx.restore();
    ctx.lineWidth = 12; ctx.strokeStyle = ink; rr(ctx, -330, -170, 660, 340, 40); ctx.stroke();
    ctx.lineWidth = 5; rr(ctx, -305, -145, 610, 290, 28); ctx.stroke();
    txt(ctx, 'CREW', 0, -95, { s: 54, w: 900, ls: 18, color: ink });
    txt(ctx, 'إعفاء', 0, 8, { f: 'Lalezar', w: 400, s: 150, color: ink });
    txt(ctx, 'ON DUTY ✓', 0, 112, { s: 44, w: 800, ls: 8, color: ink });
    // ink texture
    ctx.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 70; i++) { ctx.beginPath(); ctx.arc((rnd(i, 1) - 0.5) * 640, (rnd(i, 2) - 0.5) * 320, 1 + rnd(i, 3) * 2.5, 0, TAU); ctx.fill(); }
    ctx.restore();
    // splatter
    if (vt > 21.95) {
      const sp = Ez.outExpo(prog(vt, 21.95, 22.2));
      for (let i = 0; i < 14; i++) {
        const an = rnd(i, 9) * TAU, r = 380 + rnd(i, 8) * 120 * sp;
        ctx.beginPath(); ctx.arc(540 + Math.cos(an) * r, 620 + Math.sin(an) * r * 0.55, 3 + rnd(i, 7) * 8 * sp, 0, TAU);
        ctx.fillStyle = 'rgba(24,184,102,0.7)'; ctx.fill();
      }
    }
  }
});

// ---- S7b: conditions & documents ---------------------------------------------
const DOCS = [
  [24.05, iPassport, 'جواز سفر ساري المفعول', 'Passport'],
  [24.62, iCard, 'بطاقة عضو الطاقم', 'Crew Member Certificate'],
  [25.2, iDoc, 'وثائق الرحلة', 'Flight documents'],
];
scene(23.95, 26.0, (ctx, vt) => {
  full(ctx, 'v4', 0.15 + (vt - 23.95) * 0.9, { fx: 0.4, zoom: 1.08 });
  darken(ctx, 0.5);
  blurSnap(ctx);
  const cp = spring(vt - 23.98, 1.4, 6.5);
  const x = 80, y = 400, w = 920, h = 760;
  ctx.save(); ctx.translate(540, y + h / 2); ctx.scale(lerp(0.85, 1, cp), lerp(0.85, 1, cp)); ctx.globalAlpha = clamp(cp * 1.5); ctx.translate(-540, -(y + h / 2));
  frosted(ctx, x, y, w, h, 40, { tint: 'rgba(6,20,46,0.6)' });
  iWarn(ctx, x + w - 80, y + 92, 70, C.orange, '#0B1A3A');
  txt(ctx, 'شروط ووثائق محددة', x + w - 140, y + 96, { align: 'right', s: 54, w: 900, color: '#fff' });
  ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(x + 50, y + 170, w - 100, 3);
  DOCS.forEach(([t0, ic, ar, la], i) => {
    const p = spring(vt - t0, 1.5, 6.5); if (vt < t0) return;
    const ry = y + 280 + i * 170;
    ctx.save(); ctx.translate((1 - p) * 300, 0); ctx.globalAlpha *= clamp(p * 2);
    rr(ctx, x + 40, ry - 70, w - 80, 140, 30); ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fill();
    ctx.beginPath(); ctx.arc(x + w - 120, ry, 50, 0, TAU); ctx.fillStyle = C.blue2; ctx.fill();
    ic(ctx, x + w - 120, ry, 66, '#fff');
    txt(ctx, ar, x + w - 200, ry - 16, { align: 'right', s: 46, w: 800 });
    txt(ctx, la, x + w - 200, ry + 36, { align: 'right', s: 26, w: 600, color: 'rgba(255,255,255,0.65)', dir: 'ltr' });
    const kp = Ez.outBack2(prog(vt, t0 + 0.12, t0 + 0.35));
    if (kp > 0) circleBadge(ctx, x + 120, ry, 44, C.green, (c, xx, yy, s) => iCheck(c, xx, yy, s, '#fff', prog(vt, t0 + 0.15, t0 + 0.35)), kp);
    ctx.restore();
  });
  ctx.restore();
});

// ---- S8: one perk among many -------------------------------------------------
const PERKS = [
  [810, 0.16, iGlobe, 'السفر', 2],
  [270, -0.16, iCam, 'الاكتشاف', 3],
  [540, 0, iPassport, 'الإعفاءات', 1],
];
scene(26.0, 31.15, (ctx, vt) => {
  if (vt < 29.3) full(ctx, 'v5', 6.7 + (vt - 26.0), { fx: lerp(0.6, 0.68, prog(vt, 26, 29.3)), zoom: 1.05 });
  else full(ctx, 'v2', 7.2 + (vt - 29.3), { fx: 0.43, zoom: 1.06 });
  gradV(ctx, 700, 1250, 'rgba(6,20,46,0)', 'rgba(6,20,46,0.6)');
  blurSnap(ctx);
  for (const [x, rot, ic, label, num] of PERKS) {
    const main = num === 1;
    const t0 = main ? 26.9 : 27.6 + (num - 2) * 0.12;
    if (vt < t0) continue;
    const p = spring(vt - t0, 1.4, 6);
    const fl = Math.sin(vt * 1.6 + num) * 8;
    const cy = 1000 + fl + (main ? 0 : 30);
    ctx.save(); ctx.translate(x, cy); ctx.rotate(rot * p); ctx.scale(p * (main ? 1.22 : 1.02), p * (main ? 1.22 : 1.02));
    ctx.translate(-x, -cy);
    frosted(ctx, x - 140, cy - 175, 280, 350, 34, { tint: main ? 'rgba(10,30,80,0.62)' : 'rgba(6,20,46,0.7)', border: main ? C.orange : 'rgba(255,255,255,0.3)' });
    const unlock = main ? 1 : Ez.outBack(prog(vt, 30.75, 31.05));
    ctx.save(); ctx.globalAlpha *= main ? 1 : lerp(0.35, 1, unlock);
    ctx.beginPath(); ctx.arc(x, cy - 55, 72, 0, TAU); ctx.fillStyle = main ? C.orange : C.blue2; ctx.fill();
    ic(ctx, x, cy - 55, 90, '#fff');
    txt(ctx, label, x, cy + 75, { s: 44, w: 900 });
    ctx.restore();
    txt(ctx, String(num), x, cy + 140, { s: 30, w: 900, color: main ? C.orange : 'rgba(255,255,255,0.6)' });
    if (!main && unlock < 1) {
      const sh = vt > 28.6 && vt < 29.0 ? Math.sin(vt * 60) * 0.15 : 0;
      ctx.save(); ctx.translate(x, cy - 55); ctx.rotate(sh); ctx.globalAlpha *= 1 - unlock;
      ctx.beginPath(); ctx.arc(0, 0, 72, 0, TAU); ctx.fillStyle = 'rgba(6,20,46,0.82)'; ctx.fill();
      iLock(ctx, 0, 0, 80, '#fff', 0);
      ctx.restore();
    }
    if (main) { const kp = Ez.outBack2(prog(vt, 27.2, 27.45)); if (kp > 0) circleBadge(ctx, x + 115, cy - 160, 38, C.green, (c, xx, yy, s) => iCheck(c, xx, yy, s, '#fff'), kp); }
    ctx.restore();
  }
  // "1 / ?" counter
  if (vt > 27.1) {
    const p = spring(vt - 27.1, 1.5, 6);
    pill(ctx, 540, 720, 'ميزة وحدة من بزاف', { bg: 'rgba(247,129,5,0.95)', s: 38, scale: p });
  }
});

// ---- S9a: departures board ---------------------------------------------------
const BOARD = [
  ['08:15', 'PARIS', 'A12'], ['09:40', 'MADRID', 'B07'], ['11:05', 'LONDON', 'C21'], ['12:30', 'ISTANBUL', 'A03'],
  ['14:10', 'DUBAI', 'D15'], ['15:55', 'ROME', 'B11'], ['17:20', 'AMSTERDAM', 'C04'], ['19:45', 'NEW YORK', 'E09'],
];
scene(31.15, 33.25, (ctx, vt) => {
  clipBlur(ctx, 'v5', 0.1 + (vt - 31.15), 0, 0, W, H, { fx: 0.5 }, 1);
  darken(ctx, 0.55, '3,8,20');
  const z = 1 + (vt - 31.15) * 0.03;
  ctx.save(); ctx.translate(540, 820); ctx.scale(z, z); ctx.translate(-540, -820);
  const bx = 40, by = 300, bw = 1000, bh = 1000;
  ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 20;
  rr(ctx, bx, by, bw, bh, 30); ctx.fillStyle = '#0A0D14'; ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.lineWidth = 4; ctx.strokeStyle = '#2A3142'; ctx.stroke();
  // header
  iPlane(ctx, bx + 80, by + 80, 40, Math.PI / 2, C.gold);
  txt(ctx, 'DEPARTURES', bx + 140, by + 82, { align: 'left', f: 'JetBrains Mono', w: 800, s: 58, color: C.gold, ls: 4 });
  txt(ctx, 'المغادرة', bx + bw - 50, by + 84, { align: 'right', s: 52, w: 900, color: C.gold });
  ctx.fillStyle = '#2A3142'; ctx.fillRect(bx + 30, by + 140, bw - 60, 3);
  const cw = 40, chh = 68, gap = 4;
  const colX = [bx + 40, bx + 40 + 6 * (cw + gap), bx + 40 + 17 * (cw + gap)];
  txt(ctx, 'TIME', colX[0], by + 178, { align: 'left', f: 'JetBrains Mono', w: 700, s: 24, color: '#7D8699', ls: 2 });
  txt(ctx, 'DESTINATION', colX[1], by + 178, { align: 'left', f: 'JetBrains Mono', w: 700, s: 24, color: '#7D8699', ls: 2 });
  txt(ctx, 'GATE', colX[2], by + 178, { align: 'left', f: 'JetBrains Mono', w: 700, s: 24, color: '#7D8699', ls: 2 });
  BOARD.forEach((row, r) => {
    const ry = by + 210 + r * 96;
    const lens = [5, 10, 3];
    row.forEach((val, c) => {
      const str = val.padEnd(lens[c], ' ');
      for (let i = 0; i < lens[c]; i++) {
        const settle = 31.35 + r * 0.11 + c * 0.06 + i * 0.03 + rnd(r * 31 + c * 7 + i, 5) * 0.12;
        const col = r < 3 && c === 1 ? '#FFFFFF' : C.gold;
        flapCell(ctx, colX[c] + i * (cw + gap), ry, cw, chh, str[i], vt, settle, r * 100 + c * 20 + i, col);
      }
    });
    if (r < 3 && vt > 32.4) {
      const bl = 0.5 + 0.5 * Math.sin(vt * 9 + r);
      ctx.beginPath(); ctx.arc(bx + bw - 34, ry + chh / 2, 9, 0, TAU); ctx.fillStyle = `rgba(32,196,107,${0.4 + 0.6 * bl})`; ctx.fill();
    }
  });
  lightSweep(ctx, bx, by, bw, bh, prog(vt, 32.5, 33.2), 0.12);
  ctx.restore();
});

// ---- S9b: polaroids of new cities -------------------------------------------
const POLS = [
  [33.32, 300, 520, -0.14, 'v3', 0.5, 0.65, 'Paris'],
  [33.95, 775, 650, 0.12, 'v3', 3.6, 0.55, 'España'],
  [34.5, 320, 1000, 0.08, 'v3', 7.0, 0.82, 'London'],
  [35.15, 760, 1105, -0.1, 'v5', 0.3, 0.45, 'Layover ✈'],
];
scene(33.25, 36.3, (ctx, vt) => {
  full(ctx, 'v5', 3.4 + (vt - 33.25) * 0.9, { fx: 0.4, zoom: 1.05, filter: 'saturate(0.7)' });
  darken(ctx, 0.62);
  bokeh(ctx, vt, 24, 21, '255,255,255', 0.25, 6);
  for (const [t0, x, y, rot, cl, c0, fx, cap] of POLS) {
    if (vt < t0) continue;
    const d = vt - t0, p = Ez.outExpo(prog(d, 0, 0.35));
    const s = lerp(1.7, 1, p) * 0.86, r = rot + (1 - p) * 0.5;
    ctx.save(); ctx.translate(x, y + (1 - p) * -120); ctx.rotate(r); ctx.scale(s, s); ctx.globalAlpha = clamp(p * 2);
    ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 40 * p; ctx.shadowOffsetY = 20 * p;
    ctx.fillStyle = '#FBFAF6'; ctx.fillRect(-235, -250, 470, 560); ctx.shadowColor = 'transparent';
    clip(ctx, cl, c0 + d * 0.8, -210, -225, 420, 420, { fx });
    const fl = 1 - prog(d, 0.02, 0.4);
    if (fl > 0) { ctx.fillStyle = `rgba(255,255,255,${fl * 0.9})`; ctx.fillRect(-210, -225, 420, 420); }
    txt(ctx, cap, 0, 250, { f: 'Caveat', w: 700, s: 62, color: '#1B2340' });
    // tape
    ctx.fillStyle = 'rgba(247,200,120,0.75)'; ctx.save(); ctx.translate(0, -255); ctx.rotate(-0.05); ctx.fillRect(-70, -18, 140, 36); ctx.restore();
    ctx.restore();
  }
});

// ---- S10: service, not tourism -----------------------------------------------
scene(36.3, 40.35, (ctx, vt) => {
  full(ctx, 'v5', 3.4 + (vt - 36.3) * 0.78, { fx: 0.45, zoom: 1.05 });
  darken(ctx, 0.5);
  blurSnap(ctx);
  // important pill
  if (vt > 36.62) {
    const p = spring(vt - 36.62, 1.6, 6);
    pill(ctx, 540, 380, 'مهم', { bg: C.orange, s: 52, scale: p, icon: (c, x, y, s, col) => iWarn(c, x, y, s, col, C.orange) });
  }
  const cards = [
    [770, 36.95, 'الخدمة', 'ON DUTY', (c, x, y, s, col) => iWings(c, x, y, s * 1.0, col), 38.42, true],
    [310, 37.1, 'السياحة', 'TOURISM', (c, x, y, s, col) => iUmbrella(c, x, y, s, col), 39.36, false],
  ];
  for (const [x, t0, ar, la, ic, tj, ok] of cards) {
    if (vt < t0) continue;
    const p = spring(vt - t0, 1.4, 6), j = prog(vt, tj, tj + 0.2), jj = Ez.outBack2(j);
    const shake = !ok && vt > tj && vt < tj + 0.35 ? Math.sin(vt * 80) * 14 * (1 - prog(vt, tj, tj + 0.35)) : 0;
    const sc = p * (ok ? 1 + 0.07 * jj : 1 - 0.06 * jj);
    const cy = 860;
    ctx.save(); ctx.translate(x + shake, cy + (1 - p) * 200); ctx.scale(sc, sc); ctx.rotate(!ok ? -0.04 * jj : 0);
    ctx.globalAlpha = clamp(p * 2) * (!ok ? lerp(1, 0.75, j) : 1);
    ctx.translate(-x, -cy);
    const col = j > 0 ? (ok ? C.green : C.red) : 'rgba(255,255,255,0.35)';
    frosted(ctx, x - 215, cy - 270, 430, 540, 40, { tint: j > 0 ? (ok ? 'rgba(10,70,45,0.55)' : 'rgba(80,10,20,0.55)') : 'rgba(6,20,46,0.6)', border: col });
    ctx.beginPath(); ctx.arc(x, cy - 90, 95, 0, TAU); ctx.fillStyle = j > 0 ? (ok ? C.green : C.red) : C.blue2; ctx.fill();
    ic(ctx, x, cy - 90, 120, '#fff');
    txt(ctx, ar, x, cy + 75, { s: 66, w: 900 });
    txt(ctx, la, x, cy + 150, { s: 30, w: 800, ls: 6, color: 'rgba(255,255,255,0.7)' });
    if (j > 0) circleBadge(ctx, x + 175, cy - 235, 52, ok ? C.green : C.red, (c, xx, yy, s) => (ok ? iCheck(c, xx, yy, s, '#fff', j) : iCross(c, xx, yy, s, '#fff', j)), jj);
    ctx.restore();
  }
});

// ---- S11: USA crew visa -------------------------------------------------------
scene(40.35, 44.1, (ctx, vt) => {
  const fh = H + 140, fw = fh * IMG.flagUS.width / IMG.flagUS.height;
  flag(ctx, IMG.flagUS, -260, -70, fw, fh, vt, { amp: 40, k: 1.2, sp: 2.6 });
  darken(ctx, 0.62);
  bokeh(ctx, vt, 20, 31, '255,255,255', 0.3, 5);
  // USA outlined -> filled
  const p = Ez.outExpo(prog(vt, 40.42, 40.85)), fill = Ez.ioC(prog(vt, 40.7, 41.3));
  ctx.save(); ctx.translate(540, 560); ctx.scale(lerp(0.7, 1, p), lerp(0.7, 1, p)); ctx.globalAlpha = p;
  txt(ctx, 'USA', 0, 0, { s: 300, w: 900, ls: 20, fill: false, stroke: 6, sc: '#fff' });
  ctx.save(); ctx.beginPath(); ctx.rect(-500, -200, 1000 * fill, 400); ctx.clip();
  txt(ctx, 'USA', 0, 0, { s: 300, w: 900, ls: 20, color: '#fff' }); ctx.restore();
  ctx.restore();
  // crew visa card
  if (vt > 42.45) {
    const cp = spring(vt - 42.45, 1.3, 6.5);
    const x = 540, y = 1010, w = 880, h = 520;
    ctx.save(); ctx.translate(x, y + (1 - cp) * 700); ctx.rotate((1 - cp) * 0.4 - 0.03);
    ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 24;
    rr(ctx, -w / 2, -h / 2, w, h, 26); const pg = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
    pg.addColorStop(0, '#F6F2E6'); pg.addColorStop(1, '#E7EEF6'); ctx.fillStyle = pg; ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.save(); rr(ctx, -w / 2, -h / 2, w, h, 26); ctx.clip();
    ctx.fillStyle = '#1D3A8A'; ctx.fillRect(-w / 2, -h / 2, w, 92);
    ctx.fillStyle = C.red; ctx.fillRect(-w / 2, -h / 2 + 92, w, 8);
    txt(ctx, 'UNITED STATES OF AMERICA', -w / 2 + 34, -h / 2 + 48, { align: 'left', s: 32, w: 800, ls: 3 });
    txt(ctx, 'VISA', w / 2 - 34, -h / 2 + 48, { align: 'right', s: 44, w: 900, ls: 6 });
    // photo
    rr(ctx, -w / 2 + 40, -h / 2 + 135, 190, 240, 14); ctx.fillStyle = '#C9D3E3'; ctx.fill();
    ctx.fillStyle = '#9AA8C0'; ctx.beginPath(); ctx.arc(-w / 2 + 135, -h / 2 + 225, 52, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(-w / 2 + 135, -h / 2 + 375, 90, Math.PI, 0); ctx.fill();
    txt(ctx, 'VISA TYPE / CLASS', -w / 2 + 270, -h / 2 + 150, { align: 'left', s: 24, w: 700, color: '#6B7690', ls: 2 });
    txt(ctx, 'C1/D', -w / 2 + 266, -h / 2 + 240, { align: 'left', s: 128, w: 900, color: '#1D3A8A' });
    const hp = Ez.outC(prog(vt, 43.35, 43.75));
    ctx.fillStyle = 'rgba(247,129,5,0.4)'; ctx.fillRect(-w / 2 + 262, -h / 2 + 300, 380 * hp, 50);
    txt(ctx, 'CREW MEMBER', -w / 2 + 270, -h / 2 + 326, { align: 'left', s: 44, w: 900, color: C.red, ls: 2 });
    ctx.fillStyle = '#D7DCE6'; ctx.fillRect(-w / 2, h / 2 - 110, w, 110);
    txt(ctx, 'V<USACREW<MEMBER<<<<<<<<<<<<<<<<<<<<<', -w / 2 + 30, h / 2 - 76, { align: 'left', f: 'JetBrains Mono', w: 700, s: 30, color: '#3A4458' });
    txt(ctx, 'C1D<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<', -w / 2 + 30, h / 2 - 34, { align: 'left', f: 'JetBrains Mono', w: 700, s: 30, color: '#3A4458' });
    flag(ctx, IMG.flagUS, w / 2 - 200, -h / 2 + 140, 160, 84, vt, { amp: 3 });
    lightSweep(ctx, -w / 2, -h / 2, w, h, prog(vt, 42.9, 43.6), 0.5);
    ctx.restore(); ctx.restore();
  }
});

// ---- S12a: the question --------------------------------------------------------
scene(44.1, 45.45, (ctx, vt) => {
  bgNavy(ctx, vt, '#0A1C44');
  rays(ctx, 540, 860, vt, '247,129,5', 0.05 * prog(vt, 44.2, 44.6), 16, 0.12);
  bokeh(ctx, vt, 40, 41, '255,190,120', 0.35, 7);
  for (let i = 0; i < 4; i++) {
    const ph = ((vt - 44.3) * 0.7 + i / 4) % 1; if (vt < 44.3) break;
    ctx.beginPath(); ctx.arc(540, 860, 260 + ph * 520, 0, TAU); ctx.strokeStyle = `rgba(247,129,5,${(1 - ph) * 0.45})`; ctx.lineWidth = 6; ctx.stroke();
  }
  const p = Ez.outBack(prog(vt, 44.3, 44.75));
  const pulse = 1 + 0.03 * Math.sin(vt * 9);
  ctx.save(); ctx.translate(540, 860); ctx.scale(p * pulse, p * pulse); ctx.rotate(Math.sin(vt * 2) * 0.05);
  const g = ctx.createLinearGradient(0, -380, 0, 380); g.addColorStop(0, C.orange2); g.addColorStop(1, '#E35F00');
  ctx.save(); ctx.font = font('Lalezar', 400, 820); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'rtl';
  ctx.shadowColor = 'rgba(247,129,5,0.85)'; ctx.shadowBlur = 90; ctx.fillStyle = g; ctx.fillText('؟', 0, 40); ctx.restore();
  ctx.restore();
});

// ---- S12b: aircraft door opens onto the crew ---------------------------------
function doorScene(ctx, vt) {
  const op = Ez.ioC(prog(vt, 46.78, 47.45));
  // behind the door: the crew
  full(ctx, 'v1', 0.3 + Math.max(0, vt - 46.6), { fx: 0.52, zoom: 1.1 });
  // cabin wall with door opening
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, W, H); rrPath(ctx, 170, 370, 740, 1220, 120); ctx.clip('evenodd');
  const wg = ctx.createLinearGradient(0, 0, W, 0); wg.addColorStop(0, '#C9D1DC'); wg.addColorStop(0.5, '#EEF2F6'); wg.addColorStop(1, '#C3CBD7');
  ctx.fillStyle = wg; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(120,132,150,0.35)'; ctx.lineWidth = 3;
  for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(0, 200 + i * 320); ctx.lineTo(W, 200 + i * 320); ctx.stroke(); }
  ctx.restore();
  // frame of the opening
  ctx.save(); rr(ctx, 170, 370, 740, 1220, 120); ctx.lineWidth = 22; ctx.strokeStyle = '#9DA8B8'; ctx.stroke(); ctx.restore();
  // exit sign
  ctx.save(); rr(ctx, 400, 262, 280, 80, 14); ctx.fillStyle = '#1B1F27'; ctx.fill();
  txt(ctx, 'EXIT', 470, 304, { s: 46, w: 900, color: '#FF3B3B', ls: 4 });
  txt(ctx, 'مخرج', 610, 306, { s: 40, w: 900, color: '#FF3B3B' }); ctx.restore();
  // light spill
  if (op > 0) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const lg = ctx.createRadialGradient(540, 980, 50, 540, 980, 900);
    lg.addColorStop(0, `rgba(255,240,215,${0.35 * op * (1 - prog(vt, 47.6, 48.3))})`); lg.addColorStop(1, 'rgba(255,240,215,0)');
    ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H); ctx.restore();
  }
  // the door panel (slides out & away)
  if (op < 1) {
    ctx.save(); ctx.translate(540 + op * 820, 980 - op * 40); ctx.scale(1 + op * 0.25, 1 + op * 0.25); ctx.rotate(op * 0.05);
    ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 60; ctx.shadowOffsetX = -20;
    rr(ctx, -360, -600, 720, 1200, 110);
    const dg = ctx.createLinearGradient(-360, 0, 360, 0); dg.addColorStop(0, '#DCE2EA'); dg.addColorStop(0.5, '#F5F7FA'); dg.addColorStop(1, '#D3DAE4');
    ctx.fillStyle = dg; ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.lineWidth = 4; ctx.strokeStyle = '#AEB8C6'; ctx.stroke();
    // window with moving clouds
    ctx.save(); rr(ctx, -110, -430, 220, 290, 100); ctx.clip();
    const sg = ctx.createLinearGradient(0, -430, 0, -140); sg.addColorStop(0, '#3B7BD8'); sg.addColorStop(1, '#BFE3FF');
    ctx.fillStyle = sg; ctx.fillRect(-110, -430, 220, 290);
    for (let i = 0; i < 6; i++) {
      const cx = ((rnd(i, 2) * 400 - vt * 120 * (0.6 + rnd(i, 3))) % 400 + 400) % 400 - 200, cy = -390 + rnd(i, 4) * 230;
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.ellipse(cx, cy, 60, 18, 0, 0, TAU); ctx.fill();
    }
    ctx.restore();
    ctx.save(); rr(ctx, -110, -430, 220, 290, 100); ctx.lineWidth = 16; ctx.strokeStyle = '#B9C3D1'; ctx.stroke(); ctx.restore();
    // handle
    ctx.save(); ctx.translate(-220, 40); ctx.rotate(-op * 1.2);
    rr(ctx, -20, -20, 260, 40, 20); ctx.fillStyle = '#7C8697'; ctx.fill(); ctx.restore();
    // crew placard
    rr(ctx, 80, 160, 210, 70, 10); ctx.fillStyle = C.blue; ctx.fill();
    txt(ctx, 'CREW ONLY', 185, 196, { s: 28, w: 900, ls: 2 });
    ctx.restore();
  }
}
scene(45.45, 48.45, (ctx, vt) => {
  const push = Ez.inC(prog(vt, 47.4, 48.45));
  ctx.save(); ctx.translate(540, 980); ctx.scale(1 + push * 1.3, 1 + push * 1.3); ctx.translate(-540, -980);
  doorScene(ctx, vt);
  ctx.restore();
  const wf = Ez.inExpo(prog(vt, 48.27, 48.45));
  if (wf > 0) { ctx.fillStyle = `rgba(255,255,255,${wf})`; ctx.fillRect(0, 0, W, H); }
});

// ---- S13a: logo reveal --------------------------------------------------------
scene(48.45, 51.15, (ctx, vt) => {
  bgNavy(ctx, vt, '#123A86');
  rays(ctx, 540, 800, vt, '255,255,255', 0.05, 20, 0.08);
  bokeh(ctx, vt, 40, 51, '255,190,120', 0.35, 8);
  // Koutoubia silhouette
  const kp = Ez.outC(prog(vt, 50.55, 51.0));
  if (kp > 0) { ctx.save(); ctx.globalAlpha = 0.16 * kp; koutoubia(ctx, 540, H + 40 + (1 - kp) * 200, 1050, '#9DB8FF'); ctx.restore(); }
  // swoosh + plane
  const sp = Ez.ioC(prog(vt, 48.5, 49.05));
  const P = u => [lerp(-80, 1160, u), 1180 - Math.sin(u * Math.PI) * 520 - u * 200];
  if (sp > 0) {
    ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = C.orange; ctx.globalAlpha = 1 - prog(vt, 49.2, 49.7);
    ctx.lineWidth = 34; ctx.shadowColor = C.orange; ctx.shadowBlur = 40;
    ctx.beginPath(); const N = 50; for (let i = 0; i <= N * sp; i++) { const [x, y] = P(i / N); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
    ctx.restore();
    if (sp < 1) { const [x, y] = P(sp), [x2, y2] = P(Math.min(1, sp + 0.01)); iPlane(ctx, x, y, 70, Math.atan2(y2 - y, x2 - x) + Math.PI / 2, '#fff'); }
  }
  // logo wipe
  const lp = Ez.ioC(prog(vt, 48.75, 49.25));
  const lw = 920, lh = lw * IMG.logoW.height / IMG.logoW.width;
  const ls = lerp(0.9, 1, Ez.outC(prog(vt, 48.75, 49.6))) + (vt - 48.75) * 0.01;
  ctx.save(); ctx.translate(540, 770); ctx.scale(ls, ls);
  ctx.beginPath(); ctx.rect(-lw / 2 - 20, -lh, (lw + 40) * lp, lh * 2); ctx.clip();
  ctx.shadowColor = 'rgba(80,140,255,0.6)'; ctx.shadowBlur = 40;
  ctx.drawImage(IMG.logoW, -lw / 2, -lh / 2, lw, lh); ctx.restore();
  lightSweep(ctx, 0, 770 - lh / 2, W, lh, prog(vt, 49.4, 50.0), 0.5);
  // tagline + badges
  const tp = Ez.outExpo(prog(vt, 49.3, 49.8));
  ctx.save(); ctx.globalAlpha = tp;
  ctx.fillStyle = C.orange; ctx.fillRect(540 - 260 * tp, 925, 520 * tp, 6);
  txt(ctx, 'مدرسة تكوين مضيفات ومضيفي الطيران', 540, 1000 + (1 - tp) * 30, { s: 50, w: 800 });
  ctx.restore();
  if (vt > 50.12) pill(ctx, 540, 1110, "École privée autorisée par l'État", { bg: 'rgba(255,255,255,0.12)', border: 'rgba(255,255,255,0.5)', s: 32, w: 700, scale: spring(vt - 50.12, 1.5, 6), icon: (c, x, y, s, col) => iCheck(c, x, y, s, C.green) });
  if (vt > 50.6) pill(ctx, 540, 1225, 'MARRAKECH', { bg: C.orange, s: 42, ls: 6, scale: spring(vt - 50.6, 1.5, 6), icon: (c, x, y, s, col) => iPin(c, x, y + s * 0.45, s * 0.9, '#fff', C.orange) });
});

// ---- S13b: training — hôtesses & stewards ------------------------------------
scene(51.15, 54.55, (ctx, vt) => {
  const ct = 3.5 + (vt - 51.15);
  clipBlur(ctx, 'v1', ct, 0, 0, W, H, { fx: 0.5 }, 2);
  darken(ctx, 0.35);
  const vx = -60, vy = 560, vw = 1200, vh = 675;
  const z = 1 + (vt - 51.15) * 0.012;
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 50; ctx.fillStyle = '#000'; ctx.fillRect(vx, vy, vw, vh); ctx.restore();
  clip(ctx, 'v1', ct, vx, vy, vw, vh, { zoom: z });
  ctx.fillStyle = C.orange; ctx.fillRect(0, vy - 4, W, 6); ctx.fillRect(0, vy + vh - 2, W, 6);
  // title
  const tp = Ez.outExpo(prog(vt, 51.2, 51.65));
  ctx.save(); ctx.globalAlpha = tp;
  txt(ctx, 'FORMATION', 540, 300 + (1 - tp) * 40, { s: 62, w: 900, ls: 14, color: 'rgba(255,255,255,0.9)' });
  txt(ctx, 'CABIN CREW', 540, 392 + (1 - tp) * 40, { s: 104, w: 900, ls: 6, color: '#fff', shadow: 'rgba(0,0,0,0.5)', sb: 30 });
  ctx.restore();
  // brackets over the people
  const br = [[52.5, 520, 1060, 'مضيفات', C.orange], [53.2, 30, 400, 'مضيفين', C.blue2]];
  for (const [t0, x0, x1, lab, col] of br) {
    if (vt < t0) continue;
    const p = Ez.outExpo(prog(vt, t0, t0 + 0.35)), cx = (x0 + x1) / 2;
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx - (cx - x0) * p, 530); ctx.lineTo(cx + (x1 - cx) * p, 530); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - (cx - x0) * p, 530); ctx.lineTo(cx - (cx - x0) * p, 560 * p + 530 * (1 - p) + 30 * p); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + (x1 - cx) * p, 530); ctx.lineTo(cx + (x1 - cx) * p, 560 * p + 530 * (1 - p) + 30 * p); ctx.stroke();
    ctx.restore();
    pill(ctx, Math.min(Math.max(cx, 170), 910), 490, lab, { bg: col, s: 40, scale: spring(vt - t0 - 0.1, 1.6, 6) });
  }
});

// ---- outro helpers ---------------------------------------------------------------
function outroBg(ctx, vt, ct) {
  clipBlur(ctx, 'v1', ct, 0, 0, W, H, { fx: 0.5 }, 1);
  ctx.save(); ctx.globalCompositeOperation = 'color'; ctx.fillStyle = '#0B2A6B'; ctx.fillRect(0, 0, W, H); ctx.restore();
  darken(ctx, 0.62, '4,12,32');
  // drifting brand glows
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const blobs = [[0.18, 0.22, '247,129,5', 0.30, 620], [0.85, 0.78, '31,91,255', 0.34, 760], [0.75, 0.15, '31,91,255', 0.18, 520]];
  blobs.forEach(([bx, by, col, a, r], i) => {
    const x = bx * W + Math.sin(vt * 0.6 + i * 2) * 90, y = by * H + Math.cos(vt * 0.5 + i) * 110;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  });
  ctx.restore();
}
function ticker(ctx, vt, y, rot, bg, fg, text, speed, inT) {
  const p = Ez.outExpo(prog(vt, inT, inT + 0.45));
  if (p <= 0) return;
  ctx.save(); ctx.translate(540, y); ctx.rotate(rot); ctx.translate((1 - p) * (speed < 0 ? 1400 : -1400), 0);
  ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10;
  ctx.fillStyle = bg; ctx.fillRect(-1300, -62, 2600, 124); ctx.shadowColor = 'transparent';
  ctx.font = '900 56px "Montserrat", "Cairo"'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.direction = 'ltr';
  ctx.letterSpacing = '4px';
  const seg = ctx.measureText(text).width;
  let x = -1300 + (((vt * speed) % seg) + seg) % seg - seg;
  ctx.fillStyle = fg;
  while (x < 1300) { ctx.fillText(text, x, 4); x += seg; }
  ctx.restore();
}
function reveal(ctx, str, x, y, t, t0, o) {
  // word slides up from behind a mask line
  const p = Ez.outExpo(prog(t, t0, t0 + 0.42));
  if (p <= 0) return;
  ctx.save(); ctx.beginPath(); ctx.rect(0, y - o.s * 0.95, W, o.s * 1.7); ctx.clip();
  ctx.translate(0, (1 - p) * o.s * 1.3);
  txt(ctx, str, x, y, o);
  ctx.restore();
}

// ---- S14a: registration open — kinetic type + ticker bands --------------------
scene(54.55, 56.15, (ctx, vt) => {
  outroBg(ctx, vt, 7.0 + (vt - 54.55) * 0.5);
  ticker(ctx, vt, 520, -0.09, C.orange, '#fff', 'INSCRIPTIONS OUVERTES   •   التسجيل مفتوح   •   ', -240, 54.5);
  ticker(ctx, vt, 1290, 0.06, '#F4F6FB', C.navy2, 'CABIN CREW   •   HÔTESSES DE L’AIR   •   STEWARDS   •   MARRAKECH   •   ', 200, 54.62);
  const zoom = 1 + (vt - 54.55) * 0.03;
  ctx.save(); ctx.translate(540, 905); ctx.scale(zoom, zoom); ctx.translate(-540, -905);
  reveal(ctx, 'التسجيل', 540, 800, vt, 54.86, { f: 'Cairo', w: 900, s: 190, color: '#fff', shadow: 'rgba(0,0,0,0.4)', sb: 30 });
  reveal(ctx, 'مفتوح', 540, 1010, vt, 55.28, { f: 'Cairo', w: 900, s: 210, color: C.orange2, shadow: 'rgba(247,129,5,0.45)', sb: 40, sy: 0 });
  const lp = Ez.outExpo(prog(vt, 55.5, 55.95));
  ctx.fillStyle = C.orange; rr(ctx, 540 - 170 * lp, 1150, 340 * lp, 8, 4); ctx.fill();
  ctx.restore();
  // light streak on the second word
  lightSweep(ctx, 0, 880, W, 260, prog(vt, 55.4, 55.95), 0.4);
});

// ---- S14b: boarding-pass end card ---------------------------------------------
const CONTACTS = [
  [57.40, iPhone, '+212 777 771 314', 44],
  [57.52, iPhone, '+212 777 771 712', 44],
  [57.64, iGlobe, 'www.flyhyani.ma', 42],
  [57.76, iInsta, '@flyhyani.aviation.school', 37],
];
function passPath(ctx, x, y, w, h, r, ny, nr) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, ny - nr); ctx.arc(x + w, ny, nr, -Math.PI / 2, Math.PI / 2, true);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, ny + nr); ctx.arc(x, ny, nr, Math.PI / 2, -Math.PI / 2, true);
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
}
function field(ctx, vt, t0, x, label, value, col, align = 'left') {
  const p = Ez.outExpo(prog(vt, t0, t0 + 0.4)); if (p <= 0) return;
  ctx.save(); ctx.globalAlpha *= p; ctx.translate(0, (1 - p) * 18);
  txt(ctx, label, x, 652, { align, s: 22, w: 700, ls: 4, color: '#8A94A8' });
  txt(ctx, value, x, 698, { align, s: 40, w: 900, color: col });
  ctx.restore();
}
scene(56.15, 63, (ctx, vt) => {
  outroBg(ctx, vt, 7.6 + (vt - 56.15) * 0.35);
  const X = 80, Y = 300, Wd = 920, Hd = 1090, NY = 1030;
  const cp = spring(vt - 56.18, 1.25, 6.5);
  const fl = Math.sin((vt - 56) * 1.3) * 4;
  ctx.save();
  ctx.translate(540, Y + Hd / 2 + (1 - cp) * 520 + fl); ctx.rotate((1 - cp) * 0.07); ctx.scale(lerp(0.94, 1, cp), lerp(0.94, 1, cp));
  ctx.translate(-540, -(Y + Hd / 2));
  ctx.globalAlpha = clamp(cp * 2);
  // card body
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 70; ctx.shadowOffsetY = 30;
  passPath(ctx, X, Y, Wd, Hd, 44, NY, 30);
  const bg = ctx.createLinearGradient(0, Y, 0, Y + Hd); bg.addColorStop(0, '#FFFFFF'); bg.addColorStop(1, '#EEF2F9');
  ctx.fillStyle = bg; ctx.fill(); ctx.restore();
  ctx.save(); passPath(ctx, X, Y, Wd, Hd, 44, NY, 30); ctx.clip();
  // header strip
  const hg = ctx.createLinearGradient(X, 0, X + Wd, 0); hg.addColorStop(0, C.blue); hg.addColorStop(1, C.blue2);
  ctx.fillStyle = hg; ctx.fillRect(X, Y, Wd, 110);
  ctx.fillStyle = C.orange; ctx.fillRect(X, Y + 110, Wd, 6);
  iPlane(ctx, X + 62, Y + 55, 26, Math.PI / 2, '#fff');
  txt(ctx, 'BOARDING PASS', X + 100, Y + 57, { align: 'left', s: 32, w: 900, ls: 5 });
  txt(ctx, 'بطاقة الصعود', X + Wd - 40, Y + 59, { align: 'right', s: 36, w: 900, color: C.orange2 });
  // route RAK -> CREW
  ctx.save(); ctx.beginPath(); ctx.rect(X, 430, Wd, 200); ctx.clip();
  const r1 = Ez.outExpo(prog(vt, 56.5, 56.9)), r2 = Ez.outExpo(prog(vt, 56.6, 57.0));
  txt(ctx, 'FROM', X + 50, 452, { align: 'left', s: 22, w: 700, ls: 4, color: '#8A94A8' });
  txt(ctx, 'TO', X + Wd - 50, 452, { align: 'right', s: 22, w: 700, ls: 4, color: '#8A94A8' });
  ctx.save(); ctx.translate(0, (1 - r1) * 160); txt(ctx, 'RAK', X + 44, 532, { align: 'left', s: 116, w: 900, color: C.navy2 }); ctx.restore();
  ctx.save(); ctx.translate(0, (1 - r2) * 160);
  const cg = ctx.createLinearGradient(0, 480, 0, 580); cg.addColorStop(0, C.orange2); cg.addColorStop(1, '#E35F00');
  txt(ctx, 'CREW', X + Wd - 44, 532, { align: 'right', s: 116, w: 900, color: cg }); ctx.restore();
  txt(ctx, 'Marrakech', X + 50, 604, { align: 'left', s: 26, w: 600, color: '#5A6683', alpha: r1 });
  txt(ctx, 'Cabin Crew', X + Wd - 50, 604, { align: 'right', s: 26, w: 600, color: '#5A6683', alpha: r2 });
  ctx.restore();
  // dotted arc + plane
  const ax0 = X + 44 + tw(ctx, 'RAK', { s: 116, w: 900 }) + 26, ax1 = X + Wd - 44 - tw(ctx, 'CREW', { s: 116, w: 900 }) - 26;
  const ap = Ez.ioC(prog(vt, 56.75, 57.35));
  if (ap > 0) {
    const P = u => [lerp(ax0, ax1, u), 540 - Math.sin(u * Math.PI) * 46];
    ctx.save(); ctx.strokeStyle = '#B8C2D8'; ctx.lineWidth = 5; ctx.setLineDash([3, 11]); ctx.lineCap = 'round';
    ctx.beginPath(); for (let i = 0; i <= 40 * ap; i++) { const [x, y] = P(i / 40); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); ctx.restore();
    const u = lerp(0, 0.5, ap) + (ap >= 1 ? Math.sin(vt * 2) * 0.02 : 0);
    const [px, py] = P(u), [qx, qy] = P(u + 0.01);
    iPlane(ctx, px, py - 2, 30, Math.atan2(qy - py, qx - px) + Math.PI / 2, C.orange);
  }
  // fields
  ctx.fillStyle = '#E3E8F2'; ctx.fillRect(X + 44, 628, Wd - 88, 2);
  field(ctx, vt, 56.85, X + 50, 'PASSENGER', 'YOU', C.navy2);
  field(ctx, vt, 56.92, 540, 'GATE', 'EFH', C.navy2, 'center');
  field(ctx, vt, 56.99, X + Wd - 50, 'BOARDING', 'NOW', C.orange, 'right');
  if (vt > 57.3) { ctx.beginPath(); ctx.arc(X + Wd - 50 - tw(ctx, 'NOW', { s: 40, w: 900 }) - 22, 698, 8, 0, TAU); ctx.fillStyle = `rgba(32,196,107,${0.5 + 0.5 * Math.sin(vt * 8)})`; ctx.fill(); }
  // map strip
  const mxp = X + 44, myp = 740, mwp = Wd - 88, mhp = 262;
  const mr = Ez.ioC(prog(vt, 56.95, 57.45));
  if (mr > 0) {
    ctx.save(); rr(ctx, mxp, myp, mwp * mr, mhp, 26); ctx.clip();
    const ms = lerp(1.25, 1.06, Ez.outC(prog(vt, 56.95, 58.2))) + Math.max(0, vt - 58.2) * 0.012;
    const pinX = mxp + 560, pinY = myp + 150;
    ctx.drawImage(IMG.map, pinX - 820 * ms, pinY - 518 * ms, IMG.map.width * ms, IMG.map.height * ms);
    const sh = ctx.createLinearGradient(0, myp, 0, myp + mhp); sh.addColorStop(0, 'rgba(6,20,46,0.05)'); sh.addColorStop(1, 'rgba(6,20,46,0.45)');
    ctx.fillStyle = sh; ctx.fillRect(mxp, myp, mwp, mhp);
    // route
    const rp = Ez.ioC(prog(vt, 57.3, 57.95));
    if (rp > 0) {
      const pts = [[mxp + 40, myp + mhp + 10], [mxp + 260, myp + 200], [pinX - 220, pinY + 120], [pinX, pinY + 4]];
      ctx.save(); ctx.strokeStyle = C.blue2; ctx.lineWidth = 11; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.shadowColor = 'rgba(31,91,255,0.8)'; ctx.shadowBlur = 16;
      ctx.beginPath(); let last = pts[0];
      for (let i = 0; i <= 60 * rp; i++) {
        const u = i / 60, a0 = Math.pow(1 - u, 3), a1 = 3 * Math.pow(1 - u, 2) * u, a2 = 3 * (1 - u) * u * u, a3 = u * u * u;
        const x = a0 * pts[0][0] + a1 * pts[1][0] + a2 * pts[2][0] + a3 * pts[3][0], y = a0 * pts[0][1] + a1 * pts[1][1] + a2 * pts[2][1] + a3 * pts[3][1];
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); last = [x, y];
      }
      ctx.stroke(); ctx.restore();
    }
    // pin + ripples
    if (vt > 57.15) {
      for (let i = 0; i < 3; i++) {
        const ph = ((vt - 57.35) * 0.8 + i / 3) % 1; if (vt < 57.35) break;
        ctx.beginPath(); ctx.ellipse(pinX, pinY, 16 + ph * 110, (16 + ph * 110) * 0.45, 0, 0, TAU); ctx.strokeStyle = `rgba(247,129,5,${(1 - ph) * 0.9})`; ctx.lineWidth = 5; ctx.stroke();
      }
      const dp = Ez.outBack2(prog(vt, 57.15, 57.45));
      ctx.save(); ctx.translate(pinX, pinY - (1 - dp) * 200); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 8;
      iPin(ctx, 0, 0, 92, C.orange); ctx.restore();
    }
    // address chip
    const ap2 = Ez.outBack(prog(vt, 57.5, 57.8));
    if (ap2 > 0) {
      ctx.save(); ctx.translate(mxp + 24, myp + mhp - 24); ctx.scale(ap2, ap2);
      const t1 = 'Bd Allal Al Fassi · Marrakech', cw = tw(ctx, t1, { s: 27, w: 800 }) + 84;
      rr(ctx, 0, -60, cw, 60, 30); ctx.fillStyle = 'rgba(255,255,255,0.96)'; ctx.fill();
      iPin(ctx, 34, -17, 30, C.orange);
      txt(ctx, t1, 58, -29, { align: 'left', s: 27, w: 800, color: C.navy2 });
      ctx.restore();
    }
    ctx.restore();
    ctx.save(); rr(ctx, mxp, myp, mwp * mr, mhp, 26); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(11,35,83,0.15)'; ctx.stroke(); ctx.restore();
  }
  // perforation
  ctx.save(); ctx.strokeStyle = '#C9D2E6'; ctx.lineWidth = 4; ctx.setLineDash([14, 12]);
  ctx.beginPath(); ctx.moveTo(X + 44, NY); ctx.lineTo(X + Wd - 44, NY); ctx.stroke(); ctx.restore();
  // contacts
  CONTACTS.forEach(([t0, ic, label, fs], i) => {
    const p = Ez.outExpo(prog(vt, t0, t0 + 0.45)); if (p <= 0) return;
    const y = 1100 + i * 82;
    ctx.save(); ctx.globalAlpha *= p; ctx.translate((1 - p) * -60, 0);
    ctx.beginPath(); ctx.arc(X + 76, y, 30, 0, TAU); ctx.fillStyle = '#FFF0E0'; ctx.fill();
    ic(ctx, X + 76, y, 40, C.orange);
    txt(ctx, label, X + 124, y + 2, { align: 'left', s: fs, w: 800, color: C.navy2, dir: 'ltr' });
    ctx.restore();
  });
  // QR code -> www.flyhyani.ma
  const qr = MAP.qr, n = qr.length, qs = 150, mod = qs / n, qx = X + Wd - 50 - qs, qy = 1072;
  const qp = prog(vt, 57.6, 58.2);
  if (qp > 0) {
    ctx.save(); rr(ctx, qx - 10, qy - 10, qs + 20, qs + 20, 14); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#E3E8F2'; ctx.stroke();
    ctx.fillStyle = C.navy2;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      if (qr[r][c] !== '1') continue;
      if (rnd(r * 31 + c, 77) > qp * 1.15) continue;
      ctx.fillRect(qx + c * mod, qy + r * mod, mod + 0.5, mod + 0.5);
    }
    ctx.restore();
    txt(ctx, 'SCAN', qx + qs / 2, qy + qs + 30, { s: 20, w: 800, ls: 6, color: '#8A94A8', alpha: qp });
  }
  ctx.restore();
  lightSweep(ctx, X, Y, Wd, Hd, prog(vt, 60.75, 61.5), 0.35);
  ctx.restore();
  // CTA button
  if (vt > 57.95) {
    const p = spring(vt - 57.95, 1.4, 6), beat = 1 + 0.04 * Math.pow(Math.max(0, Math.cos((vt - 48.52) / 0.51168 * Math.PI)), 8);
    ctx.save(); ctx.translate(540, 1490); ctx.scale(p * beat, p * beat);
    ctx.shadowColor = 'rgba(247,129,5,0.6)'; ctx.shadowBlur = 40;
    rr(ctx, -300, -62, 600, 124, 62); const g = ctx.createLinearGradient(0, -62, 0, 62); g.addColorStop(0, C.orange2); g.addColorStop(1, '#E35F00'); ctx.fillStyle = g; ctx.fill();
    ctx.shadowColor = 'transparent';
    txt(ctx, 'سجّل دابا', 30, 4, { s: 62, w: 900 });
    ctx.save(); ctx.translate(-200, 2); ctx.strokeStyle = '#fff'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(18, -22); ctx.lineTo(-4, 0); ctx.lineTo(18, 22); ctx.moveTo(-4, 0); ctx.lineTo(40, 0); ctx.stroke(); ctx.restore();
    ctx.save(); rr(ctx, -300, -62, 600, 124, 62); ctx.clip(); lightSweep(ctx, -300, -62, 600, 124, ((vt - 57.95) * 0.6) % 1, 0.5); ctx.restore();
    ctx.restore();
  }
});

// ------------------------------------------------------------- transitions ----
trans(8.75, 0.32, 'whip', { dx: -1 });
trans(12.62, 0.36, 'zoom');
trans(14.65, 0.34, 'whip', { dx: 0, dy: -1 });
trans(19.55, 0.30, 'whip', { dx: 1 });
trans(23.95, 0.32, 'whip', { dx: 0, dy: -1 });
trans(26.0, 0.45, 'iris');
trans(31.15, 0.40, 'slideUp');
trans(33.25, 0.30, 'whip', { dx: -1 });
trans(36.3, 0.34, 'zoom');
trans(40.35, 0.30, 'whip', { dx: 1 });
trans(44.1, 0.30, 'fade');
trans(45.45, 0.40, 'iris', { cy: 860 });
trans(51.15, 0.32, 'whip', { dx: 0, dy: -1 });
trans(54.55, 0.30, 'zoom');
trans(56.15, 0.34, 'whip', { dx: 0, dy: -1 });

// ---- Instagram cover (not part of the timeline; render at t = -4.8) ----------
SC.unshift({ t0: -10, t1: -1, fn: (ctx, vt) => {
  full(ctx, 'v4', 8.6, { fx: 0.42, zoom: 1.12 });
  gradV(ctx, 0, 420, 'rgba(6,20,46,0.75)', 'rgba(6,20,46,0)');
  gradV(ctx, 820, 1920, 'rgba(6,20,46,0)', 'rgba(6,20,46,0.95)');
  const lw = 430, lh = lw * IMG.logoW.height / IMG.logoW.width;
  ctx.drawImage(IMG.logoW, 540 - lw / 2, 330 - lh / 2, lw, lh);
  // passport + crew stamp
  const pw = 250, ph = pw * IMG.passport.height / IMG.passport.width;
  ctx.save(); ctx.translate(845, 905); ctx.rotate(0.12); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18;
  ctx.drawImage(IMG.passport, -pw / 2, -ph / 2, pw, ph); ctx.restore();
  ctx.save(); ctx.translate(800, 980); ctx.rotate(-0.18);
  rr(ctx, -150, -62, 300, 124, 22); ctx.fillStyle = 'rgba(4,16,30,0.5)'; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = '#22E07F'; ctx.stroke();
  txt(ctx, 'CREW ✓', 0, 4, { s: 60, w: 900, ls: 6, color: '#22E07F' }); ctx.restore();
  // title
  txt(ctx, 'بلا فيزا؟', 540, 1165, { f: 'Lalezar', w: 400, s: 240, color: '#fff', shadow: 'rgba(0,0,0,0.6)', sb: 30 });
  const sw = tw(ctx, 'السر اللي ماكيعرفوش بزاف ديال الناس', { s: 46, w: 900 }) + 80;
  ctx.save(); ctx.translate(540, 1345); rr(ctx, -sw / 2, -58, sw, 116, 30);
  const og = ctx.createLinearGradient(0, -62, 0, 62); og.addColorStop(0, C.orange2); og.addColorStop(1, '#E35F00'); ctx.fillStyle = og; ctx.fill();
  txt(ctx, 'السر اللي ماكيعرفوش بزاف ديال الناس', 0, 6, { s: 46, w: 900, color: '#fff' }); ctx.restore();
  // flags
  [['flagFR', 330], ['flagES', 540], ['flagUK', 750]].forEach(([k, x]) => {
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 16; rr(ctx, x - 80, 1460, 160, 106, 14); ctx.clip();
    ctx.drawImage(IMG[k], x - 80, 1460, 160, 106); ctx.restore();
  });
  txt(ctx, 'CABIN CREW • MARRAKECH', 540, 1612, { s: 40, w: 800, ls: 6, color: 'rgba(255,255,255,0.85)' });
} });

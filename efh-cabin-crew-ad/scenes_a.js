// ---------- Scenes 1-5 ----------
const SCENES = [];

// ===== S1: months of saving vs one week of travel (0 - 3.72)
const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'ماي', 'يونيو', 'يوليوز', 'غشت', 'شتنبر', 'أكتوبر', 'نونبر', 'دجنبر'];
const S1_SEG = k => 0.32 + k * 0.17; // month k lights up
function suitcase(x, y, s, a = 1) {
  X.save(); X.translate(x, y); X.scale(s, s); X.globalAlpha *= a;
  X.strokeStyle = '#fff'; X.lineWidth = 7; rr(-22, -62, 44, 30, 10); X.stroke();
  const g = X.createLinearGradient(0, -40, 0, 50); g.addColorStop(0, '#FFAA3A'); g.addColorStop(1, '#F07A00');
  X.fillStyle = g; rr(-55, -40, 110, 90, 16); X.fill();
  X.fillStyle = 'rgba(255,255,255,.85)'; X.fillRect(-30, -40, 9, 90); X.fillRect(21, -40, 9, 90);
  X.fillStyle = '#0A1C4A'; circle(-34, 56, 8); X.fill(); circle(34, 56, 8); X.fill();
  X.restore();
}
SCENES.push({
  a: 0, b: 3.72, draw(t) {
    const ent = E.outC(P(t, 0, .5)), ex = P(t, 3.45, 3.72);
    X.globalAlpha = ent * (1 - ex);
    const cx = 540, cy = 640, R = 255;
    // gentle year ring: 12 months fill one by one
    X.save(); X.translate(cx, cy); X.scale(lerp(.9, 1, ent) * (1 - ex * .1), lerp(.9, 1, ent) * (1 - ex * .1));
    const gapA = .05;
    for (let k = 0; k < 12; k++) {
      const a0 = -Math.PI / 2 + k * TAU / 12 + gapA, a1 = a0 + TAU / 12 - gapA * 2;
      X.lineCap = 'round'; X.lineWidth = 34;
      X.strokeStyle = 'rgba(255,255,255,.10)'; X.beginPath(); X.arc(0, 0, R, a0, a1); X.stroke();
      const p = E.ioC(P(t, S1_SEG(k), S1_SEG(k) + .22));
      if (p > 0) {
        X.strokeStyle = mixHex('#5AA8FF', '#1E5BD8', k / 11); X.beginPath(); X.arc(0, 0, R, a0, a0 + (a1 - a0) * p); X.stroke();
      }
      // month label
      const am = (a0 + a1) / 2, lr = R + 66, lit = P(t, S1_SEG(k), S1_SEG(k) + .2);
      T(MONTHS[k], Math.cos(am) * lr, Math.sin(am) * lr, { font: '700 27px Alexandria', dir: 'rtl', color: lit > 0 ? '#fff' : 'rgba(255,255,255,.35)', alpha: .5 + .5 * lit });
    }
    // centre: month counter
    const n = clamp(Math.floor((t - S1_SEG(0)) / 0.17) + 1, 0, 12);
    T(String(n), 0, -28, { font: '900 150px Montserrat', color: '#fff', shadow: 'rgba(0,0,0,.35)', blur: 20 });
    T('شهر ديال التوفير', 0, 82, { font: '700 36px Alexandria', dir: 'rtl', color: 'rgba(255,255,255,.75)' });
    X.restore();

    // comparison: 12 months saving vs 1 week travelling
    const b1 = E.outExpo(P(t, 2.42, 2.9)), b2 = E.outBack(P(t, 2.7, 3.05), 2);
    const left = 120, full = 840;
    if (b1 > 0) {
      X.save(); X.globalAlpha *= clamp(b1 * 2);
      T('التوفير', 960, 1090, { font: '800 34px Alexandria', align: 'right', dir: 'rtl' });
      T('12 MOIS', left, 1090, { font: '800 28px Montserrat', align: 'left', ls: 4, color: 'rgba(255,255,255,.6)' });
      X.fillStyle = 'rgba(255,255,255,.10)'; rr(left, 1120, full, 44, 22); X.fill();
      const g = X.createLinearGradient(left, 0, left + full, 0); g.addColorStop(0, '#1E5BD8'); g.addColorStop(1, '#5AA8FF');
      X.fillStyle = g; rr(left + full * (1 - b1), 1120, full * b1, 44, 22); X.fill();
      X.restore();
    }
    if (b2 > 0) {
      X.save(); X.globalAlpha *= clamp(b2 * 2);
      T('السفر', 960, 1225, { font: '800 34px Alexandria', align: 'right', dir: 'rtl', color: COL.orange });
      T('7 JOURS', left, 1225, { font: '800 28px Montserrat', align: 'left', ls: 4, color: 'rgba(255,255,255,.6)' });
      X.fillStyle = 'rgba(255,255,255,.10)'; rr(left, 1255, full, 44, 22); X.fill();
      const w = full * 7 / 365 * 4 + 30; // tiny on purpose
      X.fillStyle = COL.orange; rr(left + full - w * b2, 1255, w * b2, 44, 22); X.fill();
      suitcase(left + full - w - 80, 1262, .62 * b2);
      X.restore();
    }
  }
});
// ===== S2: travel is their job & they get paid (3.66 - 7.32)
const DESTS = [['CDG', 'PARIS'], ['DXB', 'DUBAI'], ['IST', 'ISTANBUL'], ['JFK', 'NEW YORK'], ['LHR', 'LONDON'], ['DOH', 'DOHA']];
const BARCODE = (() => { const r = mulberry(3), b = []; let x = 0; while (x < 300) { const w = 2 + Math.floor(r() * 7); b.push([x, w]); x += w + 3 + Math.floor(r() * 5); } return b; })();
const S2COINS = (() => { const r = mulberry(21), o = []; for (let i = 0; i < 16; i++) o.push({ sx: 540 + (r() - .5) * 900, sy: 1500 + r() * 300, t0: 6.1 + i * .045, c: (r() - .5) * 500 }); return o; })();
SCENES.push({
  a: 3.6, b: 7.38, draw(t) {
    // background plane crossing
    const bp = P(t, 3.7, 7.3);
    X.save(); X.globalAlpha = .18;
    planeTop(lerp(-300, 1400, bp), lerp(560, 300, bp), 260, -0.18, '#9cc4ff');
    X.restore();

    const ent = P(t, 3.75, 4.35), ex = P(t, 7.12, 7.36);
    const cx = 540, cy = 800 + (1 - E.outBack(ent, 1.2)) * 900 - E.inC(ex) * 200;
    X.save();
    X.globalAlpha = clamp(ent * 3) * (1 - ex);
    X.translate(cx, cy);
    X.rotate((1 - E.outC(ent)) * 0.35 - 0.035 + Math.sin(t * 1.3) * .008);
    const sc = (1 - ex * .3);
    X.scale(lerp(.7, 1, E.outC(ent)) * sc, sc);
    const L = -450, R = 450, Tp = -240, B = 240, r = 34, px = 200, nr = 26;
    const path = () => {
      X.beginPath(); X.moveTo(L + r, Tp); X.lineTo(px - nr, Tp); X.arc(px, Tp, nr, Math.PI, 0, true);
      X.lineTo(R - r, Tp); X.arcTo(R, Tp, R, Tp + r, r); X.lineTo(R, B - r); X.arcTo(R, B, R - r, B, r);
      X.lineTo(px + nr, B); X.arc(px, B, nr, 0, Math.PI, true); X.lineTo(L + r, B); X.arcTo(L, B, L, B - r, r);
      X.lineTo(L, Tp + r); X.arcTo(L, Tp, L + r, Tp, r); X.closePath();
    };
    X.save(); X.shadowColor = 'rgba(0,0,0,.55)'; X.shadowBlur = 70; X.shadowOffsetY = 30; path(); X.fillStyle = '#fff'; X.fill(); X.restore();
    X.save(); path(); X.clip();
    const hg = X.createLinearGradient(L, 0, R, 0); hg.addColorStop(0, '#0D3FA6'); hg.addColorStop(1, '#1E5BD8');
    X.fillStyle = hg; X.fillRect(L, Tp, R - L, 100);
    X.fillStyle = COL.orange; X.fillRect(L, Tp + 100, R - L, 8);
    T('BOARDING PASS', L + 40, Tp + 52, { font: '800 36px Montserrat', align: 'left', ls: 4 });
    planeTop(px + 125, Tp + 50, 34, -Math.PI / 2, '#fff');
    // FROM
    T('FROM', L + 50, Tp + 150, { font: '700 20px Montserrat', align: 'left', color: '#8a96b0', ls: 3 });
    T('RAK', L + 46, Tp + 218, { font: '900 92px Montserrat', align: 'left', color: COL.ink });
    T('MARRAKECH', L + 50, Tp + 278, { font: '700 20px Montserrat', align: 'left', color: '#8a96b0', ls: 2 });
    // TO (cycling destinations)
    const di = Math.floor(clamp((t - 4.3) / .42, 0, 99)) % DESTS.length;
    const cyc = ((t - 4.3) / .42) % 1, slide = t < 4.3 ? 0 : E.outC(clamp(cyc * 4));
    T('TO', px - 50, Tp + 150, { font: '700 20px Montserrat', align: 'right', color: '#8a96b0', ls: 3 });
    X.save(); X.beginPath(); X.rect(px - 300, Tp + 165, 260, 125); X.clip();
    T(DESTS[di][0], px - 50, Tp + 218 + (1 - slide) * 60, { font: '900 92px Montserrat', align: 'right', color: COL.blue, alpha: slide });
    T(DESTS[di][1], px - 50, Tp + 278 + (1 - slide) * 60, { font: '700 20px Montserrat', align: 'right', color: '#8a96b0', ls: 2, alpha: slide });
    X.restore();
    // dotted arc + plane
    const ax0 = L + 255, ax1 = px - 245, ay = Tp + 225;
    X.save(); X.setLineDash([4, 10]); X.lineCap = 'round'; X.strokeStyle = '#b8c3da'; X.lineWidth = 4;
    X.beginPath(); X.moveTo(ax0, ay); X.quadraticCurveTo((ax0 + ax1) / 2, ay - 70, ax1, ay); X.stroke(); X.restore();
    const pp = ((t - 3.9) * .55) % 1, q = 1 - pp;
    const bx = q * q * ax0 + 2 * q * pp * (ax0 + ax1) / 2 + pp * pp * ax1, by = q * q * ay + 2 * q * pp * (ay - 70) + pp * pp * ay;
    const dx = 2 * q * ((ax0 + ax1) / 2 - ax0) + 2 * pp * (ax1 - (ax0 + ax1) / 2), dy = 2 * q * (-70) + 2 * pp * 70;
    planeTop(bx, by, 26, Math.atan2(dy, dx), COL.orange);
    // fields
    const fields = [['PASSENGER', 'CABIN CREW', L + 50], ['SEAT', 'CREW', L + 380], ['CLASS', 'PRO', L + 510]];
    for (const [k, v, fx] of fields) {
      T(k, fx, Tp + 345, { font: '700 18px Montserrat', align: 'left', color: '#8a96b0', ls: 3 });
      T(v, fx, Tp + 388, { font: '800 34px Montserrat', align: 'left', color: COL.ink });
    }
    // perforation
    X.save(); X.setLineDash([10, 10]); X.strokeStyle = '#c6cfdf'; X.lineWidth = 3;
    X.beginPath(); X.moveTo(px, Tp + 30); X.lineTo(px, B - 30); X.stroke(); X.restore();
    // stub
    T('GATE', px + 125, Tp + 150, { font: '700 18px Montserrat', color: '#8a96b0', ls: 3 });
    T('A1', px + 125, Tp + 200, { font: '900 56px Montserrat', color: COL.ink });
    X.fillStyle = COL.ink;
    for (const [bx2, bw] of BARCODE) if (bx2 < 200) X.fillRect(px + 25 + bx2, Tp + 300, bw, 110);
    // paid check on stub
    const ck = P(t, 6.35, 6.6);
    if (ck > 0) {
      X.fillStyle = rgba('#ffffff', .92); X.fillRect(px + 10, Tp + 120, 230, 320);
      X.fillStyle = COL.orange; circle(px + 125, Tp + 250, 70 * E.outBack(ck)); X.fill();
      checkMark(px + 125, Tp + 252, 80, P(t, 6.45, 6.75), '#fff', 14);
      T('PAID', px + 125, Tp + 375, { font: '900 34px Montserrat', color: COL.orange, ls: 6, alpha: P(t, 6.6, 6.8) });
    }
    X.restore();
    // ON DUTY stamp
    const st = P(t, 5.38, 5.5);
    if (st > 0) {
      X.save(); X.translate(L + 330, 135); X.rotate(-0.22); const s = lerp(2.6, 1, E.outC(st)); X.scale(s, s);
      X.globalAlpha *= clamp(st * 2) * .92;
      X.strokeStyle = COL.orange2; X.lineWidth = 7; rr(-170, -52, 340, 104, 14); X.stroke();
      X.lineWidth = 2.5; rr(-158, -41, 316, 82, 9); X.stroke();
      T('ON DUTY', 0, 3, { font: '900 58px Montserrat', color: COL.orange2, ls: 4 });
      X.restore();
    }
    X.restore();
    // salary pill
    const sp = P(t, 6.5, 6.8);
    if (sp > 0) {
      X.save(); X.globalAlpha = E.outC(sp) * (1 - P(t, 7.1, 7.3)); X.translate(540, 1160 + (1 - E.outBack(sp)) * 40);
      rr(-230, -44, 460, 88, 44); X.fillStyle = COL.orange; X.fill();
      T('+ SALAIRE', 0, 2, { font: '900 40px Montserrat', ls: 4 });
      X.restore();
    }
  }
});

// ===== S3: "imagine" airplane window (7.22 - 8.75)
const S3CL = (() => { const r = mulberry(5), o = []; for (let i = 0; i < 14; i++) o.push({ x: r() * 1400 - 200, y: 650 + r() * 520, s: .6 + r() * 1.3, v: 40 + r() * 120, a: .7 + r() * .3 }); return o.sort((a, b) => a.s - b.s); })();
SCENES.push({
  a: 7.22, b: 8.62, draw(t) {
    const cx = 540, cy = 800, ow = 560, oh = 820;
    const ent = E.outExpo(P(t, 7.22, 7.5));
    const z = 1 + E.inExpo(P(t, 7.95, 8.5)) * 9;
    const s0 = lerp(1.7, 1, ent) * z;
    X.globalAlpha = clamp(P(t, 7.22, 7.34) * 2);
    X.translate(cx, cy); X.scale(s0, s0); X.translate(-cx, -cy);
    // sky through the window
    X.save(); rr(cx - ow / 2, cy - oh / 2, ow, oh, ow / 2); X.clip();
    const g = X.createLinearGradient(0, cy - oh / 2, 0, cy + oh / 2);
    g.addColorStop(0, '#1D4FBF'); g.addColorStop(.55, '#6FA8F0'); g.addColorStop(.85, '#FFC58A'); g.addColorStop(1, '#FF9C5A');
    X.fillStyle = g; X.fillRect(cx - ow, cy - oh, ow * 2, oh * 2);
    const sg = X.createRadialGradient(cx + 120, cy + 230, 0, cx + 120, cy + 230, 300);
    sg.addColorStop(0, 'rgba(255,240,200,.95)'); sg.addColorStop(.2, 'rgba(255,210,150,.6)'); sg.addColorStop(1, 'rgba(255,200,150,0)');
    X.fillStyle = sg; X.fillRect(cx - ow, cy - oh, ow * 2, oh * 2);
    for (const c of S3CL) { const x = ((c.x - (t - 7) * c.v) % 1500 + 1500) % 1500 - 250; cloud(x, c.y, c.s, c.a * .9); }
    // wing
    X.fillStyle = '#d5deec'; X.beginPath(); X.moveTo(cx - 400, cy + 330); X.lineTo(cx + 40, cy + 170); X.lineTo(cx + 70, cy + 185); X.lineTo(cx - 300, cy + 420); X.fill();
    X.fillStyle = COL.orange; X.beginPath(); X.moveTo(cx + 40, cy + 170); X.lineTo(cx + 60, cy + 120); X.lineTo(cx + 80, cy + 125); X.lineTo(cx + 70, cy + 185); X.fill();
    // shade sliding up
    const sh = E.ioC(P(t, 7.42, 7.88));
    const shTop = cy - oh / 2, shH = oh * (1 - sh);
    if (shH > 1) {
      const sgr = X.createLinearGradient(0, shTop, 0, shTop + shH); sgr.addColorStop(0, '#e9eef6'); sgr.addColorStop(1, '#cfd8e6');
      X.fillStyle = sgr; X.fillRect(cx - ow / 2, shTop, ow, shH);
      for (let k = 1; k < 9; k++) { const ly = shTop + shH - k * 70; if (ly > shTop) { X.fillStyle = 'rgba(0,0,0,.05)'; X.fillRect(cx - ow / 2, ly, ow, 3); } }
      X.fillStyle = '#9aa8bf'; rr(cx - 50, shTop + shH - 30, 100, 16, 8); X.fill();
    }
    X.restore();
    // wall with hole (even-odd)
    X.save();
    X.beginPath(); X.rect(-2000, -2000, 5080, 5920); X.roundRect(cx - ow / 2, cy - oh / 2, ow, oh, ow / 2);
    const wg = X.createLinearGradient(0, 0, W, H); wg.addColorStop(0, '#eef2f8'); wg.addColorStop(1, '#b9c5d8');
    X.fillStyle = wg; X.fill('evenodd');
    // bezel
    X.lineWidth = 46; X.strokeStyle = '#dde4ef'; rr(cx - ow / 2 - 23, cy - oh / 2 - 23, ow + 46, oh + 46, ow / 2 + 23); X.stroke();
    X.lineWidth = 6; X.strokeStyle = 'rgba(0,0,0,.12)'; rr(cx - ow / 2 - 3, cy - oh / 2 - 3, ow + 6, oh + 6, ow / 2 + 3); X.stroke();
    X.lineWidth = 3; X.strokeStyle = 'rgba(255,255,255,.9)'; rr(cx - ow / 2 - 46, cy - oh / 2 - 46, ow + 92, oh + 92, ow / 2 + 46); X.stroke();
    // panel lines
    X.strokeStyle = 'rgba(40,60,100,.08)'; X.lineWidth = 4;
    X.beginPath(); X.moveTo(0, 210); X.lineTo(W, 210); X.moveTo(0, 1390); X.lineTo(W, 1390); X.stroke();
    X.restore();
    // white-out when diving into the clouds
    const wo = P(t, 8.2, 8.5);
    if (wo > 0) { X.setTransform(1, 0, 0, 1, 0, 0); X.fillStyle = `rgba(255,255,255,${E.inQ(wo)})`; X.fillRect(0, 0, W, H); }
  }
});

// ===== S4: globe + departures board (8.4 - 11.2)
const LAND = [
  [[-6, 36], [10, 37], [20, 32], [32, 31], [35, 28], [43, 12], [51, 12], [42, -1], [40, -15], [35, -25], [20, -35], [17, -29], [12, -17], [13, -5], [9, 4], [-8, 4], [-17, 14], [-17, 21], [-13, 28]],
  [[-10, 36], [-9, 43], [-2, 44], [-5, 48], [2, 51], [8, 54], [10, 58], [5, 62], [15, 69], [28, 71], [40, 67], [45, 55], [40, 45], [28, 41], [26, 37], [23, 40], [18, 40], [12, 44], [8, 44], [3, 42], [-5, 36]],
  [[28, 41], [36, 36], [35, 32], [43, 12], [52, 17], [58, 22], [66, 25], [72, 21], [77, 8], [80, 15], [88, 22], [92, 21], [98, 16], [104, 1], [109, 13], [106, 21], [121, 30], [122, 40], [130, 43], [142, 50], [141, 60], [160, 62], [180, 66], [180, 72], [140, 73], [110, 77], [80, 73], [68, 70], [60, 68], [45, 55], [40, 45]],
  [[-168, 66], [-160, 59], [-135, 58], [-124, 48], [-124, 40], [-117, 32], [-110, 23], [-105, 20], [-95, 16], [-88, 15], [-83, 9], [-77, 8], [-81, 13], [-87, 21], [-97, 27], [-90, 30], [-82, 25], [-80, 32], [-76, 38], [-70, 42], [-66, 45], [-60, 47], [-55, 52], [-64, 60], [-77, 62], [-95, 72], [-120, 72], [-140, 70], [-160, 71]],
  [[-77, 8], [-60, 10], [-50, 0], [-35, -6], [-40, -22], [-48, -27], [-58, -38], [-65, -46], [-70, -55], [-75, -50], [-73, -40], [-71, -30], [-70, -18], [-76, -14], [-81, -5], [-79, 1]],
  [[114, -22], [122, -17], [130, -12], [137, -12], [142, -11], [146, -19], [153, -26], [150, -37], [141, -38], [131, -31], [115, -34]],
  [[-50, 60], [-42, 60], [-20, 70], [-20, 80], [-60, 82], [-72, 77], [-55, 70]],
  [[-5, 50], [1, 51], [0, 53], [-2, 56], [-5, 58], [-6, 55], [-3, 54]],
  [[44, -25], [50, -15], [49, -12], [43, -17]],
  [[130, 31], [136, 34], [141, 36], [142, 43], [140, 41], [133, 35]],
];
function inPoly(x, y, poly) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; }
const GLOBE_DOTS = (() => {
  const o = [];
  for (let lat = -58; lat <= 82; lat += 2.4) {
    const step = 2.4 / Math.max(.2, Math.cos(lat * D2R));
    for (let lon = -180; lon < 180; lon += step) if (LAND.some(p => inPoly(lon, lat, p))) o.push([lon, lat]);
  }
  return o;
})();
const CITIES = { RAK: [-8.0, 31.63], PARIS: [2.35, 48.85], DUBAI: [55.27, 25.2], ISTANBUL: [28.97, 41.0], 'NEW YORK': [-74, 40.7] };
function vec(lon, lat) { const a = lon * D2R, b = lat * D2R; return [Math.cos(b) * Math.sin(a), Math.sin(b), Math.cos(b) * Math.cos(a)]; }
function project(v, lon0, lat0) {
  // rotate around Y by -lon0, then around X by lat0
  const a = -lon0 * D2R, b = lat0 * D2R;
  let [x, y, z] = v;
  const x1 = x * Math.cos(a) + z * Math.sin(a), z1 = -x * Math.sin(a) + z * Math.cos(a);
  const y2 = y * Math.cos(b) - z1 * Math.sin(b), z2 = y * Math.sin(b) + z1 * Math.cos(b);
  return [x1, y2, z2];
}
function slerp(a, b, s) {
  const d = clamp(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], -1, 1), om = Math.acos(d), so = Math.sin(om);
  if (so < 1e-6) return a;
  const k1 = Math.sin((1 - s) * om) / so, k2 = Math.sin(s * om) / so;
  return [a[0] * k1 + b[0] * k2, a[1] * k1 + b[1] * k2, a[2] * k1 + b[2] * k2];
}
const ROUTES = [['PARIS', 9.6], ['DUBAI', 9.95], ['ISTANBUL', 10.3], ['NEW YORK', 10.62]];
SCENES.push({
  a: 8.4, b: 11.2, draw(t) {
    const ent = E.outExpo(P(t, 8.42, 9.0)), ex = P(t, 10.95, 11.2);
    const gx = 540, gy = 640, R = 330 * lerp(.55, 1, ent) * (1 + ex * .2);
    const lon0 = 6 + (t - 8.4) * 7 - (1 - ent) * 40, lat0 = 26;
    X.globalAlpha = clamp(ent * 2) * (1 - ex);
    // atmosphere
    const ag = X.createRadialGradient(gx, gy, R * .9, gx, gy, R * 1.35);
    ag.addColorStop(0, 'rgba(90,168,255,.35)'); ag.addColorStop(1, 'rgba(90,168,255,0)');
    X.fillStyle = ag; circle(gx, gy, R * 1.4); X.fill();
    const sg = X.createRadialGradient(gx - R * .35, gy - R * .4, R * .1, gx, gy, R);
    sg.addColorStop(0, '#16408f'); sg.addColorStop(1, '#071636');
    X.fillStyle = sg; circle(gx, gy, R); X.fill();
    X.strokeStyle = 'rgba(140,190,255,.5)'; X.lineWidth = 2; circle(gx, gy, R); X.stroke();
    // graticule (faint)
    X.save(); circle(gx, gy, R); X.clip(); X.strokeStyle = 'rgba(140,190,255,.10)'; X.lineWidth = 1.5;
    for (let lat = -60; lat <= 60; lat += 30) { X.beginPath(); let first = true; for (let lon = -180; lon <= 180; lon += 6) { const p = project(vec(lon, lat), lon0, lat0); if (p[2] < 0) { first = true; continue; } const sx = gx + p[0] * R, sy = gy - p[1] * R; first ? X.moveTo(sx, sy) : X.lineTo(sx, sy); first = false; } X.stroke(); }
    for (let lon = -180; lon < 180; lon += 30) { X.beginPath(); let first = true; for (let lat = -90; lat <= 90; lat += 6) { const p = project(vec(lon, lat), lon0, lat0); if (p[2] < 0) { first = true; continue; } const sx = gx + p[0] * R, sy = gy - p[1] * R; first ? X.moveTo(sx, sy) : X.lineTo(sx, sy); first = false; } X.stroke(); }
    X.restore();
    // land dots
    for (const [lon, lat] of GLOBE_DOTS) {
      const p = project(vec(lon, lat), lon0, lat0); if (p[2] <= 0.02) continue;
      const a = .25 + .75 * p[2];
      X.fillStyle = `rgba(200,225,255,${a})`;
      X.fillRect(gx + p[0] * R - 2.6, gy - p[1] * R - 2.6, 5.2 * (.6 + .4 * p[2]), 5.2 * (.6 + .4 * p[2]));
    }
    // RAK pin
    const rak = vec(...CITIES.RAK);
    const pr = project(rak, lon0, lat0), rx = gx + pr[0] * R, ry = gy - pr[1] * R;
    const pinP = E.outBack(P(t, 8.9, 9.15));
    for (let k = 0; k < 3; k++) { const ph = ((t - 8.9) * 1.1 + k / 3) % 1; if (t > 8.9) { X.strokeStyle = rgba(COL.orange, (1 - ph) * .8); X.lineWidth = 3; circle(rx, ry, 8 + ph * 60); X.stroke(); } }
    if (pinP > 0) { pinIcon(rx, ry, 1.6 * pinP); T('MARRAKECH', rx + 18, ry - 70, { font: '800 24px Montserrat', align: 'left', ls: 3, alpha: P(t, 9.0, 9.2) }); }
    // routes
    for (const [name, t0] of ROUTES) {
      const p = E.ioC(P(t, t0, t0 + .5)); if (p <= 0) continue;
      const dv = vec(...CITIES[name]);
      X.save(); X.lineCap = 'round';
      const n = 40, pts = [];
      for (let i = 0; i <= n * p; i++) { const s = i / n, v = slerp(rak, dv, s), h = 1 + .22 * Math.sin(Math.PI * s); const q = project(v, lon0, lat0); pts.push([gx + q[0] * R * h, gy - q[1] * R * h, q[2]]); }
      X.strokeStyle = COL.orange; X.lineWidth = 5; X.shadowColor = COL.orange; X.shadowBlur = 16;
      X.beginPath(); pts.forEach((q, i) => i ? X.lineTo(q[0], q[1]) : X.moveTo(q[0], q[1])); X.stroke();
      X.restore();
      const end = pts[pts.length - 1], pre = pts[Math.max(0, pts.length - 3)];
      if (p < 1) planeTop(end[0], end[1], 22, Math.atan2(end[1] - pre[1], end[0] - pre[0]), '#fff');
      else {
        const dq = project(dv, lon0, lat0);
        if (dq[2] > 0) { X.fillStyle = '#fff'; circle(gx + dq[0] * R, gy - dq[1] * R, 8); X.fill(); T(name, gx + dq[0] * R, gy - dq[1] * R - 26, { font: '800 22px Montserrat', ls: 2, alpha: .9 }); }
      }
    }
    // departure board
    const bp = E.outExpo(P(t, 8.5, 8.95));
    X.save(); X.translate(0, (1 - bp) * 300 + ex * 80); X.globalAlpha *= bp;
    rr(60, 1040, 960, 360, 30); X.fillStyle = 'rgba(4,10,26,.9)'; X.fill(); X.strokeStyle = 'rgba(255,255,255,.14)'; X.lineWidth = 2; X.stroke();
    T('DEPARTURES', 100, 1088, { font: '800 26px Montserrat', align: 'left', color: COL.orange, ls: 8 });
    T('المغادرة', 980, 1086, { font: '700 28px Alexandria', align: 'right', dir: 'rtl', color: 'rgba(255,255,255,.7)' });
    planeTop(392, 1088, 18, -0.5, COL.orange);
    const cw = 76, chh = 108, gap = 8, x0 = 100;
    const row = (y, label, word, schedule) => {
      T(label, 975, y + chh / 2, { font: '800 40px Alexandria', align: 'right', dir: 'rtl' });
      for (let i = 0; i < 9; i++) {
        const ch = [];
        for (const [t0, w] of schedule) {
          const target = (w.padEnd(9, ' '))[i];
          const ts = t0 + i * .03;
          const rr2 = mulberry(i * 31 + Math.floor(t0 * 100));
          if (schedule.scramble) for (let k = 0; k < 3; k++) ch.push([ts + k * .06, 'ABCDEFGHIJKLMNOPRSTUVWXYZ'[Math.floor(rr2() * 25)]]);
          ch.push([ts + (schedule.scramble ? .18 : 0), target]);
        }
        flapCell(t, x0 + i * (cw + gap), y, cw, chh, ch, '800 64px JBM', { dur: .09 });
      }
    };
    const s1 = [[8.85, 'MARRAKECH']]; s1.scramble = true;
    row(1120, 'اليوم', '', s1);
    const s2 = [[9.62, 'PARIS'], [9.97, 'DUBAI'], [10.32, 'ISTANBUL'], [10.64, 'NEW YORK']];
    row(1260, 'غدا', '', s2);
    X.restore();
    // white flash coming in from S3
    const wf = 1 - P(t, 8.42, 8.8);
    if (wf > 0) { X.setTransform(1, 0, 0, 1, 0, 0); X.globalAlpha = 1; X.fillStyle = `rgba(255,255,255,${E.inQ(wf)})`; X.fillRect(0, 0, W, H); }
  }
});

// ===== S5: new airport / new faces / different experience (11.05 - 14.9)
const FACES = [
  { bg: '#1E5BD8', skin: '#F1C7A5', hair: '#3b2416' }, { bg: '#F7941D', skin: '#8D5524', hair: '#1a1110' },
  { bg: '#5AA8FF', skin: '#E0AC69', hair: '#2a1a10', long: 1 }, { bg: '#F6C15B', skin: '#FFDBAC', hair: '#c98b3d', long: 1 },
  { bg: '#F27E9B', skin: '#C68642', hair: '#120c08', long: 1 }, { bg: '#2BC4B4', skin: '#A0522D', hair: '#1b120c' },
  { bg: '#7B61FF', skin: '#F1C7A5', hair: '#7a3b1b', long: 1 },
];
const GREET = [['Hello', -350, -300], ['Bonjour', 330, -320], ['مرحبا', -400, 190], ['Hola', 400, 200], ['Ciao', -170, 430], ['Merhaba', 190, 440]];
function face(x, y, r, f, s) {
  X.save(); X.translate(x, y); X.scale(s, s);
  X.fillStyle = f.bg; circle(0, 0, r); X.fill();
  X.save(); circle(0, 0, r); X.clip();
  if (f.long) { X.fillStyle = f.hair; rr(-r * .52, -r * .45, r * 1.04, r * 1.05, r * .4); X.fill(); }
  X.fillStyle = '#ffffff'; X.beginPath(); X.ellipse(0, r * 1.05, r * .78, r * .55, 0, 0, TAU); X.fill();
  X.fillStyle = f.skin; rr(-r * .14, r * .25, r * .28, r * .35, 4); X.fill();
  X.beginPath(); X.ellipse(0, -r * .05, r * .38, r * .45, 0, 0, TAU); X.fill();
  X.fillStyle = f.hair; X.beginPath(); X.ellipse(0, -r * .28, r * .42, r * .3, 0, Math.PI, TAU); X.fill();
  X.beginPath(); X.ellipse(-r * .1, -r * .36, r * .34, r * .18, -0.3, 0, TAU); X.fill();
  X.fillStyle = '#1a1a2a'; circle(-r * .14, -r * .04, r * .045); X.fill(); circle(r * .14, -r * .04, r * .045); X.fill();
  X.strokeStyle = '#7a2e1e'; X.lineWidth = r * .045; X.lineCap = 'round'; X.beginPath(); X.arc(0, r * .07, r * .14, .2 * Math.PI, .8 * Math.PI); X.stroke();
  X.restore();
  X.strokeStyle = 'rgba(255,255,255,.9)'; X.lineWidth = 6; circle(0, 0, r); X.stroke();
  X.restore();
}
function chip(x, y, text, num, alpha) {
  if (alpha <= 0) return;
  X.save(); X.globalAlpha *= alpha;
  const w = measure(text, '800 30px Montserrat', 5) + 110;
  rr(x - w / 2, y - 34, w, 68, 34); X.fillStyle = 'rgba(5,12,30,.75)'; X.fill(); X.strokeStyle = COL.orange; X.lineWidth = 3; X.stroke();
  X.fillStyle = COL.orange; circle(x - w / 2 + 34, y, 22); X.fill();
  T(num, x - w / 2 + 34, y + 1, { font: '900 20px Montserrat' });
  T(text, x + 22, y + 2, { font: '800 30px Montserrat', ls: 5 });
  X.restore();
}
const STAMPS = [
  { t: 13.3, x: -190, y: -90, r: -.25, c: '#C0392B', kind: 'circle', a: 'PARIS', b: 'CDG' },
  { t: 13.62, x: 170, y: -120, r: .18, c: '#1E5BD8', kind: 'rect', a: 'DUBAI', b: 'DXB' },
  { t: 13.92, x: -170, y: 120, r: .12, c: '#1E8449', kind: 'oval', a: 'ISTANBUL', b: 'IST' },
  { t: 14.2, x: 190, y: 110, r: -.15, c: '#6C3483', kind: 'rect2', a: 'NEW YORK', b: 'JFK' },
];
SCENES.push({
  a: 11.05, b: 14.95, draw(t) {
    const sub = [[11.08, 12.16], [12.1, 13.1], [13.04, 14.95]];
    const push = (i) => { const [a, b] = sub[i]; return { in: E.outExpo(P(t, a, a + .3)), out: E.inC(P(t, b - .16, b)) }; };
    // A: airport
    let s = push(0);
    if (t < sub[0][1]) {
      X.save(); X.translate((1 - s.in) * -500 + s.out * 900, 0); X.globalAlpha = s.in * (1 - s.out);
      chip(540, 330, 'NOUVEL AÉROPORT', '01', 1);
      // ground + runway lights
      X.fillStyle = 'rgba(255,255,255,.12)'; X.fillRect(60, 1150, 960, 4);
      for (let k = 0; k < 12; k++) { const lx = 80 + ((k * 85 - (t - 11) * 300) % 1020 + 1020) % 1020; X.fillStyle = k % 2 ? COL.orange : '#9fd0ff'; circle(lx, 1172, 5); X.fill(); }
      // tower
      const g1 = E.outBack(P(t, 11.1, 11.45));
      X.save(); X.translate(700, 1150); X.scale(1, g1);
      const tg = X.createLinearGradient(-50, 0, 50, 0); tg.addColorStop(0, '#c9d5ea'); tg.addColorStop(1, '#8395b8');
      X.fillStyle = tg; X.beginPath(); X.moveTo(-55, 0); X.lineTo(-34, -430); X.lineTo(34, -430); X.lineTo(55, 0); X.fill();
      X.fillStyle = 'rgba(0,0,0,.15)'; for (let k = 1; k < 6; k++) X.fillRect(-50, -k * 72, 100, 4);
      X.restore();
      const g2 = E.outBack(P(t, 11.32, 11.6));
      X.save(); X.translate(700, 720); X.scale(g2, g2);
      X.fillStyle = '#e3eaf6'; X.beginPath(); X.moveTo(-95, 0); X.lineTo(-140, -110); X.lineTo(140, -110); X.lineTo(95, 0); X.fill();
      const wgl = X.createLinearGradient(0, -100, 0, -20); wgl.addColorStop(0, '#5AA8FF'); wgl.addColorStop(1, '#16408f');
      X.fillStyle = wgl; X.beginPath(); X.moveTo(-108, -30); X.lineTo(-130, -95); X.lineTo(130, -95); X.lineTo(108, -30); X.fill();
      X.fillStyle = 'rgba(255,255,255,.35)'; for (let k = -3; k <= 3; k++) X.fillRect(k * 34 - 2, -95, 4, 65);
      X.fillStyle = '#c9d5ea'; rr(-150, -135, 300, 28, 8); X.fill();
      X.fillStyle = '#9fb0cc'; X.fillRect(-4, -230, 8, 100);
      X.fillStyle = Math.sin(t * 9) > 0 ? '#ff3b3b' : '#6b1a1a'; circle(0, -236, 10); X.fill();
      X.restore();
      // plane taking off
      const pt = P(t, 11.25, 12.1), pe = E.inQ(pt);
      const px = lerp(-150, 1250, pt), py = 1110 - pe * 700 - pt * 60;
      X.save(); X.strokeStyle = 'rgba(255,255,255,.35)'; X.lineWidth = 6; X.lineCap = 'round';
      X.beginPath(); for (let k = 0; k <= 20; k++) { const q = pt - k * .02; if (q < 0) break; const xx = lerp(-150, 1250, q), yy = 1110 - E.inQ(q) * 700 - q * 60; k ? X.lineTo(xx - 120, yy + 18) : X.moveTo(xx - 120, yy + 18); } X.stroke(); X.restore();
      planeSide(px, py, 300, -0.08 - pe * .45);
      X.restore();
    }
    // B: faces
    s = push(1);
    if (t > sub[1][0] && t < sub[1][1]) {
      X.save(); X.translate((1 - s.in) * -900 + s.out * 900, 0); X.globalAlpha = s.in * (1 - s.out);
      chip(540, 330, 'NOUVEAUX VISAGES', '02', 1);
      const pos = [[540, 790, 125]]; for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + k * TAU / 6 + .5; pos.push([540 + Math.cos(a) * 265, 790 + Math.sin(a) * 265, 100]); }
      pos.forEach(([x, y, r], i) => { const p = P(t, 12.12 + i * .06, 12.42 + i * .06); if (p > 0) face(x, y + Math.sin(t * 2 + i) * 6, r, FACES[i], E.outBack(p, 2.2)); });
      GREET.forEach(([g, dx, dy], i) => {
        const p = P(t, 12.35 + i * .07, 12.6 + i * .07); if (p <= 0) return;
        const ar = /[؀-ۿ]/.test(g), f = ar ? '700 34px Alexandria' : '800 32px Montserrat';
        const w = measure(g, f, 0, ar ? 'rtl' : 'ltr') + 44;
        X.save(); X.translate(540 + dx, 790 + dy - p * 20); X.scale(E.outBack(p), E.outBack(p));
        rr(-w / 2, -32, w, 64, 32); X.fillStyle = i % 2 ? '#fff' : COL.orange; X.fill();
        X.beginPath(); X.moveTo(-10, 30); X.lineTo(0, 46); X.lineTo(12, 30); X.fill();
        T(g, 0, 2, { font: f, dir: ar ? 'rtl' : 'ltr', color: i % 2 ? COL.ink : '#fff' });
        X.restore();
      });
      X.restore();
    }
    // C: passport stamps
    s = push(2);
    if (t > sub[2][0]) {
      const ex = P(t, 14.7, 14.95);
      X.save(); X.translate((1 - s.in) * -900, 0); X.globalAlpha = s.in * (1 - ex);
      chip(540, 330, 'NOUVELLE EXPÉRIENCE', '03', 1);
      X.translate(540, 790); X.rotate(-0.04); X.scale(1 + ex * .2, 1 + ex * .2);
      X.save(); X.shadowColor = 'rgba(0,0,0,.5)'; X.shadowBlur = 50; X.shadowOffsetY = 20;
      X.fillStyle = '#5b1f2a'; rr(-400, -290, 800, 580, 26); X.fill(); X.restore();
      X.fillStyle = '#F4EFE3'; rr(-385, -275, 380, 550, 14); X.fill(); rr(5, -275, 380, 550, 14); X.fill();
      X.save(); X.strokeStyle = 'rgba(30,91,216,.10)'; X.lineWidth = 2;
      for (let k = 0; k < 18; k++) { X.beginPath(); for (let xx = -380; xx <= 380; xx += 10) { const yy = -260 + k * 30 + Math.sin(xx * .03 + k) * 8; xx === -380 ? X.moveTo(xx, yy) : X.lineTo(xx, yy); } X.stroke(); }
      X.restore();
      const spine = X.createLinearGradient(-30, 0, 30, 0); spine.addColorStop(0, 'rgba(0,0,0,0)'); spine.addColorStop(.5, 'rgba(0,0,0,.25)'); spine.addColorStop(1, 'rgba(0,0,0,0)');
      X.fillStyle = spine; X.fillRect(-30, -275, 60, 550);
      T('PASSPORT', -195, -235, { font: '700 20px Montserrat', color: 'rgba(91,31,42,.5)', ls: 6 });
      X.globalCompositeOperation = 'multiply';
      for (const st of STAMPS) {
        const p = P(t, st.t, st.t + .1); if (p <= 0) continue;
        X.save(); X.translate(st.x, st.y); X.rotate(st.r); const sc = lerp(2.2, 1, E.outC(p)); X.scale(sc, sc);
        X.globalAlpha *= clamp(p * 2) * .85; X.strokeStyle = st.c; X.fillStyle = st.c;
        if (st.kind === 'circle') { X.lineWidth = 6; circle(0, 0, 105); X.stroke(); X.lineWidth = 2; circle(0, 0, 90); X.stroke(); }
        else if (st.kind === 'oval') { X.lineWidth = 6; X.beginPath(); X.ellipse(0, 0, 150, 90, 0, 0, TAU); X.stroke(); }
        else { X.lineWidth = 6; rr(-150, -80, 300, 160, st.kind === 'rect' ? 6 : 30); X.stroke(); X.lineWidth = 2; rr(-138, -68, 276, 136, st.kind === 'rect' ? 4 : 22); X.stroke(); }
        T(st.a, 0, -14, { font: '900 38px Montserrat', color: st.c, ls: 2 });
        T(st.b + ' · 2026', 0, 32, { font: '700 22px Montserrat', color: st.c, ls: 3 });
        planeTop(0, -62, 16, -Math.PI / 2, st.c);
        X.restore();
      }
      X.restore();
    }
  }
});

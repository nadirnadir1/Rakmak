// ---------- frame compositor ----------
const BGK = [ // [time, top, bottom]
  [0, '#061233', '#0B2A6B'], [8.4, '#0A1F55', '#1C4FA8'], [11.05, '#071743', '#123A86'], [14.8, '#04091A', '#0E1F4A'],
  [18.6, '#0A1640', '#1A2F6E'], [22.55, '#050D24', '#0F2560'], [32.0, '#061233', '#0E2D73'], [35.75, '#071743', '#143A8F'], [38.65, '#050D24', '#0D2763'],
];
function bgColors(t) {
  let i = 0; for (let k = 0; k < BGK.length; k++) if (BGK[k][0] <= t) i = k;
  const prev = BGK[Math.max(0, i - 1)], cur = BGK[i], q = E.smooth(P(t, cur[0], cur[0] + .6));
  return [mixHex(prev[1], cur[1], i ? q : 1), mixHex(prev[2], cur[2], i ? q : 1)];
}
const DUST = (() => { const r = mulberry(99), o = []; for (let i = 0; i < 110; i++) o.push([r() * W, r() * H, .6 + r() * 2.4, 8 + r() * 40, r() * TAU]); return o; })();
const GRAIN = (() => { const arr = []; const r = mulberry(1234); for (let k = 0; k < 4; k++) { const c = makeCanvas(540, 960), g = c.getContext('2d'), id = g.createImageData(540, 960); for (let i = 0; i < id.data.length; i += 4) { const v = r() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; } g.putImageData(id, 0, 0); arr.push(c); } return arr; })();

function drawBG(t) {
  const [top, bot] = bgColors(t);
  const g = X.createLinearGradient(0, 0, 0, H); g.addColorStop(0, top); g.addColorStop(1, bot);
  X.fillStyle = g; X.fillRect(0, 0, W, H);
  const orbs = [[300 + Math.sin(t * .3) * 200, 500 + Math.cos(t * .25) * 150, 700, 'rgba(30,91,216,.35)'],
  [850 + Math.cos(t * .27) * 150, 1300 + Math.sin(t * .2) * 200, 650, 'rgba(247,148,29,.16)'],
  [600 + Math.sin(t * .17 + 2) * 250, 1000, 800, 'rgba(90,168,255,.14)']];
  for (const [x, y, r, c] of orbs) { const rg = X.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, c); rg.addColorStop(1, 'rgba(0,0,0,0)'); X.fillStyle = rg; X.fillRect(0, 0, W, H); }
  for (const [x, y, s, v, ph] of DUST) {
    const yy = ((y - t * v) % H + H) % H, a = .25 + .35 * Math.sin(t * 2 + ph);
    X.fillStyle = `rgba(200,225,255,${a})`; X.fillRect(x + Math.sin(t * .5 + ph) * 20, yy, s, s);
  }
}

// screen shake impulses: [time, amplitude, duration]
const SHAKES = [[5.38, 14, .3], [13.3, 6, .2], [13.62, 6, .2], [13.92, 6, .2], [14.2, 6, .2], [22.02, 46, .6], [33.88, 10, .35], [38.82, 16, .35]];
function shake(t) {
  let x = 0, y = 0;
  for (const [t0, a, d] of SHAKES) { const p = (t - t0) / d; if (p < 0 || p > 1) continue; const k = a * Math.pow(1 - p, 2); x += Math.sin(t * 91 + t0) * k; y += Math.cos(t * 77 + t0 * 3) * k; }
  return [x, y];
}

// diagonal band swipes
const SWIPES = [3.7, 11.1, 14.8, 18.62, 28.45, 38.7, 41.48];
function drawSwipes(t) {
  for (const T0 of SWIPES) {
    const p = P(t, T0 - .28, T0 + .3); if (p <= 0 || p >= 1) continue;
    X.save(); X.translate(540, 960); X.rotate(-.35);
    [[COL.orange, 0], [COL.blue2, .07], ['#ffffff', .14], [COL.navy2, .2]].forEach(([c, d], i) => {
      const q = E.ioC(clamp((p - d) / .75));
      const x = lerp(1500, -1500, q);
      X.fillStyle = c; X.fillRect(x - 260 + i * 0, -1800, i === 2 ? 60 : 420, 3600);
    });
    X.restore();
  }
}

// small brand watermark
function drawWatermark(t) {
  const a = Math.min(P(t, .2, .6), 1 - P(t, 33.0, 33.3)) + Math.min(P(t, 35.9, 36.2), 1 - P(t, 38.5, 38.75));
  const hide = (t > 7.22 && t < 8.6) ? 0 : 1;
  if (a * hide <= 0) return;
  X.save(); X.globalAlpha = clamp(a) * hide * .92; X.drawImage(IMG.full, 540 - 160, 82, 320, 92); X.restore();
}

// karaoke captions
const CAP_FONT = 800, CAP_Y = 1520;
function drawCaptions(t) {
  // find chunk
  let ci = -1;
  for (let i = 0; i < CAPTIONS.length; i++) {
    const c = CAPTIONS[i], s = c[0][1] - .12, nxt = i + 1 < CAPTIONS.length ? CAPTIONS[i + 1][0][1] - .12 : 1e9;
    const e = Math.min(nxt, c[c.length - 1][2] + .6);
    if (t >= s && t < e) { ci = i; break; }
  }
  // dark band for legibility
  X.save(); const bg = X.createLinearGradient(0, 1330, 0, 1760); bg.addColorStop(0, 'rgba(0,0,0,0)'); bg.addColorStop(.5, 'rgba(0,0,0,.30)'); bg.addColorStop(1, 'rgba(0,0,0,0)');
  X.globalAlpha = ci >= 0 ? 1 : 0; X.fillStyle = bg; X.fillRect(0, 1330, W, 430); X.restore();
  if (ci < 0) return;
  const c = CAPTIONS[ci];
  const s0 = c[0][1] - .12, last = c[c.length - 1][2];
  const nxt = ci + 1 < CAPTIONS.length ? CAPTIONS[ci + 1][0][1] - .12 : 1e9, e0 = Math.min(nxt, last + .6);
  const outP = P(t, e0 - .1, e0);
  let size = 78; const gap = 46;
  let ws = c.map(w => measure(w[0], `${CAP_FONT} ${size}px Cairo`, 0, 'rtl'));
  let tot = ws.reduce((a, b) => a + b, 0) + gap * (c.length - 1);
  if (tot > 940) { size = Math.floor(size * 940 / tot); ws = c.map(w => measure(w[0], `${CAP_FONT} ${size}px Cairo`, 0, 'rtl')); tot = ws.reduce((a, b) => a + b, 0) + gap * (c.length - 1); }
  let x = 540 + tot / 2;
  c.forEach(([word, ws0, we], i) => {
    const w = ws[i], cx = x - w / 2;
    const inP = E.outBack(P(t, s0 + i * .035, s0 + i * .035 + .3), 1.6);
    const active = t >= ws0 && t < we + .02;
    const spoken = t >= ws0;
    const pop = active ? 1 + .1 * Math.sin(P(t, ws0, ws0 + .18) * Math.PI) : 1;
    X.save();
    X.globalAlpha = clamp(P(t, s0 + i * .035, s0 + i * .035 + .15)) * (1 - outP);
    X.translate(cx, CAP_Y + (1 - inP) * 40 - outP * 20);
    X.scale(pop, pop);
    if (active) {
      const ap = E.outBack(P(t, ws0, ws0 + .15), 2);
      X.save(); X.scale(ap, ap); X.shadowColor = 'rgba(247,148,29,.6)'; X.shadowBlur = 24;
      rr(-w / 2 - 16, -size * .6, w + 32, size * 1.26, 22); X.fillStyle = COL.orange; X.fill(); X.restore();
    }
    T(word, 0, 2, { font: `${CAP_FONT} ${size}px Cairo`, dir: 'rtl', color: spoken ? '#fff' : 'rgba(255,255,255,.55)', stroke: active ? undefined : 'rgba(5,10,30,.85)', lw: 12 });
    X.restore();
    x -= w + gap;
  });
}

function drawGrainVignette(t) {
  X.save();
  X.globalCompositeOperation = 'overlay'; X.globalAlpha = .07;
  X.drawImage(GRAIN[Math.floor(t * 24) % 4], 0, 0, W, H);
  X.restore();
  const v = X.createRadialGradient(540, 900, 500, 540, 960, 1250); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.55)');
  X.fillStyle = v; X.fillRect(0, 0, W, H);
}

function render(t) {
  X.setTransform(1, 0, 0, 1, 0, 0); X.globalAlpha = 1; X.globalCompositeOperation = 'source-over'; X.setLineDash([]); X.letterSpacing = '0px';
  drawBG(t);
  const [sx, sy] = shake(t);
  for (const s of SCENES) {
    if (t < s.a || t >= s.b) continue;
    X.save(); X.setTransform(1, 0, 0, 1, sx, sy); X.globalAlpha = 1; s.draw(t); X.restore();
  }
  X.setTransform(1, 0, 0, 1, 0, 0); X.globalAlpha = 1;
  drawWatermark(t);
  drawSwipes(t);
  X.save(); X.translate(sx * .4, sy * .4); drawCaptions(t); X.restore();
  drawGrainVignette(t);
  const fo = P(t, 47.4, 48.0); if (fo > 0) { X.fillStyle = `rgba(0,0,0,${fo})`; X.fillRect(0, 0, W, H); }
  const fi = 1 - P(t, 0, .25); if (fi > 0) { X.fillStyle = `rgba(0,0,0,${fi})`; X.fillRect(0, 0, W, H); }
}

window.READY = (async () => {
  await Promise.all([loadImg('full', 'assets/logo_full.png'), loadImg('swoosh', 'assets/swoosh_orange.png'), loadImg('white', 'assets/logo_white_parts.png'), loadImg('hostess', 'assets/crew_hostess.png'), loadImg('steward', 'assets/crew_steward.png')]);
  const specs = ['400 40px Lalezar', '400 40px Alexandria', '700 40px Alexandria', '800 40px Alexandria', '900 40px Alexandria', '800 40px Cairo',
    '600 40px Montserrat', '700 40px Montserrat', '800 40px Montserrat', '900 40px Montserrat', '800 40px JBM'];
  await Promise.all(specs.map(s => document.fonts.load(s, 'Aaمرحبا')));
  await document.fonts.ready;
  render(0);
  return true;
})();
window.render = render;

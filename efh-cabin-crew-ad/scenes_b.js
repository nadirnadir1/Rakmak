// ---------- Scenes 6-10 ----------

// ===== S6: CABIN CREW title + gold wings (14.78 - 18.7)
const WINGC = makeCanvas(1080, 520);
function drawWings(t) {
  const c = WINGC.getContext('2d');
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, 1080, 520);
  c.translate(540, 260);
  const gold = c.createLinearGradient(0, -120, 0, 120); gold.addColorStop(0, '#FFF1C2'); gold.addColorStop(.45, '#F6C15B'); gold.addColorStop(1, '#B9791E');
  for (const side of [1, -1]) {
    c.save(); c.scale(side, 1);
    for (let k = 5; k >= 0; k--) {
      const p = E.outExpo(P(t, 14.95 + k * .07, 15.55 + k * .07)); if (p <= 0) continue;
      const len = (420 - k * 58) * p, y = -58 + k * 27, x0 = 95;
      c.beginPath(); c.moveTo(x0, y + 22);
      c.lineTo(x0, y);
      c.quadraticCurveTo(x0 + len * .6, y - 18 - k * 2, x0 + len, y - 34 + k * 4);
      c.quadraticCurveTo(x0 + len - 20, y + 4, x0 + len - 48, y + 20);
      c.closePath();
      c.fillStyle = gold; c.fill();
      c.strokeStyle = 'rgba(120,70,10,.55)'; c.lineWidth = 2.5; c.stroke();
    }
    c.restore();
  }
  const bp = E.outBack(P(t, 14.9, 15.25), 2);
  if (bp > 0) {
    c.save(); c.scale(bp, bp);
    c.fillStyle = gold; c.beginPath(); c.arc(0, 0, 104, 0, TAU); c.fill();
    c.fillStyle = '#0A1C4A'; c.beginPath(); c.arc(0, 0, 90, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(246,193,91,.6)'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 78, 0, TAU); c.stroke();
    c.fillStyle = '#F6C15B'; c.font = '900 50px Montserrat'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('EFH', 0, 4);
    c.restore();
  }
  // shine
  for (const t0 of [15.9, 17.5]) {
    const sp = P(t, t0, t0 + .6); if (sp <= 0 || sp >= 1) continue;
    c.globalCompositeOperation = 'source-atop';
    const sx = lerp(-700, 700, E.ioC(sp));
    const g = c.createLinearGradient(sx - 120, 0, sx + 120, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,.85)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.setTransform(1, 0, 0, 1, 540, 260); c.transform(1, 0, -.4, 1, 0, 0); c.fillRect(-900, -260, 1800, 520);
    c.globalCompositeOperation = 'source-over';
  }
}
const S6SP = (() => { const r = mulberry(66), o = []; for (let i = 0; i < 40; i++) o.push([r() * 1080, 300 + r() * 1000, r() * 6 + 3, r() * TAU, .3 + r()]); return o; })();
SCENES.push({
  a: 14.78, b: 18.72, draw(t) {
    const ex = P(t, 18.45, 18.72);
    X.globalAlpha = 1 - ex;
    // rays
    X.save(); X.translate(540, 620); X.rotate(t * .15);
    const ra = P(t, 14.85, 15.4) * .9;
    for (let k = 0; k < 18; k++) {
      X.rotate(TAU / 18); const g = X.createLinearGradient(0, 0, 0, -1100); g.addColorStop(0, `rgba(246,193,91,${.18 * ra})`); g.addColorStop(1, 'rgba(246,193,91,0)');
      X.fillStyle = g; X.beginPath(); X.moveTo(0, 0); X.lineTo(-70, -1100); X.lineTo(70, -1100); X.fill();
    }
    X.restore();
    const glow = X.createRadialGradient(540, 620, 0, 540, 620, 520); glow.addColorStop(0, `rgba(246,193,91,${.28 * ra})`); glow.addColorStop(1, 'rgba(246,193,91,0)');
    X.fillStyle = glow; X.fillRect(0, 0, W, H);
    // sparkles
    for (const [x, y, r, ph, sp] of S6SP) sparkle(x, y - (t - 14.8) * 30 * sp, r, Math.max(0, Math.sin(t * 3 * sp + ph)) * P(t, 15.2, 15.6), '#FFE6A8');
    // wings
    drawWings(t);
    const sc = 1 + ex * .3 + Math.sin(t * 1.5) * .006;
    X.save(); X.translate(540, 620); X.scale(sc, sc); X.shadowColor = 'rgba(0,0,0,.45)'; X.shadowBlur = 30; X.shadowOffsetY = 14;
    X.drawImage(WINGC, -540, -260); X.restore();
    // PNC small line
    T('PERSONNEL NAVIGANT COMMERCIAL', 540, 870, { font: '600 24px Montserrat', ls: 6, alpha: E.outC(P(t, 16.0, 16.4)) * .7 });
    // CABIN CREW letters
    const word = 'CABIN CREW', font = '900 116px Montserrat', ls = 10;
    const total = measure(word, font, ls);
    let x = 540 - total / 2;
    X.save(); X.beginPath(); X.rect(0, 890, W, 135); X.clip();
    for (let i = 0; i < word.length; i++) {
      const ch = word[i], w = measure(ch, font, ls);
      const p = E.outExpo(P(t, 16.04 + i * .035, 16.6 + i * .035));
      T(ch, x + w / 2 - ls / 2, 962 + (1 - p) * 140, { font, color: '#fff', ls: 0 });
      x += w;
    }
    X.restore();
    // Arabic subtitle wipe (RTL)
    const wp = E.ioC(P(t, 17.0, 17.6));
    const aw = measure('طاقم الضيافة الجوية', '800 66px Alexandria', 0, 'rtl');
    X.save(); X.beginPath(); X.rect(540 + aw / 2 + 20 - (aw + 40) * wp, 1030, (aw + 40) * wp, 120); X.clip();
    T('طاقم الضيافة الجوية', 540, 1085, { font: '800 66px Alexandria', dir: 'rtl', color: COL.orange });
    X.restore();
    const ul = E.outExpo(P(t, 17.3, 17.9));
    if (ul > 0) { X.fillStyle = COL.gold; X.fillRect(540 - 240 * ul, 1150, 480 * ul, 4); sparkle(540 + 240 * ul, 1152, 14 * (1 - P(t, 17.8, 18.1)), 1, '#FFE6A8'); sparkle(540 - 240 * ul, 1152, 14 * (1 - P(t, 17.8, 18.1)), 1, '#FFE6A8'); }
  }
});

// ===== S7: just travel & nice photos? (18.55 - 22.4)
const POLS = [
  { x: 320, y: 760, r: -.17, t: 18.8, kind: 0, tag: '#sunset' },
  { x: 770, y: 830, r: .14, t: 19.45, kind: 1, tag: '#aboveclouds' },
  { x: 545, y: 1085, r: -.05, t: 20.25, kind: 2, tag: '#citylights' },
];
function photo(kind, w, h, t) {
  if (kind === 0) {
    const g = X.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#FF7E5F'); g.addColorStop(.55, '#FEB47B'); g.addColorStop(.56, '#2d6bb5'); g.addColorStop(1, '#0f2f66');
    X.fillStyle = g; X.fillRect(0, 0, w, h);
    X.fillStyle = '#FFE7A0'; circle(w * .6, h * .5, 50); X.fill();
    X.fillStyle = 'rgba(255,220,160,.6)'; for (let k = 0; k < 6; k++) X.fillRect(w * .6 - 50 + k * 4, h * .58 + k * 16, 100 - k * 8, 5);
    X.fillStyle = '#1b1020'; X.save(); X.translate(w * .2, h); X.beginPath(); X.moveTo(-8, 0); X.quadraticCurveTo(10, -120, 30, -200); X.lineTo(40, -198); X.quadraticCurveTo(20, -120, 10, 0); X.fill();
    for (let k = 0; k < 6; k++) { X.save(); X.translate(35, -200); X.rotate(-2.6 + k * .6); X.beginPath(); X.ellipse(45, 0, 50, 10, 0, 0, TAU); X.fill(); X.restore(); }
    X.restore();
  } else if (kind === 1) {
    const g = X.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2F80ED'); g.addColorStop(1, '#BFE3FF');
    X.fillStyle = g; X.fillRect(0, 0, w, h);
    cloud(w * .3, h * .8, .9, 1); cloud(w * .85, h * .9, .7, .95); cloud(w * .6, h * .62, .45, .8);
    X.fillStyle = '#e8eef7'; X.beginPath(); X.moveTo(-10, h * .45); X.lineTo(w * .75, h * .3); X.lineTo(w * .8, h * .33); X.lineTo(-10, h * .62); X.fill();
    X.fillStyle = COL.orange; X.beginPath(); X.moveTo(w * .75, h * .3); X.lineTo(w * .8, h * .18); X.lineTo(w * .84, h * .2); X.lineTo(w * .8, h * .33); X.fill();
  } else {
    const g = X.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#0b1338'); g.addColorStop(1, '#3a2a6b');
    X.fillStyle = g; X.fillRect(0, 0, w, h);
    X.fillStyle = '#fff7d6'; circle(w * .8, h * .2, 28); X.fill();
    const r = mulberry(9); let x = 0;
    while (x < w) {
      const bw = 30 + r() * 50, bh = 80 + r() * 190; X.fillStyle = '#121a3d'; X.fillRect(x, h - bh, bw, bh);
      for (let yy = h - bh + 10; yy < h - 10; yy += 18) for (let xx = x + 6; xx < x + bw - 8; xx += 14) if (r() > .45) { X.fillStyle = r() > .3 ? '#FFD27A' : '#9fd0ff'; X.fillRect(xx, yy, 6, 8); }
      x += bw + 4;
    }
  }
}
function polaroid(p, t, k) {
  const w = 400, h = 470, pw = 360, ph = 340;
  X.save(); X.shadowColor = 'rgba(0,0,0,.5)'; X.shadowBlur = 40; X.shadowOffsetY = 18;
  X.fillStyle = '#fbfbf8'; rr(-w / 2, -h / 2, w, h, 8); X.fill(); X.restore();
  X.save(); X.translate(-pw / 2, -h / 2 + 20); X.beginPath(); X.rect(0, 0, pw, ph); X.clip(); photo(p.kind, pw, ph, t); X.restore();
  T(p.tag, 0, h / 2 - 52, { font: '700 30px Montserrat', color: '#4a5570' });
}
SCENES.push({
  a: 18.55, b: 22.42, draw(t) {
    const blast = P(t, 22.02, 22.4), bq = E.outC(blast);
    // hearts first (behind polaroids is fine)
    POLS.forEach((p, i) => {
      const dp = P(t, p.t, p.t + .55); if (dp <= 0) return;
      const yy = lerp(p.y - 1200, p.y, E.outBack(dp, 1.1));
      const rot = p.r + (1 - E.outC(dp)) * (i % 2 ? -.6 : .6) + Math.sin(t * 2 + i) * .01;
      const bx = (p.x - 540) * bq * 3, by = (p.y - 900) * bq * 3;
      X.save(); X.globalAlpha = 1 - blast; X.translate(p.x + bx, yy + by); X.rotate(rot + bq * (i - 1) * 2); X.scale(1 + bq * .5, 1 + bq * .5);
      polaroid(p, t, i); X.restore();
      // hearts
      for (let h = 0; h < 4; h++) {
        const hp = P(t, p.t + .5 + h * .14, p.t + 1.6 + h * .14); if (hp <= 0 || hp >= 1) continue;
        heart(p.x + 150 - h * 20 + Math.sin(hp * 8 + h) * 20 + bx, p.y - 200 - hp * 260 + by, 34 + h * 6, '#FF4D6D', (1 - hp) * (1 - blast));
      }
    });
    // viewfinder brackets
    const vf = P(t, 20.6, 20.75) * (1 - P(t, 21.1, 21.3));
    if (vf > 0) {
      X.save(); X.globalAlpha = vf; X.strokeStyle = '#fff'; X.lineWidth = 6; const m = lerp(80, 0, E.outC(P(t, 20.6, 20.8)));
      const bx0 = 140 - m, by0 = 470 - m, bx1 = 940 + m, by1 = 1360 + m, L = 70;
      X.beginPath();
      X.moveTo(bx0, by0 + L); X.lineTo(bx0, by0); X.lineTo(bx0 + L, by0);
      X.moveTo(bx1 - L, by0); X.lineTo(bx1, by0); X.lineTo(bx1, by0 + L);
      X.moveTo(bx0, by1 - L); X.lineTo(bx0, by1); X.lineTo(bx0 + L, by1);
      X.moveTo(bx1 - L, by1); X.lineTo(bx1, by1); X.lineTo(bx1, by1 - L); X.stroke();
      X.fillStyle = '#ff3b3b'; circle(bx0 + 40, by0 + 40, 10); X.fill();
      X.restore();
    }
    // question mark
    const qp = P(t, 21.18, 21.5);
    if (qp > 0) {
      X.save(); X.globalAlpha = 1 - blast; X.translate(540, 430 - bq * 300); X.rotate(Math.sin(t * 6) * .08 * (1 - P(t, 21.6, 22))); const s = E.outBack(qp, 2.5) * (1 + bq); X.scale(s, s);
      T('؟', 0, 0, { font: '400 330px Lalezar', dir: 'rtl', color: COL.orange, stroke: '#fff', lw: 14, shadow: 'rgba(247,148,29,.7)', blur: 40 });
      X.restore();
    }
    // camera flash
    const fl = P(t, 20.74, 21.0);
    if (fl > 0 && fl < 1) { X.save(); X.setTransform(1, 0, 0, 1, 0, 0); X.globalAlpha = 1; X.fillStyle = `rgba(255,255,255,${.9 * (1 - fl)})`; X.fillRect(0, 0, W, H); X.restore(); }
  }
});

// ===== S8: "لا!" (22.0 - 22.78)
SCENES.push({
  a: 22.0, b: 22.8, draw(t) {
    const fp = P(t, 22.0, 22.35);
    X.save(); X.setTransform(1, 0, 0, 1, 0, 0);
    X.fillStyle = `rgba(255,80,20,${.55 * (1 - fp)})`; X.fillRect(0, 0, W, H); X.restore();
    // speed lines
    X.save(); X.translate(540, 820);
    const r = mulberry(77);
    for (let k = 0; k < 46; k++) {
      const a = r() * TAU, d0 = 260 + r() * 300 + fp * 600, len = 150 + r() * 400;
      X.strokeStyle = `rgba(255,255,255,${(.5 + r() * .5) * (1 - P(t, 22.25, 22.6))})`; X.lineWidth = 2 + r() * 6;
      X.beginPath(); X.moveTo(Math.cos(a) * d0, Math.sin(a) * d0); X.lineTo(Math.cos(a) * (d0 + len), Math.sin(a) * (d0 + len)); X.stroke();
    }
    // shockwaves
    for (const d of [0, .08]) { const sp = P(t, 22.02 + d, 22.5 + d); if (sp > 0 && sp < 1) { X.strokeStyle = `rgba(255,255,255,${1 - sp})`; X.lineWidth = 40 * (1 - sp); circle(0, 0, 120 + E.outC(sp) * 900); X.stroke(); } }
    // the word
    const ip = P(t, 22.02, 22.16), op = P(t, 22.5, 22.78);
    const s = lerp(2.8, 1, E.outExpo(ip)) * (1 + E.inExpo(op) * 6) * (1 + Math.sin(P(t, 22.16, 22.5) * Math.PI) * .04);
    X.globalAlpha = clamp(ip * 3) * (1 - op);
    X.scale(s, s);
    for (let k = 14; k > 0; k--) T('لا', k * 2.2, k * 2.6, { font: '400 560px Lalezar', dir: 'rtl', color: mixHex('#7a2600', '#b34700', k / 14) });
    const g = X.createLinearGradient(0, -250, 0, 200); g.addColorStop(0, '#FFC36B'); g.addColorStop(1, '#FF5A00');
    X.save(); X.font = '400 560px Lalezar'; X.textAlign = 'center'; X.textBaseline = 'middle'; X.direction = 'rtl';
    X.lineJoin = 'round'; X.lineWidth = 16; X.strokeStyle = '#fff'; X.strokeText('لا', 0, 0); X.fillStyle = g; X.fillText('لا', 0, 0); X.restore();
    X.restore();
  }
});

// ===== S9: behind the elegance: 4 pillars (22.55 - 28.6)
const PILLARS = [
  { t: 24.24, ar: 'الانضباط', fr: 'DISCIPLINE', x: 780, y: 650, icon: 'clock' },
  { t: 25.15, ar: 'التواصل', fr: 'COMMUNICATION', x: 300, y: 650, icon: 'chat' },
  { t: 25.8, ar: 'المسؤولية', fr: 'RESPONSABILITÉ', x: 780, y: 1110, icon: 'shield' },
  { t: 26.94, ar: 'التكوين على السلامة', fr: 'SÉCURITÉ', x: 300, y: 1110, icon: 'buoy' },
];
function pillarIcon(kind, t, t0) {
  const p = P(t, t0, t0 + .6), lt = t - t0;
  if (kind === 'clock') {
    X.strokeStyle = '#fff'; X.lineWidth = 9; circle(0, 0, 82); X.stroke();
    for (let k = 0; k < 12; k++) { X.save(); X.rotate(k * TAU / 12); X.fillStyle = k % 3 ? 'rgba(255,255,255,.5)' : '#fff'; X.fillRect(-3, -70, 6, k % 3 ? 10 : 18); X.restore(); }
    const m = -Math.PI / 2 + (1 - E.outC(clamp(lt / .9))) * TAU * 3, hh = -Math.PI / 2 + (1 - E.outC(clamp(lt / .9))) * TAU * .25 + Math.PI / 2 * 0;
    X.lineCap = 'round'; X.strokeStyle = '#fff'; X.lineWidth = 9; X.beginPath(); X.moveTo(0, 0); X.lineTo(Math.cos(hh) * 40, Math.sin(hh) * 40); X.stroke();
    X.strokeStyle = COL.orange; X.lineWidth = 6; X.beginPath(); X.moveTo(0, 0); X.lineTo(Math.cos(m) * 62, Math.sin(m) * 62); X.stroke();
    X.fillStyle = COL.orange; circle(0, 0, 10); X.fill();
  } else if (kind === 'chat') {
    const b1 = E.outBack(P(t, t0, t0 + .3)), b2 = E.outBack(P(t, t0 + .15, t0 + .45));
    X.save(); X.translate(-30, -30); X.scale(b1, b1); X.fillStyle = COL.orange; rr(-80, -55, 140, 92, 26); X.fill();
    X.beginPath(); X.moveTo(-50, 30); X.lineTo(-65, 62); X.lineTo(-20, 34); X.fill(); X.restore();
    X.save(); X.translate(40, 40); X.scale(b2, b2); X.fillStyle = '#fff'; rr(-70, -48, 140, 92, 26); X.fill();
    X.beginPath(); X.moveTo(40, 38); X.lineTo(60, 68); X.lineTo(10, 40); X.fill();
    for (let k = 0; k < 3; k++) { X.fillStyle = COL.ink; circle(-34 + k * 34, -2 - Math.max(0, Math.sin(lt * 9 - k * .9)) * 10, 9); X.fill(); }
    X.restore();
  } else if (kind === 'shield') {
    X.save(); X.scale(1.05, 1.05);
    const sp = new Path2D('M0,-92 C40,-70 70,-68 84,-66 L82,6 C78,56 40,84 0,100 C-40,84 -78,56 -82,6 L-84,-66 C-70,-68 -40,-70 0,-92 Z');
    X.fillStyle = rgba(COL.orange, .9 * P(t, t0 + .35, t0 + .6)); X.fill(sp);
    X.setLineDash([620 * E.ioC(p), 1000]); X.strokeStyle = '#fff'; X.lineWidth = 9; X.lineJoin = 'round'; X.stroke(sp); X.setLineDash([]);
    X.restore();
    checkMark(0, 4, 85, P(t, t0 + .45, t0 + .8), '#fff', 13);
  } else {
    X.save(); X.rotate(lt * 1.6);
    for (let k = 0; k < 8; k++) { X.fillStyle = k % 2 ? '#fff' : COL.orange2; X.beginPath(); X.arc(0, 0, 86, k * TAU / 8, (k + 1) * TAU / 8); X.arc(0, 0, 44, (k + 1) * TAU / 8, k * TAU / 8, true); X.fill(); }
    X.strokeStyle = 'rgba(0,0,0,.15)'; X.lineWidth = 2; circle(0, 0, 86); X.stroke(); circle(0, 0, 44); X.stroke();
    X.strokeStyle = '#e8d3a8'; X.lineWidth = 5; X.setLineDash([16, 10]); circle(0, 0, 66); X.stroke(); X.setLineDash([]);
    X.restore();
  }
}
const CURTAIN = (() => { const c = makeCanvas(560, 1920), g = c.getContext('2d'); const lg = g.createLinearGradient(0, 0, 560, 0); for (let k = 0; k <= 14; k++) lg.addColorStop(k / 14, k % 2 ? '#0B2563' : '#06153C'); g.fillStyle = lg; g.fillRect(0, 0, 560, 1920); const vg = g.createLinearGradient(0, 0, 0, 1920); vg.addColorStop(0, 'rgba(0,0,0,.35)'); vg.addColorStop(.5, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.45)'); g.fillStyle = vg; g.fillRect(0, 0, 560, 1920); return c; })();
SCENES.push({
  a: 22.55, b: 28.62, draw(t) {
    const ex = P(t, 28.3, 28.6);
    // cards
    PILLARS.forEach((c, i) => {
      const p = P(t, c.t - .05, c.t + .4); if (p <= 0) return;
      const next = i < 3 ? PILLARS[i + 1].t : 28.0;
      const active = t >= c.t && t < next ? 1 : (t >= 27.9 ? .8 + .2 * Math.sin(t * 10) : 0);
      const s = E.outBack(p, 1.8) * (1 - E.inC(ex) * .3);
      X.save(); X.translate(c.x + (i % 2 ? -1 : 1) * E.inC(ex) * 600, c.y); X.scale(s, s); X.globalAlpha = clamp(p * 2) * (1 - ex) * (active ? 1 : .72);
      X.save(); if (active) { X.shadowColor = COL.orange; X.shadowBlur = 50 * active; }
      rr(-220, -215, 440, 430, 36); X.fillStyle = active ? 'rgba(20,40,90,.92)' : 'rgba(255,255,255,.07)'; X.fill(); X.restore();
      X.strokeStyle = active ? COL.orange : 'rgba(255,255,255,.18)'; X.lineWidth = active ? 5 : 2; rr(-220, -215, 440, 430, 36); X.stroke();
      T('0' + (i + 1), -180, -170, { font: '900 30px Montserrat', color: COL.orange, align: 'left' });
      X.save(); X.translate(0, -50); pillarIcon(c.icon, t, c.t); X.restore();
      const fs = c.ar.length > 10 ? 40 : 52;
      T(c.ar, 0, 108, { font: `800 ${fs}px Alexandria`, dir: 'rtl' });
      T(c.fr, 0, 166, { font: '700 22px Montserrat', ls: 5, color: 'rgba(255,255,255,.6)' });
      X.restore();
    });
    // curtains
    const close = E.outExpo(P(t, 22.55, 22.8)), open = E.ioExpo(P(t, 23.8, 24.3));
    const off = (1 - close) * 600 + open * 640;
    if (off < 600) {
      X.save(); X.drawImage(CURTAIN, -off - 20, 0); X.scale(-1, 1); X.drawImage(CURTAIN, -1080 - off - 20, 0); X.restore();
      X.save(); X.globalAlpha *= clamp(off / 80); X.fillStyle = COL.gold; X.fillRect(540 - 20 - off - 6, 0, 6, H); X.fillRect(540 + 20 + off, 0, 6, H); X.restore();
      const tp = P(t, 23.2, 23.6), tf = 1 - P(t, 23.75, 24.0);
      if (tp > 0) {
        X.save(); X.globalAlpha = E.outC(tp) * tf; const s = 1 + (1 - tf) * .3; X.translate(540, 800); X.scale(s, s);
        T('الأناقة', 0, -20, { font: '900 120px Alexandria', dir: 'rtl', shadow: 'rgba(0,0,0,.5)', blur: 30 });
        T('ÉLÉGANCE', 0, 110, { font: '600 52px Montserrat', ls: 22, color: COL.gold });
        X.fillStyle = COL.gold; X.fillRect(-180 * E.outExpo(tp), 170, 360 * E.outExpo(tp), 3);
        sparkle(0, 172, 16, E.outC(tp), '#FFE6A8');
        X.restore();
      }
      T('وراء', 540, 560, { font: '700 52px Alexandria', dir: 'rtl', color: 'rgba(255,255,255,.75)', alpha: P(t, 22.65, 22.9) * (1 - P(t, 23.75, 24.0)) });
    }
  }
});

// ===== S10: runway at sunrise, "you too" (28.4 - 32.15)
function planeRear(x, y, s, bank = 0) {
  X.save(); X.translate(x, y); X.rotate(bank); X.scale(s, s);
  // wings
  X.fillStyle = '#d7dfec'; X.beginPath(); X.moveTo(-40, 0); X.lineTo(-320, -36); X.lineTo(-320, -26); X.lineTo(-40, 22); X.closePath(); X.fill();
  X.beginPath(); X.moveTo(40, 0); X.lineTo(320, -36); X.lineTo(320, -26); X.lineTo(40, 22); X.closePath(); X.fill();
  // engines
  for (const ex of [-140, 140]) { X.fillStyle = '#b8c4d8'; circle(ex, 26, 26); X.fill(); X.fillStyle = '#2a3346'; circle(ex, 26, 15); X.fill(); }
  // stabilizers + fin
  X.fillStyle = '#c9d3e4'; X.beginPath(); X.moveTo(0, -50); X.lineTo(-120, -64); X.lineTo(-120, -56); X.lineTo(0, -34); X.fill(); X.beginPath(); X.moveTo(0, -50); X.lineTo(120, -64); X.lineTo(120, -56); X.lineTo(0, -34); X.fill();
  X.fillStyle = COL.blue; X.beginPath(); X.moveTo(-9, -40); X.lineTo(-6, -170); X.lineTo(6, -170); X.lineTo(9, -40); X.fill();
  X.fillStyle = COL.orange; X.fillRect(-7, -150, 14, 30);
  // fuselage
  const g = X.createRadialGradient(-14, -14, 4, 0, 0, 52); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#aab6ca');
  X.fillStyle = g; circle(0, 0, 50); X.fill();
  // lights
  const bl = Math.sin(performanceT * 10) > .6;
  X.fillStyle = bl ? '#ff3b3b' : '#7a1f1f'; circle(-320, -32, 6); X.fill();
  X.fillStyle = bl ? '#3bff6a' : '#1f6a33'; circle(320, -32, 6); X.fill();
  X.restore();
}
let performanceT = 0;
SCENES.push({
  a: 28.4, b: 32.2, draw(t) {
    performanceT = t;
    const ent = P(t, 28.4, 28.7), ex = P(t, 31.95, 32.2);
    X.globalAlpha = ent * (1 - ex);
    const HY = 880;
    const sky = X.createLinearGradient(0, 0, 0, HY);
    sky.addColorStop(0, '#071436'); sky.addColorStop(.55, '#2b3470'); sky.addColorStop(.85, '#c2566a'); sky.addColorStop(1, '#FF9A4D');
    X.fillStyle = sky; X.fillRect(0, 0, W, HY);
    const rise = E.outC(P(t, 28.4, 32));
    const sun = X.createRadialGradient(540, HY, 0, 540, HY, 620); sun.addColorStop(0, 'rgba(255,200,120,.95)'); sun.addColorStop(.25, 'rgba(255,150,80,.45)'); sun.addColorStop(1, 'rgba(255,120,60,0)');
    X.fillStyle = sun; X.fillRect(0, 0, W, HY + 200);
    X.save(); X.beginPath(); X.rect(0, 0, W, HY); X.clip(); X.fillStyle = '#FFE0A3'; circle(540, HY + 60 - rise * 80, 130); X.fill(); X.restore();
    // ground
    const gr = X.createLinearGradient(0, HY, 0, H); gr.addColorStop(0, '#1a1530'); gr.addColorStop(1, '#04060f');
    X.fillStyle = gr; X.fillRect(0, HY, W, H - HY);
    // runway
    const speed = 6 + E.inQ(P(t, 30.4, 32)) * 40, travel = (t - 28.4) * speed;
    X.fillStyle = '#20253a'; X.beginPath(); X.moveTo(540 - 14, HY); X.lineTo(540 + 14, HY); X.lineTo(540 + 900, H); X.lineTo(540 - 900, H); X.fill();
    for (let k = 0; k < 40; k++) {
      const d = 1 + ((k * 3 - travel) % 120 + 120) % 120; if (d < 1) continue;
      const y0 = HY + 1040 / d, y1 = HY + 1040 / (d + 1.4), wv = 14 / d;
      if (y0 > H + 50) continue;
      X.fillStyle = 'rgba(255,255,255,.75)'; X.beginPath(); X.moveTo(540 - wv, y0); X.lineTo(540 + wv, y0); X.lineTo(540 + 14 / (d + 1.4), y1); X.lineTo(540 - 14 / (d + 1.4), y1); X.fill();
      for (const side of [-1, 1]) {
        const lx = 540 + side * 860 / d, ly = HY + 1040 / d, lr = 2 + 26 / d;
        const lg = X.createRadialGradient(lx, ly, 0, lx, ly, lr * 3); lg.addColorStop(0, k % 2 ? 'rgba(255,190,90,1)' : 'rgba(170,215,255,1)'); lg.addColorStop(1, 'rgba(255,190,90,0)');
        X.fillStyle = lg; circle(lx, ly, lr * 3); X.fill();
      }
    }
    // horizon haze
    const hz = X.createLinearGradient(0, HY - 60, 0, HY + 80); hz.addColorStop(0, 'rgba(255,160,90,0)'); hz.addColorStop(.5, 'rgba(255,160,90,.35)'); hz.addColorStop(1, 'rgba(255,160,90,0)');
    X.fillStyle = hz; X.fillRect(0, HY - 60, W, 140);
    // sparkles for "والأجمل"
    for (let k = 0; k < 14; k++) { const r = mulberry(k + 400); const sp = P(t, 28.5 + r() * .5, 29.2 + r() * .5); sparkle(120 + r() * 840, 260 + r() * 500, 22 * Math.sin(sp * Math.PI), 1, k % 3 ? '#fff' : COL.gold); }
    // "حتى نتا"
    const yp = P(t, 29.28, 29.55), yo = P(t, 30.5, 30.8);
    if (yp > 0 && yo < 1) {
      X.save(); X.globalAlpha *= E.outC(yp) * (1 - yo); const s = E.outBack(yp, 2) * (1 + yo * .3); X.translate(540, 420); X.scale(s, s);
      for (let k = 0; k < 2; k++) { const ph = ((t - 29.5) * 1.2 + k * .5) % 1; if (t > 29.5) { X.strokeStyle = rgba(COL.orange, (1 - ph) * .7); X.lineWidth = 5; circle(0, 0, 160 + ph * 220); X.stroke(); } }
      T('حتى', 150, 0, { font: '900 120px Alexandria', dir: 'rtl', shadow: 'rgba(0,0,0,.4)', blur: 30 });
      T('نتا', -110, 0, { font: '900 150px Alexandria', dir: 'rtl', color: COL.orange, shadow: 'rgba(247,148,29,.6)', blur: 40 });
      X.restore();
    }
    // plane takes off toward the sunrise
    const pp = P(t, 30.45, 32.15);
    if (pp > 0) {
      const e = E.ioC(pp);
      const s = lerp(1.1, .07, E.ioC(pp));
      const y = lerp(1240, HY - 190, E.ioC(pp)) - Math.sin(pp * Math.PI) * 90;
      X.save(); X.globalAlpha *= clamp(pp * 6);
      // shadow on runway
      X.fillStyle = 'rgba(0,0,0,.35)'; X.beginPath(); X.ellipse(540, lerp(1700, HY + 20, E.ioC(pp)), 330 * s, 26 * s, 0, 0, TAU); X.fill();
      planeRear(540 + Math.sin(pp * 3) * 20, y, s, Math.sin(pp * 4) * .05);
      X.restore();
      T('PRÊT(E) POUR LE DÉCOLLAGE', 540, 330, { font: '800 30px Montserrat', ls: 6, color: '#fff', alpha: P(t, 30.9, 31.3) * (1 - ex) });
    }
  }
});

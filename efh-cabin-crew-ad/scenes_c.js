// ---------- Scenes 11-15 ----------

// ===== S11: step by step (32.05 - 33.42)
const STEPS = [{ x: 770, top: 1130, t: 32.08, land: 32.24 }, { x: 510, top: 940, t: 32.16, land: 32.66 }, { x: 250, top: 750, t: 32.24, land: 33.04 }];
SCENES.push({
  a: 32.0, b: 33.45, draw(t) {
    const ent = P(t, 32.0, 32.2), ex = P(t, 33.2, 33.45);
    X.globalAlpha = ent * (1 - ex);
    X.translate(540, 900); const zs = 1 + E.inExpo(ex) * .6; X.scale(zs, zs); X.translate(-540, -900);
    T('ÉTAPE PAR ÉTAPE', 540, 330, { font: '800 34px Montserrat', ls: 10, color: COL.orange, alpha: P(t, 32.15, 32.4) });
    STEPS.forEach((s, i) => {
      const p = E.outBack(P(t, s.t, s.t + .35), 1.4);
      const top = lerp(1500, s.top, p), bottom = 1330, w = 250;
      X.save(); X.globalAlpha *= clamp(p * 3);
      // top face
      X.fillStyle = '#5AA8FF'; X.beginPath(); X.moveTo(s.x - w / 2, top); X.lineTo(s.x - w / 2 + 40, top - 40); X.lineTo(s.x + w / 2 + 40, top - 40); X.lineTo(s.x + w / 2, top); X.fill();
      // side face
      X.fillStyle = '#0D2F86'; X.beginPath(); X.moveTo(s.x + w / 2, top); X.lineTo(s.x + w / 2 + 40, top - 40); X.lineTo(s.x + w / 2 + 40, bottom - 40); X.lineTo(s.x + w / 2, bottom); X.fill();
      const g = X.createLinearGradient(0, top, 0, bottom); g.addColorStop(0, '#1E5BD8'); g.addColorStop(1, '#0D3FA6');
      X.fillStyle = g; X.fillRect(s.x - w / 2, top, w, bottom - top);
      const lit = P(t, s.land, s.land + .15);
      if (lit > 0) { X.fillStyle = rgba(COL.orange, .9 * lit); X.beginPath(); X.moveTo(s.x - w / 2, top); X.lineTo(s.x - w / 2 + 40, top - 40); X.lineTo(s.x + w / 2 + 40, top - 40); X.lineTo(s.x + w / 2, top); X.fill(); }
      T('0' + (i + 1), s.x, top + 90, { font: '900 90px Montserrat', color: 'rgba(255,255,255,.9)' });
      X.restore();
    });
    // hopping orb
    const pts = [[900, 700, 31.95], ...STEPS.map(s => [s.x + 20, s.top - 20 - 26, s.land])];
    let ox = pts[0][0], oy = pts[0][1];
    for (let k = 1; k < pts.length; k++) {
      const [x0, y0, t0] = pts[k - 1], [x1, y1, t1] = pts[k];
      const ta = k === 1 ? 32.0 : t0;
      if (t >= ta && t <= t1) { const q = (t - ta) / (t1 - ta); ox = lerp(x0, x1, q); oy = lerp(y0, y1, q) - Math.sin(q * Math.PI) * 160; }
      else if (t > t1) { ox = x1; oy = y1; }
    }
    const lastLand = pts.filter(p => p[2] <= t).pop();
    const sq = lastLand ? Math.max(0, 1 - (t - lastLand[2]) / .12) : 0;
    // trail
    X.save(); for (let k = 1; k < 10; k++) {
      const tt = t - k * .025; let tx = ox, ty = oy;
      for (let j = 1; j < pts.length; j++) { const [x0, y0, t0] = pts[j - 1], [x1, y1, t1] = pts[j]; const ta = j === 1 ? 32.0 : t0; if (tt >= ta && tt <= t1) { const q = (tt - ta) / (t1 - ta); tx = lerp(x0, x1, q); ty = lerp(y0, y1, q) - Math.sin(q * Math.PI) * 160; } }
      X.fillStyle = rgba(COL.orange, .35 * (1 - k / 10)); circle(tx, ty, 26 * (1 - k / 12)); X.fill();
    } X.restore();
    X.save(); X.translate(ox, oy + sq * 8); X.scale(1 + sq * .3, 1 - sq * .3);
    const og = X.createRadialGradient(-8, -8, 2, 0, 0, 30); og.addColorStop(0, '#FFE0A3'); og.addColorStop(1, COL.orange2);
    X.shadowColor = COL.orange; X.shadowBlur = 40; X.fillStyle = og; circle(0, 0, 28); X.fill(); X.restore();
    for (const s of STEPS) { const rp = P(t, s.land, s.land + .4); if (rp > 0 && rp < 1) { X.strokeStyle = rgba(COL.orange, 1 - rp); X.lineWidth = 5; X.beginPath(); X.ellipse(s.x + 20, s.top - 20, 40 + rp * 120, 12 + rp * 30, 0, 0, TAU); X.stroke(); } }
    // flag on the top step
    const fp = E.outBack(P(t, 33.04, 33.25));
    if (fp > 0) {
      X.save(); X.translate(210, 730); X.scale(1, fp);
      X.fillStyle = '#fff'; X.fillRect(-3, -170, 6, 170);
      X.fillStyle = COL.orange; X.beginPath(); X.moveTo(3, -170); X.quadraticCurveTo(60, -160 + Math.sin(t * 12) * 6, 110, -150); X.lineTo(110, -100); X.quadraticCurveTo(60, -110 + Math.sin(t * 12 + 1) * 6, 3, -120); X.fill();
      T('EFH', 56, -134, { font: '900 26px Montserrat' });
      X.restore();
    }
  }
});

// ===== S12: logo reveal (33.25 - 35.95)
const LOGOC = makeCanvas(1536, 442);
function composeLogo(t, base) {
  const c = LOGOC.getContext('2d');
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, 1536, 442); c.globalAlpha = 1;
  const at = t - base;
  // swoosh: angular wipe
  const sw = E.ioC(clamp((at - .05) / .45));
  if (sw > 0) {
    c.save(); c.beginPath(); c.moveTo(230, 210); c.arc(230, 210, 900, 235 * D2R, (235 - 175 * sw) * D2R, true); c.closePath(); c.clip();
    c.drawImage(IMG.swoosh, 0, 0, 440, 442, 0, 0, 440, 442); c.restore();
  }
  // plane flies in
  const pf = clamp((at - .15) / .5);
  if (pf > 0) {
    const e = E.outC(pf);
    for (let g = 3; g >= 0; g--) {
      const q = Math.max(0, e - g * .06);
      c.save(); c.globalAlpha = g ? .18 * (1 - pf) : 1;
      c.translate(lerp(-520, 0, q) + 215, lerp(520, 0, q) + 200); c.rotate((1 - q) * -.5); c.scale(lerp(.5, 1, q), lerp(.5, 1, q)); c.translate(-215, -200);
      c.drawImage(IMG.white, 0, 0, 440, 442, 0, 0, 440, 442); c.restore();
    }
  }
  // letters E F H
  [[440, 640, .38], [640, 850, .46], [850, 1075, .54]].forEach(([x0, x1, d]) => {
    const p = clamp((at - d) / .4); if (p <= 0) return;
    const e = E.outBack(p, 1.6);
    c.save(); c.globalAlpha = clamp(p * 3); c.translate(0, (1 - e) * -330);
    c.drawImage(IMG.white, x0, 0, x1 - x0, 442, x0, 0, x1 - x0, 442); c.restore();
  });
  // divider
  const dv = E.outExpo(clamp((at - .7) / .35));
  if (dv > 0) { c.save(); c.translate(0, 221); c.scale(1, dv); c.translate(0, -221); c.drawImage(IMG.white, 1075, 0, 35, 442, 1075, 0, 35, 442); c.restore(); }
  // right text wipe
  const rw = E.ioC(clamp((at - .8) / .4));
  if (rw > 0) { c.save(); c.beginPath(); c.rect(1110, 0, 426 * rw, 442); c.clip(); c.translate((1 - rw) * -40, 0); c.drawImage(IMG.white, 1110, 0, 426, 442, 1110, 0, 426, 442); c.restore(); }
  return c;
}
function logoShine(c, p) {
  if (p <= 0 || p >= 1) return;
  c.save(); c.globalCompositeOperation = 'source-atop';
  const x = lerp(-300, 1836, E.ioC(p));
  const g = c.createLinearGradient(x - 160, 0, x + 160, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,.95)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.setTransform(1, 0, -.35, 1, 0, 0); c.fillRect(-400, 0, 2400, 442); c.restore();
}
SCENES.push({
  a: 33.25, b: 35.95, draw(t) {
    const ent = P(t, 33.25, 33.5), ex = P(t, 35.7, 35.95);
    X.globalAlpha = 1 - ex;
    // brand backdrop
    const bg = X.createRadialGradient(540, 820, 0, 540, 820, 1100); bg.addColorStop(0, '#1E5BD8'); bg.addColorStop(.6, '#0B2A7A'); bg.addColorStop(1, '#050D24');
    X.globalAlpha = ent * (1 - ex); X.fillStyle = bg; X.fillRect(0, 0, W, H); X.globalAlpha = 1 - ex;
    // rays
    const rp = P(t, 33.9, 34.3);
    X.save(); X.translate(540, 820); X.rotate(t * .1);
    for (let k = 0; k < 24; k++) { X.rotate(TAU / 24); X.fillStyle = `rgba(255,255,255,${.06 * rp})`; X.beginPath(); X.moveTo(0, 0); X.lineTo(-50, -1300); X.lineTo(50, -1300); X.fill(); }
    X.restore();
    // burst ring
    const br = P(t, 33.88, 34.4); if (br > 0 && br < 1) { X.strokeStyle = `rgba(255,255,255,${.8 * (1 - br)})`; X.lineWidth = 24 * (1 - br); circle(540, 820, 200 + E.outC(br) * 700); X.stroke(); }
    const c = composeLogo(t, 33.3);
    logoShine(c, P(t, 34.6, 35.25));
    const s = lerp(1.08, 1, E.outC(P(t, 33.3, 35.5))) * (1 + E.inExpo(ex) * .2);
    X.save(); X.translate(540, 820); X.scale(s, s);
    X.shadowColor = 'rgba(0,0,0,.45)'; X.shadowBlur = 40; X.shadowOffsetY = 10;
    X.drawImage(LOGOC, -480, -138, 960, 276); X.restore();
    // chips
    const cp = E.outBack(P(t, 34.74, 35.0));
    if (cp > 0) {
      X.save(); X.translate(540, 560); X.scale(cp, cp);
      const w = measure('ÉCOLE PRIVÉE', '800 30px Montserrat', 8) + 70;
      rr(-w / 2, -32, w, 64, 32); X.fillStyle = COL.orange; X.fill();
      T('ÉCOLE PRIVÉE', 4, 2, { font: '800 30px Montserrat', ls: 8 }); X.restore();
    }
    const mp = E.outExpo(P(t, 35.2, 35.6));
    if (mp > 0) {
      X.save(); X.globalAlpha *= mp; X.translate(0, (1 - mp) * 40);
      const w1 = measure('MARRAKECH', '800 40px Montserrat', 12);
      pinIcon(540 - w1 / 2 - 34, 1086, 1.5);
      T('MARRAKECH', 540 + 10, 1068, { font: '800 40px Montserrat', ls: 12 });
      T('مراكش', 540, 1130, { font: '700 38px Alexandria', dir: 'rtl', color: 'rgba(255,255,255,.75)' });
      X.restore();
    }
    // white flash on entry
    const fl = 1 - P(t, 33.25, 33.55); if (fl > 0) { X.fillStyle = `rgba(255,255,255,${.8 * fl * fl})`; X.fillRect(0, 0, W, H); }
  }
});

// ===== S13: training hostesses & stewards (35.75 - 38.85)
function crewBust(x, y, kind, p, t) {
  X.save(); X.translate(x, y);
  const s = E.outBack(P(p, 0, .6), 1.5);
  X.save(); X.scale(s, s);
  const bg = X.createLinearGradient(0, -230, 0, 230); bg.addColorStop(0, '#2a6ae6'); bg.addColorStop(1, '#0b2a7a');
  X.fillStyle = bg; circle(0, 0, 220); X.fill();
  X.strokeStyle = COL.orange; X.lineWidth = 6; circle(0, 0, 220); X.stroke();
  X.restore();
  const ph = IMG[kind ? 'steward' : 'hostess'];
  if (ph) { // real photo, cover-fit inside the circle with a slow push-in
    X.save(); circle(0, 0, 217 * s); X.clip();
    const k = 440 / Math.min(ph.width, ph.height) * (1.08 + .06 * P(p, 0, 1)), w = ph.width * k, h = ph.height * k;
    X.globalAlpha *= clamp(P(p, .05, .45) * 1.5);
    X.drawImage(ph, -w / 2, -220 - (h - 440) * .25 + (1 - E.outC(P(p, .05, .7))) * 60, w, h);
    const v = X.createRadialGradient(0, 0, 150, 0, 0, 225); v.addColorStop(0, 'rgba(5,13,36,0)'); v.addColorStop(1, 'rgba(5,13,36,.45)');
    X.fillStyle = v; X.fillRect(-230, -230, 460, 460);
    X.restore();
    X.save(); X.scale(s, s); X.strokeStyle = COL.orange; X.lineWidth = 7; circle(0, 0, 220); X.stroke(); X.restore();
    X.restore(); return;
  }
  X.save(); circle(0, 0, 217 * s); X.clip();
  X.translate(0, (1 - E.outC(P(p, .1, .8))) * 420 + 225);
  const skin = kind ? '#C68642' : '#E8B48A', hair = kind ? '#1b120c' : '#3b2416';
  // body
  X.fillStyle = '#12285F'; X.beginPath(); X.moveTo(-200, 10); X.lineTo(-180, -150); X.quadraticCurveTo(-160, -190, -60, -205); X.lineTo(60, -205); X.quadraticCurveTo(160, -190, 180, -150); X.lineTo(200, 10); X.fill();
  X.fillStyle = '#fff'; X.beginPath(); X.moveTo(-52, -205); X.lineTo(52, -205); X.lineTo(0, -95); X.fill();
  X.fillStyle = '#0a1c4a'; X.beginPath(); X.moveTo(-60, -205); X.lineTo(-10, -90); X.lineTo(-40, -60); X.lineTo(-95, -190); X.fill(); X.beginPath(); X.moveTo(60, -205); X.lineTo(10, -90); X.lineTo(40, -60); X.lineTo(95, -190); X.fill();
  // gold wings pin
  X.fillStyle = COL.gold; X.beginPath(); X.ellipse(-110, -130, 34, 7, -.1, 0, TAU); X.fill(); circle(-110, -130, 9); X.fill();
  // neck
  X.fillStyle = skin; rr(-30, -265, 60, 70, 20); X.fill();
  if (kind === 0) { // scarf
    X.fillStyle = COL.orange; X.beginPath(); X.moveTo(-55, -210); X.quadraticCurveTo(0, -180, 55, -210); X.lineTo(30, -185); X.lineTo(0, -195); X.lineTo(-30, -185); X.fill();
    X.beginPath(); X.moveTo(0, -195); X.lineTo(-35, -130); X.lineTo(-8, -140); X.closePath(); X.fill(); X.beginPath(); X.moveTo(0, -195); X.lineTo(28, -128); X.lineTo(6, -145); X.closePath(); X.fill();
  } else { // tie
    X.fillStyle = COL.orange; X.beginPath(); X.moveTo(-14, -205); X.lineTo(14, -205); X.lineTo(8, -185); X.lineTo(18, -110); X.lineTo(0, -92); X.lineTo(-18, -110); X.lineTo(-8, -185); X.fill();
  }
  // head
  if (kind === 0) { X.fillStyle = hair; circle(0, -420, 42); X.fill(); }
  X.fillStyle = skin; X.beginPath(); X.ellipse(0, -330, 76, 92, 0, 0, TAU); X.fill();
  circle(-74, -325, 14); X.fill(); circle(74, -325, 14); X.fill();
  X.fillStyle = hair;
  if (kind === 0) { X.beginPath(); X.ellipse(0, -372, 84, 62, 0, Math.PI, TAU); X.fill(); X.beginPath(); X.ellipse(-30, -385, 60, 30, -.4, 0, TAU); X.fill(); }
  else { X.beginPath(); X.ellipse(0, -380, 80, 48, 0, Math.PI, TAU); X.fill(); X.beginPath(); X.ellipse(10, -398, 70, 26, .15, 0, TAU); X.fill(); }
  // hat (hostess)
  if (kind === 0) { X.save(); X.translate(18, -430); X.rotate(.12); X.fillStyle = '#12285F'; rr(-62, -24, 124, 48, 12); X.fill(); X.fillStyle = COL.orange; X.fillRect(-62, 8, 124, 9); X.fillStyle = COL.gold; circle(0, -2, 7); X.fill(); X.restore(); }
  // face
  const blink = (Math.sin(t * 2.3 + kind * 3) > .97) ? .2 : 1;
  X.fillStyle = '#1a1a2a'; X.beginPath(); X.ellipse(-28, -335, 7, 8 * blink, 0, 0, TAU); X.fill(); X.beginPath(); X.ellipse(28, -335, 7, 8 * blink, 0, 0, TAU); X.fill();
  X.strokeStyle = hair; X.lineWidth = 5; X.lineCap = 'round'; X.beginPath(); X.moveTo(-42, -360); X.lineTo(-16, -364); X.moveTo(16, -364); X.lineTo(42, -360); X.stroke();
  X.strokeStyle = kind ? '#6b2a12' : '#c0392b'; X.lineWidth = 6; X.beginPath(); X.arc(0, -300, 24, .18 * Math.PI, .82 * Math.PI); X.stroke();
  X.fillStyle = 'rgba(255,120,120,.25)'; circle(-44, -305, 13); X.fill(); circle(44, -305, 13); X.fill();
  X.restore();
  X.restore();
}
SCENES.push({
  a: 35.75, b: 38.85, draw(t) {
    const ex = P(t, 38.6, 38.85);
    X.globalAlpha = 1 - ex;
    // banner
    const bp = E.outBack(P(t, 35.8, 36.15), 1.4);
    if (bp > 0) {
      X.save(); X.translate(540, 360); X.scale(bp, bp);
      X.fillStyle = '#B35400'; X.beginPath(); X.moveTo(-330, -10); X.lineTo(-400, -10); X.lineTo(-370, 30); X.lineTo(-400, 70); X.lineTo(-300, 70); X.fill();
      X.beginPath(); X.moveTo(330, -10); X.lineTo(400, -10); X.lineTo(370, 30); X.lineTo(400, 70); X.lineTo(300, 70); X.fill();
      const g = X.createLinearGradient(0, -50, 0, 50); g.addColorStop(0, '#FFAA3A'); g.addColorStop(1, '#F07A00');
      X.fillStyle = g; rr(-330, -50, 660, 100, 14); X.fill();
      T('FORMATION PNC', 0, 2, { font: '900 52px Montserrat', ls: 6 });
      X.restore();
      // grad cap
      const cp = E.outBack(P(t, 36.4, 36.7), 2);
      if (cp > 0) { X.save(); X.translate(540 + 310, 300); X.rotate(.25); X.scale(cp, cp);
        X.fillStyle = '#0A1C4A'; X.beginPath(); X.moveTo(0, -36); X.lineTo(70, -8); X.lineTo(0, 20); X.lineTo(-70, -8); X.fill();
        X.beginPath(); X.moveTo(-40, 4); X.lineTo(-40, 34); X.quadraticCurveTo(0, 54, 40, 34); X.lineTo(40, 4); X.lineTo(0, 20); X.fill();
        X.strokeStyle = COL.gold; X.lineWidth = 4; X.beginPath(); X.moveTo(0, -8); X.lineTo(56, 6); X.lineTo(56, 44); X.stroke(); X.fillStyle = COL.gold; circle(56, 48, 8); X.fill();
        X.restore(); }
    }
    // figures: hostess (right, first) then steward (left)
    crewBust(770, 840, 0, P(t, 36.8, 37.6), t);
    crewBust(310, 840, 1, P(t, 37.4, 38.2), t);
    const lab = (x, s, p) => { if (p <= 0) return; X.save(); X.translate(x, 1125); X.scale(E.outBack(p), E.outBack(p)); const w = measure(s, '800 28px Montserrat', 5) + 60; rr(-w / 2, -30, w, 60, 30); X.fillStyle = 'rgba(5,12,30,.85)'; X.fill(); X.strokeStyle = COL.orange; X.lineWidth = 3; X.stroke(); T(s, 3, 2, { font: '800 28px Montserrat', ls: 5 }); X.restore(); };
    lab(770, 'HÔTESSES DE L\'AIR', P(t, 37.0, 37.3));
    lab(310, 'STEWARDS', P(t, 37.6, 37.9));
    for (let k = 0; k < 10; k++) { const r = mulberry(k + 900); sparkle(100 + r() * 880, 560 + r() * 600, 18 * Math.max(0, Math.sin((t - 36.8) * 3 + k)), P(t, 37, 37.4), k % 2 ? '#fff' : COL.gold); }
  }
});

// ===== S14: registration open, limited seats (38.65 - 41.6)
const SEATS = (() => {
  const o = [], r = mulberry(4242);
  const xs = [262, 344, 426, 582, 664, 746];
  for (let row = 0; row < 8; row++) for (let c = 0; c < 6; c++) o.push({ x: xs[c], y: 640 + row * 84, k: r() });
  const order = o.map((s, i) => i).sort((a, b) => o[a].k - o[b].k);
  const FREE = 5;
  order.forEach((idx, n) => {
    if (n >= o.length - FREE) { o[idx].ft = 99; o[idx].free = 1; return; }
    const q = n / (o.length - FREE);
    o[idx].ft = 39.05 + Math.pow(q, .8) * 2.2;
  });
  return o;
})();
SCENES.push({
  a: 38.65, b: 41.62, draw(t) {
    const ent = E.outExpo(P(t, 38.7, 39.1)), ex = P(t, 41.35, 41.62);
    X.globalAlpha = clamp(ent * 2) * (1 - ex);
    // cabin
    X.save(); X.translate(0, (1 - ent) * 300);
    const fg = X.createLinearGradient(0, 470, 0, 1400); fg.addColorStop(0, 'rgba(255,255,255,.14)'); fg.addColorStop(1, 'rgba(255,255,255,0)');
    X.beginPath(); X.moveTo(190, 1400); X.lineTo(190, 700); X.bezierCurveTo(190, 520, 380, 440, 540, 440); X.bezierCurveTo(700, 440, 890, 520, 890, 700); X.lineTo(890, 1400);
    X.fillStyle = 'rgba(10,28,74,.85)'; X.fill(); X.strokeStyle = fg; X.lineWidth = 4; X.stroke();
    // cockpit windows
    X.fillStyle = 'rgba(90,168,255,.45)'; X.beginPath(); X.moveTo(470, 520); X.lineTo(530, 505); X.lineTo(530, 545); X.lineTo(480, 555); X.fill(); X.beginPath(); X.moveTo(610, 520); X.lineTo(550, 505); X.lineTo(550, 545); X.lineTo(600, 555); X.fill();
    for (let k = 0; k < 9; k++) { X.fillStyle = 'rgba(90,168,255,.5)'; rr(205, 640 + k * 84, 10, 34, 5); X.fill(); rr(865, 640 + k * 84, 10, 34, 5); X.fill(); }
    // seats
    for (const s of SEATS) {
      const fp = P(t, s.ft, s.ft + .14), pulse = s.free ? Math.max(0, Math.sin((t - 40.6) * 8)) * P(t, 40.6, 40.9) : 0;
      const sc = 1 + Math.sin(fp * Math.PI) * .25;
      X.save(); X.translate(s.x + 36, s.y + 33); X.scale(sc, sc);
      if (pulse > 0) { X.shadowColor = '#fff'; X.shadowBlur = 30 * pulse; }
      X.fillStyle = fp > .5 ? COL.orange : 'rgba(255,255,255,.88)';
      rr(-36, -26, 72, 58, 12); X.fill();
      X.fillStyle = fp > .5 ? '#B35400' : 'rgba(200,215,240,1)'; rr(-36, -33, 72, 16, 8); X.fill();
      X.restore();
    }
    X.restore();
    // stamp
    const sp = P(t, 38.82, 38.95);
    if (sp > 0) {
      X.save(); X.translate(540, 330); X.rotate(-.1); const s = lerp(2.4, 1, E.outC(sp)) * (1 - P(t, 41.3, 41.6) * .2); X.scale(s, s); X.globalAlpha *= clamp(sp * 2);
      X.fillStyle = 'rgba(5,12,30,.85)'; rr(-330, -95, 660, 190, 22); X.fill();
      X.strokeStyle = COL.orange; X.lineWidth = 8; rr(-330, -95, 660, 190, 22); X.stroke(); X.lineWidth = 3; rr(-314, -79, 628, 158, 14); X.stroke();
      T('التسجيل مفتوح', 0, -18, { font: '900 74px Alexandria', dir: 'rtl' });
      T('INSCRIPTIONS OUVERTES', 0, 52, { font: '800 28px Montserrat', ls: 6, color: COL.orange });
      X.restore();
    }
    // limited places chip
    const lp = E.outBack(P(t, 40.18, 40.45));
    if (lp > 0) {
      X.save(); X.translate(540, 1330); X.scale(lp, lp);
      const blink = .75 + .25 * Math.sin(t * 14);
      rr(-250, -42, 500, 84, 42); X.fillStyle = `rgba(255,90,40,${blink})`; X.fill();
      T('PLACES LIMITÉES', 0, 3, { font: '900 36px Montserrat', ls: 5 });
      X.restore();
    }
  }
});

// ===== S15: contact end card (41.45 - 48)
const CONTACTS = [
  { kind: 'phone', text: '+212 777 771 314', t: 41.75 },
  { kind: 'phone', text: '+212 777 771 712', t: 41.95 },
  { kind: 'web', text: 'www.flyhyani.ma', t: 42.15 },
];
function phoneIcon(s) {
  X.save(); X.scale(s, s); X.fillStyle = '#fff';
  X.beginPath(); X.moveTo(-14, -18); X.quadraticCurveTo(-22, -16, -22, -6); X.quadraticCurveTo(-18, 12, 6, 22); X.quadraticCurveTo(16, 24, 20, 16);
  X.lineTo(20, 10); X.lineTo(10, 4); X.lineTo(4, 10); X.quadraticCurveTo(-8, 4, -10, -6); X.lineTo(-4, -12); X.lineTo(-10, -22); X.closePath(); X.fill(); X.restore();
}
function globeIcon(s) {
  X.save(); X.scale(s, s); X.strokeStyle = '#fff'; X.lineWidth = 3;
  circle(0, 0, 20); X.stroke(); X.beginPath(); X.ellipse(0, 0, 9, 20, 0, 0, TAU); X.stroke();
  X.beginPath(); X.moveTo(-20, 0); X.lineTo(20, 0); X.moveTo(-17, -10); X.lineTo(17, -10); X.moveTo(-17, 10); X.lineTo(17, 10); X.stroke(); X.restore();
}
SCENES.push({
  a: 41.45, b: 48.01, draw(t) {
    const ent = P(t, 41.45, 41.75);
    const bg = X.createRadialGradient(540, 700, 0, 540, 700, 1200); bg.addColorStop(0, '#1A4FC4'); bg.addColorStop(.55, '#0A2463'); bg.addColorStop(1, '#040B1F');
    X.globalAlpha = ent; X.fillStyle = bg; X.fillRect(0, 0, W, H); X.globalAlpha = 1;
    X.save(); X.translate(540, 470); X.rotate(t * .06);
    for (let k = 0; k < 20; k++) { X.rotate(TAU / 20); X.fillStyle = `rgba(255,255,255,${.035 * ent})`; X.beginPath(); X.moveTo(0, 0); X.lineTo(-60, -1400); X.lineTo(60, -1400); X.fill(); }
    X.restore();
    // logo
    const lp = E.outBack(P(t, 41.5, 41.95), 1.3);
    if (lp > 0) {
      const c = LOGOC.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, 1536, 442); c.drawImage(IMG.full, 0, 0);
      logoShine(c, P(t, 42.6, 43.3)); logoShine(c, P(t, 45.6, 46.3));
      X.save(); X.translate(540, 450); X.scale(lp, lp); X.globalAlpha = clamp(lp * 2);
      X.shadowColor = 'rgba(0,0,0,.4)'; X.shadowBlur = 30; X.drawImage(LOGOC, -450, -129.5, 900, 259); X.restore();
    }
    // orbiting plane
    const op = P(t, 42.9, 47.6);
    if (op > 0 && op < 1) {
      const a = -Math.PI * .9 + op * TAU * 1.1;
      const pts = []; for (let k = 0; k < 30; k++) { const aa = a - k * .05; pts.push([540 + Math.cos(aa) * 520, 450 + Math.sin(aa) * 210]); }
      X.save(); X.setLineDash([6, 12]); X.strokeStyle = 'rgba(255,255,255,.5)'; X.lineWidth = 3; X.beginPath(); pts.forEach((p, i) => i ? X.lineTo(...p) : X.moveTo(...p)); X.stroke(); X.restore();
      const [x, y] = pts[0], [x2, y2] = pts[1];
      planeTop(x, y, 26, Math.atan2(y - y2, x - x2), COL.orange, clamp(op * 8) * clamp((1 - op) * 8));
    }
    // heading
    const words = [['تواصل', 41.65, '#fff'], ['معانا', 42.14, '#fff'], ['اليوم', 42.46, COL.orange]];
    const font = '900 84px Alexandria';
    const ws = words.map(w => measure(w[0], font, 0, 'rtl')), gap = 26, tot = ws.reduce((a, b) => a + b) + gap * 2;
    let x = 540 + tot / 2;
    words.forEach((w, i) => {
      const p = E.outBack(P(t, w[1] - .05, w[1] + .25));
      if (p > 0) { X.save(); X.translate(x - ws[i] / 2, 720 + (1 - p) * 40); X.scale(p, p); T(w[0], 0, 0, { font, dir: 'rtl', color: w[2], shadow: 'rgba(0,0,0,.4)', blur: 20 }); X.restore(); }
      x -= ws[i] + gap;
    });
    // contact pills
    CONTACTS.forEach((c, i) => {
      const p = P(t, c.t, c.t + .45); if (p <= 0) return;
      const y = 870 + i * 150, e = E.outExpo(p);
      X.save(); X.translate((1 - e) * -700, 0); X.globalAlpha = clamp(p * 2);
      rr(110, y, 860, 124, 62); X.fillStyle = 'rgba(255,255,255,.10)'; X.fill(); X.strokeStyle = 'rgba(255,255,255,.28)'; X.lineWidth = 2; X.stroke();
      X.fillStyle = COL.orange; circle(172, y + 62, 46); X.fill();
      X.save(); X.translate(172, y + 62); c.kind === 'phone' ? phoneIcon(1.25) : globeIcon(1.2); X.restore();
      const n = Math.floor(c.text.length * clamp((t - c.t - .15) / .55));
      const shown = c.text.slice(0, n);
      T(shown, 250, y + 64, { font: '800 56px Montserrat', align: 'left', ls: c.kind === 'phone' ? 2 : 1 });
      if (n < c.text.length && t > c.t + .1) { const w = measure(shown, '800 56px Montserrat', c.kind === 'phone' ? 2 : 1); X.fillStyle = COL.orange; X.fillRect(256 + w, y + 36, 5, 56); }
      X.restore();
    });
    // footer
    const fp = E.outC(P(t, 43.0, 43.5));
    if (fp > 0) {
      X.save(); X.globalAlpha *= fp;
      const pulse = 1 + Math.sin(t * 4) * .03;
      X.translate(540, 1380); X.scale(pulse, pulse);
      rr(-300, -44, 600, 88, 44); X.fillStyle = COL.orange; X.fill();
      T('التسجيل مفتوح · مراكش', 0, 2, { font: '800 38px Alexandria', dir: 'rtl' });
      X.restore();
      T('ÉCOLE FLY HYANI PRIVÉ', 540, 1490, { font: '700 26px Montserrat', ls: 8, color: 'rgba(255,255,255,.6)', alpha: fp });
    }
  }
});

/* S5 (11.0 – 14.95): "A new airport, new faces, a different experience."
   Split-flap departures board -> crew faces pop in -> passport stamps slam. */
(function () {
  const R = window.R, tl = R.tl;
  const T0 = 11.0, T1 = 14.95;
  const s = R.scene('s5', T0, T1, { zIndex: 18, background: 'linear-gradient(180deg, #0b1a3a 0%, #071026 55%, #030812 100%)' });
  // terminal window glow + bokeh
  R.div('abs', s, { left: '-300px', top: '780px', width: '1700px', height: '900px', borderRadius: '50%',
    background: 'radial-gradient(ellipse, rgba(255,170,80,.28) 0%, rgba(255,140,40,0) 62%)' });
  R.particles(s, { n: 26, t0: T0, t1: T1, seed: 51, color: '255,190,120', alpha: 0.35, minR: 6, maxR: 22, speed: 12 });
  R.particles(s, { n: 18, t0: T0, t1: T1, seed: 52, color: '140,190,255', alpha: 0.3, minR: 6, maxR: 18, speed: 10 });
  const root = R.div('fill', s);
  tl.fromTo(root, { scale: 1 }, { scale: 1.045, duration: T1 - T0, ease: 'none' }, T0);

  // ---------------- split-flap board ----------------
  const board = R.div('board', root, { top: '300px' });
  R.div('board-title', board, null, `<span style="display:flex;align-items:center;gap:14px">${R.icon('plane-takeoff', 46, 2.4)} DEPARTURES · DÉPARTS</span><span>11:24</span>`);
  const rows = [
    ['08:45', 'PARIS', 'A12', 'BOARDING', 'orange'],
    ['09:30', 'DUBAI', 'B04', 'ON TIME', 'green'],
    ['10:15', 'ISTANBUL', 'C07', 'ON TIME', 'green'],
    ['11:05', 'NEW YORK', 'D21', 'ON TIME', 'green'],
    ['12:40', 'DOHA', 'B09', 'ON TIME', 'green'],
    ['13:20', 'LONDON', 'A03', 'ON TIME', 'green'],
  ];
  const CH = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:';
  const cells = [];
  const tFlap = T0 + 0.12;
  const rnd = R.rng(77);
  rows.forEach((r, ri) => {
    const row = R.div('board-row', board);
    const text = r[0].padEnd(5) + ' ' + r[1].padEnd(9) + ' ' + r[2].padEnd(3) + ' ' + r[3].padEnd(8);
    [...text].forEach((ch, ci) => {
      const cl = ci >= 20 ? r[4] : '';
      const c = R.div('flap ' + cl, row, { width: '29px', height: '58px', fontSize: '42px', lineHeight: '58px' }, '');
      const start = tFlap + ri * 0.07 + ci * 0.012;
      cells.push({ c, ch, start, end: start + 0.25 + rnd() * 0.45, off: Math.floor(rnd() * CH.length) });
    });
  });
  R.onFrame((t) => {
    if (t < T0 || t > T1) return;
    for (const k of cells) {
      if (t < k.start) k.c.textContent = '';
      else if (t >= k.end || k.ch === ' ' && t > k.start + 0.15) k.c.textContent = k.ch === ' ' ? '' : k.ch;
      else k.c.textContent = CH[(k.off + Math.floor((t - k.start) / 0.03)) % CH.length];
    }
  });
  gsap.set(board, { y: -80, opacity: 0, rotationX: 25, transformPerspective: 1400 });
  tl.to(board, { y: 0, opacity: 1, rotationX: 0, duration: 0.45, ease: 'expo.out' }, T0);
  R.sfx(tFlap, 'flaps', { gain: 0.42, dur: 0.9 });

  // ---------------- new faces ----------------
  const faces = ['fa2', 'st1', 'fa3', 'st2'];
  const tFace = R.ws(5, 2) - 0.06;
  faces.forEach((f, i) => {
    const d = R.div('face', root, { left: 70 + i * 240 + 'px', top: (i % 2 ? 1040 : 1000) + 'px', zIndex: 5 + i });
    const im = R.img(`${R.A}${f}.png`, '', d);
    if (f.startsWith('st')) Object.assign(im.style, { width: '310px', left: '-48px', top: '6px' });
    gsap.set(d, { scale: 0, rotation: (i % 2 ? 12 : -12) });
    tl.to(d, { scale: 1, rotation: 0, duration: 0.45, ease: 'back.out(2.6)' }, tFace + i * 0.1);
    R.sfx(tFace + i * 0.1, 'pop', { gain: 0.55, pitch: 1 + i * 0.12 });
  });

  // ---------------- passport stamps ----------------
  const stamps = [
    { x: 70, y: 450, rot: -14, c: '#1d4ed8', t1: 'PARIS', t2: 'CDG · FRANCE', time: R.ws(5, 4) },
    { x: 560, y: 330, rot: 11, c: '#e8590c', t1: 'DUBAI', t2: 'DXB · UAE', time: R.ws(5, 4) + 0.26 },
    { x: 330, y: 770, rot: -5, c: '#0f9b58', t1: 'ISTANBUL', t2: 'IST · TÜRKIYE', time: R.ws(5, 5) },
  ];
  stamps.forEach((o, i) => {
    const w = i === 2 ? 470 : 420;
    const st = R.div('pstamp', root, { left: o.x + 'px', top: o.y + 'px', width: w + 'px', height: w + 'px', color: o.c, zIndex: 20 + i },
      `<div class="ring"></div><div class="ring2"></div>
       <div class="txt"><small>✈ ENTRÉE · ARRIVAL</small>${o.t1}<small>${o.t2}</small><small style="font-size:20px;opacity:.85">17 OCT 2026</small></div>`);
    st.style.background = 'radial-gradient(circle, rgba(255,255,255,.96) 0%, rgba(255,255,255,.93) 66%, rgba(255,255,255,0) 71%)';
    gsap.set(st, { scale: 2.4, opacity: 0, rotation: o.rot - 20 });
    tl.to(st, { scale: 1, opacity: 0.94, rotation: o.rot, duration: 0.16, ease: 'power4.in' }, o.time - 0.14);
    R.sfx(o.time, 'stamp', { gain: 0.85 });
    R.shake(o.time + 0.02, 14, 0.3);
  });

  // exit: everything whips up
  tl.to(s, { y: -1920, duration: 0.38, ease: 'power3.in' }, 14.57);
  R.sfx(14.52, 'whoosh', { gain: 0.6 });
})();

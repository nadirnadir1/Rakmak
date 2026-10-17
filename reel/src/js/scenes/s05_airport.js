/* S5 (11.0 – 14.95): "A new airport, new faces, a different experience."
   Split-flap departures board -> crew faces pop in -> the Moroccan passport flies in, opens,
   and fills up with a visa and entry stamps. */
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
  const faceEls = faces.map((f, i) => {
    const d = R.div('face', root, { left: 70 + i * 240 + 'px', top: (i % 2 ? 1040 : 1000) + 'px', zIndex: 5 + i });
    const im = R.img(`${R.A}${f}.png`, '', d);
    if (f.startsWith('st')) Object.assign(im.style, { width: '310px', left: '-48px', top: '6px' });
    gsap.set(d, { scale: 0, rotation: (i % 2 ? 12 : -12) });
    tl.to(d, { scale: 1, rotation: 0, duration: 0.45, ease: 'back.out(2.6)' }, tFace + i * 0.1);
    R.sfx(tFace + i * 0.1, 'pop', { gain: 0.55, pitch: 1 + i * 0.12 });
    return d;
  });

  // ---------------- the passport ("وتجربة مختلفة") ----------------
  // the board and the faces make room
  const tPP = 12.98;
  tl.to(board, { y: -320, rotationX: 55, opacity: 0, duration: 0.3, ease: 'power3.in' }, tPP - 0.08);
  tl.to(faceEls, { y: 420, opacity: 0, duration: 0.28, ease: 'power3.in', stagger: 0.03 }, tPP - 0.06);
  const ppWrap = R.div('abs', root, { left: '40px', top: '480px', width: '1000px', height: '710px', zIndex: 30, perspective: '2600px' });
  R.ppDefs(ppWrap);
  const pp = R.div('abs', ppWrap, { left: 0, top: 0, width: '1000px', height: '710px', transformStyle: 'preserve-3d' });
  const shadow = R.div('pp-shadow', pp);
  const right = R.ppPage(pp, 'R', 15, { left: '500px', top: '0px' });
  const leaf = R.div('pp-leaf', pp);
  R.img(`${R.A}passport_cover.png`, 'pp-front', leaf);
  const left = R.ppPage(leaf, 'L', 14, { left: '0px', top: '0px' });
  left.classList.add('pp-back');

  // older, faded exit stamp from Marrakech already on the left page
  R.ppStamp(left, { kind: 'round', x: 150, y: 575, color: '#2e7d5b', ink: 5, alpha: 0.42, top: 'MARRAKECH-MÉNARA', bottom: 'SORTIE · DEPARTURE', code: 'RAK' })
    .style.transform = 'rotate(-18deg) scale(.82)';

  // fly in closed (cover up), then open like a book
  gsap.set(pp, { x: -250, y: 1500, rotationZ: -28, rotationX: 38, scale: 0.72, autoAlpha: 0 });
  tl.set(pp, { autoAlpha: 1 }, tPP);
  tl.to(pp, { y: 0, rotationZ: -3, rotationX: 9, scale: 1.1, duration: 0.3, ease: 'power3.out' }, tPP);
  gsap.set(leaf, { transformOrigin: '0% 50%', rotationY: 0 });
  const tOpen = tPP + 0.2;
  tl.to(leaf, { rotationY: -180, duration: 0.26, ease: 'power2.inOut' }, tOpen);
  tl.to(pp, { x: 0, duration: 0.26, ease: 'power2.inOut' }, tOpen);
  R.sfx(tPP - 0.02, 'whoosh_small', { gain: 0.42 });
  R.sfx(tOpen + 0.02, 'page_flip', { gain: 0.5 });
  // slow push while the stamps land
  // camera: favour the left page for the visa, then pan to the right page as the stamps land
  tl.to(ppWrap, { x: 72, duration: 0.3, ease: 'power2.out' }, tOpen + 0.08);
  tl.to(ppWrap, { x: -84, scale: 1.08, rotation: 1.2, duration: 0.72, ease: 'power2.inOut' }, R.ws(5, 5) - 0.3);

  // visa sticker slapped onto the left page
  const tVisa = R.ws(5, 4) + 0.02;                                   // "وتجربة"
  const visa = R.ppVisa(left, { x: 30, y: 74, z: 3 });
  gsap.set(visa, { scale: 1.35, rotation: -9, opacity: 0, transformOrigin: '50% 50%' });
  tl.to(visa, { scale: 1, rotation: -1.5, opacity: 1, duration: 0.14, ease: 'power3.in' }, tVisa - 0.14);
  tl.fromTo(visa.gloss, { x: 0 }, { x: 720, duration: 0.55, ease: 'power2.inOut' }, tVisa);
  R.sfx(tVisa, 'card', { gain: 0.5, pitch: 0.8 });

  // entry stamps, one per beat
  const stamps = [
    { pg: left, kind: 'round', x: 352, y: 438, rot: -14, color: '#2346b8', ink: 0, top: 'PARIS · FRANCE', bottom: 'ENTRÉE · ARRIVAL', code: 'CDG', t: tVisa + 0.24 },
    { pg: right, kind: 'rect', x: 255, y: 150, rot: 7, color: '#6b2fa0', ink: 1, top: "DUBAI INT'L AIRPORT", bottom: 'ARRIVED', code: 'DXB', t: R.ws(5, 5) - 0.02 },
    { pg: right, kind: 'oval', x: 238, y: 372, rot: -9, color: '#0f7f4c', ink: 2, top: 'İSTANBUL HAVALİMANI', bottom: 'GİRİŞ · ENTRY', code: 'IST', t: R.ws(5, 5) + 0.22 },
    { pg: right, kind: 'round', x: 312, y: 580, rot: 11, color: '#c62828', ink: 3, top: 'TOKYO · HANEDA', bottom: 'LANDING PERMIT', code: 'HND', t: R.ws(5, 5) + 0.42 },
  ];
  stamps.forEach((o, i) => {
    const st = R.ppStamp(o.pg, Object.assign({ z: 6 + i }, o));
    gsap.set(st, { scale: 1.7, rotation: o.rot - 16, opacity: 0 });
    tl.to(st, { scale: 1, rotation: o.rot, opacity: 1, duration: 0.12, ease: 'power4.in' }, o.t - 0.12);
    R.sfx(o.t, 'stamp', { gain: 0.62 });
    R.shake(o.t + 0.01, 9, 0.25);
  });

  // exit: everything whips up
  tl.to(s, { y: -1920, duration: 0.38, ease: 'power3.in' }, 14.57);
  R.sfx(14.52, 'whoosh', { gain: 0.6 });
})();

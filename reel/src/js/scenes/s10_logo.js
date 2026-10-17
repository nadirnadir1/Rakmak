/* S10 (33.3 – 38.95): "At the private Fly Hyani school in Marrakech, we train female and male
   flight attendants." Vector logo build on the drop; Marrakech chip; fuselage with crew windows. */
(function () {
  const R = window.R, tl = R.tl;
  const T0 = 33.3, T1 = 38.95;
  const s = R.scene('s10', T0, T1, { zIndex: 13, background: 'radial-gradient(ellipse 85% 55% at 50% 30%, #17409a 0%, #0a1f4f 45%, #020817 100%)' });
  const rays = R.div('rays', s, { top: '25%' });
  tl.fromTo(rays, { rotation: 0, opacity: 0 }, { rotation: 25, opacity: 0.8, duration: T1 - T0, ease: 'none' }, T0);
  R.particles(s, { n: 34, t0: T0, t1: T1, seed: 101, color: '255,180,90', alpha: 0.5, speed: 30, maxR: 6 });
  R.particles(s, { n: 30, t0: T0, t1: T1, seed: 102, color: '140,190,255', alpha: 0.45, speed: 22, maxR: 5 });
  const glow = R.div('abs', s, { left: '40px', top: '220px', width: '1000px', height: '700px', borderRadius: '50%',
    background: 'radial-gradient(ellipse, rgba(60,140,255,.45) 0%, rgba(31,111,255,0) 65%)' });

  // ---------------- logo ----------------
  const L = window.LOGO;
  const logoBox = R.div('abs', s, { left: '60px', top: '470px', width: '960px', height: '276px', zIndex: 5 });
  const svg = R.svgEl('svg', { viewBox: `0 0 ${L.w} ${L.h}`, width: 960, height: 276, class: 'logo-svg' }, logoBox);
  svg.style.filter = 'drop-shadow(0 12px 30px rgba(0,0,0,.35))';
  const defs = R.svgEl('defs', {}, svg);
  const clipAll = R.svgEl('clipPath', { id: 'logoClip' }, defs);
  const swClip = R.svgEl('clipPath', { id: 'swClip' }, defs);
  const swRect = R.svgEl('rect', { x: 0, y: 95, width: 200, height: 0 }, swClip);
  const grad = R.svgEl('linearGradient', { id: 'shineG', x1: '0', x2: '1', y1: '0', y2: '0' }, defs);
  [['0', 0], ['0.5', 0.85], ['1', 0]].forEach(([o, a]) => R.svgEl('stop', { offset: o, 'stop-color': '#fff', 'stop-opacity': a }, grad));
  const G = {};
  for (const [k, p] of Object.entries(L.parts)) {
    const g = R.svgEl('g', {}, svg);
    const path = R.svgEl('path', { d: p.d, fill: p.fill, 'fill-rule': 'evenodd' }, g);
    if (k === 'swoosh') g.setAttribute('clip-path', 'url(#swClip)');
    R.svgEl('path', { d: p.d, 'fill-rule': 'evenodd' }, clipAll);
    G[k] = { g, path, bbox: p.bbox };
  }
  const shineRect = R.svgEl('rect', { x: -300, y: 0, width: 220, height: L.h, fill: 'url(#shineG)', 'clip-path': 'url(#logoClip)', transform: 'skewX(-20)' }, svg);

  const tD = 33.39;
  R.flash(tD, 0.95, 0.5);
  R.shake(tD, 20, 0.5);
  R.sfx(tD, 'impact_big', { gain: 1.0 });
  R.sfx(tD + 0.02, 'whoosh_logo', { gain: 0.6 });
  // swoosh draws top -> bottom
  tl.to(swRect, { attr: { height: 280 }, duration: 0.45, ease: 'power2.inOut' }, tD + 0.02);
  // plane flies in along a curve
  gsap.set(G.plane.g, { opacity: 0 });
  tl.set(G.plane.g, { opacity: 1 }, tD + 0.05);
  tl.fromTo(G.plane.g, { x: -900, y: 520, rotation: -35, scale: 0.4, svgOrigin: '270 230' },
    { motionPath: { path: [{ x: -900, y: 520 }, { x: -420, y: 330 }, { x: 0, y: 0 }], curviness: 1.2 }, rotation: 0, scale: 1,
      duration: 0.5, ease: 'power3.out' }, tD + 0.05);
  R.sfx(tD + 0.06, 'plane_zip', { gain: 0.55 });
  // E F H slam
  ['E', 'F', 'H'].forEach((k, i) => {
    const b = G[k].bbox, t = tD + 0.32 + i * 0.09;
    gsap.set(G[k].g, { opacity: 0 });
    tl.fromTo(G[k].g, { opacity: 0, y: -260, scaleY: 1.35, svgOrigin: `${(b[0] + b[2]) / 2} ${b[3]}` },
      { opacity: 1, y: 0, scaleY: 1, duration: 0.2, ease: 'power4.in' }, t);
    tl.fromTo(G[k].g, { scaleY: 0.82 }, { scaleY: 1, duration: 0.25, ease: 'back.out(3)' }, t + 0.2);
    R.sfx(t + 0.19, 'thud', { gain: 0.65, pitch: 1 + i * 0.1 });
  });
  // divider + text lines
  const dv = G.divider.bbox;
  gsap.set(G.divider.g, { scaleY: 0, svgOrigin: `${(dv[0] + dv[2]) / 2} ${(dv[1] + dv[3]) / 2}` });
  tl.to(G.divider.g, { scaleY: 1, duration: 0.3, ease: 'expo.out' }, tD + 0.58);
  ['line1', 'line2', 'line3'].forEach((k, i) => {
    gsap.set(G[k].g, { opacity: 0, x: -60 });
    tl.to(G[k].g, { opacity: 1, x: 0, duration: 0.35, ease: 'expo.out' }, R.ws(12, 1) - 0.05 + i * 0.1);
  });
  R.sfx(R.ws(12, 1) - 0.05, 'swish_text', { gain: 0.45 });
  tl.fromTo(shineRect, { attr: { x: -300 } }, { attr: { x: 1900 }, duration: 0.8, ease: 'power2.inOut' }, R.ws(12, 3));
  R.sfx(R.ws(12, 3), 'shimmer', { gain: 0.5 });
  tl.fromTo(logoBox, { scale: 1.08 }, { scale: 1, duration: 1.2, ease: 'expo.out' }, tD);

  // Marrakech chip
  const chip = R.div('chip loc-chip', s, { left: '540px', top: '800px', zIndex: 6 },
    `${R.icon('map-pin', 40, 2.4)}<span>MARRAKECH</span><span style="font:700 32px Alexandria;opacity:.95">· مراكش</span>`);
  gsap.set(chip, { opacity: 0, y: -60, scale: 0.6, xPercent: -50 });
  tl.to(chip, { opacity: 1, y: 0, scale: 1, duration: 0.42, ease: 'bounce.out' }, R.ws(12, 4) - 0.1);
  R.sfx(R.ws(12, 4) - 0.02, 'pin', { gain: 0.65 });

  // ---------------- logo goes up, fuselage with crew windows ----------------
  const tUp = R.ws(12, 5) - 0.12;
  tl.to(logoBox, { y: -296, scale: 0.74, duration: 0.55, ease: 'power3.inOut' }, tUp);
  tl.to(chip, { y: -412, scale: 0.85, duration: 0.55, ease: 'power3.inOut' }, tUp);
  tl.to(glow, { y: -320, opacity: 0.6, duration: 0.55 }, tUp);

  const fus = R.div('fuselage', s, { top: '560px', width: '2300px', borderRadius: '0 60px 60px 0', zIndex: 4 });
  R.div('stripe', fus, { top: '520px', background: 'linear-gradient(90deg,#003a9b,#1f6fff)' });
  R.div('stripe', fus, { top: '552px', height: '12px', background: '#f48100' });
  R.div('abs', fus, { left: '60px', top: '30px', font: "italic 900 54px 'Montserrat'", color: '#003a9b', letterSpacing: '2px' }, 'FLY HYANI <span style="color:#f48100">✈</span>');
  const crew = ['fa1', 'fa2', 'fa3', 'st1', 'st2', 'st3'];
  const wins = crew.map((c, i) => {
    const w = R.div('win', fus, { left: 70 + i * 330 + 'px', top: '115px' });
    R.img(`${R.A}${c}.png`, '', w, c === 'fa1' || c === 'st1' ? { width: '420px', bottom: '-30px' } : {});
    R.div('glare', w);
    return w;
  });
  const lab = R.div('crew-label', s, { top: '470px', color: '#ffad3d', zIndex: 6 }, 'HÔTESSES DE L\'AIR');
  const lab2 = R.div('crew-label', s, { top: '470px', color: '#7cc0ff', zIndex: 6 }, 'STEWARDS');
  gsap.set(fus, { x: 1300 });
  tl.to(fus, { x: 0, duration: 0.6, ease: 'expo.out' }, tUp + 0.1);
  R.sfx(tUp + 0.08, 'whoosh_big', { gain: 0.55 });
  const tF = R.ws(12, 7) - 0.08, tM = R.ws(12, 8) - 0.08;
  wins.forEach((w, i) => {
    const im = w.querySelector('img');
    gsap.set(im, { y: 260, opacity: 0 });
    tl.to(im, { y: 0, opacity: 1, duration: 0.4, ease: 'back.out(1.6)' }, (i < 3 ? tF : tM + 0.12) + (i % 3) * 0.08);
  });
  for (let i = 0; i < 3; i++) R.sfx(tF + i * 0.08, 'pop', { gain: 0.45, pitch: 1 + i * 0.1 });
  for (let i = 0; i < 3; i++) R.sfx(tM + 0.12 + i * 0.08, 'pop', { gain: 0.45, pitch: 0.9 + i * 0.1 });
  gsap.set([lab, lab2], { opacity: 0, y: 20 });
  tl.to(lab, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }, tF);
  tl.to(fus, { x: -990, duration: 0.5, ease: 'power3.inOut' }, tM);
  tl.to(lab, { opacity: 0, y: -20, duration: 0.2 }, tM);
  tl.to(lab2, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }, tM + 0.15);
  R.sfx(tM, 'whoosh', { gain: 0.45 });

  // exit
  tl.to(fus, { x: -2600, duration: 0.4, ease: 'power3.in' }, 38.55);
  tl.to([logoBox, chip, lab2], { opacity: 0, y: '-=60', duration: 0.3, ease: 'power2.in' }, 38.55);
  tl.to(s, { opacity: 0, duration: 0.25 }, 38.7);
  R.sfx(38.5, 'whoosh_big', { gain: 0.55 });
})();

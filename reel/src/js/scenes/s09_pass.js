/* S9 (28.35 – 33.55): "The best part? You too can start orienting your studies to this world,
   step by step." Golden-hour sky; a boarding pass prints with YOU as passenger; 3-step flight path. */
(function () {
  const R = window.R, tl = R.tl;
  const T0 = 28.35, T1 = 33.4;  // hard cut under the logo-drop flash
  const s = R.scene('s9', T0, T1, { zIndex: 14, background: 'linear-gradient(180deg, #2457c5 0%, #6c8fe0 26%, #f3a46a 60%, #ff7a2f 84%, #e8590c 100%)' });
  const sun = R.div('abs', s, { left: '40px', top: '1100px', width: '1000px', height: '1000px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(255,240,200,1) 0%, rgba(255,200,120,.75) 18%, rgba(255,150,60,.25) 42%, rgba(255,120,40,0) 66%)' });
  const clouds = R.div('fill', s, { filter: 'sepia(.35) saturate(1.5) hue-rotate(-12deg) brightness(1.04)' });
  R.cloudLayer(clouds, { t0: T0, t1: T1, n: 6, seed: 91, yMin: 120, yMax: 520, sMin: 0.25, sMax: 0.5, speed: 60, w: 1080, opacity: 0.85 });
  R.cloudLayer(clouds, { t0: T0, t1: T1, n: 6, seed: 93, yMin: 1000, yMax: 1250, sMin: 0.45, sMax: 0.8, speed: 110, w: 1080, opacity: 0.95 });
  R.particles(s, { n: 40, t0: T0, t1: T1, seed: 92, color: '255,236,190', alpha: 0.55, speed: 35, maxR: 6 });
  // soft dark band so the white captions stay readable over the bright sunrise
  R.div('abs', s, { left: 0, right: 0, top: '1100px', height: '820px', zIndex: 3,
    background: 'linear-gradient(180deg, rgba(70,22,0,0) 0%, rgba(70,22,0,.42) 26%, rgba(50,14,0,.55) 60%, rgba(40,10,0,.6) 100%)' });
  tl.fromTo(s, { scale: 1 }, { scale: 1.035, duration: T1 - T0, ease: 'none' }, T0);
  tl.fromTo(sun, { y: 120, scale: 0.9 }, { y: -60, scale: 1.05, duration: T1 - T0, ease: 'power1.out' }, T0);

  // entrance: bright flash + sparkles on "والأجمل؟"
  gsap.set(s, { opacity: 0 });
  tl.to(s, { opacity: 1, duration: 0.2, ease: 'power1.out' }, T0);
  R.flash(R.ws(11, 0) - 0.02, 0.6, 0.5);
  R.burst(s, { t: R.ws(11, 0), x: 540, y: 700, n: 26, seed: 17, speed: 1100, gravity: 600, life: 1.1, size: 54,
    html: `<div style="color:#fff">${R.icon('sparkles', 54, 2, 'style="fill:#fff"')}</div>`, z: 40 });
  R.sfx(R.ws(11, 0) - 0.04, 'sparkle', { gain: 0.7 });

  // ---------------- boarding pass printed from a slot ----------------
  const slot = R.div('abs', s, { left: '40px', top: '276px', width: '1000px', height: '28px', borderRadius: '14px',
    background: 'linear-gradient(180deg,#0b1430,#1b2a52)', boxShadow: '0 10px 30px rgba(0,0,0,.35)', zIndex: 3 });
  const win = R.div('abs', s, { left: '0', top: '290px', width: '1080px', height: '700px', overflow: 'hidden', zIndex: 2 });
  const pass = R.div('bpass', win, { top: '20px' });
  const main = R.div('bp-main', pass);
  R.div('bp-head', main, null, `${R.icon('plane', 54, 2.2, 'style="transform:rotate(45deg)"')}<div>EFH AIRLINES<small>CARTE D'EMBARQUEMENT · BOARDING PASS</small></div>`);
  const F = (x, y, k, v, big) => R.div('bp-f', main, { left: x + 'px', top: y + 'px' }, `<div class="bp-k">${k}</div><div class="bp-v" ${big ? 'style="font-size:64px"' : ''}>${v}</div>`);
  const fName = F(34, 136, 'PASSAGER / PASSENGER', '', true);
  const nameV = fName.querySelector('.bp-v');
  const f2 = F(34, 262, 'DE / FROM', 'RAK<span style="font:700 24px Montserrat;color:#7a8399;margin-left:10px">Marrakech</span>');
  const f3 = F(360, 262, 'À / TO', '<span style="color:#f48100">CREW</span><span style="font:700 24px Montserrat;color:#7a8399;margin-left:10px">Cabin Crew</span>');
  const f4 = F(34, 380, 'VOL / FLIGHT', 'EFH 2026');
  const f5 = F(300, 380, 'PORTE', 'A1');
  const f6 = F(450, 380, 'SIÈGE', '1A');
  const f7 = R.div('bp-f', main, { left: '34px', top: '478px', font: "800 24px 'Montserrat'", letterSpacing: '3px', color: '#0f9b58' },
    `EMBARQUEMENT : MAINTENANT ✓`);
  const stub = R.div('bp-stub', pass);
  R.div('abs', stub, { left: '34px', top: '40px', font: "900 40px 'Montserrat'", color: '#003a9b' }, 'EFH');
  R.div('abs', stub, { left: '34px', top: '96px', font: "700 20px 'Montserrat'", letterSpacing: '3px', color: '#7a8399' }, 'SIÈGE');
  R.div('abs', stub, { left: '34px', top: '120px', font: "900 72px 'Montserrat'", color: '#0b1430' }, '1A');
  R.div('barcode', stub, { top: '250px' });
  R.div('abs', stub, { left: '34px', top: '386px', font: "700 20px 'JetBrains Mono'", color: '#7a8399' }, 'RAK→CREW 2026');
  // punch holes
  [-18, 542].forEach((y) => R.div('abs', pass, { left: '672px', top: y + 'px', width: '36px', height: '36px', borderRadius: '50%', background: '#e7a066' }));
  // shine
  const shine = R.div('abs', pass, { left: '-300px', top: '-50px', width: '200px', height: '700px', transform: 'skewX(-18deg)',
    background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.7), rgba(255,255,255,0))' });

  const tPrint = R.ws(11, 1) - 0.25;
  gsap.set(pass, { y: -620 });
  tl.to(pass, { y: 0, duration: 0.7, ease: 'power2.out' }, tPrint);
  R.sfx(tPrint, 'printer', { gain: 0.6, dur: 0.7 });
  // type "VOUS" on "انت"
  const tType = R.ws(11, 2) - 0.02, full = 'VOUS';
  R.onFrame((t) => {
    if (t < T0 || t > T1) return;
    const n = Math.max(0, Math.min(full.length, Math.floor((t - tType) / 0.07) + 1));
    const cursor = t > tType - 0.2 && t < tType + 1.2 && Math.floor(t * 4) % 2 === 0 ? '<span style="color:#f48100">|</span>' : '';
    nameV.innerHTML = (t < tType ? '' : full.slice(0, n)) + cursor;
  });
  for (let k = 0; k < 4; k++) R.sfx(tType + k * 0.07, 'type', { gain: 0.45 });
  [f2, f3, f4, f5, f6, f7].forEach((f, i) => {
    gsap.set(f, { opacity: 0, y: 16 });
    tl.to(f, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }, R.ws(11, 3) + i * 0.09);
  });
  tl.to(shine, { x: 1500, duration: 0.6, ease: 'power2.inOut' }, R.ws(11, 8) - 0.1);
  tl.fromTo(pass, { rotation: 0 }, { rotation: -2, duration: 0.6, ease: 'power2.out' }, R.ws(11, 8) - 0.1);
  R.sfx(R.ws(11, 8) - 0.1, 'shimmer', { gain: 0.45 });

  // ---------------- step by step ----------------
  const tStep = R.ws(11, 9) - 0.3;
  tl.to(win, { y: -175, scale: 0.7, transformOrigin: '50% 0%', duration: 0.45, ease: 'power3.inOut' }, tStep);
  tl.to(slot, { y: -175, opacity: 0, duration: 0.3 }, tStep);
  const svg = R.svgEl('svg', { width: 1080, height: 1920, viewBox: '0 0 1080 1920', class: 'steps-path' }, s);
  svg.style.zIndex = 4;
  const d = 'M150,1070 C330,1070 380,910 540,890 C700,870 760,730 930,690';
  const ghost = R.svgEl('path', { d, fill: 'none', stroke: 'rgba(255,255,255,.35)', 'stroke-width': 6, 'stroke-dasharray': '2 18', 'stroke-linecap': 'round' }, svg);
  const line = R.svgEl('path', { d, fill: 'none', stroke: '#fff', 'stroke-width': 8, 'stroke-linecap': 'round' }, svg);
  const len = line.getTotalLength();
  gsap.set(line, { drawSVG: '0%' }); gsap.set(ghost, { opacity: 0 });
  tl.to(ghost, { opacity: 1, duration: 0.2 }, tStep + 0.1);
  const steps = [
    { f: 0.0, ic: 'book-open', lb: 'APPRENDRE', t: R.ws(11, 9) },
    { f: 0.5, ic: 'users', lb: 'PRATIQUER', t: R.ws(11, 10) },
    { f: 1.0, ic: 'plane-takeoff', lb: 'DÉCOLLER', t: R.we(11, 10) - 0.02 },
  ];
  steps.forEach((st, i) => {
    const pt = line.getPointAtLength(len * st.f);
    const n = R.div('step', s, { left: pt.x - 75 + 'px', top: pt.y - 55 + 'px', zIndex: 6 },
      `<div class="dot">${R.icon(st.ic, 54, 2.4)}</div><div class="lb">${st.lb}</div>`);
    gsap.set(n, { scale: 0, opacity: 0 });
    tl.to(n, { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(2.6)' }, st.t - 0.06);
    R.sfx(st.t - 0.05, 'step', { gain: 0.6, pitch: 1 + i * 0.12 });
    if (i > 0) tl.to(line, { drawSVG: `0% ${st.f * 100}%`, duration: st.t - steps[i - 1].t, ease: 'power1.inOut' }, steps[i - 1].t);
  });
  const plane = R.div('abs', s, { left: '0', top: '0', width: '90px', height: '90px', color: '#fff', zIndex: 7,
    filter: 'drop-shadow(0 8px 14px rgba(80,30,0,.4))' }, R.icon('plane', 90, 0, 'style="fill:#fff"'));
  gsap.set(plane, { opacity: 0, xPercent: -50, yPercent: -50 });
  tl.set(plane, { opacity: 1 }, steps[0].t);
  tl.to(plane, { motionPath: { path: line, align: line, alignOrigin: [0.5, 0.5], autoRotate: 45, start: 0, end: 1 },
    duration: steps[2].t - steps[0].t + 0.25, ease: 'power1.inOut' }, steps[0].t);
  tl.to(plane, { x: '+=500', y: '-=420', scale: 0.4, opacity: 0, duration: 0.3, ease: 'power2.in' }, steps[2].t + 0.25);
  R.sfx(33.0, 'riser_short', { gain: 0.6, dur: 0.39 });
})();

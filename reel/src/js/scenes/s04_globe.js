/* S4 (7.05 – 11.45): "Imagine with me: today in Marrakech, tomorrow another city."
   Dotted 3D globe; Marrakech pin; flight arcs fan out; a plane flies to Dubai. */
(function () {
  const R = window.R, tl = R.tl;
  const T0 = 7.05, T1 = 11.45;
  const s = R.scene('s4', T0, T1, { zIndex: 19, background: 'radial-gradient(ellipse 80% 60% at 50% 38%, #0d2a66 0%, #04102b 55%, #01050f 100%)' });

  // static star field
  const stars = R.el('canvas', 'abs', s, { left: 0, top: 0 });
  stars.width = 1080; stars.height = 1920;
  const sc = stars.getContext('2d'), rnd = R.rng(404);
  for (let i = 0; i < 420; i++) {
    const r = Math.pow(rnd(), 3) * 2.2 + 0.4;
    sc.fillStyle = `rgba(${200 + rnd() * 55},${210 + rnd() * 45},255,${0.25 + rnd() * 0.7})`;
    sc.beginPath(); sc.arc(rnd() * 1080, rnd() * 1920, r, 0, 6.2832); sc.fill();
  }
  tl.fromTo(stars, { y: 40, scale: 1.08 }, { y: -30, scale: 1, duration: T1 - T0, ease: 'none' }, T0);

  // nebula glow
  R.div('abs', s, { left: '-200px', top: '1000px', width: '1500px', height: '900px', borderRadius: '50%',
    background: 'radial-gradient(ellipse, rgba(244,129,0,.22) 0%, rgba(244,129,0,0) 65%)' });

  const cv = R.el('canvas', 'abs', s, { left: 0, top: 0 });
  cv.width = 1080; cv.height = 1500;
  const st = { cx: 540, cy: 735, r: 440, lon: -60, lat: 5, alpha: 0, dot: 3.3, arcs: [], pins: [{ code: 'RAK', a: 0 }] };
  const globe = R.Globe(cv, st);
  R.onFrame((t) => { if (t >= T0 - 0.05 && t <= T1 + 0.05) globe.draw(t); });

  // entrance: zoom out of panel B's sky into space, globe spins in
  tl.fromTo(st, { alpha: 0, r: 1500, lon: -70, lat: 0 }, { alpha: 1, r: 440, lon: -8, lat: 24, duration: 0.95, ease: 'expo.out' }, T0 + 0.1);
  tl.to(st, { lon: -2, lat: 26, duration: 1.6, ease: 'sine.inOut' }, T0 + 1.05);
  R.sfx(T0 + 0.12, 'whoosh_deep', { gain: 0.7 });

  // Marrakech pin + label ("today in Marrakech")
  const tPin = R.ws(4, 2) - 0.05;
  tl.to(st.pins[0], { a: 1, duration: 0.25, ease: 'power2.out' }, tPin);
  R.sfx(tPin, 'pin', { gain: 0.7 });
  const lab1 = R.div('city-label', s, { left: '0px', top: '0px' }, `<div class="k">AUJOURD'HUI</div><div class="v">MARRAKECH</div>`);
  gsap.set(lab1, { opacity: 0, scale: 0.6, transformOrigin: '100% 100%' });
  tl.to(lab1, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(2)' }, R.ws(4, 3) - 0.05);

  // arcs fan out ("tomorrow another city")
  const tArc = R.ws(4, 4) - 0.08;
  const dests = ['CDG', 'IST', 'LHR', 'JFK', 'DOH', 'FCO', 'JED', 'CAI', 'AMS', 'YUL', 'DSS', 'MAD'];
  dests.forEach((d, i) => {
    const a = { from: 'RAK', to: d, p: 0, bump: 0.16 + (i % 3) * 0.04, w: 4 };
    st.arcs.push(a);
    tl.to(a, { p: 1, duration: 0.85, ease: 'power2.inOut' }, tArc + 0.06 + i * 0.055);
  });
  const main = { from: 'RAK', to: 'DXB', p: 0, bump: 0.3, w: 7, plane: true, planeSize: 0.75 };
  st.arcs.push(main);
  tl.to(main, { p: 1, duration: 1.25, ease: 'power1.inOut' }, tArc);
  tl.to(st, { lon: 20, lat: 30, duration: 1.4, ease: 'power2.inOut' }, tArc);
  R.sfx(tArc, 'arcs_launch', { gain: 0.65 });
  R.sfx(tArc + 0.05, 'plane_pass', { gain: 0.5, dur: 1.3 });

  // destination label: slot-machine city names, lands on DUBAI
  const lab2 = R.div('city-label', s, { left: '0px', top: '0px', borderColor: 'rgba(255,173,61,.6)' }, `<div class="k">DEMAIN</div><div class="v">PARIS</div>`);
  const v2 = lab2.querySelector('.v');
  gsap.set(lab2, { opacity: 0, scale: 0.6, transformOrigin: '0% 100%' });
  const tL2 = R.ws(4, 5) - 0.1, tLand = R.ws(4, 6) + 0.12;
  tl.to(lab2, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(2)' }, tL2);
  const names = ['PARIS', 'ISTANBUL', 'LONDON', 'NEW YORK', 'DOHA', 'ROME', 'JEDDAH', 'MONTRÉAL', 'DUBAI'];
  R.onFrame((t) => {
    if (t < tL2 || t > T1) return;
    const k = Math.min(names.length - 1, Math.floor((t - tL2) / ((tLand - tL2) / (names.length - 1))));
    v2.textContent = names[k];
  });
  for (let k = 0; k < names.length - 1; k++) R.sfx(tL2 + k * (tLand - tL2) / (names.length - 1), 'tick', { gain: 0.35 });
  R.sfx(tLand, 'ding', { gain: 0.55 });

  // labels follow their cities on the rotating globe
  R.onFrame((t) => {
    if (t < T0 || t > T1) return;
    const a = globe.project(31.63, -8.0), b = globe.project(25.2, 55.27);
    const cl = (v, w) => Math.max(24, Math.min(1056 - w, v));
    lab1.style.left = cl(a.x - 360, lab1.offsetWidth) + 'px'; lab1.style.top = a.y - 165 + 'px';
    lab2.style.left = cl(b.x + 10, lab2.offsetWidth) + 'px'; lab2.style.top = b.y - 175 + 'px';
  });

  // exit: dive into the globe
  tl.to(st, { r: 2600, alpha: 0, duration: 0.42, ease: 'power3.in' }, 11.0);
  tl.to([lab1, lab2], { opacity: 0, scale: 1.6, duration: 0.25, ease: 'power2.in' }, 11.0);
  tl.to(stars, { scale: 1.6, opacity: 0, duration: 0.4, ease: 'power2.in' }, 11.02);
  tl.to(s, { opacity: 0, duration: 0.3, ease: 'power1.in' }, 11.12);
  R.sfx(10.98, 'whoosh_big', { gain: 0.65 });
})();

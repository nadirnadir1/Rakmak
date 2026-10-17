/* S1 (0 – 7.47): hook. "Some save money for months to travel one week… others: travel is
   their job, and they get paid for it." Split screen: VACANCES vs MÉTIER. */
(function () {
  const R = window.R, tl = R.tl;
  const T_OUT = 7.47;
  const s = R.scene('s1', 0, T_OUT, { zIndex: 20, background: 'radial-gradient(ellipse 90% 70% at 50% 40%, #0f2c6b 0%, #051230 60%, #020817 100%)' });
  R.particles(s, { n: 40, t0: 0, t1: T_OUT, seed: 11, alpha: 0.35, speed: 25, maxR: 5 });

  const root = R.div('fill', s);
  // ---------------- Panel A: the saver ----------------
  const A = R.div('vs-panel shadow-xl', root); A.id = 'vsA';
  const chipA = R.div('chip', A, { left: '34px', top: '30px', background: '#0b1430', color: '#fff' },
    `${R.icon('luggage', 36, 2.4)}<span>VOYAGE = VACANCES</span>`);

  // calendar
  const cal = R.div('cal', A, { left: '64px', top: '128px' });
  const months = ['يوليوز', 'يونيو', 'ماي', 'أبريل', 'مارس', 'فبراير', 'يناير'];
  const pages = months.map((m, i) => R.div('cal-page', cal, { zIndex: i }, `<div class="cal-head">${m}</div><div class="cal-num">0${7 - i}</div>`));
  [70, 238].forEach((x) => R.div('cal-ring', cal, { left: x + 'px' }));
  [92, 216].forEach((x) => R.div('cal-ring', cal, { left: x + 'px' }));
  const flipT = [R.ws(1, 3), R.ws(1, 3) + 0.23, R.ws(1, 4), R.ws(1, 4) + 0.23, R.ws(1, 5), R.ws(1, 6)];
  flipT.forEach((t, k) => {
    const pg = pages[pages.length - 1 - k];
    tl.to(pg, { rotationX: -115, y: -30, opacity: 0, duration: 0.3, ease: 'power2.in' }, t);
    R.sfx(t, 'page_flip', { gain: 0.5 });
  });

  // savings counter + coin stacks
  R.div('abs', A, { left: '480px', top: '112px', font: "800 24px 'Montserrat'", letterSpacing: '5px', color: '#e07400' }, 'ÉPARGNE');
  const money = R.div('money-label', A, { left: '478px', top: '142px' }, '0 DH');
  R.counter(money, R.ws(1, 2), R.ws(1, 6), 0, 18000, (v) => `${Math.round(v / 100) * 100 >= 1000 ? (Math.round(v / 100) * 100).toLocaleString('fr-FR').replace(/ /g, ' ') : Math.round(v / 100) * 100} DH`);
  const heights = [6, 9, 12, 15];
  let ci = 0;
  const coinT0 = R.ws(1, 2), coinT1 = R.ws(1, 6) - 0.05;
  const total = heights.reduce((a, b) => a + b, 0);
  const order = [];
  heights.forEach((hh, si) => { for (let k = 0; k < hh; k++) order.push([si, k]); });
  order.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  order.forEach(([si, k]) => {
    const c = R.div('coin', A, { left: 486 + si * 122 + 'px', top: 468 - k * 17 + 'px', zIndex: 10 + k });
    const t = coinT0 + (coinT1 - coinT0) * (ci++ / total);
    gsap.set(c, { y: -380, opacity: 0 });
    tl.to(c, { y: 0, opacity: 1, duration: 0.22, ease: 'bounce.out' }, t);
  });
  R.sfx(coinT0, 'coins_stream', { dur: coinT1 - coinT0 + 0.25, gain: 0.55 });

  // plane takes off from the savings ("to travel")
  const takeoff = R.div('abs', A, { left: '640px', top: '330px', width: '110px', height: '110px', borderRadius: '50%',
    background: '#0b1430', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }, R.icon('plane', 58, 2.2));
  gsap.set(takeoff, { scale: 0, opacity: 0 });
  tl.to(takeoff, { scale: 1, opacity: 1, duration: 0.2, ease: 'back.out(2)' }, R.ws(1, 6) - 0.05);
  tl.to(takeoff, { x: 300, y: -330, scale: 0.4, rotation: 10, duration: 0.55, ease: 'power2.in' }, R.ws(1, 6) + 0.2);
  tl.set(takeoff, { opacity: 0 }, R.ws(1, 6) + 0.76);
  R.sfx(R.ws(1, 6) + 0.18, 'whoosh_small', { gain: 0.45, pan: 0.4 });

  // one week strip + stamp
  const week = R.div('week', A, { left: '612px', top: '480px', zIndex: 70 });
  const days = 'LMMJVSD'.split('').map((d) => R.div('d', week, null, d));
  gsap.set(week, { opacity: 0, y: 20 });
  tl.to(week, { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' }, R.ws(1, 8) - 0.1);
  days.forEach((d, i) => tl.to(d, { backgroundColor: '#f48100', color: '#fff', duration: 0.06 }, R.ws(1, 8) + i * 0.075));
  const stamp = R.div('stamp', A, { left: '520px', top: '290px', color: '#e8590c', background: 'rgba(255,250,242,.86)', zIndex: 80 }, '1 SEMAINE');
  gsap.set(stamp, { rotation: -14, scale: 2.6, opacity: 0 });
  const tStamp = R.ws(1, 9) - 0.14;  // lands just before "واحد" so the thud never masks the word
  tl.to(stamp, { scale: 1, opacity: 1, duration: 0.18, ease: 'power4.in' }, tStamp - 0.18);
  R.sfx(tStamp, 'stamp', { gain: 0.75 });
  R.shake(tStamp, 12, 0.35);

  // ---------------- Panel B: travel is the job ----------------
  const B = R.div('vs-panel shadow-xl', root); B.id = 'vsB';
  const sun = R.div('abs', B, { left: '640px', top: '-160px', width: '520px', height: '520px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(255,236,190,.95) 0%, rgba(255,214,140,.45) 30%, rgba(255,200,120,0) 68%)' });
  R.cloudLayer(B, { t0: 0, t1: T_OUT, n: 4, seed: 23, yMin: 20, yMax: 140, sMin: 0.10, sMax: 0.2, speed: 70, w: 1000, opacity: 0.9 });
  R.cloudLayer(B, { t0: 0, t1: T_OUT, n: 9, seed: 21, yMin: 330, yMax: 420, sMin: 0.3, sMax: 0.55, speed: 120, w: 1000 });
  const jet = R.div('abs', B, { left: '0px', top: '0px', width: '120px', height: '120px', color: '#fff', opacity: 0.9 }, R.icon('plane', 120, 1.6, 'style="fill:#fff"'));
  gsap.set(jet, { x: 1100, y: 170, rotation: -100, scale: 0.55 });
  tl.to(jet, { x: -200, y: 60, duration: 3.6, ease: 'none' }, R.ws(2, 0) - 0.2);
  R.sfx(R.ws(2, 0) - 0.1, 'jet_flyby', { gain: 0.42, dur: 3.2 });

  const fa = R.img(`${R.A}fa1.png`, 'portrait', B, { width: '600px', left: '470px', top: '-6px', zIndex: 10 });
  R.cloudLayer(B, { t0: 0, t1: T_OUT, n: 4, seed: 29, yMin: 410, yMax: 470, sMin: 0.35, sMax: 0.6, speed: 190, w: 1000, z: 11 });
  const dimB = R.div('vs-dim', B, { zIndex: 12 });
  const chipB = R.div('chip', B, { left: '34px', top: '30px', background: '#f48100', color: '#fff', zIndex: 13 },
    `${R.icon('plane', 36, 2.4)}<span>VOYAGE = MÉTIER</span>`);
  gsap.set(chipB, { opacity: 0, scale: 0.6, transformOrigin: '0% 50%' });
  tl.to(chipB, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(2.4)' }, R.ws(2, 3) - 0.08);
  R.sfx(R.ws(2, 3) - 0.06, 'pop', { gain: 0.5 });

  // notifications: salary + next flight
  const n1 = R.div('notif', B, { left: '34px', top: '120px', zIndex: 14, width: '590px' },
    `<div class="ic" style="background:linear-gradient(160deg,#2ecc71,#13a04f);color:#fff">${R.icon('landmark', 44, 2.2)}</div>
     <div><div class="tt">BANQUE · MAINTENANT</div><div class="mm">Salaire reçu ✓</div></div>`);
  const n2 = R.div('notif', B, { left: '34px', top: '284px', zIndex: 14, width: '590px' },
    `<div class="ic" style="background:linear-gradient(160deg,#2f80ff,#0b4fd6);color:#fff">${R.icon('plane', 44, 2.2)}</div>
     <div><div class="tt">VOL EF457 · DEMAIN</div><div class="mm">Prochain vol : Dubaï ✈</div></div>`);
  [[n1, R.ws(3, 0) - 0.1], [n2, R.ws(3, 1) - 0.1]].forEach(([n, t], i) => {
    gsap.set(n, { y: -180, opacity: 0, scale: 0.9 });
    tl.to(n, { y: 0, opacity: 1, scale: 1, duration: 0.42, ease: 'back.out(1.6)' }, t);
    R.sfx(t + 0.04, i ? 'notif2' : 'notif', { gain: 0.75 });
  });
  R.burst(B, { z: 15, t: R.ws(3, 0) + 0.12, x: 100, y: 170, n: 22, seed: 5, speed: 900, gravity: 2200, life: 1.1, size: 44,
    angle: -Math.PI / 2.6, spread: 1.9, html: '<div class="coin" style="width:44px;height:44px;border-radius:50%;box-shadow:0 3px 0 #b06f00"></div>' });
  R.sfx(R.ws(3, 0) + 0.12, 'cash', { gain: 0.6 });

  // ---------------- VS badge ----------------
  const vs = R.div('', root, null, 'VS'); vs.id = 'vsBadge';

  // intro: panels slam in
  gsap.set(A, { x: -420 }); gsap.set(B, { x: 420 }); gsap.set(vs, { scale: 0.2, rotation: -120 });
  gsap.set(chipA, { opacity: 0, scale: 0.6, transformOrigin: '0% 50%' });
  tl.to(A, { x: 0, duration: 0.3, ease: 'expo.out' }, 0);
  tl.to(B, { x: 0, duration: 0.3, ease: 'expo.out' }, 0.04);
  tl.to(vs, { scale: 1, rotation: 0, duration: 0.4, ease: 'back.out(2.2)' }, 0.08);
  tl.to(chipA, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(2.4)' }, 0.25);
  R.sfx(0.0, 'whoosh', { gain: 0.6 });
  R.sfx(0.2, 'impact_small', { gain: 0.55 });

  // focus switch A -> B on "وكاين"
  const dimA = R.div('vs-dim', A, { opacity: 0, zIndex: 90 });
  const tB = R.ws(2, 0) - 0.12;
  tl.to(dimA, { opacity: 0.55, duration: 0.3 }, tB);
  tl.to(A, { scale: 0.96, duration: 0.4, ease: 'power2.out' }, tB);
  tl.to(dimB, { opacity: 0, duration: 0.35 }, tB);
  tl.fromTo(fa, { y: 60 }, { y: 0, duration: 0.6, ease: 'expo.out' }, tB);
  tl.to(vs, { scale: 1.25, duration: 0.12, yoyo: true, repeat: 1, ease: 'power2.out' }, tB);
  R.sfx(tB, 'swoosh_up', { gain: 0.5 });

  // exit: zoom through panel B's sky into space
  tl.to(root, { scale: 3.2, transformOrigin: '300px 960px', opacity: 0, duration: 0.42, ease: 'power3.in' }, 7.05);
  R.sfx(7.0, 'whoosh_big', { gain: 0.8 });
})();

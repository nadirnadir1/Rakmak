/* S6 (14.6 – 18.95): "This is the Cabin Crew profession — air hospitality crew."
   Title drop: CABIN behind the hero's head, CREW in front; two colleagues join. */
(function () {
  const R = window.R, tl = R.tl;
  const T0 = 14.6, T1 = 18.95;
  const s = R.scene('s6', T0, T1, { zIndex: 17, background: 'radial-gradient(ellipse 70% 55% at 50% 36%, #1a4aa8 0%, #0a1f4f 45%, #020817 100%)' });
  R.s6 = s;
  const rays = R.div('rays', s);
  tl.fromTo(rays, { rotation: -8, opacity: 0.4 }, { rotation: 14, opacity: 1, duration: T1 - T0, ease: 'none' }, T0);
  R.particles(s, { n: 50, t0: T0, t1: T1, seed: 61, alpha: 0.45, speed: 30, maxR: 5 });

  const cam = R.div('fill', s);
  // side crew (behind everything but the background)
  const left = R.img(`${R.A}st1.png`, 'portrait', cam, { width: '600px', left: '-170px', top: '608px', filter: 'brightness(.72) saturate(.9)' });
  const right = R.img(`${R.A}st3.png`, 'portrait', cam, { width: '560px', left: '690px', top: '648px', filter: 'brightness(.72) saturate(.9)' });

  const cabin = R.div('big-word', cam, { top: '350px', color: '#fff', textShadow: '0 20px 60px rgba(0,0,0,.35)' }, 'CABIN');
  const hero = R.img(`${R.A}fa2.png`, 'portrait', cam, { width: '820px', left: '130px', top: '388px' });
  const crew = R.div('big-word', cam, { top: '968px', color: '#f48100', textShadow: '0 18px 50px rgba(0,0,0,.45)' }, 'CREW');
  // sub line
  const sub = R.div('abs', cam, { left: '0', right: '0', top: '1238px', textAlign: 'center', font: "800 30px 'Montserrat'",
    letterSpacing: '12px', color: '#cfe2ff' }, '✦ HÔTESSES &amp; STEWARDS ✦');
  // bottom fade so the bust cut never shows above the captions
  R.div('abs', s, { left: 0, right: 0, top: '1160px', height: '760px',
    background: 'linear-gradient(180deg, rgba(2,8,23,0) 0%, rgba(2,8,23,.85) 40%, #020817 70%)' });
  s.appendChild(sub); // keep sub line above the fade

  // hero rises (build-up)
  gsap.set(hero, { y: 420, opacity: 0 });
  tl.to(hero, { y: 0, opacity: 1, duration: 0.7, ease: 'expo.out' }, T0 + 0.05);
  tl.fromTo(cam, { scale: 1.12 }, { scale: 1, duration: 1.4, ease: 'power2.out' }, T0);
  R.sfx(T0 + 0.05, 'riser', { gain: 0.55, dur: 16.07 - T0 - 0.05 });

  // CABIN slam (on the beat, "كابين")
  const tC = R.ws(6, 3), tW = R.ws(6, 4);
  gsap.set(cabin, { scale: 1.9, opacity: 0 });
  tl.to(cabin, { scale: 1, opacity: 1, duration: 0.2, ease: 'power4.in' }, tC - 0.2);
  gsap.set(crew, { scale: 2.1, opacity: 0, y: 30 });
  tl.to(crew, { scale: 1, opacity: 1, y: 0, duration: 0.18, ease: 'power4.in' }, tW - 0.18);
  R.flash(tC, 0.9, 0.45);
  R.shake(tC, 22, 0.5);
  R.punch(tC, 1.06, 0.6);
  R.shake(tW, 16, 0.35);
  R.sfx(tC, 'impact_big', { gain: 0.8 });
  R.sfx(tW, 'impact', { gain: 0.42 });
  // shockwave rings
  [0, 0.08].forEach((d, i) => {
    const ring = R.div('ring-wave', s, { left: '540px', top: '608px', width: '10px', height: '10px', margin: '-5px 0 0 -5px', opacity: 0 });
    tl.fromTo(ring, { width: 10, height: 10, margin: '-5px 0 0 -5px', opacity: 0.9 },
      { width: 1800, height: 1800, margin: '-900px 0 0 -900px', opacity: 0, duration: 0.8, ease: 'expo.out' }, tC + d);
  });
  R.leak(tC + 0.05, 1, 240, 380, 1.2, 0.7);

  // colleagues join ("طاقم الضيافة الجوية")
  const tCrew = R.ws(7, 0) - 0.1;
  gsap.set(left, { x: -500, opacity: 0 }); gsap.set(right, { x: 500, opacity: 0 });
  tl.to(left, { x: 0, opacity: 1, duration: 0.55, ease: 'expo.out' }, tCrew);
  tl.to(right, { x: 0, opacity: 1, duration: 0.55, ease: 'expo.out' }, tCrew + 0.07);
  R.sfx(tCrew, 'whoosh_double', { gain: 0.55 });
  gsap.set(sub, { opacity: 0, letterSpacing: '30px' });
  tl.to(sub, { opacity: 1, letterSpacing: '12px', duration: 0.6, ease: 'expo.out' }, R.ws(7, 1) - 0.1);
  // slow push + shine on CREW
  tl.to(cam, { scale: 1.05, duration: 1.6, ease: 'none' }, tCrew + 0.3);
  const shine = R.div('abs', cam, { left: '-400px', top: '968px', width: '260px', height: '270px', transform: 'skewX(-20deg)',
    background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.55), rgba(255,255,255,0))', mixBlendMode: 'overlay' });
  tl.to(shine, { x: 1700, duration: 0.7, ease: 'power2.inOut' }, R.ws(7, 2));
})();

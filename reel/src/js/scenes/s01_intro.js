/* S1 (0 – 7.47): the hook. Full-bleed and photographic from the first frame.
   Shot A (tourist): "Some save money for months to travel just one week"  -> 12 MOIS … POUR 7 JOURS ?
   Shot B (crew):    "…for others travel is the job, and they get paid"     -> ET SI VOYAGER ÉTAIT TON MÉTIER ? */
(function () {
  const R = window.R, tl = R.tl;
  const T_OUT = 7.47;
  const s = R.scene('s1', 0, T_OUT, { zIndex: 20, background: '#0a1f4f' });
  const root = R.div('fill', s);

  // ======================= Shot B (underneath, revealed by the whip) =======================
  const B = R.div('fill', root, { background: 'linear-gradient(180deg, #1f63d6 0%, #4d9bff 38%, #a9d6ff 72%, #ffe1b8 100%)' });
  R.div('abs', B, { left: '520px', top: '120px', width: '900px', height: '900px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(255,244,214,.95) 0%, rgba(255,226,160,.5) 22%, rgba(255,210,140,0) 62%)' });
  R.cloudLayer(B, { t0: 3.4, t1: T_OUT, n: 5, seed: 31, yMin: 560, yMax: 760, sMin: 0.18, sMax: 0.32, speed: 90, w: 1080, opacity: 0.9 });
  R.cloudLayer(B, { t0: 3.4, t1: T_OUT, n: 8, seed: 33, yMin: 1180, yMax: 1420, sMin: 0.5, sMax: 0.85, speed: 170, w: 1080 });
  const hero = R.img(`${R.A}fa1.png`, 'portrait', B, { width: '960px', left: '150px', top: '700px', zIndex: 3 });
  R.cloudLayer(B, { t0: 3.4, t1: T_OUT, n: 5, seed: 37, yMin: 1470, yMax: 1560, sMin: 0.7, sMax: 1.0, speed: 230, w: 1080, z: 4 });
  R.div('abs', B, { left: 0, right: 0, top: '1250px', height: '670px', zIndex: 5,
    background: 'linear-gradient(180deg, rgba(5,18,48,0) 0%, rgba(5,18,48,.55) 45%, rgba(5,18,48,.8) 100%)' });
  const hlB = R.div('headline', B, { top: '300px', zIndex: 6 },
    ['ET', 'SI', 'VOYAGER'].map((w) => `<span class="w">${w}</span>`).join(' ') + '<br>' +
    ['ÉTAIT', 'TON', '<span class="o">MÉTIER</span>', '?'].map((w) => `<span class="w">${w}</span>`).join(' '));
  const wordsB = hlB.querySelectorAll('.w');
  gsap.set(wordsB, { opacity: 0, y: 70, rotationX: -70, transformPerspective: 800 });
  tl.to(wordsB, { opacity: 1, y: 0, rotationX: 0, duration: 0.42, ease: 'back.out(1.8)', stagger: 0.07 }, 3.72);
  tl.to(hlB, { y: -90, opacity: 0, duration: 0.3, ease: 'power2.in' }, 5.72);
  tl.fromTo(hero, { y: 140, scale: 1.06 }, { y: 0, scale: 1, duration: 1.1, ease: 'expo.out' }, 3.62);
  tl.to(hero, { scale: 1.05, duration: 3.0, ease: 'none' }, 4.7);

  // postcards from the road: London, Tokyo, Dubai ("جزء من خدمتو")
  const cards = [['london', 'LONDON', -9, 470, 930], ['tokyo', 'TOKYO', 6, 575, 955], ['dubai', 'DUBAI', -3, 525, 985]];
  const tCard = [R.ws(2, 3) - 0.06, R.ws(2, 4) - 0.1, R.ws(2, 5) - 0.04];
  const pcs = cards.map(([img, lbl, rot, cx, cy], i) => {
    const c = R.div('postcard', B, { left: cx - 320 + 'px', top: cy - 400 + 'px', zIndex: 10 + i });
    R.img(`${R.A}travel/${img}.jpg`, '', c);
    R.div('pc-l', c, null, lbl);
    gsap.set(c, { x: 1100, y: 120, rotation: rot + 25, scale: 0.9 });
    tl.to(c, { x: 0, y: 0, rotation: rot, scale: 1, duration: 0.34, ease: 'back.out(1.3)' }, tCard[i]);
    R.sfx(tCard[i], 'card', { gain: 0.42, pitch: 1 + i * 0.08 });
    return c;
  });
  tl.to(pcs, { x: -1300, rotation: -30, duration: 0.32, ease: 'power3.in', stagger: 0.04 }, 5.86);
  R.sfx(5.84, 'whoosh_small', { gain: 0.45 });

  // salary + next flight notifications ("وكيتخلص عليها")
  const n1 = R.div('notif', B, { left: '70px', top: '300px', width: '940px', zIndex: 20 },
    `<div class="ic" style="background:linear-gradient(160deg,#2ecc71,#13a04f);color:#fff">${R.icon('landmark', 44, 2.2)}</div>
     <div><div class="tt">BANQUE · MAINTENANT</div><div class="mm">Salaire reçu ✓</div></div>`);
  const n2 = R.div('notif', B, { left: '70px', top: '462px', width: '940px', zIndex: 20 },
    `<div class="ic" style="background:linear-gradient(160deg,#2f80ff,#0b4fd6);color:#fff">${R.icon('plane', 44, 2.2)}</div>
     <div><div class="tt">VOL EF457 · DEMAIN</div><div class="mm">Prochain vol : Dubaï ✈</div></div>`);
  [[n1, R.ws(3, 0) - 0.1], [n2, R.ws(3, 1) - 0.12]].forEach(([n, t], i) => {
    gsap.set(n, { y: -200, opacity: 0, scale: 0.92 });
    tl.to(n, { y: 0, opacity: 1, scale: 1, duration: 0.42, ease: 'back.out(1.6)' }, t);
    R.sfx(t + 0.04, i ? 'notif2' : 'notif', { gain: 0.7 });
  });
  const coinHtml = '<div class="coin" style="width:46px;height:46px;border-radius:50%;box-shadow:0 3px 0 #b06f00"></div>';
  [[30, -Math.PI * 0.36, 5], [1050, -Math.PI * 0.64, 6]].forEach(([x, ang, seed]) =>
    R.burst(B, { z: 21, t: R.ws(3, 0) + 0.1, x, y: 1420, n: 20, seed, speed: 1650, gravity: 2100, life: 1.4, size: 46, angle: ang, spread: 0.55, html: coinHtml }));
  R.sfx(R.ws(3, 0) + 0.12, 'cash', { gain: 0.55 });

  // ======================= Shot A (on top): the tourist =======================
  const A = R.div('fill', root, { zIndex: 2, overflow: 'hidden' });
  const ph = R.img(`${R.A}travel/thailand.jpg`, 'photo-bg', A);
  tl.fromTo(ph, { scale: 1.02, xPercent: -1 }, { scale: 1.13, xPercent: 1.5, duration: 3.75, ease: 'none' }, 0);
  R.div('abs', A, { left: 0, right: 0, top: '640px', height: '1280px',
    background: 'linear-gradient(180deg, rgba(4,14,40,0) 0%, rgba(4,14,40,.62) 20%, rgba(4,14,40,.78) 45%, rgba(4,14,40,.88) 100%)' });
  R.div('abs', A, { left: 0, right: 0, top: '230px', height: '420px',
    background: 'linear-gradient(180deg, rgba(4,14,40,.35) 0%, rgba(4,14,40,0) 100%)' });

  // headline 1 -> headline 2
  const hl1 = R.div('headline', A, { top: '800px', fontSize: '104px' },
    `<span class="w"><span class="o">12</span></span> <span class="w">MOIS</span><br><span class="w">D'ÉCONOMIES…</span>`);
  const hl2 = R.div('headline', A, { top: '780px' },
    `<span class="w" style="font-size:72px">…POUR</span><br><span class="w o" style="font-size:150px;letter-spacing:-4px">7 JOURS ?</span>`);
  const w1 = hl1.querySelectorAll('.w'), w2 = hl2.querySelectorAll('.w');
  gsap.set(w1, { opacity: 0, y: 50, scale: 0.85 });
  tl.to(w1, { opacity: 1, y: 0, scale: 1, duration: 0.28, ease: 'back.out(2)', stagger: 0.06 }, 0);
  const tSwap = R.ws(1, 5) - 0.08;
  tl.to(w1, { opacity: 0, y: -60, duration: 0.18, ease: 'power2.in', stagger: 0.03 }, tSwap - 0.1);
  gsap.set(w2, { opacity: 0, y: 80, scale: 0.7 });
  tl.to(w2, { opacity: 1, y: 0, scale: 1, duration: 0.36, ease: 'back.out(2.2)', stagger: 0.09 }, tSwap + 0.08);
  R.sfx(tSwap - 0.05, 'whoosh_small', { gain: 0.42 });

  // glass card: savings counter -> one week of travel
  const card = R.div('glass', A, { left: '70px', top: '1052px', width: '940px', height: '316px', padding: '32px 44px' });
  const k1 = R.div('g-k', card, null, 'ÉPARGNE · MOIS <span class="mcount">1</span>/12');
  const v1 = R.div('g-v', card, { marginTop: '14px' }, '0 DH');
  const bar = R.div('g-bar', card, { marginTop: '30px' }, '<i></i>');
  const mcount = k1.querySelector('.mcount');
  const fill = bar.querySelector('i');
  gsap.set(card, { y: 140, opacity: 0 });
  tl.to(card, { y: 0, opacity: 1, duration: 0.4, ease: 'back.out(1.5)' }, R.ws(1, 2) - 0.2);
  const tC0 = R.ws(1, 2), tC1 = R.ws(1, 5) - 0.1;
  R.counter(v1, tC0, tC1, 0, 18000, (v) => `${(Math.round(v / 100) * 100).toLocaleString('fr-FR').replace(/ /g, ' ')} DH`);
  R.counter(mcount, tC0, tC1, 1, 12, (v) => String(Math.round(v)));
  gsap.set(fill, { scaleX: 0 });
  tl.to(fill, { scaleX: 1, duration: tC1 - tC0, ease: 'power1.inOut' }, tC0);
  R.sfx(tC0, 'coins_stream', { dur: tC1 - tC0, gain: 0.42 });
  // card turns into the 7-day trip
  const k2 = R.div('g-k abs', card, { left: '44px', top: '34px', opacity: 0 }, 'VOYAGE · <span style="color:#fff">1 SEMAINE</span>');
  const days = R.div('abs', card, { left: '44px', top: '108px', display: 'flex', gap: '14px', opacity: 0, direction: 'ltr' });
  const dEls = ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d) => R.div('mdot', days, { width: '104px', height: '104px', borderRadius: '26px', fontSize: '38px' }, d));
  const tTrip = R.ws(1, 6) - 0.06;
  tl.to([k1, v1, bar], { opacity: 0, y: -20, duration: 0.18, ease: 'power2.in' }, tTrip - 0.1);
  tl.to([k2, days], { opacity: 1, duration: 0.2 }, tTrip + 0.05);
  dEls.forEach((d, i) => {
    const t = R.ws(1, 7) + i * 0.105;
    tl.to(d, { backgroundColor: '#f48100', color: '#fff', scale: 1.08, duration: 0.08 }, t);
    tl.to(d, { scale: 1, duration: 0.12 }, t + 0.08);
    R.sfx(t, 'pop', { gain: 0.28, pitch: 1 + i * 0.07 });
  });
  // "1 SEMAINE" stamp just before "واحد"
  const tStamp = R.ws(1, 9) - 0.14;
  const stamp = R.div('stamp', A, { left: '190px', top: '808px', color: '#ff5a1f', background: 'rgba(255,255,255,.94)', fontSize: '92px', zIndex: 5 }, '1 SEMAINE');
  gsap.set(stamp, { rotation: -12, scale: 2.6, opacity: 0 });
  tl.to(stamp, { scale: 1, opacity: 1, duration: 0.17, ease: 'power4.in' }, tStamp - 0.17);
  tl.to(w2, { opacity: 0, scale: 0.9, duration: 0.12, ease: 'power2.in' }, tStamp - 0.12);  // stamp replaces the headline
  R.sfx(tStamp, 'stamp', { gain: 0.75 });
  R.shake(tStamp, 14, 0.35);
  // the holiday ends: photo drains of colour
  gsap.set(ph, { filter: 'saturate(1) brightness(1)' });  // explicit start: tweening from 'none' goes black
  tl.to(ph, { filter: 'saturate(.3) brightness(.85)', duration: 0.35 }, R.we(1, 9) - 0.15);

  // whip pan A -> B
  const tWhip = 3.58;
  tl.to(A, { x: -1180, duration: 0.3, ease: 'power3.in' }, tWhip);
  tl.fromTo(B, { x: 380 }, { x: 0, duration: 0.42, ease: 'power3.out' }, tWhip + 0.18);
  R.sfx(tWhip - 0.02, 'whoosh', { gain: 0.6 });
  R.sfx(tWhip + 0.2, 'impact_small', { gain: 0.45 });

  // opening accents
  R.sfx(0.0, 'swoosh_up', { gain: 0.35 });

  // exit: zoom through the sky into space
  tl.to(root, { scale: 3.2, transformOrigin: '540px 620px', opacity: 0, duration: 0.42, ease: 'power3.in' }, 7.05);
  R.sfx(7.0, 'whoosh_big', { gain: 0.8 });
})();

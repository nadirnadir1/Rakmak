/* S1 (0 – 7.47): the hook. A split screen from the very first frame, two live-action clips:
   top    — the office worker drops coins in her savings jar, then sinks her chin into her hand (cold grade):
            "12 MOIS D'ÉCONOMIES… → …POUR 7 JOURS"
   bottom — a crew member on a layover walks Westminster Bridge as a red bus passes (warm grade)
   middle — "QUI A FAIT LE BON CHOIX ?"
   Both halves punch in on "أسبوع"; on "وكاين اللي السفر جزء من خدمتو" they open like doors on the
   answer: the hostess in the sky, postcards, salary. */
(function () {
  const R = window.R, tl = R.tl;
  const T_OUT = 7.47;
  const BAND = [900, 1020];                  // hinge band between the two halves
  const tDoors = 3.56, dDoors = 0.38;        // the halves open on the answer
  const tP = R.ws(1, 8) - 0.02;              // punch-in on "أسبوع"
  const s = R.scene('s1', 0, T_OUT, { zIndex: 20, background: '#0a1f4f' });
  const root = R.div('fill', s);

  // ======================= B: the answer, revealed behind the doors =======================
  const B = R.div('fill', root, { zIndex: 1, background: 'linear-gradient(180deg, #1f63d6 0%, #4d9bff 38%, #a9d6ff 72%, #ffe1b8 100%)' });
  R.div('abs', B, { left: '520px', top: '120px', width: '900px', height: '900px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(255,244,214,.95) 0%, rgba(255,226,160,.5) 22%, rgba(255,210,140,0) 62%)' });
  R.cloudLayer(B, { t0: 3.3, t1: T_OUT, n: 5, seed: 31, yMin: 560, yMax: 760, sMin: 0.18, sMax: 0.32, speed: 90, w: 1080, opacity: 0.9 });
  R.cloudLayer(B, { t0: 3.3, t1: T_OUT, n: 8, seed: 33, yMin: 1180, yMax: 1420, sMin: 0.5, sMax: 0.85, speed: 170, w: 1080 });
  const hero = R.img(`${R.A}fa1.png`, 'portrait', B, { width: '960px', left: '150px', top: '730px', zIndex: 3 });
  R.cloudLayer(B, { t0: 3.3, t1: T_OUT, n: 5, seed: 37, yMin: 1470, yMax: 1560, sMin: 0.7, sMax: 1.0, speed: 230, w: 1080, z: 4 });
  R.div('abs', B, { left: 0, right: 0, top: '1250px', height: '670px', zIndex: 5,
    background: 'linear-gradient(180deg, rgba(5,18,48,0) 0%, rgba(5,18,48,.55) 45%, rgba(5,18,48,.8) 100%)' });
  const kickB = R.div('chip kicker', B, { top: '268px', zIndex: 6 }, `${R.icon('plane', 30, 2.4)}<span>CABIN CREW</span>`);
  const hlB = R.div('headline', B, { top: '342px', zIndex: 6 },
    ['ET', 'SI', 'VOYAGER'].map((w) => `<span class="w">${w}</span>`).join(' ') + '<br>' +
    ['ÉTAIT', 'TON', '<span class="o">MÉTIER</span>', '?'].map((w) => `<span class="w">${w}</span>`).join(' '));
  const wordsB = hlB.querySelectorAll('.w');
  gsap.set(kickB, { xPercent: -50, left: 540, opacity: 0, y: -20 });
  tl.to(kickB, { opacity: 1, y: 0, duration: 0.3, ease: 'back.out(2)' }, 3.9);
  gsap.set(wordsB, { opacity: 0, y: 70, rotationX: -70, transformPerspective: 800 });
  tl.to(wordsB, { opacity: 1, y: 0, rotationX: 0, duration: 0.42, ease: 'back.out(1.8)', stagger: 0.07 }, 3.94);
  tl.to([hlB, kickB], { y: -90, opacity: 0, duration: 0.3, ease: 'power2.in' }, 5.72);
  tl.fromTo(hero, { y: 150, scale: 1.1 }, { y: 0, scale: 1, duration: 0.9, ease: 'expo.out' }, tDoors + 0.06);
  tl.to(hero, { scale: 1.05, duration: 2.6, ease: 'none' }, tDoors + 0.96);

  // postcards from the road: New York, Tokyo, Dubai ("جزء من خدمتو")
  const cards = [['newyork', 'NEW YORK', -9, 470, 960], ['tokyo', 'TOKYO', 6, 575, 985], ['dubai', 'DUBAI', -3, 525, 1015]];
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

  // ======================= TOP: the office (cold) =======================
  const TOP = R.div('abs', root, { left: 0, top: 0, width: '1080px', height: BAND[0] + 'px', overflow: 'hidden', zIndex: 3, background: '#0b1220' });
  // the same clip, blurred, fills the strip behind the header
  R.clip(TOP, { dir: 'office', n: 96, css: { left: '-60px', top: '-40px', width: '1200px', height: '775px', filter: 'blur(26px) brightness(.5) saturate(.6)' } });
  const offWrap = R.div('abs', TOP, { left: 0, top: '202px', width: '1081px', height: '698px', overflow: 'hidden' });
  const office = R.clip(offWrap, { dir: 'office', n: 96, css: { left: '0px', top: '0px', width: '1081px', height: '698px' } });
  R.div('fill', offWrap, { background: 'radial-gradient(ellipse 80% 78% at 50% 42%, rgba(0,0,0,0) 55%, rgba(0,0,0,.42) 100%)' });
  R.div('abs', offWrap, { left: 0, right: 0, top: 0, height: '80px', background: 'linear-gradient(180deg, rgba(5,10,22,.65), rgba(5,10,22,0))' });
  R.div('abs', offWrap, { right: 0, top: '360px', width: '760px', height: '338px',
    background: 'linear-gradient(270deg, rgba(4,10,24,.85) 0%, rgba(4,10,24,.55) 55%, rgba(4,10,24,0) 100%)' });
  // slow push, then the punch-in on "أسبوع"
  gsap.set(office, { transformOrigin: '540px 194px' });
  tl.fromTo(office, { scale: 1 }, { scale: 1.05, duration: tP, ease: 'none' }, 0);
  tl.fromTo(office, { scale: 1.3 }, { scale: 1.36, duration: tDoors - tP, ease: 'none' }, tP);

  R.div('chip kicker big', TOP, { top: '250px', left: '36px' }, `${R.icon('briefcase', 34, 2.4)}<span>BUREAU · 9H-18H</span>`);
  const save = R.div('chip kicker big', TOP, { top: '250px', color: '#7dffb0' }, `${R.icon('piggy-bank', 36, 2.4)}<span class="v">0 DH</span>`);
  const saveV = save.querySelector('.v');
  gsap.set(save, { left: 1044, xPercent: -100 });

  // lower third: "12 MOIS D'ÉCONOMIES…" -> "…POUR 7 JOURS" + the one week
  const lt = { left: 'auto', right: '40px', width: '660px', textAlign: 'right' };
  const hl1 = R.div('headline', TOP, Object.assign({ top: '706px', fontSize: '58px' }, lt),
    `<span class="w"><span class="o">12</span> MOIS</span><br><span class="w">D'ÉCONOMIES…</span>`);
  const hl2 = R.div('headline', TOP, Object.assign({ top: '688px', fontSize: '58px' }, lt),
    `<span class="w">…POUR</span><br><span class="w o" style="font-size:84px">7 JOURS</span>`);
  const w1 = hl1.querySelectorAll('.w'), w2 = hl2.querySelectorAll('.w');
  gsap.set(w1, { opacity: 0, x: 60 });
  tl.to(w1, { opacity: 1, x: 0, duration: 0.32, ease: 'power3.out', stagger: 0.08 }, R.ws(1, 2) - 0.1);
  const tSwap = R.ws(1, 6) - 0.1;                                    // "يسافر"
  tl.to(w1, { opacity: 0, x: -40, duration: 0.16, ease: 'power2.in', stagger: 0.03 }, tSwap - 0.1);
  gsap.set(w2, { opacity: 0, x: 60 });
  tl.to(w2, { opacity: 1, x: 0, duration: 0.32, ease: 'power3.out', stagger: 0.08 }, tSwap + 0.04);
  R.sfx(tSwap - 0.07, 'whoosh_small', { gain: 0.36 });
  const days = R.div('abs', TOP, { left: '604px', top: '840px', width: '440px', height: '50px', direction: 'ltr' });
  const dEls = ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => R.div('mpill', days, { left: i * 64 + 'px', width: '56px', height: '50px', fontSize: '24px', borderRadius: '14px' }, d));
  gsap.set(dEls, { opacity: 0, scale: 0.5 });
  tl.to(dEls, { opacity: 1, scale: 1, duration: 0.26, ease: 'back.out(2.6)', stagger: 0.04 }, tSwap + 0.14);
  dEls.forEach((d, i) => {
    const t = R.ws(1, 8) + i * 0.1;
    tl.to(d, { backgroundColor: '#f48100', color: '#fff', borderColor: 'rgba(255,214,150,.9)', duration: 0.06 }, t);
    tl.fromTo(d, { scale: 1.16 }, { scale: 1, duration: 0.14, ease: 'power2.out' }, t);
    R.sfx(t, 'pop', { gain: 0.24, pitch: 1 + i * 0.07 });
  });

  // savings counter (the coins drop in the jar on "كيجمع الفلوس") -> spent on one week
  const tF0 = R.ws(1, 2), tF1 = R.we(1, 4) + 0.05;
  R.counter(saveV, tF0, tF1, 0, 18000, (v) => (v < 50 ? '0 DH' : `+${(Math.round(v / 100) * 100).toLocaleString('fr-FR').replace(/ |\s/g, ' ')} DH`));
  const tSpent = R.ws(1, 9) - 0.06;
  R.onFrame((t) => { if (t >= tSpent && t < tDoors + 0.5) saveV.textContent = '−18 000 DH'; });
  tl.to(save, { color: '#ff6b6b', duration: 0.05 }, tSpent);
  tl.fromTo(save, { scale: 1.25 }, { scale: 1, duration: 0.3, ease: 'back.out(3)' }, tSpent);
  R.sfx(tSpent, 'tick', { gain: 0.45 });

  // ======================= BOTTOM: the layover in London (warm) =======================
  const BOT = R.div('abs', root, { left: 0, top: BAND[1] + 'px', width: '1080px', height: 1920 - BAND[1] + 'px', overflow: 'hidden', zIndex: 3 });
  const london = R.clip(BOT, { dir: 'london', n: 97, css: { left: '0px', top: '0px', width: '1080px', height: '900px' } });
  R.div('fill', BOT, { background: 'radial-gradient(ellipse 85% 80% at 50% 38%, rgba(0,0,0,0) 58%, rgba(0,0,0,.35) 100%)' });
  R.div('abs', BOT, { left: 0, right: 0, top: '330px', height: '570px',
    background: 'linear-gradient(180deg, rgba(5,18,48,0) 0%, rgba(5,18,48,.5) 45%, rgba(5,18,48,.82) 100%)' });
  gsap.set(london, { transformOrigin: '540px 188px' });
  tl.fromTo(london, { scale: 1 }, { scale: 1.04, duration: tP, ease: 'none' }, 0);
  tl.fromTo(london, { scale: 1.22 }, { scale: 1.27, duration: tDoors - tP, ease: 'none' }, tP);
  R.div('chip kicker crew big', BOT, { top: '22px', left: '36px' }, `${R.icon('plane', 36, 2.4)}<span>CABIN CREW</span>`);
  const esc = R.div('chip kicker big', BOT, { top: '22px' }, `${R.icon('map-pin', 34, 2.4)}<span>ESCALE · LONDRES</span>`);
  gsap.set(esc, { left: 1044, xPercent: -100 });
  const pay = R.div('chip kicker big', BOT, { top: '298px', color: '#7dffb0' }, `${R.icon('circle-check', 34, 2.4)}<span>+ SALAIRE</span>`);
  gsap.set(pay, { left: 1044, xPercent: -100 });
  tl.fromTo(pay, { scale: 1 }, { scale: 1.1, duration: 0.25, ease: 'sine.inOut', yoyo: true, repeat: 5 }, 0.4);

  // the clips' own sound: coins in the jar, the city
  R.sfx(0, 'file:amb_office', { gain: 1.4, dur: tDoors + 0.06 });
  R.sfx(0, 'file:amb_london', { gain: 2.0, dur: tDoors + 0.06 });

  // ======================= the hinge: "QUI A FAIT LE BON CHOIX ?" =======================
  const band = R.div('hinge', root, { top: BAND[0] + 'px', height: BAND[1] - BAND[0] + 'px', zIndex: 7 },
    `<div class="hinge-t">QUI A FAIT LE <span class="o">BON CHOIX</span> ?</div><div class="hinge-shine"></div>`);
  const shine = band.querySelector('.hinge-shine');
  tl.fromTo(band.firstChild, { scale: 1.14 }, { scale: 1, duration: 0.4, ease: 'back.out(2.5)' }, 0);
  [0.45, 2.2].forEach((t) => tl.fromTo(shine, { x: -400 }, { x: 1500, duration: 0.7, ease: 'power2.inOut' }, t));
  R.sfx(0.0, 'impact_small', { gain: 0.3 });

  // ======================= the doors open on the answer =======================
  tl.to(band, { scaleY: 0, opacity: 0, duration: 0.18, ease: 'power2.in' }, tDoors - 0.06);
  tl.to(TOP, { y: -BAND[0] - 30, duration: dDoors, ease: 'power3.inOut' }, tDoors);
  tl.to(BOT, { y: 1920 - BAND[1] + 30, duration: dDoors, ease: 'power3.inOut' }, tDoors);
  R.sfx(tDoors - 0.04, 'whoosh', { gain: 0.55 });
  R.sfx(tDoors + 0.08, 'impact', { gain: 0.45 });

  // exit: zoom through the sky into space
  tl.to(root, { scale: 3.2, transformOrigin: '540px 620px', opacity: 0, duration: 0.42, ease: 'power3.in' }, 7.05);
  R.sfx(7.0, 'whoosh_big', { gain: 0.8 });
})();

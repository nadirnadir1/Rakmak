/* S1 (0 – 7.47): the hook. The concept is on screen from the very first frame.
   0.00  an airliner window with a hostess waiting inside; the camera flies through it (live three.js)
   0.55  inside the cabin — "LES PASSAGERS: 12 MOIS D'ÉCONOMIES… POUR 7 JOURS ?" (12 months collapse into one week)
   3.58  whip into the sky — "CABIN CREW: ET SI VOYAGER ÉTAIT TON MÉTIER ?", postcards, salary */
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
  const hero = R.img(`${R.A}fa1.png`, 'portrait', B, { width: '960px', left: '150px', top: '730px', zIndex: 3 });
  R.cloudLayer(B, { t0: 3.4, t1: T_OUT, n: 5, seed: 37, yMin: 1470, yMax: 1560, sMin: 0.7, sMax: 1.0, speed: 230, w: 1080, z: 4 });
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
  tl.fromTo(hero, { y: 980, scale: 1.08 }, { y: 0, scale: 1, duration: 0.95, ease: 'expo.out' }, 3.93);
  tl.to(hero, { scale: 1.05, duration: 3.0, ease: 'none' }, 4.7);

  // postcards from the road: London, Tokyo, Dubai ("جزء من خدمتو")
  const cards = [['london', 'LONDON', -9, 470, 960], ['tokyo', 'TOKYO', 6, 575, 985], ['dubai', 'DUBAI', -3, 525, 1015]];
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

  // ======================= Shot A (on top): inside the cabin =======================
  const A = R.div('fill', root, { zIndex: 2, overflow: 'hidden', background: '#0b1a3c' });
  const cam = R.div('fill', A, { transformOrigin: '0 0' });          // aligned to the plane window during the fly-in
  const plate = R.img(`${R.A}cabin.jpg`, 'abs', cam, { left: '-108px', top: '-192px', width: '1296px', height: '2304px' });
  R.particles(cam, { n: 26, t0: 0, t1: 3.9, seed: 17, color: '255,214,160', alpha: 0.32, minR: 3, maxR: 14, speed: 9 });
  const hostess = R.img(`${R.A}fa3.png`, 'portrait', cam, { width: '860px', left: '110px', top: '690px' });
  // slow dolly while the line plays: the hostess (near) grows faster than the cabin (far)
  tl.fromTo(plate, { scale: 1 }, { scale: 1.035, transformOrigin: '648px 945px', duration: 3.2, ease: 'none' }, 0.45);
  tl.fromTo(hostess, { scale: 1 }, { scale: 1.07, transformOrigin: '430px 330px', duration: 3.2, ease: 'none' }, 0.45);

  // legibility: dark top for the headline, dark bottom for the captions (also hides the portrait's cut)
  const shadeTop = R.div('abs', A, { left: 0, right: 0, top: 0, height: '760px',
    background: 'linear-gradient(180deg, rgba(3,10,30,.82) 0%, rgba(3,10,30,.6) 48%, rgba(3,10,30,0) 100%)' });
  const shadeBot = R.div('abs', A, { left: 0, right: 0, top: '1180px', height: '740px',
    background: 'linear-gradient(180deg, rgba(3,10,30,0) 0%, rgba(3,10,30,.62) 34%, rgba(3,10,30,.9) 62%, rgba(3,10,30,.96) 100%)' });
  gsap.set([shadeTop, shadeBot], { opacity: 0 });
  tl.to([shadeTop, shadeBot], { opacity: 1, duration: 0.35, ease: 'power1.out' }, 0.5);

  // kicker chips: who we are talking about + their savings counter
  const kickA = R.div('chip kicker', A, { top: '268px' }, `${R.icon('luggage', 30, 2.4)}<span>LES PASSAGERS</span>`);
  const save = R.div('chip kicker', A, { top: '268px', color: '#7dffb0' }, `${R.icon('piggy-bank', 30, 2.4)}<span class="v">0 DH</span>`);
  const saveV = save.querySelector('.v');
  gsap.set(kickA, { left: 70, opacity: 0, x: -40 });
  gsap.set(save, { left: 1010, xPercent: -100, opacity: 0, x: 40 });
  tl.to(kickA, { opacity: 1, x: 0, duration: 0.32, ease: 'back.out(2)' }, 0.56);
  tl.to(save, { opacity: 1, x: 0, duration: 0.32, ease: 'back.out(2)' }, R.ws(1, 3) - 0.18);

  // headline 1 -> headline 2
  const hl1 = R.div('headline', A, { top: '336px', fontSize: '106px' },
    `<span class="w"><span class="o">12</span></span> <span class="w">MOIS</span><br><span class="w">D'ÉCONOMIES…</span>`);
  const hl2 = R.div('headline', A, { top: '330px' },
    `<span class="w" style="font-size:74px">…POUR</span><br><span class="w o" style="font-size:150px;letter-spacing:-4px">7 JOURS ?</span>`);
  const w1 = hl1.querySelectorAll('.w'), w2 = hl2.querySelectorAll('.w');
  gsap.set(w1, { opacity: 0, y: 50, scale: 0.85 });
  tl.to(w1, { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'back.out(2)', stagger: 0.07 }, 0.58);
  const tSwap = R.ws(1, 6) - 0.1;                                   // "يسافر"
  tl.to(w1, { opacity: 0, y: -60, duration: 0.18, ease: 'power2.in', stagger: 0.03 }, tSwap - 0.12);
  gsap.set(w2, { opacity: 0, y: 80, scale: 0.7 });
  tl.to(w2, { opacity: 1, y: 0, scale: 1, duration: 0.36, ease: 'back.out(2.2)', stagger: 0.09 }, tSwap + 0.06);
  R.sfx(tSwap - 0.07, 'whoosh_small', { gain: 0.4 });

  // 12 month pills fill up with the savings ("كيجمع الفلوس شهور")…
  const pills = R.div('abs', A, { left: '101px', top: '590px', width: '878px', height: '58px', direction: 'ltr' });
  const months = 'JFMAMJJASOND'.split('').map((m, i) => R.div('mpill', pills, { left: i * 74 + 'px' }, m));
  gsap.set(months, { opacity: 0, y: 24, scale: 0.6 });
  tl.to(months, { opacity: 1, y: 0, scale: 1, duration: 0.24, ease: 'back.out(2.4)', stagger: 0.025 }, 0.66);
  const tF0 = R.ws(1, 3) - 0.02, tF1 = R.we(1, 4) + 0.02;
  months.forEach((m, i) => {
    const t = tF0 + (tF1 - tF0) * (i / 11);
    tl.to(m, { backgroundColor: '#f48100', color: '#fff', borderColor: 'rgba(255,214,150,.9)', duration: 0.07 }, t);
    tl.fromTo(m, { scale: 1.18 }, { scale: 1, duration: 0.16, ease: 'power2.out' }, t);
  });
  R.counter(saveV, tF0, tF1 + 0.1, 0, 18000, (v) => `+${(Math.round(v / 100) * 100).toLocaleString('fr-FR').replace(/ |\s/g, ' ')} DH`);
  R.sfx(tF0, 'coins_stream', { dur: tF1 - tF0, gain: 0.4 });

  // …then collapse into one single week ("باش يسافر غير أسبوع واحد")
  tl.to(months, { opacity: 0, scale: 0.4, y: -10, duration: 0.14, ease: 'power2.in', stagger: { amount: 0.06, from: 'edges' } }, 1.88);
  const days = R.div('abs', A, { left: '153px', top: '584px', width: '774px', height: '70px', direction: 'ltr' });
  const dEls = ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => R.div('mpill day', days, { left: i * 112 + 'px' }, d));
  gsap.set(dEls, { opacity: 0, scale: 0.5 });
  tl.to(dEls, { opacity: 1, scale: 1, duration: 0.26, ease: 'back.out(2.6)', stagger: 0.04 }, 2.07);
  dEls.forEach((d, i) => {
    const t = R.ws(1, 8) + i * 0.1;                                 // "أسبوع واحد"
    tl.to(d, { backgroundColor: '#f48100', color: '#fff', borderColor: 'rgba(255,214,150,.9)', duration: 0.06 }, t);
    tl.fromTo(d, { scale: 1.16 }, { scale: 1, duration: 0.14, ease: 'power2.out' }, t);
    R.sfx(t, 'pop', { gain: 0.26, pitch: 1 + i * 0.07 });
  });
  // the savings are gone: +18 000 -> -18 000
  const tSpent = R.ws(1, 9) - 0.06;
  R.onFrame((t) => { if (t >= tSpent && t < 4) saveV.textContent = '−18 000 DH'; });
  tl.to(save, { color: '#ff6b6b', duration: 0.05 }, tSpent);
  tl.fromTo(save, { scale: 1.25 }, { scale: 1, duration: 0.3, ease: 'back.out(3)' }, tSpent);
  R.sfx(tSpent, 'tick', { gain: 0.45 });

  // ======================= the fly-in (three.js, 0 – 0.56) =======================
  const T_IN = 0.56;
  const canvas = R.el('canvas', 'abs', root, { left: '0px', top: '0px', width: '1080px', height: '1920px', zIndex: 6 });
  canvas.width = 1080; canvas.height = 1920;
  let plane = null;
  R.waitFor.push(R.threeReady.then((THREE) => window.buildPlane(THREE, canvas, {
    asset: R.A, fov: 74, exposure: 1, sun: [-0.8, 0.16, 0.55], sunI: 4.2, hemiI: 0.25, envI: 0.5,
  })).then((api) => { plane = api; }));
  const lerp = (a, b, k) => a + (b - a) * k;
  const FACE = [540, 960];                                            // cabin-layer point that sits in the window
  R.onFrame((t) => {
    if (!plane) return;
    if (t >= T_IN) { canvas.style.visibility = 'hidden'; cam.style.transform = ''; return; }
    canvas.style.visibility = 'visible';
    const p = Math.max(0, t) / T_IN;
    const e = Math.pow(p, 2.2);                                       // slow start, accelerating into the window
    const e2 = Math.min(1, Math.pow(p, 1.6) * 1.08);
    const { W0, N } = plane;
    const dn = lerp(0.70, 0.06, e), dx = lerp(0.82, 0, e2), dy = lerp(-0.74, 0, e2);  // from below: blue sky behind
    const pos = [W0.x + N.x * dn + dx, W0.y + N.y * dn + dy, W0.z + N.z * dn];
    const deep = lerp(0, 0.6, e2);                                    // look target slides inside the cabin
    const look = [W0.x - N.x * deep, W0.y - N.y * deep, W0.z - N.z * deep];
    plane.render({ pos, look, roll: lerp(0.3, 0, e2) });
    // keep the DOM cabin glued behind the window: centre, size and tilt of the projected window
    const c = plane.project([W0.x, W0.y, W0.z]);
    const top = plane.project(plane.windowPoint(0, plane.WIN[1])), bot = plane.project(plane.windowPoint(0, -plane.WIN[1]));
    const tilt = Math.atan2(bot[0] - top[0], bot[1] - top[1]);
    const dz = 0.95;
    const sc = Math.min(1, (0.06 + dz) / (dn + dz));
    const k = Math.pow(e, 3);                                         // blend to the final framing at the very end
    const tx = lerp(c[0] - FACE[0], 0, k), ty = lerp(c[1] - FACE[1], 0, k);
    cam.style.transformOrigin = `${FACE[0]}px ${FACE[1]}px`;
    cam.style.transform = `translate(${tx}px, ${ty}px) rotate(${-tilt * (1 - k)}rad) scale(${sc})`;
  });
  // caption legibility over the white fuselage during the fly-in
  const capBand = R.div('abs', root, { left: 0, right: 0, top: '1250px', height: '670px', zIndex: 7,
    background: 'linear-gradient(180deg, rgba(3,10,30,0) 0%, rgba(3,10,30,.45) 40%, rgba(3,10,30,.6) 100%)' });
  tl.to(capBand, { opacity: 0, duration: 0.12 }, T_IN - 0.04);
  // entering the cabin: soft bloom + whoosh
  R.flash(T_IN - 0.06, 0.35, 0.3);
  R.sfx(0.0, 'jet_rumble', { gain: 0.55, dur: 1.2 });
  R.sfx(T_IN - 0.08, 'impact_small', { gain: 0.32 });

  // ======================= A -> B: pan to a cabin window, push through it into the sky =======================
  const rr = (cx, cy, w, h, r) => {
    const x0 = cx - w / 2, y0 = cy - h / 2, x1 = cx + w / 2, y1 = cy + h / 2;
    return `M${x0 + r} ${y0} H${x1 - r} A${r} ${r} 0 0 1 ${x1} ${y0 + r} V${y1 - r} A${r} ${r} 0 0 1 ${x1 - r} ${y1} H${x0 + r} A${r} ${r} 0 0 1 ${x0} ${y1 - r} V${y0 + r} A${r} ${r} 0 0 1 ${x0 + r} ${y0} Z`;
  };
  const WC = [540, 1000];
  const win = R.div('fill', root, { zIndex: 4 },
    `<svg width="1080" height="1920" viewBox="0 0 1080 1920" style="position:absolute;left:0;top:0;overflow:visible">
      <defs>
        <linearGradient id="wpWall" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stop-color="#f1ece3"/><stop offset=".55" stop-color="#e2dbcf"/><stop offset="1" stop-color="#c9c0b1"/></linearGradient>
        <linearGradient id="wpBez" x1="0.15" y1="0" x2="0.85" y2="1"><stop offset="0" stop-color="#fbf8f2"/><stop offset=".5" stop-color="#e6e0d5"/><stop offset="1" stop-color="#b9b0a1"/></linearGradient>
        <linearGradient id="wpIn" x1="0.85" y1="1" x2="0.15" y2="0"><stop offset="0" stop-color="#fffdf8"/><stop offset="1" stop-color="#a99f8f"/></linearGradient>
        <linearGradient id="wpGlass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset=".7" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
        <clipPath id="wpClip"><path d="${rr(WC[0], WC[1], 470, 680, 225)}"/></clipPath>
      </defs>
      <path fill-rule="evenodd" fill="url(#wpWall)" d="M0 -3000 H4080 V4920 H0 Z ${rr(WC[0], WC[1], 640, 860, 300)}"/>
      <path fill-rule="evenodd" fill="url(#wpBez)" d="${rr(WC[0], WC[1], 640, 860, 300)} ${rr(WC[0], WC[1], 540, 760, 258)}"/>
      <path fill-rule="evenodd" fill="url(#wpIn)" d="${rr(WC[0], WC[1], 540, 760, 258)} ${rr(WC[0], WC[1], 470, 680, 225)}"/>
      <g clip-path="url(#wpClip)">
        <rect x="200" y="560" width="680" height="190" fill="#f6f2ea"/>
        <rect x="200" y="742" width="680" height="16" fill="#d4ccbe"/>
        <rect x="490" y="728" width="100" height="22" rx="8" fill="#bfb6a6"/>
        <rect x="200" y="560" width="680" height="900" fill="url(#wpGlass)"/>
      </g>
      <path d="${rr(WC[0], WC[1], 640, 860, 300)}" fill="none" stroke="rgba(90,75,55,.25)" stroke-width="3"/>
    </svg>`);
  const tWhip = 3.56, tPush = 3.8;
  gsap.set(win, { x: 1080, transformOrigin: `${WC[0]}px ${WC[1] - 40}px` });
  tl.to(A, { x: -1080, duration: 0.26, ease: 'power2.inOut' }, tWhip);
  tl.to(win, { x: 0, duration: 0.26, ease: 'power2.inOut' }, tWhip);
  tl.to(win, { scale: 6.5, duration: 0.3, ease: 'power2.in' }, tPush);
  tl.to(win, { opacity: 0, duration: 0.1, ease: 'power1.in' }, tPush + 0.18);
  tl.fromTo(B, { scale: 1.3 }, { scale: 1, transformOrigin: `${WC[0]}px ${WC[1]}px`, duration: 0.55, ease: 'power2.out' }, tPush);
  R.sfx(tWhip - 0.02, 'whoosh', { gain: 0.55 });
  R.sfx(tPush - 0.02, 'swoosh_up', { gain: 0.3 });

  // exit: zoom through the sky into space
  tl.to(root, { scale: 3.2, transformOrigin: '540px 620px', opacity: 0, duration: 0.42, ease: 'power3.in' }, 7.05);
  R.sfx(7.0, 'whoosh_big', { gain: 0.8 });
})();

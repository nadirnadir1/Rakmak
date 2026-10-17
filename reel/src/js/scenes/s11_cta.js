/* S11 (38.6 – 43.5): "Registration is still open, places are limited. Contact us today!"
   Gate sign flips to INSCRIPTIONS OUVERTES; seat map fills up; contact card with phones + site. */
(function () {
  const R = window.R, tl = R.tl;
  const T0 = 38.6, T1 = 43.5;
  const s = R.scene('s11', T0, T1, { zIndex: 12, background: 'radial-gradient(ellipse 90% 60% at 50% 35%, #12357e 0%, #071a42 50%, #020817 100%)' });
  R.particles(s, { n: 36, t0: T0, t1: T1, seed: 111, alpha: 0.4, speed: 26, maxR: 5 });
  gsap.set(s, { opacity: 0 });
  tl.to(s, { opacity: 1, duration: 0.2 }, T0);
  tl.fromTo(s, { scale: 1 }, { scale: 1.035, duration: T1 - T0, ease: 'none' }, T0);

  // ---------------- gate sign (split-flap) ----------------
  const sign = R.div('board', s, { top: '300px', left: '90px', width: '900px', padding: '24px 30px 30px' });
  R.div('board-title', sign, { marginBottom: '16px' }, `<span style="display:flex;align-items:center;gap:12px">${R.icon('graduation-cap', 44, 2.3)} EFH · 2026</span>
     <span class="led" style="display:flex;align-items:center;gap:10px;color:#3df58b"><span style="width:22px;height:22px;border-radius:50%;background:#3df58b;box-shadow:0 0 18px #3df58b"></span>OPEN</span>`);
  const led = sign.querySelector('.led');
  const lines = [['INSCRIPTIONS', ''], ['OUVERTES ✓', 'green']];
  const CH = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ✓';
  const cells = [], rnd = R.rng(113);
  const tFl = R.ws(13, 0) - 0.1;
  lines.forEach(([txt, cl], ri) => {
    const row = R.div('board-row', sign, { justifyContent: 'center', gap: '6px' });
    [...txt.padEnd(12)].forEach((ch, ci) => {
      const c = R.div('flap ' + cl, row, { width: '62px', height: '96px', fontSize: '74px', lineHeight: '96px' });
      const st = tFl + ri * 0.18 + ci * 0.03;
      cells.push({ c, ch, start: st, end: st + 0.3 + rnd() * 0.35, off: Math.floor(rnd() * CH.length) });
    });
  });
  R.onFrame((t) => {
    if (t < T0 || t > T1) return;
    for (const k of cells) {
      if (t < k.start) k.c.textContent = '';
      else if (t >= k.end) k.c.textContent = k.ch === ' ' ? '' : k.ch;
      else k.c.textContent = k.ch === ' ' ? '' : CH[(k.off + Math.floor((t - k.start) / 0.03)) % CH.length];
    }
    led.style.opacity = t < R.ws(13, 2) ? 0.25 : (Math.floor((t - R.ws(13, 2)) * 3) % 2 ? 0.55 : 1);
  });
  gsap.set(sign, { y: -60, opacity: 0, rotationX: 30, transformPerspective: 1400 });
  tl.to(sign, { y: 0, opacity: 1, rotationX: 0, duration: 0.45, ease: 'expo.out' }, T0 + 0.05);
  R.sfx(tFl, 'flaps', { gain: 0.4, dur: 0.85 });
  R.sfx(R.ws(13, 2), 'ding', { gain: 0.6 });

  // ---------------- seat map ----------------
  const sm = R.div('seatmap', s, { left: '170px', top: '712px', width: '740px', height: '670px', borderRadius: '120px 120px 40px 40px',
    background: 'linear-gradient(180deg,#eef3fb,#dbe4f2)', boxShadow: '0 40px 90px rgba(0,0,0,.5)' });
  const lab = R.div('abs', s, { left: 0, right: 0, top: '636px', textAlign: 'center', font: "900 44px 'Montserrat'", letterSpacing: '6px', color: '#ffad3d' }, 'PLACES LIMITÉES');
  const seats = [];
  for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) {
    const x = 60 + c * 104 + (c >= 3 ? 40 : 0), y = 130 + r * 106;
    seats.push(R.div('seat', sm, { left: x + 'px', top: y + 'px' }));
  }
  R.div('abs', sm, { left: '0', right: '0', top: '40px', textAlign: 'center', font: "800 26px 'Montserrat'", letterSpacing: '6px', color: '#7a8399' }, '✈ CABINE · PROMO 2026');
  const free = [8, 21, 27];
  const order = seats.map((_, i) => i).filter((i) => !free.includes(i));
  const r2 = R.rng(7); order.sort(() => r2() - 0.5);
  const tSeat0 = R.ws(13, 3) - 0.1, tSeat1 = R.ws(13, 4) + 0.25;
  gsap.set(sm, { y: 120, opacity: 0 }); gsap.set(lab, { opacity: 0, y: 20 });
  tl.to(sm, { y: 0, opacity: 1, duration: 0.45, ease: 'expo.out' }, tSeat0 - 0.3);
  tl.to(lab, { opacity: 1, y: 0, duration: 0.3, ease: 'back.out(2)' }, R.ws(13, 4) - 0.08);
  order.forEach((si, k) => {
    const t = tSeat0 + (tSeat1 - tSeat0) * (k / order.length);
    tl.to(seats[si], { backgroundColor: '#3a4357', scale: 0.92, duration: 0.08 }, t);
  });
  R.sfx(tSeat0, 'seats_fill', { gain: 0.5, dur: tSeat1 - tSeat0 });
  free.forEach((si) => {
    tl.to(seats[si], { backgroundColor: '#f48100', boxShadow: '0 0 0 6px rgba(244,129,0,.35), 0 0 40px rgba(244,129,0,.8)', duration: 0.2 }, tSeat1);
    tl.fromTo(seats[si], { scale: 1.25 }, { scale: 1, duration: 0.45, ease: 'back.out(3)' }, tSeat1);
  });
  R.sfx(tSeat1, 'pop', { gain: 0.35, pitch: 1.3 });

  // ---------------- contact card ----------------
  const tC = R.ws(13, 5) - 0.12;
  const card = R.div('contact', s, { top: '790px', zIndex: 8 },
    `<div class="c-row"><div class="c-ic">${R.icon('phone', 48, 2.4)}</div><div class="c-tx">+212 777 77 13 14</div></div>
     <div class="c-row"><div class="c-ic">${R.icon('phone', 48, 2.4)}</div><div class="c-tx">+212 777 77 17 12</div></div>
     <div class="c-row"><div class="c-ic" style="background:linear-gradient(160deg,#2f80ff,#0b4fd6);box-shadow:0 10px 24px rgba(31,111,255,.35)">${R.icon('globe', 48, 2.4)}</div><div class="c-tx web">www.flyhyani.ma</div></div>`);
  gsap.set(card, { y: 1300, rotation: 4 });
  tl.to(card, { y: 0, rotation: 0, duration: 0.55, ease: 'back.out(1.2)' }, tC);
  tl.to([sm, lab], { opacity: 0.25, scale: 0.94, duration: 0.4 }, tC);
  R.sfx(tC, 'whoosh_up', { gain: 0.6 });
  const rows = card.querySelectorAll('.c-row');
  rows.forEach((r, i) => {
    gsap.set(r, { opacity: 0, x: -40 });
    tl.to(r, { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' }, tC + 0.25 + i * 0.12);
    R.sfx(tC + 0.25 + i * 0.12, 'tick', { gain: 0.45 });
  });
  // phone icons ring
  card.querySelectorAll('.c-ic svg').forEach((ic, i) => {
    if (i > 1) return;
    tl.to(ic, { rotation: 14, duration: 0.06, repeat: 7, yoyo: true, ease: 'none' }, R.ws(13, 7) + i * 0.1);
  });
  R.sfx(R.ws(13, 7), 'phone_buzz', { gain: 0.18 });
  R.s11card = card;
})();

/* Scenes 11-14 : the question -> drop (you + the crew) -> EFH logo -> Marrakech location
   -> training (Instagram) -> registration open + contact end card */
(function () {
  const { h, S, T, clamp, lerp, P, E, env, inv, show, spring, noise1, rng } = M;
  const { ClipView, Img, FlagCircle, WavingFlag, Icon, ICON, WINGS, FX, IMG, SRC, flagURL } = C;
  const SC = (window.SCENES = window.SCENES || []);
  const T_DROP = 45.69;

  // ======================================================================= S11 the question (44.55 - 45.75)
  SC.push({
    id: 's11', start: 44.55, end: 45.76, z: 14,
    build(el) {
      el.style.background = 'radial-gradient(circle at 50% 48%, #0f2f78 0%, #061433 45%, #02061a 100%)';
      const q = h('div', { class: 'abs mont', style: { left: 0, top: '240px', width: '1080px', textAlign: 'center', color: 'rgba(255,181,71,.16)', fontWeight: 900, fontSize: '1300px', lineHeight: '1' } }, '?');
      el.appendChild(q);
      const parts = [];
      const r = rng(42);
      for (let i = 0; i < 46; i++) {
        const d = h('div', { class: 'abs', style: { width: '10px', height: '10px', borderRadius: '50%', background: i % 3 ? '#ffb547' : '#8cc8ff', left: '535px', top: '925px' } });
        el.appendChild(d);
        parts.push({ d, a: r() * Math.PI * 2, r0: 500 + r() * 600, sp: 0.6 + r() * 0.8 });
      }
      return (t) => {
        const t0 = 44.55;
        el.style.opacity = E.outCubic(clamp((t - t0) / 0.12)).toFixed(3);
        const u = clamp((t - t0) / (T_DROP - t0));
        S(q, { transform: `scale(${(0.6 + 0.5 * E.inQuad(u) + (t > T_DROP - 0.18 ? 6 * E.inExpo(clamp((t - (T_DROP - 0.18)) / 0.18)) : 0)).toFixed(3)}) rotate(${(-12 + 14 * u).toFixed(2)}deg)`, color: `rgba(255,181,71,${(0.12 + 0.2 * u).toFixed(3)})` });
        for (const p of parts) {
          const rr = p.r0 * (1 - E.inCubic(clamp(u * p.sp + 0.1)));
          S(p.d, { transform: `translate(${(Math.cos(p.a) * rr).toFixed(1)}px, ${(Math.sin(p.a) * rr).toFixed(1)}px)`, opacity: (0.9 * (1 - u * 0.5)).toFixed(2) });
        }
      };
    },
  });

  // ======================================================================= S12 drop: your boarding pass to cabin crew (45.69 - 49.15)
  function boardingPass() {
    const W = 940, H = 520;
    const card = h('div', { class: 'abs', style: { width: W + 'px', height: H + 'px', borderRadius: '30px', background: '#fff', overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,.6)' } });
    const head = h('div', { class: 'abs', style: { left: 0, top: 0, width: W + 'px', height: '118px', background: 'linear-gradient(90deg,#003a9b,#1a5fd6)' } });
    const lg = Img(head, 'logo_white.png', { left: '34px', top: '27px', width: '286px', height: '64px' });
    head.appendChild(h('div', { class: 'abs mont', style: { right: '38px', top: '24px', color: '#fff', fontWeight: 900, fontSize: '40px', letterSpacing: '5px', textAlign: 'right', lineHeight: '1.05' } }, 'BOARDING PASS'));
    head.appendChild(h('div', { class: 'abs mont', style: { right: '38px', top: '72px', color: 'rgba(255,255,255,.75)', fontWeight: 700, fontSize: '20px', letterSpacing: '4px' } }, "CARTE D’EMBARQUEMENT"));
    card.appendChild(head);
    const lab = (txt, x, y) => card.appendChild(h('div', { class: 'abs mont', style: { left: x + 'px', top: y + 'px', color: '#8a96b3', fontWeight: 800, fontSize: '22px', letterSpacing: '3px' } }, txt));
    const val = (txt, x, y, size = 54, color = '#061433') => {
      const d = h('div', { class: 'abs mont', style: { left: x + 'px', top: y + 'px', color, fontWeight: 900, fontSize: size + 'px', letterSpacing: '2px', whiteSpace: 'nowrap' } }, txt);
      card.appendChild(d);
      return d;
    };
    lab('PASSENGER', 44, 146);
    const name = val('', 44, 176, 66, '#f38100');
    const caret = h('div', { class: 'abs', style: { left: '44px', top: '188px', width: '6px', height: '58px', background: '#f38100' } });
    card.appendChild(caret);
    lab('FROM', 44, 282); val('RAK', 44, 308, 70);
    card.appendChild(h('div', { class: 'abs', html: ICON.plane('#1a5fd6'), style: { left: '214px', top: '318px', width: '60px', height: '60px', transform: 'rotate(90deg)' } }));
    lab('TO', 300, 282); val('THE WORLD', 300, 318, 54);
    lab('GATE', 44, 410); val('EFH', 44, 436, 46, '#1a5fd6');
    lab('SEAT', 214, 410); val('1A', 214, 436, 46);
    lab('CLASS', 340, 410);
    const clsBox = h('div', { class: 'abs', style: { left: '336px', top: '432px', width: '330px', height: '66px', perspective: '400px' } });
    const clsA = h('div', { class: 'abs mont', style: { left: 0, top: 0, color: '#061433', fontWeight: 900, fontSize: '42px', letterSpacing: '2px', whiteSpace: 'nowrap', transformOrigin: '50% 100%' } }, 'PASSENGER');
    const clsB = h('div', { class: 'abs mont', style: { left: 0, top: 0, padding: '2px 16px 6px', borderRadius: '12px', background: 'linear-gradient(90deg,#f38100,#ffa53a)', color: '#fff', fontWeight: 900, fontSize: '40px', letterSpacing: '2px', whiteSpace: 'nowrap', transformOrigin: '50% 0%' } }, 'CABIN CREW');
    clsBox.append(clsA, clsB);
    card.appendChild(clsBox);
    // perforation + stub
    card.appendChild(h('div', { class: 'abs', style: { left: '700px', top: '130px', width: '0', height: '380px', borderLeft: '4px dashed #d5dbe8' } }));
    card.appendChild(h('div', { class: 'abs', style: { left: '730px', top: '150px', width: '170px', height: '340px', background: 'repeating-linear-gradient(0deg,#061433 0 4px,transparent 4px 8px,#061433 8px 10px,transparent 10px 15px)', opacity: .9 } }));
    const notchT = h('div', { class: 'abs', style: { left: '682px', top: '-20px', width: '40px', height: '40px', borderRadius: '50%', background: '#0b1f4d' } });
    const notchB = h('div', { class: 'abs', style: { left: '682px', top: H - 20 + 'px', width: '40px', height: '40px', borderRadius: '50%', background: '#0b1f4d' } });
    const shine = h('div', { class: 'abs', style: { left: '-300px', top: '-100px', width: '200px', height: '800px', background: 'linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.65),rgba(255,255,255,0))', transform: 'rotate(18deg)', mixBlendMode: 'overlay' } });
    card.appendChild(shine);
    return { card, name, caret, clsA, clsB, shine };
  }

  SC.push({
    id: 's12', start: 45.69, end: 49.16, z: 15,
    build(el) {
      el.style.background = '#030a1f';
      const bg = ClipView(el, { w: 1080, h: 1920 });
      const shade = h('div', { class: 'full', style: { background: 'linear-gradient(180deg, rgba(3,10,31,.45) 0%, rgba(3,10,31,0) 22%, rgba(3,10,31,.15) 40%, rgba(3,10,31,.55) 70%, rgba(3,10,31,.85) 100%)' } });
      el.appendChild(shade);
      const glow = h('div', { class: 'abs', style: { left: '-60px', top: '480px', width: '1200px', height: '900px', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(243,129,0,.35) 0%, rgba(243,129,0,0) 62%)' } });
      el.appendChild(glow);
      const bp = boardingPass();
      const wrap = h('div', { class: 'abs', style: { left: '70px', top: '640px', width: '940px', height: '520px' } });
      wrap.appendChild(bp.card);
      el.appendChild(wrap);
      const wings = h('div', { class: 'abs', html: WINGS('#f5c86b'), style: { left: '370px', top: '540px', width: '340px', height: '100px', filter: 'drop-shadow(0 6px 18px rgba(0,0,0,.6))' } });
      el.appendChild(wings);
      const parts = [];
      const r = rng(77);
      for (let i = 0; i < 26; i++) {
        const d = h('div', { class: 'abs', style: { width: '12px', height: '12px', borderRadius: '50%', background: i % 3 ? '#ffb547' : '#ffffff', left: '540px', top: '900px', opacity: 0 } });
        el.appendChild(d);
        parts.push({ d, a: r() * Math.PI * 2, sp: 380 + r() * 520 });
      }
      return (t) => {
        const t0 = T_DROP;
        bg.set('v5', 0.15 + (t - t0) * 0.92, { cx: 0.36, cy: 0.38, zoom: 1.04 + 0.03 * (t - t0) });
        // boarding pass flies in on the drop
        const ti = t0 + 0.2;
        const pi = spring(t - ti, { k: 150, c: 15 });
        const float = 6 * Math.sin((t - ti) * 2.2);
        S(wrap, { opacity: t < ti ? 0 : 1, transform: `perspective(1600px) translateY(${(lerp(1000, 0, pi) + float).toFixed(1)}px) rotateX(${lerp(55, 2, pi).toFixed(2)}deg) rotate(${lerp(8, -2, pi).toFixed(2)}deg)` });
        glow.style.opacity = (t < ti ? 0 : 0.6 + 0.3 * Math.sin((t - ti) * 4)).toFixed(3);
        // passenger name types "YOU" on "انت"
        const tn = Wt('انت').s - 0.05;
        const full = 'YOU';
        const n = Math.round(full.length * clamp((t - tn) / 0.25));
        bp.name.textContent = full.slice(0, n);
        S(bp.caret, { left: 44 + n * 52 + 'px', opacity: t < ti + 0.2 ? 0 : (n < 3 || Math.sin(t * 16) > 0 ? 1 : 0).toFixed(2) });
        // class flips PASSENGER -> CABIN CREW on "مضيفي الطيران"
        const tf = Wt('مضيفي').s - 0.1;
        const f = clamp((t - tf) / 0.36);
        S(bp.clsA, { opacity: f < 0.5 ? 1 : 0, transform: `rotateX(${(-180 * Math.min(f, 0.5)).toFixed(1)}deg)` });
        S(bp.clsB, { opacity: f >= 0.5 ? 1 : 0, transform: `rotateX(${(f >= 0.5 ? 90 - 180 * (f - 0.5) : 90).toFixed(1)}deg) scale(${(1 + 0.15 * Math.sin(Math.PI * clamp((t - tf - 0.18) / 0.3))).toFixed(3)})` });
        const pw = spring(t - (tf + 0.25), { k: 260, c: 14 });
        S(wings, { opacity: t < tf + 0.25 ? 0 : 1, transform: `translateY(${lerp(60, 0, pw).toFixed(1)}px) scale(${pw.toFixed(3)})` });
        bp.shine.style.left = lerp(-300, 1200, clamp((t - (tf + 0.3)) / 0.6)) + 'px';
        // confetti burst when the pass becomes crew
        const tb = tf + 0.2;
        for (const p of parts) {
          const u = clamp((t - tb) / 0.9);
          const rr = p.sp * E.outCubic(u);
          S(p.d, { opacity: t < tb ? 0 : (1 - u).toFixed(3), transform: `translate(${(Math.cos(p.a) * rr).toFixed(1)}px, ${(Math.sin(p.a) * rr * 0.75 + 140 * u * u).toFixed(1)}px)` });
        }
        const xo = P(t, 49.06, 0.1, E.inCubic);
        el.style.opacity = (1 - xo).toFixed(3);
      };
    },
  });

  // ======================================================================= S13a logo reveal (49.05 - 51.0)
  SC.push({
    id: 's13a', start: 49.05, end: 51.0, z: 16,
    build(el) {
      el.style.background = 'radial-gradient(ellipse at 50% 38%, #0f3487 0%, #061433 55%, #02061a 100%)';
      const streaks = [];
      for (let i = 0; i < 7; i++) {
        const s = h('div', { class: 'abs', style: { left: '-400px', top: 260 + i * 120 + 'px', width: '700px', height: '4px', borderRadius: '2px', background: 'linear-gradient(90deg, rgba(140,200,255,0), rgba(140,200,255,.55), rgba(140,200,255,0))' } });
        el.appendChild(s);
        streaks.push(s);
      }
      const ns = 'http://www.w3.org/2000/svg';
      const trail = document.createElementNS(ns, 'svg');
      trail.setAttribute('width', 1080); trail.setAttribute('height', 1920);
      trail.style.position = 'absolute';
      trail.innerHTML = `<path id="swoosh" d="M-80 820 C 200 700, 420 640, 700 560" fill="none" stroke="#f38100" stroke-width="16" stroke-linecap="round" filter="url(#glow-o)"/>`;
      el.appendChild(trail);
      const sw = trail.querySelector('#swoosh');
      const swLen = sw.getTotalLength();
      const plane = h('div', { class: 'abs', html: ICON.plane('#fff'), style: { left: '-45px', top: '-45px', width: '90px', height: '90px', filter: 'drop-shadow(0 0 16px rgba(255,255,255,.7))' } });
      el.appendChild(plane);
      const logoWrap = h('div', { class: 'abs', style: { left: '90px', top: '470px', width: '900px', height: '201px' } });
      const icon = Img(logoWrap, 'icon_white.png', { left: '0px', top: '17px', width: '249px', height: '168px' });
      const efh = Img(logoWrap, 'efh_white.png', { left: '270px', top: '30px', width: '371px', height: '139px' });
      const tag = Img(logoWrap, 'tag_white.png', { left: '640px', top: '0px', width: '261px', height: '201px' });
      el.appendChild(logoWrap);
      const shine = h('div', { class: 'abs', style: { left: '-300px', top: '420px', width: '220px', height: '320px', background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.45), rgba(255,255,255,0))', transform: 'skewX(-20deg)', mixBlendMode: 'overlay' } });
      el.appendChild(shine);
      const badge = h('div', { class: 'pill', style: { left: '50%', top: '760px', background: 'rgba(255,255,255,.1)', border: '2px solid rgba(255,255,255,.4)', fontSize: '34px', fontWeight: 700, letterSpacing: '1px' } });
      badge.append(h('span', { html: ICON.check('#22c55e'), style: { width: '44px', height: '44px', display: 'inline-block', background: 'rgba(34,197,94,.18)', borderRadius: '50%', padding: '4px' } }), h('span', {}, 'École privée autorisée par l’État'));
      el.appendChild(badge);
      const city = h('div', { class: 'abs mont', style: { left: 0, top: '880px', width: '1080px', textAlign: 'center', color: '#ffb547', fontWeight: 900, fontSize: '54px', letterSpacing: '16px' } }, 'MARRAKECH');
      return (t) => {
        const t0 = 49.05;
        el.style.opacity = E.outCubic(clamp((t - t0) / 0.15)).toFixed(3);
        streaks.forEach((s, i) => {
          const x = -800 + (((t - t0) * (900 + i * 140) + i * 260) % 2200);
          s.style.transform = `translateX(${x.toFixed(1)}px)`;
        });
        const pp = E.inOutCubic(clamp((t - t0) / 0.55));
        sw.setAttribute('stroke-dasharray', `${(swLen * pp).toFixed(1)} ${swLen}`);
        const pt = sw.getPointAtLength(swLen * pp);
        const pt2 = sw.getPointAtLength(Math.min(swLen, swLen * pp + 2));
        const ang = (Math.atan2(pt2.y - pt.y, pt2.x - pt.x) * 180) / Math.PI + 90;
        S(plane, { opacity: pp < 1 ? 1 : Math.max(0, 1 - (t - t0 - 0.55) / 0.1).toFixed(2), transform: `translate(${pt.x.toFixed(1)}px, ${pt.y.toFixed(1)}px) rotate(${ang.toFixed(1)}deg)` });
        trail.style.opacity = (1 - P(t, t0 + 0.55, 0.25)).toFixed(3);
        const pi = spring(t - (t0 + 0.4), { k: 240, c: 14 });
        S(icon, { opacity: t < t0 + 0.4 ? 0 : 1, transform: `scale(${pi.toFixed(3)}) rotate(${lerp(-40, 0, pi).toFixed(1)}deg)` });
        const pe = E.outCubic(clamp((t - (t0 + 0.55)) / 0.35));
        S(efh, { opacity: pe.toFixed(3), clipPath: `inset(0 ${(100 - pe * 100).toFixed(1)}% 0 0)`, transform: `translateX(${lerp(-40, 0, pe).toFixed(1)}px)` });
        const pg = E.outCubic(clamp((t - (t0 + 0.75)) / 0.35));
        S(tag, { opacity: pg.toFixed(3), transform: `translateX(${lerp(60, 0, pg).toFixed(1)}px)` });
        shine.style.left = lerp(-300, 1200, clamp((t - (t0 + 1.0)) / 0.5)) + 'px';
        const pb = spring(t - (t0 + 1.0), { k: 220, c: 17 });
        S(badge, { opacity: t < t0 + 1.0 ? 0 : 1, transform: `translateX(-50%) translateY(${lerp(40, 0, pb).toFixed(1)}px) scale(${lerp(0.7, 1, pb).toFixed(3)})` });
        const xo = P(t, 50.9, 0.1, E.inCubic);
        if (xo > 0) el.style.opacity = (1 - xo).toFixed(3);
      };
    },
  });

  // ======================================================================= S13b Marrakech location (50.9 - 52.6)
  SC.push({
    id: 's13b', start: 50.88, end: 52.62, z: 17,
    build(el) {
      el.style.background = 'radial-gradient(ellipse at 50% 40%, #12306e 0%, #061433 60%, #02061a 100%)';
      // Morocco map (client artwork, incl. southern provinces)
      const ma = Img(el, SRC + 'morocco_map.png', { left: '0px', top: '0px', width: '1910px', height: '2049px', transformOrigin: '0 0' });
      const MX = 1084, MY = 560;
      const maPin = h('div', { class: 'abs', html: ICON.pin('#ffb547'), style: { width: '120px', height: '120px', filter: 'drop-shadow(0 8px 16px rgba(0,0,0,.6))' } });
      el.appendChild(maPin);
      // satellite crop of the school surroundings
      const sat = h('div', { class: 'abs', style: { left: 0, top: 0, width: '1080px', height: '1920px', overflow: 'hidden', opacity: 0 } });
      const satImg = Img(sat, 'map_crop.jpg', { left: 0, top: 0, width: '899px', height: '1100px', transformOrigin: '0 0' });
      const satTint = h('div', { class: 'full', style: { background: 'linear-gradient(180deg, rgba(3,10,31,.35), rgba(3,10,31,0) 30%, rgba(3,10,31,0) 65%, rgba(3,10,31,.6))' } });
      sat.appendChild(satTint);
      el.appendChild(sat);
      const SX = 640, SY = 518; // school position in map_crop.jpg
      const pulse = h('div', { class: 'abs', style: { width: '220px', height: '220px', borderRadius: '50%', border: '8px solid rgba(243,129,0,.9)', left: '430px', top: '650px' } });
      el.appendChild(pulse);
      const pin = h('div', { class: 'abs', style: { left: '470px', top: '560px', width: '140px', height: '180px' } });
      pin.innerHTML = `<svg viewBox="0 0 140 180" width="140" height="180" style="filter:drop-shadow(0 12px 18px rgba(0,0,0,.55))"><path d="M70 176 C70 176 6 104 6 66 A64 64 0 0 1 134 66 C134 104 70 176 70 176 Z" fill="#f38100" stroke="#fff" stroke-width="7"/><circle cx="70" cy="66" r="44" fill="#fff"/></svg>`;
      const pinIcon = Img(pin, 'icon_blue.png', { left: '36px', top: '40px', width: '68px', height: '46px' });
      el.appendChild(pin);
      const mapLbl = h('div', { class: 'abs mont', style: { width: '440px', textAlign: 'right', color: '#fff', fontWeight: 900, fontSize: '50px', lineHeight: '1.05', padding: '18px 26px', borderRadius: '22px', background: 'rgba(3,10,31,.72)', border: '2px solid rgba(255,255,255,.25)', boxShadow: '0 14px 34px rgba(0,0,0,.45)' } });
      mapLbl.innerHTML = 'EFH<br><span style="font-size:32px;font-weight:800;color:#ffb547">École FLY HYANI</span>';
      el.appendChild(mapLbl);
      const card = h('div', { class: 'abs', style: { left: '120px', top: '300px', width: '840px', height: '170px', borderRadius: '28px', background: '#fff', boxShadow: '0 24px 60px rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', gap: '26px', padding: '0 34px' } });
      const ci = Img(card, 'logo_blue.png', { position: 'relative', width: '250px', height: '56px' }, '');
      const ct = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '6px' } });
      ct.append(h('div', { class: 'mont', style: { color: '#061433', fontWeight: 900, fontSize: '40px', letterSpacing: '1px' } }, 'Bd Allal Al Fassi'), h('div', { class: 'mont', style: { color: '#f38100', fontWeight: 800, fontSize: '30px', letterSpacing: '6px' } }, 'MARRAKECH'));
      card.append(ci, h('div', { style: { width: '3px', height: '100px', background: '#e2e8f3' } }), ct);
      el.appendChild(card);
      return (t) => {
        const t0 = 50.88;
        el.style.opacity = E.outCubic(clamp((t - t0) / 0.12)).toFixed(3);
        // phase 1: Morocco map, pin drops on Marrakech
        const z1 = E.inOutCubic(clamp((t - t0) / 0.75));
        const s1 = lerp(0.5, 1.6, z1);
        const fx = lerp(540, 540, z1), fy = lerp(980, 900, z1);
        const tx = fx - MX * s1, ty = fy - MY * s1;
        ma.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${s1.toFixed(4)})`;
        const tp = t0 + 0.25;
        const pp = clamp((t - tp) / 0.3);
        S(maPin, { left: fx - 60 + 'px', top: fy - 120 + 'px', opacity: t < tp ? 0 : 1, transform: `translateY(${(-300 * Math.pow(1 - pp, 2)).toFixed(1)}px)` });
        // phase 2: dive into satellite view (image always covers the frame)
        const t2 = t0 + 0.7;
        const d = E.inOutCubic(clamp((t - t2) / 0.55));
        sat.style.opacity = d.toFixed(3);
        const s2 = lerp(1.8, 2.25, E.outCubic(clamp((t - t2) / 1.1)));
        let stx = 540 - SX * s2, sty = 760 - SY * s2;
        stx = Math.min(0, Math.max(1080 - 899 * s2, stx));
        sty = Math.min(0, Math.max(1920 - 1100 * s2, sty));
        satImg.style.transform = `translate(${stx.toFixed(1)}px, ${sty.toFixed(1)}px) scale(${s2.toFixed(4)})`;
        const px = stx + SX * s2, py = sty + SY * s2;
        S(pin, { left: px - 70 + 'px', top: py - 172 + 'px' });
        S(pulse, { left: px - 110 + 'px', top: py - 110 + 'px' });
        S(mapLbl, { left: px - 540 + 'px', top: py - 120 + 'px' });
        maPin.style.opacity = (t < tp ? 0 : 1 - d).toFixed(3);
        ma.style.opacity = (1 - d).toFixed(3);
        const tp2 = t2 + 0.35;
        const p2 = spring(t - tp2, { k: 300, c: 14 });
        S(pin, { opacity: t < tp2 ? 0 : 1, transform: `translateY(${lerp(-260, 0, p2).toFixed(1)}px) scale(${lerp(0.6, 1, p2).toFixed(3)})` });
        const pr = ((t - tp2) % 0.8) / 0.8;
        S(pulse, { opacity: t < tp2 ? 0 : (1 - pr).toFixed(3), transform: `scale(${(0.3 + pr).toFixed(3)}) scaleY(0.55)` });
        const pl = clamp((t - tp2 - 0.1) / 0.2);
        S(mapLbl, { opacity: pl.toFixed(3), transform: `translateX(${lerp(30, 0, pl).toFixed(1)}px)` });
        const tc = tp2 + 0.15;
        const pc = spring(t - tc, { k: 220, c: 17 });
        S(card, { opacity: t < tc ? 0 : 1, transform: `translateY(${lerp(-60, 0, pc).toFixed(1)}px) scale(${lerp(0.85, 1, pc).toFixed(3)})` });
        const xo = P(t, 52.52, 0.1, E.inCubic);
        if (xo > 0) el.style.opacity = (1 - xo).toFixed(3);
      };
    },
  });

  // ======================================================================= S13c training (Instagram) (52.5 - 55.25)
  SC.push({
    id: 's13c', start: 52.5, end: 55.26, z: 18,
    build(el) {
      const bg = ClipView(el, { w: 1080, h: 1920 });
      const tint = h('div', { class: 'full', style: { background: 'linear-gradient(180deg, rgba(0,58,155,.55), rgba(3,10,31,.75))' } });
      el.appendChild(tint);
      const phone = h('div', { class: 'abs', style: { left: '255px', top: '250px', width: '570px', height: '1160px', borderRadius: '78px', background: '#05070d', boxShadow: '0 50px 110px rgba(0,0,0,.7), inset 0 0 0 3px #2a3142', padding: '20px' } });
      const screen = h('div', { class: 'abs', style: { left: '20px', top: '20px', width: '530px', height: '1120px', borderRadius: '60px', overflow: 'hidden', background: '#fff' } });
      const ig = Img(screen, SRC + 'instagram_profile.jpg', { left: '0px', top: '58px', width: '530px', height: '2124px' });
      const bar = h('div', { class: 'abs', style: { left: 0, top: 0, width: '530px', height: '58px', background: '#fff' } });
      bar.append(h('div', { class: 'abs', style: { left: '247px', top: '16px', width: '26px', height: '26px', borderRadius: '50%', background: '#05070d' } }),
        h('div', { class: 'abs inter', style: { left: '40px', top: '14px', fontFamily: 'Inter', fontWeight: 700, fontSize: '22px', color: '#111' } }, '9:41'));
      screen.appendChild(bar);
      phone.appendChild(screen);
      el.appendChild(phone);
      const lab = (txt, bgc) => {
        const p = h('div', { class: 'pill', style: { background: bgc, fontSize: '40px', padding: '18px 34px', letterSpacing: '3px', boxShadow: '0 18px 44px rgba(0,0,0,.5)' } });
        p.append(h('span', { html: ICON.plane('#fff'), style: { width: '44px', height: '44px', display: 'inline-block', transform: 'rotate(45deg)' } }), h('span', {}, txt));
        el.appendChild(p);
        return p;
      };
      const l1 = lab('HÔTESSES DE L’AIR', 'linear-gradient(90deg,#f38100,#ffa53a)');
      const l2 = lab('STEWARDS', 'linear-gradient(90deg,#003a9b,#1a5fd6)');
      S(l1, { left: '60px', top: '520px' });
      S(l2, { left: '520px', top: '760px' });
      const form = h('div', { class: 'abs mont', style: { left: 0, top: '196px', width: '1080px', textAlign: 'center', color: '#fff', fontWeight: 900, fontSize: '42px', letterSpacing: '12px', opacity: 0 } }, 'FORMATION');
      el.appendChild(form);
      return (t) => {
        const t0 = 52.5;
        bg.set('v1', 6.0 + (t - t0) * 0.8, { cx: 0.6, cy: 0.45, zoom: 1.2 });
        bg.el.style.filter = 'blur(10px) brightness(.75)';
        el.style.opacity = E.outCubic(clamp((t - t0) / 0.15)).toFixed(3);
        const pp = spring(t - t0, { k: 150, c: 16 });
        S(phone, { transform: `perspective(1800px) translateY(${lerp(1100, 0, pp).toFixed(1)}px) rotateY(${lerp(-25, -8, pp).toFixed(2)}deg) rotateX(${lerp(20, 4, pp).toFixed(2)}deg) rotate(${lerp(6, 2, pp).toFixed(2)}deg)` });
        const sc = E.inOutCubic(clamp((t - (t0 + 0.6)) / 1.9));
        ig.style.transform = `translateY(${(-lerp(0, 900, sc)).toFixed(1)}px)`;
        const t1 = Wt('مضيفات').s - 0.05;
        const p1 = spring(t - t1, { k: 260, c: 15 });
        S(l1, { opacity: t < t1 ? 0 : 1, transform: `translateX(${lerp(-300, 0, p1).toFixed(1)}px) rotate(${lerp(-12, -4, p1).toFixed(2)}deg) scale(${lerp(0.6, 1, p1).toFixed(3)})` });
        const t2 = Wt('ومضيفي').s - 0.05;
        const p2 = spring(t - t2, { k: 260, c: 15 });
        S(l2, { opacity: t < t2 ? 0 : 1, transform: `translateX(${lerp(300, 0, p2).toFixed(1)}px) rotate(${lerp(12, 4, p2).toFixed(2)}deg) scale(${lerp(0.6, 1, p2).toFixed(3)})` });
        const pf = E.outCubic(clamp((t - Wt('تكوين').s + 0.1) / 0.3));
        S(form, { opacity: pf.toFixed(3), letterSpacing: `${lerp(40, 12, pf).toFixed(1)}px` });
        const xo = P(t, 55.14, 0.1, E.inCubic);
        if (xo > 0) el.style.opacity = (1 - xo).toFixed(3);
      };
    },
  });

  // ======================================================================= S14 registration open + end card (55.1 - 59.9)
  const ALPH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  function flapBoard(parent, text, { x, y, tw = 46, th = 74, gap = 5, fs = 54 } = {}) {
    const wrap = h('div', { class: 'abs', style: { left: x + 'px', top: y + 'px' } });
    const tiles = [];
    [...text].forEach((ch, i) => {
      const tile = h('div', { class: 'abs', style: { left: i * (tw + gap) + 'px', top: 0, width: tw + 'px', height: th + 'px', perspective: '300px' } });
      const mk = (cls, top) => {
        const half = h('div', { class: 'abs', style: { left: 0, top: top ? 0 : th / 2 + 'px', width: tw + 'px', height: th / 2 + 'px', overflow: 'hidden', background: top ? '#1c2233' : '#171c2a', borderRadius: top ? '7px 7px 0 0' : '0 0 7px 7px', transformOrigin: top ? '50% 100%' : '50% 0%', backfaceVisibility: 'hidden' } });
        const sp = h('div', { class: 'abs oswald', style: { left: 0, top: top ? 0 : -th / 2 + 'px', width: tw + 'px', height: th + 'px', lineHeight: th + 'px', textAlign: 'center', color: '#ffd27a', fontWeight: 700, fontSize: fs + 'px' } });
        half.appendChild(sp);
        tile.appendChild(half);
        return { half, sp };
      };
      const topS = mk('t', true), botS = mk('b', false), topF = mk('tf', true), botF = mk('bf', false);
      const line = h('div', { class: 'abs', style: { left: 0, top: th / 2 - 1 + 'px', width: tw + 'px', height: '2px', background: 'rgba(0,0,0,.6)' } });
      tile.appendChild(line);
      wrap.appendChild(tile);
      const r = rng(i * 13 + 5);
      const seq = [' '];
      const n = ch === ' ' ? 0 : 5 + Math.floor(r() * 6);
      for (let k = 0; k < n; k++) seq.push(ALPH[Math.floor(r() * ALPH.length)]);
      seq.push(ch);
      tiles.push({ topS, botS, topF, botF, seq, i });
    });
    parent.appendChild(wrap);
    return {
      wrap,
      update(t, t0) {
        const STEP = 0.075;
        for (const tl of tiles) {
          const ts = t0 + tl.i * 0.035;
          const k = (t - ts) / STEP;
          const last = tl.seq.length - 1;
          const idx = clamp(Math.floor(k), 0, last);
          const u = k - Math.floor(k);
          const cur = tl.seq[idx];
          const nxt = tl.seq[Math.min(idx + 1, last)];
          const flipping = k >= 0 && idx < last;
          tl.topS.sp.textContent = flipping ? nxt : cur;
          tl.botS.sp.textContent = cur;
          if (flipping && u < 0.5) {
            tl.topF.half.style.display = '';
            tl.topF.sp.textContent = cur;
            tl.topF.half.style.transform = `rotateX(${(-180 * u).toFixed(1)}deg)`;
            tl.botF.half.style.display = 'none';
          } else if (flipping) {
            tl.topF.half.style.display = 'none';
            tl.botF.half.style.display = '';
            tl.botF.sp.textContent = nxt;
            tl.botF.half.style.transform = `rotateX(${(90 - 180 * (u - 0.5)).toFixed(1)}deg)`;
          } else {
            tl.topF.half.style.display = 'none';
            tl.botF.half.style.display = 'none';
          }
        }
      },
    };
  }

  SC.push({
    id: 's14', start: 55.1, end: 60.5, z: 19,
    build(el) {
      el.style.background = 'radial-gradient(ellipse at 50% 30%, #0f3487 0%, #061433 55%, #02061a 100%)';
      const dots = h('div', { class: 'abs', style: { left: '-100px', top: '-100px', width: '1300px', height: '2300px', backgroundImage: 'radial-gradient(rgba(140,200,255,.13) 2px, transparent 2.2px)', backgroundSize: '34px 34px' } });
      el.appendChild(dots);
      const glowO = h('div', { class: 'abs', style: { left: '-300px', top: '1100px', width: '1000px', height: '1000px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(243,129,0,.35), rgba(243,129,0,0) 65%)' } });
      const glowB = h('div', { class: 'abs', style: { left: '500px', top: '-200px', width: '1000px', height: '1000px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(26,95,214,.45), rgba(26,95,214,0) 65%)' } });
      el.append(glowO, glowB);
      const plane = h('div', { class: 'abs', html: ICON.plane('rgba(255,255,255,.12)'), style: { left: '0px', top: '0px', width: '420px', height: '420px' } });
      el.appendChild(plane);
      // board
      const boardBox = h('div', { class: 'abs', style: { left: '58px', top: '950px', width: '964px', height: '230px', borderRadius: '24px', background: '#0b0f1a', boxShadow: '0 30px 70px rgba(0,0,0,.6), inset 0 0 0 3px #232a3d' } });
      el.appendChild(boardBox);
      const hdr = h('div', { class: 'abs mont', style: { left: '30px', top: '16px', color: '#8cc8ff', fontWeight: 800, fontSize: '24px', letterSpacing: '6px' } }, 'DEPARTURES  •  EFH  •  RAK');
      boardBox.appendChild(hdr);
      const b1 = flapBoard(boardBox, 'INSCRIPTIONS', { x: 172, y: 62, tw: 46, th: 72, gap: 5, fs: 52 });
      const b2 = flapBoard(boardBox, 'OUVERTES', { x: 274, y: 142, tw: 46, th: 72, gap: 5, fs: 52 });
      S(b2.wrap, { top: '142px' });
      const dot = h('div', { class: 'abs', style: { left: '36px', top: '108px', width: '26px', height: '26px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 18px #22c55e' } });
      boardBox.appendChild(dot);
      // end card
      const logo = Img(el, 'logo_white.png', { left: '170px', top: '236px', width: '740px', height: '166px' });
      const rows = [
        { ic: 'phone', txt: '+212 777 77 13 14', col: '#22c55e' },
        { ic: 'phone', txt: '+212 777 77 17 12', col: '#22c55e' },
        { ic: 'globe', txt: 'www.flyhyani.ma', col: '#1a5fd6' },
        { ic: 'pin', txt: 'Bd Allal Al Fassi, Marrakech', col: '#f38100', small: true },
      ];
      const card = h('div', { class: 'glass', style: { left: '70px', top: '735px', width: '940px', height: '578px' } });
      el.appendChild(card);
      const rowEls = rows.map((r, i) => {
        const row = h('div', { class: 'abs', style: { left: '34px', top: 32 + i * 132 + 'px', width: '872px', height: '114px', borderRadius: '24px', background: 'rgba(3,10,31,.5)', display: 'flex', alignItems: 'center', gap: '28px', padding: '0 28px' } });
        const ic = h('div', { html: ICON[r.ic]('#fff'), style: { width: '76px', height: '76px', borderRadius: '50%', background: r.col, padding: '16px', flex: '0 0 auto' } });
        const tx = h('div', { class: 'mont', style: { color: '#fff', fontWeight: 800, fontSize: r.small ? '42px' : '58px', letterSpacing: r.small ? '0px' : '2px', whiteSpace: 'nowrap', direction: 'ltr', position: 'relative' } });
        const shown = h('span', {}, '');
        const ghost = h('span', { style: { opacity: 0 } }, r.txt);
        const caret = h('span', { style: { display: 'inline-block', width: '5px', height: '0.9em', background: '#ffb547', marginLeft: '4px', verticalAlign: '-0.08em' } });
        tx.append(shown, caret, ghost);
        row.append(ic, tx);
        card.appendChild(row);
        return { row, shown, ghost, caret, r };
      });
      const insta = h('div', { class: 'abs mont', style: { left: 0, top: '1338px', width: '1080px', textAlign: 'center', color: 'rgba(255,255,255,.92)', fontWeight: 700, fontSize: '36px', letterSpacing: '1px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '14px' } });
      insta.append(h('span', { html: ICON.insta('#fff'), style: { width: '44px', height: '44px', display: 'inline-block' } }), h('span', {}, '@flyhyani.aviation.school'));
      el.appendChild(insta);
      return (t) => {
        const t0 = 55.1;
        const T_CARD = 56.5;
        el.style.opacity = E.outCubic(clamp((t - t0) / 0.12)).toFixed(3);
        dots.style.transform = `translateY(${(-(t - t0) * 14).toFixed(1)}px)`;
        S(plane, { transform: `translate(${lerp(-500, 1200, clamp((t - t0) / 4.8)).toFixed(1)}px, ${lerp(1500, 200, clamp((t - t0) / 4.8)).toFixed(1)}px) rotate(45deg)` });
        // board: under the hero words first, then moves up below the logo
        const bIn = spring(t - (t0 + 0.08), { k: 200, c: 17 });
        const mv = E.inOutCubic(clamp((t - T_CARD + 0.15) / 0.5));
        S(boardBox, { opacity: t < t0 + 0.08 ? 0 : 1, transform: `translateY(${(lerp(500, 0, bIn) + lerp(0, -485, mv)).toFixed(1)}px) scale(${(lerp(0.8, 1, bIn) * lerp(1, 0.94, mv)).toFixed(3)})` });
        b1.update(t, Wt('التسجيل').s - 0.05);
        b2.update(t, Wt('مفتوح').s - 0.05);
        dot.style.opacity = (0.55 + 0.45 * Math.sin(t * 9)).toFixed(3);
        // logo + contacts
        const pl = spring(t - (T_CARD - 0.05), { k: 200, c: 17 });
        S(logo, { opacity: t < T_CARD - 0.05 ? 0 : 1, transform: `translateY(${lerp(-80, 0, pl).toFixed(1)}px) scale(${lerp(0.7, 1, pl).toFixed(3)})` });
        const pc = spring(t - (T_CARD + 0.1), { k: 180, c: 18 });
        S(card, { opacity: t < T_CARD + 0.1 ? 0 : 1, transform: `translateY(${lerp(260, 0, pc).toFixed(1)}px) scale(${lerp(0.9, 1, pc).toFixed(3)})` });
        rowEls.forEach((o, i) => {
          const ti = T_CARD + 0.25 + i * 0.28;
          const pr = spring(t - ti, { k: 260, c: 18 });
          S(o.row, { opacity: t < ti ? 0 : 1, transform: `translateX(${lerp(120, 0, pr).toFixed(1)}px)` });
          const n = Math.round(o.r.txt.length * clamp((t - ti - 0.05) / 0.42));
          o.shown.textContent = o.r.txt.slice(0, n);
          o.ghost.textContent = o.r.txt.slice(n);
          const typing = n < o.r.txt.length;
          o.caret.style.opacity = t < ti ? 0 : typing ? 1 : (Math.sin((t - ti) * 14) > 0 ? 0.9 : 0) * (t < ti + 1.4 ? 1 : 0);
        });
        const ti = T_CARD + 1.45;
        const pi = spring(t - ti, { k: 220, c: 18 });
        S(insta, { opacity: t < ti ? 0 : 1, transform: `translateY(${lerp(30, 0, pi).toFixed(1)}px)` });
        // final hit pulse on the logo
        const th = 59.33;
        const ph = Math.exp(-Math.max(0, t - th) * 5) * (t >= th ? 1 : 0);
        logo.style.filter = ph > 0.01 ? `drop-shadow(0 0 ${(30 * ph).toFixed(1)}px rgba(255,181,71,${(0.9 * ph).toFixed(2)}))` : '';
      };
    },
  });

  FX.flashes.push({ t: T_DROP, d: 0.35, a: 1, pre: 0.08 }, { t: 49.05, d: 0.2, a: 0.4 }, { t: 51.58, d: 0.18, a: 0.35 }, { t: 55.22, d: 0.3, a: 0.8 }, { t: 59.33, d: 0.4, a: 0.55 });
  FX.shakes.push({ t: T_DROP, d: 0.5, a: 20, z: 0.05 }, { t: 55.22, d: 0.4, a: 14 }, { t: 59.33, d: 0.35, a: 10 });
  FX.leaks.push({ t: 45.75, d: 1.5, x0: 100, y0: 200, x1: 900, y1: 500, a: 0.5 }, { t: 55.3, d: 2.0, x0: 950, y0: 1600, x1: 300, y1: 1200, a: 0.45 });
})();

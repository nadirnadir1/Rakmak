/* Scenes 1-5 : hook -> split-screen comparison -> "both Moroccan" -> the difference -> "it's real" */
(function () {
  const { h, S, T, clamp, lerp, P, E, env, inv, show, spring, noise1 } = M;
  const { ClipView, Img, FlagCircle, WavingFlag, Icon, ICON, WINGS, FX, IMG, SRC } = C;
  const SC = (window.SCENES = window.SCENES || []);
  const ease = E;

  // v7 (man + laptop) clip time, shared by S1 and the top half of S2
  const V7_T0 = 1.2;
  const v7ct = (t) => 2.6 + (t - V7_T0) * 0.92;

  const numBadge = (n, bg = '#fff', fg = '#061433') =>
    h('div', { class: 'abs mont', style: { width: '92px', height: '92px', borderRadius: '50%', background: bg, color: fg, fontWeight: 900, fontSize: '54px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(0,0,0,.45)', border: '5px solid rgba(255,255,255,.9)' } }, String(n));

  // ======================================================================= S1 hook (0 - 3.71)
  SC.push({
    id: 's1', start: 0, end: 3.71, z: 2,
    build(el) {
      const cv = ClipView(el, { w: 1080, h: 1920 });
      const shade = h('div', { class: 'full', style: { background: 'linear-gradient(180deg, rgba(3,10,31,.55) 0%, rgba(3,10,31,0) 28%, rgba(3,10,31,0) 55%, rgba(3,10,31,.6) 100%)' } });
      el.appendChild(shade);

      // visa appointment card
      const card = h('div', { class: 'card-white', style: { left: '120px', top: '540px', width: '840px', height: '560px', overflow: 'hidden', padding: '0' } });
      const head = h('div', { class: 'abs', style: { left: 0, top: 0, width: '840px', height: '118px', background: 'linear-gradient(90deg,#0b2a6b,#1a5fd6)' } });
      const hIcon = Icon('calendar', 58, '#fff', { left: '40px', top: '30px' });
      const hTitle = h('div', { class: 'abs mont', style: { left: '120px', top: '22px', color: '#fff', fontWeight: 800, fontSize: '42px', letterSpacing: '0.5px' } }, 'Rendez-vous VISA');
      const hSub = h('div', { class: 'abs mont', style: { left: '122px', top: '72px', color: 'rgba(255,255,255,.75)', fontWeight: 600, fontSize: '24px', letterSpacing: '3px' } }, 'PRISE DE RENDEZ-VOUS');
      head.append(hIcon, hTitle, hSub);
      card.appendChild(head);
      // month grid
      const grid = h('div', { class: 'abs', style: { left: '40px', top: '150px', width: '760px', height: '290px' } });
      const days = [];
      const dn = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
      dn.forEach((d, i) => grid.appendChild(h('div', { class: 'abs mont', style: { left: i * 108 + 'px', top: '0px', width: '100px', textAlign: 'center', fontWeight: 700, fontSize: '24px', color: '#8a96b3' } }, d)));
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 7; c++) {
          const n = r * 7 + c + 3;
          const cell = h('div', { class: 'abs mont', style: { left: c * 108 + 'px', top: 44 + r * 62 + 'px', width: '100px', height: '54px', borderRadius: '14px', background: '#eef2fa', color: '#24345c', fontWeight: 700, fontSize: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' } }, String(n));
          const x = h('div', { class: 'abs', html: ICON.cross('#ef4444'), style: { left: '28px', top: '8px', width: '44px', height: '38px', opacity: 0 } });
          cell.appendChild(x);
          grid.appendChild(cell);
          days.push({ cell, x, i: r * 7 + c });
        }
      }
      card.appendChild(grid);
      const status = h('div', { class: 'abs', style: { left: '40px', top: '470px', width: '760px', height: '64px', borderRadius: '16px', background: '#fff1f1', border: '2px solid #ffc9c9', display: 'flex', alignItems: 'center', gap: '16px', padding: '0 22px' } });
      const spin = h('div', { style: { width: '34px', height: '34px', borderRadius: '50%', border: '5px solid #ffd0d0', borderTopColor: '#ef4444', flex: '0 0 auto' } });
      const stTxt = h('div', { class: 'mont', style: { color: '#d32f2f', fontWeight: 800, fontSize: '28px', whiteSpace: 'nowrap' } }, 'Aucun créneau disponible');
      status.append(spin, stTxt);
      card.appendChild(status);
      el.appendChild(card);
      // destination chip
      const chip = h('div', { class: 'pill', style: { left: '600px', top: '478px', background: '#fff', color: '#061433', boxShadow: '0 16px 40px rgba(0,0,0,.4)', padding: '12px 26px 12px 14px', fontSize: '36px' } });
      const chipFlag = h('div', { style: { width: '62px', height: '62px', borderRadius: '50%', backgroundImage: `url(${C.flagURL('fr')})`, backgroundSize: 'cover', backgroundPosition: 'center', border: '3px solid #e5e9f2' } });
      chip.append(chipFlag, h('span', { html: ICON.plane('#003a9b'), style: { width: '34px', height: '34px', display: 'inline-block', transform: 'rotate(90deg)' } }), h('span', {}, 'PARIS'));
      el.appendChild(chip);
      const hook = h('div', { class: 'abs', style: { left: 0, top: '228px', width: '1080px', textAlign: 'center', direction: 'rtl' } });
      const hk1 = h('div', { class: 'lal', style: { display: 'inline-block', color: '#fff', fontSize: '100px', lineHeight: '1.15', WebkitTextStroke: '14px #030a1f', paintOrder: 'stroke fill', textShadow: '0 10px 30px rgba(0,0,0,.5)' } }, 'نفس الباسبور 🇲🇦');
      const hk2 = h('div', { class: 'lal', style: { display: 'inline-block', marginTop: '6px', color: '#fff', fontSize: '74px', lineHeight: '1.2', padding: '4px 30px 14px', borderRadius: '20px', background: 'linear-gradient(90deg,#f38100,#ffa53a)', boxShadow: '0 14px 34px rgba(243,129,0,.45)' } }, 'ولكن ماشي نفس الطريق!');
      hook.append(hk1, h('br'), hk2);
      el.appendChild(hook);

      return (t) => {
        // hook headline: fully readable on frame 0, light settle, then lifts away when the split screen starts
        const hp = E.outCubic(clamp(t / 0.35));
        const hx = P(t, 3.45, 0.22, E.inCubic);
        S(hook, { opacity: (1 - hx).toFixed(3), transform: `translateY(${(-30 * hx).toFixed(1)}px) scale(${(lerp(1.06, 1, hp)).toFixed(4)})` });
        S(hk2, { transform: `rotate(${lerp(-5, -2, hp).toFixed(2)}deg) scale(${lerp(0.9, 1, E.outBack(clamp((t - 0.05) / 0.35))).toFixed(3)})` });
        // footage
        if (t < V7_T0) {
          const z = lerp(1.28, 1.06, E.outCubic(clamp(t / 0.6))) + 0.03 * t;
          cv.set('v7', 0.55 + t * 0.95, { cx: 0.66, cy: 0.42, zoom: z });
        } else {
          const z = 1.04 + 0.025 * (t - V7_T0);
          cv.set('v7', v7ct(t), { cx: 0.42, cy: 0.45, zoom: z });
        }
        // card
        const tc = Wt('موعد').s - 0.12;
        const pc = spring(t - tc, { k: 260, c: 20 });
        const cardOut = P(t, 3.55, 0.16, E.inCubic);
        S(card, { opacity: t < tc ? 0 : (1 - cardOut).toFixed(3), transform: T({ y: lerp(260, 0, pc) - 60 * cardOut, s: lerp(0.85, 1, pc) * (1 - 0.15 * cardOut), rx: lerp(25, 0, pc), persp: 1400 }) });
        // days get crossed out sequentially
        const tx0 = Wt('الفيزا').s - 0.1;
        for (const d of days) {
          const td = tx0 + d.i * 0.028;
          const p = P(t, td, 0.12, E.outBack);
          d.x.style.opacity = t < td ? 0 : 1;
          d.x.style.transform = `scale(${p.toFixed(3)})`;
          d.cell.style.background = t >= td ? '#f5f6f9' : '#eef2fa';
          d.cell.style.color = t >= td ? '#b8c0d4' : '#24345c';
        }
        const ts = tx0 + 0.6;
        S(status, { opacity: P(t, ts, 0.15).toFixed(3), transform: `translateX(${lerp(40, 0, P(t, ts, 0.25, E.outBack))}px)` });
        spin.style.transform = `rotate(${(t * 540) % 360}deg)`;
        // header subtle shimmer
        // chip
        const tp = Wt('لباريس').s;
        const pp = spring(t - tp, { k: 300, c: 16 });
        S(chip, { opacity: t < tp ? 0 : (1 - cardOut).toFixed(3), transform: T({ s: lerp(0.2, 1, pp), r: lerp(-14, -3, pp), y: -40 * cardOut }) });
      };
    },
  });

  // ======================================================================= S2 split screen (3.71 - 9.08)
  SC.push({
    id: 's2', start: 3.71, end: 9.12, z: 3,
    build(el) {
      el.style.background = '#030a1f';
      const top = ClipView(el, { w: 1080, h: 1920 });
      const bot = ClipView(el, { w: 1080, h: 950, y: 970 });
      const topShade = h('div', { class: 'abs', style: { left: 0, top: 0, width: '1080px', height: '950px', background: 'linear-gradient(180deg, rgba(3,10,31,.45), rgba(3,10,31,0) 30%, rgba(3,10,31,0) 70%, rgba(3,10,31,.55))' } });
      const botShade = h('div', { class: 'abs', style: { left: 0, top: '970px', width: '1080px', height: '950px', background: 'linear-gradient(180deg, rgba(3,10,31,.55), rgba(3,10,31,0) 30%, rgba(3,10,31,0) 70%, rgba(3,10,31,.5))' } });
      el.append(topShade, botShade);
      const seam = h('div', { class: 'abs', style: { left: 0, top: '950px', width: '1080px', height: '20px', background: 'linear-gradient(90deg, #f38100, #ffb547 50%, #f38100)', boxShadow: '0 0 40px rgba(243,129,0,.85)' } });
      el.appendChild(seam);
      const b1 = numBadge(1);
      const b2 = numBadge(2, '#f38100', '#fff');
      S(b1, { left: '52px', top: '250px' });
      S(b2, { left: '52px', top: '1010px' });
      el.append(b1, b2);
      // status for person 1
      const st1 = h('div', { class: 'pill', style: { left: '160px', top: '262px', background: 'rgba(239,68,68,.95)', fontSize: '30px', padding: '12px 24px' } });
      st1.append(h('span', { html: ICON.clock('#fff'), style: { width: '38px', height: '38px', display: 'inline-block' } }), h('span', {}, 'RDV VISA ?'));
      el.appendChild(st1);
      // tag for person 2: TOURIST VISA (crossed) -> CREW
      const tag = h('div', { class: 'abs', style: { left: '150px', top: '1150px', width: '520px', height: '150px', transformStyle: 'preserve-3d' } });
      const tagA = h('div', { class: 'abs mont', style: { inset: 0, border: '7px solid #ef4444', borderRadius: '22px', color: '#ef4444', background: 'rgba(255,255,255,.92)', fontWeight: 900, fontSize: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '18px', backfaceVisibility: 'hidden', letterSpacing: '1px' } });
      const strike = h('div', { class: 'abs', style: { left: '30px', top: '68px', height: '10px', width: '460px', background: '#ef4444', borderRadius: '6px', transformOrigin: '0 50%' } });
      tagA.append(h('span', {}, 'TOURIST VISA'), strike);
      const tagB = h('div', { class: 'abs mont', style: { inset: 0, border: '7px solid #22c55e', borderRadius: '22px', color: '#fff', background: 'linear-gradient(135deg,#16a34a,#22c55e)', fontWeight: 900, fontSize: '58px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '18px', backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', letterSpacing: '2px' } });
      tagB.append(h('span', { html: ICON.plane('#fff'), style: { width: '64px', height: '64px', display: 'inline-block', transform: 'rotate(45deg)' } }), h('span', {}, 'CREW'), h('span', { html: ICON.check('#fff'), style: { width: '64px', height: '64px', display: 'inline-block' } }));
      tag.append(tagA, tagB);
      el.appendChild(tag);

      return (t) => {
        const t0 = 3.71;
        const sp = E.inOutCubic(clamp((t - t0) / 0.42));
        // top panel squeezes from full frame to the top half
        const th = lerp(1920, 950, sp);
        top.size(1080, th);
        top.set('v7', v7ct(t), { cx: 0.43, cy: lerp(0.45, 0.42, sp), zoom: lerp(1.04 + 0.025 * (t - V7_T0), 1.0, sp) });
        topShade.style.opacity = sp;
        // bottom panel slides up
        const by = lerp(1920, 970, E.outCubic(clamp((t - t0 - 0.05) / 0.45)));
        S(bot.el, { top: by + 'px' });
        S(botShade, { top: by + 'px' });
        S(seam, { top: by - 20 + 'px', opacity: sp, transform: `scaleX(${E.outCubic(clamp((t - t0 - 0.2) / 0.4)).toFixed(3)})` });
        // bottom footage: crew walking -> passport control
        const tSwitch = Wt('غير').s - 0.05;
        if (t < tSwitch) {
          bot.set('v5', 3.55 + (t - t0) * 0.95, { cx: 0.46, cy: 0.42, zoom: 1.02 + 0.02 * (t - t0) });
        } else {
          bot.set('v3', 7.6 + (t - tSwitch) * 1.0, { cx: 0.42, cy: 0.5, zoom: 1.0 + 0.02 * (t - tSwitch) });
        }
        // switch transition: quick white blink in the bottom panel
        const blink = 1 - clamp(Math.abs(t - tSwitch) / 0.06);
        bot.el.style.filter = blink > 0 ? `brightness(${1 + blink * 1.5})` : '';
        // badges
        const pb1 = spring(t - (t0 + 0.35), { k: 300, c: 16 });
        S(b1, { opacity: t < t0 + 0.35 ? 0 : 1, transform: `scale(${pb1.toFixed(3)})` });
        const pb2 = spring(t - (t0 + 0.5), { k: 300, c: 16 });
        S(b2, { opacity: t < t0 + 0.5 ? 0 : 1, transform: `scale(${pb2.toFixed(3)})` });
        const ps1 = spring(t - (t0 + 0.55), { k: 260, c: 18 });
        S(st1, { opacity: t < t0 + 0.55 ? 0 : 1, transform: `translateX(${lerp(-60, 0, ps1)}px) scale(${lerp(0.6, 1, ps1)})` });
        // tag
        const ta = Wt('بلا').s - 0.05;
        const pa = spring(t - ta, { k: 280, c: 15 });
        const tFlip = Wt('خدام').s;
        const fl = E.inOutCubic(clamp((t - tFlip) / 0.38));
        const pop = 1 + 0.12 * Math.sin(Math.PI * fl);
        S(tag, { opacity: t < ta ? 0 : 1, transform: `perspective(1200px) translateY(${lerp(-80, 0, pa)}px) scale(${(lerp(1.8, 1, pa) * pop).toFixed(3)}) rotate(${lerp(-12, -4, pa)}deg) rotateY(${(fl * 180).toFixed(2)}deg)` });
        const tStrike = Wt('سياحية').s;
        strike.style.transform = `rotate(-8deg) scaleX(${E.outCubic(clamp((t - tStrike) / 0.25)).toFixed(3)})`;
        // exit (panels separate) handled by S3 overlap
        const xo = P(t, 9.02, 0.1, E.inCubic);
        el.style.opacity = (1 - xo).toFixed(3);
      };
    },
  });

  // ======================================================================= S3 both Moroccan (9.08 - 11.94)
  function passport(n) {
    // the client's own passport artwork
    const w = 330, hh = 469;
    const el = h('div', { class: 'abs', style: { width: w + 'px', height: hh + 'px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 30px 70px rgba(0,0,0,.55)' } });
    el.innerHTML = `
      <img src="${SRC}passport_morocco.png" style="position:absolute;left:0;top:0;width:${w}px;height:${hh}px">
      <div class="sheen" style="position:absolute;left:-200px;top:-50px;width:160px;height:600px;background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.24),rgba(255,255,255,0));transform:rotate(18deg)"></div>`;
    const badge = numBadge(n, n === 1 ? '#fff' : '#f38100', n === 1 ? '#061433' : '#fff');
    S(badge, { left: '-34px', top: '-34px' });
    const wrap = h('div', { class: 'abs', style: { width: w + 'px', height: hh + 'px' } });
    S(el, { left: 0, top: 0 });
    wrap.append(el, badge);
    return wrap;
  }

  SC.push({
    id: 's3', start: 9.0, end: 12.0, z: 4,
    build(el) {
      el.style.background = 'radial-gradient(ellipse at 50% 40%, #12306e 0%, #061433 55%, #030a1f 100%)';
      const flag = WavingFlag(el, 'ma', { w: 1240, h: 826, x: -80, y: 280 });
      S(flag.el, { opacity: 0.0 });
      const dim = h('div', { class: 'full', style: { background: 'radial-gradient(ellipse at 50% 45%, rgba(3,10,31,.15) 0%, rgba(3,10,31,.75) 75%)' } });
      el.appendChild(dim);
      const p1 = passport(1), p2 = passport(2);
      el.append(p1, p2);
      const eq = h('div', { class: 'abs mont', style: { left: '470px', top: '580px', width: '140px', height: '140px', borderRadius: '50%', background: 'linear-gradient(135deg,#ffa53a,#f38100)', border: '7px solid #fff', boxShadow: '0 14px 40px rgba(0,0,0,.55)', textAlign: 'center', color: '#fff', fontWeight: 900, fontSize: '110px', lineHeight: '118px' } }, '=');
      el.appendChild(eq);
      const q = h('div', { class: 'abs mont', style: { left: '440px', top: '520px', width: '200px', textAlign: 'center', color: '#ffb547', fontWeight: 900, fontSize: '170px', lineHeight: '1', textShadow: '0 10px 40px rgba(0,0,0,.5)' } }, '?');
      el.appendChild(q);
      return (t) => {
        const t0 = 9.0;
        // passports fly in from the top and bottom (where the split panels were)
        const a = spring(t - t0, { k: 160, c: 17 });
        const b = spring(t - t0 - 0.08, { k: 160, c: 17 });
        const tm = Wt('بجوجهم').s;
        const merge = E.inOutCubic(clamp((t - tm) / 0.45));
        const x1 = lerp(140, 165, merge), x2 = lerp(610, 585, merge);
        S(p1, { left: x1 + 'px', top: '420px', transform: T({ y: lerp(-1100, 0, a), r: lerp(-30, -6, a) + 4 * merge, s: 1 + 0.03 * Math.sin(t * 2) }) });
        S(p2, { left: x2 + 'px', top: '420px', transform: T({ y: lerp(1300, 0, b), r: lerp(30, 6, b) - 4 * merge, s: 1 + 0.03 * Math.sin(t * 2 + 1) }) });
        for (const p of [p1, p2]) {
          const sh = p.querySelector('.sheen');
          sh.style.left = lerp(-260, 420, clamp((t - tm - 0.1) / 0.7)) + 'px';
        }
        // question mark on "يفاجئك", then "=" on "بجوجهم"
        const tq = Wt('يفاجئك').s;
        const pq = spring(t - tq, { k: 300, c: 14 });
        S(q, { opacity: t < tq ? 0 : (1 - merge).toFixed(3), transform: T({ s: lerp(0.2, 1, pq), r: 6 * Math.sin(t * 9) }) });
        const pe = spring(t - tm - 0.12, { k: 300, c: 15 });
        S(eq, { opacity: t < tm + 0.12 ? 0 : 1, transform: T({ s: lerp(0.2, 1, pe) }) });
        // flag waves in behind
        const fo = E.outCubic(clamp((t - tm + 0.05) / 0.5));
        flag.el.style.opacity = (0.95 * fo).toFixed(3);
        flag.el.style.transform = T({ s: lerp(1.15, 1, fo), y: 10 });
        flag.draw(t, 1);
        dim.style.opacity = lerp(1, 0.65, fo).toFixed(3);
        // exit: everything pushes back when "الفرق؟" hits
        const xo = P(t, 11.9, 0.1, E.inCubic);
        el.style.opacity = (1 - xo).toFixed(3);
      };
    },
  });

  // ======================================================================= S4 "الفرق؟" + steward reveal (11.94 - 15.0)
  SC.push({
    id: 's4', start: 11.92, end: 15.02, z: 5,
    build(el) {
      el.style.background = '#030a1f';
      const bg = ClipView(el, { w: 1080, h: 1920 });
      const tint = h('div', { class: 'full', style: { background: 'linear-gradient(180deg, rgba(6,20,51,.55), rgba(0,58,155,.35) 50%, rgba(3,10,31,.85))' } });
      el.appendChild(tint);
      const spot = h('div', { class: 'full', style: { background: 'radial-gradient(circle at 50% 46%, rgba(26,95,214,.35) 0%, rgba(3,10,31,0) 45%)' } });
      el.appendChild(spot);
      // rays
      const rays = h('div', { class: 'abs', style: { left: '-460px', top: '-300px', width: '2000px', height: '2000px', background: 'repeating-conic-gradient(from 0deg at 50% 50%, rgba(255,181,71,.16) 0deg 6deg, rgba(255,181,71,0) 6deg 18deg)', borderRadius: '50%', maskImage: 'radial-gradient(circle, #000 0%, rgba(0,0,0,.6) 30%, transparent 62%)', WebkitMaskImage: 'radial-gradient(circle, #000 0%, rgba(0,0,0,.6) 30%, transparent 62%)' } });
      el.appendChild(rays);
      const glow = h('div', { class: 'abs', style: { left: '90px', top: '420px', width: '900px', height: '900px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(243,129,0,.55) 0%, rgba(243,129,0,.18) 40%, rgba(243,129,0,0) 70%)' } });
      el.appendChild(glow);
      const man = Img(el, SRC + 'crew_male.png', { left: '40px', top: '560px', width: '1000px', height: '1000px' });
      const fadeBottom = h('div', { class: 'abs', style: { left: 0, top: '1380px', width: '1080px', height: '540px', background: 'linear-gradient(180deg, rgba(3,10,31,0), #030a1f 70%)' } });
      el.appendChild(fadeBottom);
      const wings = h('div', { class: 'abs', html: WINGS('#f5c86b'), style: { left: '300px', top: '300px', width: '480px', height: '140px', filter: 'drop-shadow(0 6px 18px rgba(0,0,0,.5))' } });
      el.appendChild(wings);
      const pill = h('div', { class: 'pill', style: { left: '50%', top: '450px', background: 'linear-gradient(90deg,#f38100,#ffa53a)', fontSize: '44px', padding: '16px 38px', letterSpacing: '4px', boxShadow: '0 18px 50px rgba(243,129,0,.45)' } });
      pill.append(h('span', { html: ICON.plane('#fff'), style: { width: '48px', height: '48px', display: 'inline-block', transform: 'rotate(45deg)' } }), h('span', {}, 'STEWARD'));
      el.appendChild(pill);
      return (t) => {
        const tR = 12.81; // reveal on the music downbeat
        const rev = t >= tR;
        // background: dark during the question, cabin after the reveal
        if (rev) {
          bg.set('v1', 4.2 + (t - tR) * 0.6, { cx: 0.5, cy: 0.45, zoom: 1.15 - 0.03 * (t - tR) });
          bg.el.style.filter = 'blur(7px) saturate(.9) brightness(.75)';
          bg.el.style.opacity = E.outCubic(clamp((t - tR) / 0.25)).toFixed(3);
        } else {
          bg.el.style.opacity = 0;
        }
        tint.style.opacity = rev ? 1 : 0;
        spot.style.opacity = rev ? 0.6 : (0.5 + 0.5 * Math.sin(t * 18) * 0.1).toFixed(3);
        rays.style.opacity = rev ? (0.9 * E.outCubic(clamp((t - tR) / 0.4))).toFixed(3) : 0;
        rays.style.transform = `rotate(${(t * 12).toFixed(2)}deg)`;
        const pm = spring(t - tR, { k: 120, c: 15 });
        S(man, { opacity: rev ? 1 : 0, transform: T({ y: lerp(700, 0, pm), s: lerp(0.92, 1, pm) + 0.012 * (t - tR) }) });
        glow.style.opacity = rev ? (0.9 * pm).toFixed(3) : 0;
        glow.style.transform = `scale(${(1 + 0.04 * Math.sin(t * 5)).toFixed(3)})`;
        const tw = Wt('مضيف').s - 0.05;
        const pw = spring(t - tw, { k: 260, c: 17 });
        S(wings, { opacity: t < tw ? 0 : 1, transform: T({ s: lerp(0.3, 1, pw), y: lerp(40, 0, pw) }) });
        const pp = spring(t - tw - 0.08, { k: 260, c: 17 });
        S(pill, { opacity: t < tw + 0.08 ? 0 : 1, transform: `translateX(-50%) scale(${lerp(0.3, 1, pp).toFixed(3)})` });
        const xo = P(t, 14.92, 0.1, E.inCubic);
        el.style.opacity = (1 - xo).toFixed(3);
      };
    },
  });

  // ======================================================================= S5 "وهادشي فعلا كاين" stamp (14.96 - 16.8)
  SC.push({
    id: 's5', start: 14.94, end: 16.84, z: 6,
    build(el) {
      const cv = ClipView(el, { w: 1080, h: 1920 });
      const sh = h('div', { class: 'full', style: { background: 'linear-gradient(180deg, rgba(3,10,31,.35), rgba(3,10,31,0) 30%, rgba(3,10,31,0) 60%, rgba(3,10,31,.55))' } });
      el.appendChild(sh);
      const stamp = h('div', { class: 'abs mont', style: { left: '220px', top: '560px', width: '640px', height: '300px', border: '14px solid #22c55e', borderRadius: '40px', color: '#22c55e', fontWeight: 900, fontSize: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', letterSpacing: '8px', background: 'rgba(255,255,255,.12)', mixBlendMode: 'normal', textShadow: '0 4px 0 rgba(0,0,0,.15)' } });
      stamp.append(h('span', { html: ICON.check('#22c55e'), style: { width: '150px', height: '150px', display: 'inline-block' } }), h('span', {}, 'VRAI'));
      // rough ink edge via mask
      const inkMask = `radial-gradient(circle at 20% 30%, transparent 0 6px, #000 7px), radial-gradient(circle at 70% 80%, transparent 0 5px, #000 6px)`;
      el.appendChild(stamp);
      return (t) => {
        const t0 = 14.96;
        cv.set('v6slow', Math.min(6.7, 6.1 + (t - t0) * 0.5), { cx: 0.5, cy: 0.56, zoom: 1.05 + 0.06 * (t - t0) });
        const ts = Wt('فعلا').s;
        const p = clamp((t - ts) / 0.16);
        const sc = t < ts ? 0 : lerp(2.4, 1, E.inQuad(p)) * (p >= 1 ? 1 + 0.06 * Math.exp(-(t - ts - 0.16) * 14) * Math.cos((t - ts) * 50) : 1);
        S(stamp, { opacity: t < ts ? 0 : clamp(p * 3).toFixed(3), transform: T({ s: sc, r: -12 }) });
        const xo = P(t, 16.72, 0.12, E.inCubic);
        el.style.opacity = (1 - xo).toFixed(3);
      };
    },
  });

  // global FX for this section
  FX.flashes.push({ t: 1.2, d: 0.18, a: 0.55 }, { t: 12.07, d: 0.12, a: 0.25 }, { t: 12.81, d: 0.35, a: 0.9 }, { t: 15.7, d: 0.14, a: 0.35 });
  FX.shakes.push({ t: 12.07, d: 0.45, a: 22, z: 0.04 }, { t: 12.81, d: 0.4, a: 14 }, { t: 15.68, d: 0.35, a: 18 });
  FX.leaks.push({ t: 12.7, d: 1.4, x0: 100, y0: 300, x1: 900, y1: 600, a: 0.55 });
})();

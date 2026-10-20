/* Scenes 6-10 : destinations map -> crew exemptions -> documents -> hidden perks -> travel postcards
   -> service vs tourism -> USA crew visa */
(function () {
  const { h, S, T, clamp, lerp, P, E, env, inv, show, spring, noise1, rng } = M;
  const { ClipView, Img, FlagCircle, WavingFlag, Icon, ICON, WINGS, FX, IMG, SRC, flagURL } = C;
  const SC = (window.SCENES = window.SCENES || []);

  const svgEl = (w, hh, inner, style = {}) => {
    const d = h('div', { class: 'abs', style: { width: w + 'px', height: hh + 'px', ...style } });
    d.innerHTML = inner;
    return d;
  };

  // ======================================================================= S6 map (16.75 - 20.0)
  SC.push({
    id: 's6', start: 16.72, end: 20.05, z: 7,
    build(el) {
      el.style.background = 'radial-gradient(ellipse at 50% 40%, #0d2a66 0%, #061433 60%, #030a1f 100%)';
      const cam = h('div', { class: 'abs', style: { left: 0, top: 0, width: MAP.W + 'px', height: MAP.H + 'px', transformOrigin: '0 0' } });
      el.appendChild(cam);
      // dotted ocean grid
      const grid = h('div', { class: 'abs', style: { left: '-600px', top: '-600px', width: '2400px', height: '3200px', backgroundImage: 'radial-gradient(rgba(140,200,255,.18) 1.6px, transparent 1.8px)', backgroundSize: '28px 28px' } });
      cam.appendChild(grid);
      const ns = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('width', MAP.W);
      svg.setAttribute('height', MAP.H);
      svg.setAttribute('viewBox', `0 0 ${MAP.W} ${MAP.H}`);
      svg.style.position = 'absolute';
      svg.style.overflow = 'visible';
      const cities = MAP.cities;
      const arcs = [
        { to: 'Paris', k: 'France', flag: 'fr', word: 'فرنسا', lbl: 'PARIS', bend: -0.28 },
        { to: 'Madrid', k: 'Spain', flag: 'es', word: 'إسبانيا', lbl: 'MADRID', bend: 0.32 },
        { to: 'London', k: 'United Kingdom', flag: 'uk', word: 'وبريطانيا', lbl: 'LONDON', bend: -0.22 },
      ];
      const [mx, my] = cities.Marrakech;
      const arcPath = (a) => {
        const [x2, y2] = cities[a.to];
        const dx = x2 - mx, dy = y2 - my;
        const cx = (mx + x2) / 2 - dy * a.bend, cy = (my + y2) / 2 + dx * a.bend;
        return `M${mx},${my} Q${cx},${cy} ${x2},${y2}`;
      };
      let inner = `<defs>
        <linearGradient id="maG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e0393f"/><stop offset="1" stop-color="#a51d24"/></linearGradient>
        <filter id="landShadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000814" flood-opacity=".7"/></filter>
      </defs>
      <g filter="url(#landShadow)">
        <path d="${MAP.land}" fill="#0f2654" stroke="#1d3c7a" stroke-width="1.2"/>`;
      for (const [k, d] of Object.entries(MAP.countries)) {
        if (k === 'Morocco') continue;
        inner += `<path class="c-${k.replace(/\s/g, '_')}" d="${d}" fill="#132d63" stroke="#2b4f96" stroke-width="1.3"/>`;
      }
      inner += `<path d="${MAP.countries.Morocco}" fill="url(#maG)" stroke="#ff8a8f" stroke-width="2"/></g>`;
      for (const a of arcs) inner += `<path class="arc arc-${a.to}" d="${arcPath(a)}" fill="none" stroke="#ffb547" stroke-width="5" stroke-linecap="round" stroke-dasharray="14 12"/>`;
      svg.innerHTML = inner;
      cam.appendChild(svg);
      const countryEls = {};
      for (const a of arcs) countryEls[a.k] = svg.querySelector('.c-' + a.k.replace(/\s/g, '_'));
      const arcEls = arcs.map((a) => {
        const p = svg.querySelector('.arc-' + a.to);
        return { p, len: p.getTotalLength() };
      });
      // Marrakech pin
      const pin = h('div', { class: 'abs', style: { left: mx - 26 + 'px', top: my - 26 + 'px', width: '52px', height: '52px', borderRadius: '50%', background: '#ffb547', boxShadow: '0 0 0 8px rgba(255,181,71,.35), 0 0 40px rgba(255,181,71,.9)' } });
      const ring = h('div', { class: 'abs', style: { left: mx - 26 + 'px', top: my - 26 + 'px', width: '52px', height: '52px', borderRadius: '50%', border: '5px solid #ffb547' } });
      const mLbl = h('div', { class: 'abs mont', style: { left: mx + 'px', top: my + 'px', color: '#fff', fontWeight: 900, fontSize: '40px', letterSpacing: '3px', textShadow: '0 4px 14px rgba(0,0,0,.8)', transformOrigin: '0 0', whiteSpace: 'nowrap' } }, 'MARRAKECH');
      cam.append(ring, pin, mLbl);
      // planes + destination flags
      const planes = arcs.map(() => {
        const p = h('div', { class: 'abs', html: ICON.plane('#fff'), style: { width: '64px', height: '64px', left: '-32px', top: '-32px', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,.6))' } });
        cam.appendChild(p);
        return p;
      });
      const OFFS = { Paris: [92, 10], Madrid: [-6, -96], London: [-96, -84] };
      const dests = arcs.map((a) => {
        const [x0, y0] = cities[a.to];
        const [ox, oy] = OFFS[a.to];
        const x = x0 + ox, y = y0 + oy;
        const dotc = h('div', { class: 'abs', style: { left: x0 - 12 + 'px', top: y0 - 12 + 'px', width: '24px', height: '24px', borderRadius: '50%', background: '#fff', boxShadow: '0 0 0 6px rgba(255,255,255,.3), 0 0 20px rgba(255,255,255,.8)' } });
        cam.appendChild(dotc);
        const g = h('div', { class: 'abs', style: { left: x - 70 + 'px', top: y - 70 + 'px', width: '140px', height: '140px' } });
        g._dot = dotc;
        const f = FlagCircle(g, a.flag, 140, { left: 0, top: 0, border: '7px solid #fff' });
        const l = h('div', { class: 'abs mont', style: { left: '50%', top: '150px', transform: 'translateX(-50%)', color: '#fff', fontWeight: 900, fontSize: '42px', letterSpacing: '4px', textShadow: '0 4px 14px rgba(0,0,0,.85)', whiteSpace: 'nowrap' } }, a.lbl);
        g.appendChild(l);
        cam.appendChild(g);
        return { g, x, y };
      });
      const camA = { s: 1.9, tx: 540 - mx * 1.9, ty: 900 - my * 1.9 };
      const camB = { s: 0.88, tx: 540 - 581 * 0.88, ty: 330 - 468 * 0.88 };

      return (t) => {
        const t0 = 16.72;
        const cz = E.inOutCubic(clamp((t - 17.0) / 1.1));
        const drift = 0.012 * Math.max(0, t - 18.1);
        const s = lerp(camA.s, camB.s, cz) * (1 + drift);
        const tx = lerp(camA.tx, camB.tx, cz) - 540 * drift * 0.88;
        const ty = lerp(camA.ty, camB.ty, cz) - 700 * drift * 0.88;
        const intro = E.outCubic(clamp((t - t0) / 0.35));
        cam.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${(s * lerp(1.25, 1, intro)).toFixed(4)})`;
        el.style.opacity = intro.toFixed(3);
        // pin pulse
        const pr = ((t - t0) % 1.1) / 1.1;
        S(ring, { transform: `scale(${(1 + pr * 2.4).toFixed(3)})`, opacity: (1 - pr).toFixed(3) });
        mLbl.style.opacity = (1 - cz * 0.15).toFixed(3);
        mLbl.style.transform = `translate(${(-330 / s).toFixed(1)}px, ${(-95 / s).toFixed(1)}px) scale(${(1 / s).toFixed(4)})`;
        // arcs
        arcs.forEach((a, i) => {
          const ta = Wt(a.word).s - 0.18;
          const p = E.inOutCubic(clamp((t - ta) / 0.62));
          const ae = arcEls[i];
          ae.p.style.strokeDasharray = `14 12`;
          // reveal with a mask-like dash trick: use dashoffset on a solid copy would be simpler; emulate via clip on length
          ae.p.setAttribute('stroke-dasharray', `${(ae.len * p).toFixed(1)} ${ae.len}`);
          ae.p.style.opacity = t < ta ? 0 : 1;
          const pt = ae.p.getPointAtLength(ae.len * p);
          const pt2 = ae.p.getPointAtLength(Math.min(ae.len, ae.len * p + 2));
          const ang = (Math.atan2(pt2.y - pt.y, pt2.x - pt.x) * 180) / Math.PI + 90;
          const pl = planes[i];
          pl.style.opacity = t < ta || p >= 1 ? 0 : 1;
          pl.style.transform = `translate(${pt.x.toFixed(1)}px, ${pt.y.toFixed(1)}px) rotate(${ang.toFixed(1)}deg) scale(${(1 / s).toFixed(3)})`;
          // destination flag + country highlight
          const td = ta + 0.55;
          const pd = spring(t - td, { k: 300, c: 15 });
          const d = dests[i];
          S(d.g, { opacity: t < td ? 0 : 1, transform: `scale(${(lerp(0.2, 1, pd) / Math.max(0.9, s)).toFixed(3)})` });
          S(d.g._dot, { opacity: t < td - 0.1 ? 0 : 1, transform: `scale(${(1 / s).toFixed(3)})` });
          const ce = countryEls[a.k];
          if (ce) {
            const hp = clamp((t - td + 0.1) / 0.3);
            ce.setAttribute('fill', hp > 0 ? `rgb(${Math.round(lerp(19, 26, hp))},${Math.round(lerp(45, 95, hp))},${Math.round(lerp(99, 214, hp))})` : '#132d63');
          }
        });
        // exit zoom
        const xo = P(t, 19.85, 0.2, E.inCubic);
        if (xo > 0) el.style.opacity = (1 - xo).toFixed(3);
      };
    },
  });

  // ======================================================================= S6b crew + exemptions (19.9 - 24.45)
  function crewBadge() {
    const card = h('div', { class: 'abs', style: { width: '330px', height: '450px', borderRadius: '26px', background: '#fff', boxShadow: '0 30px 60px rgba(0,0,0,.5)', overflow: 'hidden' } });
    card.innerHTML = `
      <div style="position:absolute;left:0;top:0;width:100%;height:110px;background:linear-gradient(90deg,#003a9b,#1a5fd6)"></div>
      <div class="mont" style="position:absolute;left:0;top:26px;width:100%;text-align:center;color:#fff;font-weight:900;font-size:46px;letter-spacing:8px">CREW</div>
      <div style="position:absolute;left:115px;top:140px;width:100px;height:120px;border-radius:16px;background:#dfe7f5;overflow:hidden">
        <div style="position:absolute;left:28px;top:18px;width:44px;height:44px;border-radius:50%;background:#9fb3d6"></div>
        <div style="position:absolute;left:12px;top:70px;width:76px;height:70px;border-radius:38px 38px 0 0;background:#9fb3d6"></div>
      </div>
      <div class="mont" style="position:absolute;left:0;top:282px;width:100%;text-align:center;color:#061433;font-weight:800;font-size:26px;letter-spacing:3px">CABIN CREW</div>
      <div style="position:absolute;left:60px;top:328px;width:210px;height:10px;border-radius:5px;background:#e3e9f4"></div>
      <div style="position:absolute;left:90px;top:350px;width:150px;height:10px;border-radius:5px;background:#e3e9f4"></div>
      <div style="position:absolute;left:55px;top:385px;width:220px;height:40px;background:repeating-linear-gradient(90deg,#061433 0 3px,transparent 3px 6px,#061433 6px 7px,transparent 7px 11px)"></div>`;
    const strap = h('div', { class: 'abs', style: { left: '135px', top: '-420px', width: '60px', height: '440px', background: 'linear-gradient(90deg,#f38100,#ffa53a,#f38100)', borderRadius: '6px' } });
    const clip = h('div', { class: 'abs', style: { left: '140px', top: '-14px', width: '50px', height: '34px', borderRadius: '8px', background: '#c9d2e3' } });
    const wrap = h('div', { class: 'abs', style: { width: '330px', height: '450px', transformOrigin: '165px -420px' } });
    wrap.append(strap, clip, card);
    return wrap;
  }

  function seal() {
    // every glyph stays inside the blue disc: top text sits outside a r=100 arc (up to ~128),
    // bottom text hangs inward from a r=114 arc (down to ~88); dashed ring at r=136
    const d = svgEl(340, 340, `<svg viewBox="0 0 340 340" width="340" height="340">
      <defs><path id="sTop" d="M70,170 A100,100 0 0 1 270,170"/><path id="sBot" d="M56,170 A114,114 0 0 0 284,170"/>
      <radialGradient id="sg" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#2a74ff"/><stop offset="1" stop-color="#003a9b"/></radialGradient></defs>
      <circle cx="170" cy="170" r="160" fill="#f5c86b"/>
      <circle cx="170" cy="170" r="148" fill="url(#sg)"/>
      <circle cx="170" cy="170" r="136" fill="none" stroke="#f5c86b" stroke-width="3" stroke-dasharray="6 6"/>
      <text font-family="Montserrat" font-weight="900" font-size="28" fill="#fff" letter-spacing="3"><textPath href="#sTop" startOffset="50%" text-anchor="middle">EXEMPTION</textPath></text>
      <text font-family="Montserrat" font-weight="900" font-size="27" fill="#f5c86b" letter-spacing="4"><textPath href="#sBot" startOffset="50%" text-anchor="middle">ON DUTY</textPath></text>
      <circle cx="104" cy="170" r="5" fill="#f5c86b"/><circle cx="236" cy="170" r="5" fill="#f5c86b"/>
      <g transform="translate(134,134) scale(3)">${ICON.plane('#fff').replace('<svg viewBox="0 0 24 24">', '').replace('</svg>', '')}</g>
    </svg>`, { filter: 'drop-shadow(0 18px 40px rgba(0,0,0,.55))' });
    return d;
  }

  SC.push({
    id: 's6b', start: 19.85, end: 24.5, z: 8,
    build(el) {
      const cv = ClipView(el, { w: 1080, h: 1920 });
      const sh = h('div', { class: 'full', style: { background: 'linear-gradient(180deg, rgba(3,10,31,.55) 0%, rgba(3,10,31,0) 32%, rgba(3,10,31,0) 58%, rgba(3,10,31,.7) 100%)' } });
      el.appendChild(sh);
      const badge = crewBadge();
      S(badge, { left: '70px', top: '300px' });
      el.appendChild(badge);
      const sl = seal();
      S(sl, { left: '640px', top: '270px' });
      el.appendChild(sl);
      return (t) => {
        const t0 = 19.85;
        const tSw = 23.3;
        if (t < tSw) cv.set('v5', 6.6 + (t - t0) * 0.9, { cx: 0.6, cy: 0.42, zoom: 1.0 + 0.02 * (t - t0) });
        else cv.set('v4', 7.6 + (t - tSw) * 0.9, { cx: 0.42, cy: 0.38, zoom: 1.02 + 0.03 * (t - tSw) });
        const blink = 1 - clamp(Math.abs(t - tSw) / 0.07);
        cv.el.style.filter = blink > 0 ? `brightness(${(1 + blink * 1.4).toFixed(2)})` : '';
        const tin = E.outCubic(clamp((t - t0) / 0.25));
        el.style.opacity = tin.toFixed(3);
        // badge swings down from the top
        const tb = Wt('طاقم').s;
        const pb = spring(t - tb, { k: 90, c: 7 });
        const sw = Math.sin((t - tb) * 4.2) * 6 * Math.exp(-(t - tb) * 1.4);
        S(badge, { opacity: t < tb ? 0 : 1, transform: `translateY(${lerp(-800, 0, pb).toFixed(1)}px) rotate(${(sw + 3).toFixed(2)}deg) scale(0.92)` });
        // exemption seal pops & rotates in
        const ts = Wt('إعفاءات').s - 0.05;
        const ps = spring(t - ts, { k: 240, c: 14 });
        S(sl, { opacity: t < ts ? 0 : 1, transform: `scale(${lerp(0.1, 0.95, ps).toFixed(3)}) rotate(${lerp(-160, 8, ps).toFixed(1)}deg)` });
        const xo = P(t, 24.38, 0.12, E.inCubic);
        if (xo > 0) el.style.opacity = (1 - xo).toFixed(3);
      };
    },
  });

  // ======================================================================= S6c documents (24.4 - 26.7)
  function docCard(kind) {
    const c = h('div', { class: 'abs', style: { width: '360px', height: '480px', borderRadius: '24px', boxShadow: '0 30px 70px rgba(0,0,0,.55)', overflow: 'hidden', transformOrigin: '50% 100%' } });
    if (kind === 'passport') {
      c.style.background = `#2a4a35 url("${SRC}passport_morocco.png") center / cover no-repeat`;
    } else if (kind === 'id') {
      c.style.background = '#fff';
      c.innerHTML = `<div style="position:absolute;left:0;top:0;width:100%;height:110px;background:linear-gradient(90deg,#003a9b,#1a5fd6)"></div>
        <div class="mont" style="position:absolute;top:30px;width:100%;text-align:center;color:#fff;font-weight:900;font-size:44px;letter-spacing:8px">CREW ID</div>
        <div style="position:absolute;left:125px;top:150px;width:110px;height:130px;border-radius:16px;background:#dfe7f5"></div>
        <div style="position:absolute;left:70px;top:310px;width:220px;height:12px;border-radius:6px;background:#e3e9f4"></div>
        <div style="position:absolute;left:100px;top:338px;width:160px;height:12px;border-radius:6px;background:#e3e9f4"></div>
        <div style="position:absolute;left:60px;top:385px;width:240px;height:50px;background:repeating-linear-gradient(90deg,#061433 0 3px,transparent 3px 6px,#061433 6px 7px,transparent 7px 11px)"></div>`;
    } else {
      c.style.background = '#fbfaf6';
      let lines = '';
      for (let i = 0; i < 9; i++) lines += `<div style="position:absolute;left:40px;top:${130 + i * 34}px;width:${200 + ((i * 53) % 80)}px;height:10px;border-radius:5px;background:#d9dde6"></div>`;
      c.innerHTML = `<div class="mont" style="position:absolute;left:36px;top:40px;color:#061433;font-weight:900;font-size:30px;letter-spacing:2px">GENERAL<br>DECLARATION</div>${lines}
        <div class="mont" style="position:absolute;right:30px;bottom:34px;width:120px;height:120px;border-radius:50%;border:6px solid #1a5fd6;color:#1a5fd6;font-weight:900;font-size:22px;display:flex;align-items:center;justify-content:center;transform:rotate(-14deg);text-align:center;line-height:1.1">CREW<br>LIST</div>`;
    }
    const chk = h('div', { class: 'abs', html: ICON.check('#fff'), style: { right: '-6px', top: '-6px', width: '86px', height: '86px', borderRadius: '50%', background: '#22c55e', border: '6px solid #fff', boxShadow: '0 8px 20px rgba(0,0,0,.4)', padding: '10px' } });
    const wrap = h('div', { class: 'abs', style: { width: '360px', height: '480px', transformOrigin: '50% 120%' } });
    wrap.append(c, chk);
    wrap._chk = chk;
    return wrap;
  }

  SC.push({
    id: 's6c', start: 24.38, end: 26.72, z: 9,
    build(el) {
      const bg = ClipView(el, { w: 1080, h: 1920 });
      const tint = h('div', { class: 'full', style: { background: 'linear-gradient(180deg, rgba(6,20,51,.78), rgba(3,10,31,.9))' } });
      el.appendChild(tint);
      const docs = ['gd', 'id', 'passport'].map((k) => docCard(k));
      docs.forEach((d) => { S(d, { left: '360px', top: '430px', scale: '0.9' }); el.appendChild(d); });
      return (t) => {
        const t0 = 24.38;
        bg.set('v4', 9.0 + (t - t0) * 0.3, { cx: 0.45, cy: 0.4, zoom: 1.1 });
        bg.el.style.filter = 'blur(10px)';
        el.style.opacity = E.outCubic(clamp((t - t0) / 0.2)).toFixed(3);
        const fanT = Wt('بشروط').s - 0.1;
        const f = E.outBack(clamp((t - fanT) / 0.55), 1.3);
        const angs = [-20, 0, 20];
        const offs = [-215, 0, 215];
        docs.forEach((d, i) => {
          const din = spring(t - (t0 + 0.02 + i * 0.07), { k: 200, c: 18 });
          S(d, { transform: `translate(${(offs[i] * f).toFixed(1)}px, ${lerp(900, 0, din).toFixed(1)}px) rotate(${(angs[i] * f).toFixed(2)}deg)` });
          const tc = Wt('ووثائق').s + i * 0.22;
          const pc = spring(t - tc, { k: 320, c: 15 });
          S(d._chk, { opacity: t < tc ? 0 : 1, transform: `scale(${pc.toFixed(3)})` });
        });
        const xo = P(t, 26.6, 0.12, E.inCubic);
        if (xo > 0) el.style.opacity = (1 - xo).toFixed(3);
      };
    },
  });

  // ======================================================================= S7 hidden perks (26.6 - 31.6)
  SC.push({
    id: 's7', start: 26.6, end: 31.66, z: 10,
    build(el) {
      const bg = ClipView(el, { w: 1080, h: 1920 });
      const tint = h('div', { class: 'full', style: { background: 'linear-gradient(180deg, rgba(3,10,31,.55), rgba(3,10,31,.35) 40%, rgba(3,10,31,.85))' } });
      el.appendChild(tint);
      const frame = h('div', { class: 'abs', style: { left: '50px', top: '290px', width: '980px', height: '600px', borderRadius: '30px', padding: '14px', background: '#fff', boxShadow: '0 40px 90px rgba(0,0,0,.6)' } });
      el.appendChild(frame);
      const inner = ClipView(frame, { x: 14, y: 14, w: 952, h: 572, radius: 20 });
      const one = h('div', { class: 'abs mont', style: { left: '-34px', top: '-40px', width: '150px', height: '150px', borderRadius: '50%', background: 'linear-gradient(135deg,#ffa53a,#f38100)', color: '#fff', fontWeight: 900, fontSize: '96px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '8px solid #fff', boxShadow: '0 16px 40px rgba(0,0,0,.45)' } }, '1');
      frame.appendChild(one);
      const plus = h('div', { class: 'abs mont', style: { right: '-20px', top: '-36px', padding: '10px 26px', borderRadius: '999px', background: '#1a5fd6', color: '#fff', fontWeight: 900, fontSize: '40px', border: '6px solid #fff', boxShadow: '0 16px 40px rgba(0,0,0,.45)' } }, '+ +');
      // crowd of people icons with question marks
      const crowd = h('div', { class: 'abs', style: { left: '90px', top: '940px', width: '900px', height: '200px' } });
      const ppl = [];
      for (let i = 0; i < 9; i++) {
        const p = h('div', { class: 'abs', style: { left: i * 100 + 'px', top: '40px', width: '90px', height: '150px' } });
        p.innerHTML = `<svg viewBox="0 0 90 150" width="90" height="150"><circle cx="45" cy="38" r="26" fill="#8fa3c8"/><path d="M8 150 C8 98 22 76 45 76 C68 76 82 98 82 150 Z" fill="#8fa3c8"/></svg>`;
        const q = h('div', { class: 'abs mont', style: { left: '50px', top: '-18px', width: '56px', height: '56px', borderRadius: '50%', background: '#fff', color: '#061433', fontWeight: 900, fontSize: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 16px rgba(0,0,0,.4)' } }, '?');
        p.appendChild(q);
        crowd.appendChild(p);
        ppl.push({ p, q });
      }
      el.appendChild(crowd);
      return (t) => {
        const t0 = 26.6;
        bg.set('v1', 3.6 + (t - t0) * 0.85, { cx: 0.5, cy: 0.45, zoom: 1.3 });
        bg.el.style.filter = 'blur(14px) brightness(.7)';
        inner.set('v1', 3.6 + (t - t0) * 0.85, { cx: 0.5, cy: 0.42, zoom: 1.0 + 0.03 * (t - t0) });
        const pin = spring(t - t0, { k: 150, c: 16 });
        el.style.opacity = E.outCubic(clamp((t - t0) / 0.2)).toFixed(3);
        S(frame, { transform: `perspective(1600px) translateY(${lerp(700, 0, pin).toFixed(1)}px) rotateX(${lerp(30, 4, pin).toFixed(2)}deg) rotate(${lerp(-6, -1.5, pin).toFixed(2)}deg)` });
        const to = Wt('واحدة').s - 0.05;
        const po = spring(t - to, { k: 320, c: 14 });
        S(one, { opacity: t < to ? 0 : 1, transform: `scale(${po.toFixed(3)}) rotate(${lerp(-90, 0, po).toFixed(1)}deg)` });
        const tp = Wt('المميزات').s + 0.1;
        const pp = spring(t - tp, { k: 300, c: 15 });
        const tc = Wt('كيعرفوهاش').s - 0.15;
        ppl.forEach((o, i) => {
          const ti = tc + i * 0.06;
          const pi = spring(t - ti, { k: 260, c: 14 });
          S(o.p, { opacity: t < ti ? 0 : 1, transform: `translateY(${lerp(60, 0, pi).toFixed(1)}px) scale(${lerp(0.4, 1, pi).toFixed(3)})` });
          const tq = Wt('بزاف').s + i * 0.05;
          const pq = spring(t - tq, { k: 320, c: 12 });
          S(o.q, { opacity: t < tq ? 0 : 1, transform: `scale(${pq.toFixed(3)}) rotate(${(8 * Math.sin(t * 7 + i)).toFixed(1)}deg)` });
        });
        const xo = P(t, 31.52, 0.12, E.inCubic);
        if (xo > 0) el.style.opacity = (1 - xo).toFixed(3);
      };
    },
  });

  // ======================================================================= S8 travel postcards (31.55 - 37.1)
  function postcard(city, flag) {
    const card = h('div', { class: 'abs', style: { width: '760px', height: '880px', background: '#fffdf8', borderRadius: '18px', boxShadow: '0 40px 90px rgba(0,0,0,.6)', padding: '24px' } });
    const photo = ClipView(card, { x: 24, y: 24, w: 712, h: 712, radius: 8 });
    const name = h('div', { class: 'abs bebas', style: { left: '36px', top: '752px', color: '#061433', fontSize: '104px', letterSpacing: '6px', lineHeight: '1' } }, city);
    const fl = h('div', { class: 'abs', style: { right: '36px', top: '764px', width: '124px', height: '82px', borderRadius: '10px', backgroundImage: `url("${flagURL(flag)}")`, backgroundSize: 'cover', backgroundPosition: 'center', boxShadow: '0 4px 12px rgba(0,0,0,.25)', border: '4px solid #fff' } });
    const stamp = h('div', { class: 'abs mont', style: { right: '50px', top: '60px', width: '210px', height: '210px', borderRadius: '50%', border: '7px solid rgba(26,95,214,.9)', color: 'rgba(26,95,214,.95)', fontWeight: 900, fontSize: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', letterSpacing: '2px', textAlign: 'center', lineHeight: '1.15', background: 'rgba(255,255,255,.16)' } });
    stamp.innerHTML = `<span style="font-size:22px">✈ CREW</span><span>${city}</span><span style="font-size:22px">2026</span>`;
    card.append(name, fl, stamp);
    card._photo = photo;
    card._stamp = stamp;
    return card;
  }

  SC.push({
    id: 's8', start: 31.5, end: 37.12, z: 11,
    build(el) {
      el.style.background = 'radial-gradient(ellipse at 50% 35%, #12306e 0%, #061433 60%, #030a1f 100%)';
      const dots = h('div', { class: 'abs', style: { left: '-100px', top: '-100px', width: '1300px', height: '2200px', backgroundImage: 'radial-gradient(rgba(140,200,255,.16) 2px, transparent 2.2px)', backgroundSize: '34px 34px' } });
      el.appendChild(dots);
      const cards = [
        { c: postcard('PARIS', 'fr'), clip: 'v2', s0: 0.35, cx: 0.42, word: 'السفر', rot: -5, from: [-900, -300] },
        { c: postcard('MADRID', 'es'), clip: 'v2', s0: 3.62, cx: 0.56, word: 'واكتشاف', rot: 4, from: [900, 200] },
        { c: postcard('LONDON', 'uk'), clip: 'v2', s0: 6.62, cx: 0.55, word: 'خلال', rot: -3, from: [-700, 900] },
      ];
      cards.forEach((o) => { S(o.c, { left: '160px', top: '230px' }); el.appendChild(o.c); });
      const tag = h('div', { class: 'abs', style: { left: '600px', top: '190px', padding: '16px 30px', borderRadius: '18px', background: '#fff', boxShadow: '0 20px 50px rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', gap: '16px' } });
      tag.append(h('div', { html: ICON.clock('#f38100'), style: { width: '54px', height: '54px' } }), h('div', { class: 'mont', style: { color: '#061433', fontWeight: 900, fontSize: '42px', letterSpacing: '3px' } }, 'LAYOVER'));
      el.appendChild(tag);
      return (t) => {
        const t0 = 31.5;
        el.style.opacity = E.outCubic(clamp((t - t0) / 0.2)).toFixed(3);
        dots.style.transform = `translateY(${(-(t - t0) * 18).toFixed(1)}px)`;
        cards.forEach((o, i) => {
          const ti = i === 0 ? t0 : Wt(o.word).s - 0.12;
          const p = spring(t - ti, { k: 170, c: 17 });
          const settled = cards.slice(i + 1).filter((n) => t >= (Wt(n.word).s - 0.12)).length;
          const push = settled * 26;
          S(o.c, {
            opacity: t < ti ? 0 : 1,
            transform: `translate(${lerp(o.from[0], 0, p).toFixed(1)}px, ${(lerp(o.from[1], 0, p) - push).toFixed(1)}px) rotate(${(lerp(o.rot * 5, o.rot, p) - settled * 3).toFixed(2)}deg) scale(${(lerp(1.25, 1, p) - settled * 0.05).toFixed(3)})`,
            filter: settled ? `brightness(${(1 - 0.25 * settled).toFixed(2)})` : '',
          });
          if (t >= ti && settled < 2) o.c._photo.set(o.clip, o.s0 + (t - ti) * 0.9, { cx: o.cx, cy: 0.42, zoom: 1.0 + 0.04 * (t - ti) });
          const ts = ti + 0.45;
          const ps = clamp((t - ts) / 0.14);
          S(o.c._stamp, { opacity: t < ts ? 0 : ps.toFixed(3), transform: `scale(${lerp(1.8, 1, E.inQuad(ps)).toFixed(3)}) rotate(-14deg)` });
        });
        const tt = Wt('التوقفات').s - 0.1;
        const pt = spring(t - tt, { k: 300, c: 15 });
        S(tag, { opacity: t < tt ? 0 : 1, transform: `scale(${pt.toFixed(3)}) rotate(${lerp(-20, -4, pt).toFixed(1)}deg)` });
        // "ولكن": freeze + desaturate + drop
        const tb = 36.81;
        const pb = clamp((t - tb) / 0.3);
        el.style.filter = pb > 0 ? `grayscale(${pb.toFixed(2)}) brightness(${(1 - 0.4 * pb).toFixed(2)})` : '';
      };
    },
  });

  // ======================================================================= S9 service vs tourism (36.95 - 40.75)
  SC.push({
    id: 's9', start: 36.95, end: 40.78, z: 12,
    build(el) {
      const bg = ClipView(el, { w: 1080, h: 1920 });
      const tint = h('div', { class: 'full', style: { background: 'linear-gradient(180deg, rgba(3,10,31,.7), rgba(3,10,31,.2) 45%, rgba(3,10,31,.8))' } });
      el.appendChild(tint);
      const warn = h('div', { class: 'abs', style: { left: '415px', top: '330px', width: '250px', height: '250px' } });
      warn.innerHTML = `<svg viewBox="0 0 100 100" width="250" height="250"><path d="M50 6 L96 88 H4 Z" fill="#ffb547" stroke="#fff" stroke-width="4" stroke-linejoin="round"/><rect x="45" y="34" width="10" height="30" rx="5" fill="#061433"/><circle cx="50" cy="74" r="6" fill="#061433"/></svg>`;
      el.appendChild(warn);
      const card = h('div', { class: 'glass', style: { left: '110px', top: '300px', width: '860px', height: '420px' } });
      const row = (icon, label, ok) => {
        const r = h('div', { class: 'abs', style: { left: '40px', width: '780px', height: '150px', borderRadius: '26px', background: ok ? 'rgba(34,197,94,.18)' : 'rgba(239,68,68,.18)', border: `3px solid ${ok ? '#22c55e' : '#ef4444'}`, display: 'flex', alignItems: 'center', padding: '0 34px', gap: '30px' } });
        const ic = h('div', { html: ICON[icon]('#fff'), style: { width: '84px', height: '84px', flex: '0 0 auto' } });
        const tx = h('div', { class: 'mont', style: { color: '#fff', fontWeight: 900, fontSize: '62px', letterSpacing: '4px', flex: '1 1 auto' } }, label);
        const mk = h('div', { html: ICON[ok ? 'check' : 'cross']('#fff'), style: { width: '96px', height: '96px', borderRadius: '50%', background: ok ? '#22c55e' : '#ef4444', padding: '14px', flex: '0 0 auto' } });
        r.append(ic, tx, mk);
        r._mk = mk;
        r._tx = tx;
        return r;
      };
      const r1 = row('suitcase', 'SERVICE', true);
      const r2 = row('palm', 'TOURISME', false);
      S(r1, { top: '50px' });
      S(r2, { top: '220px' });
      const strike = h('div', { class: 'abs', style: { left: '140px', top: '292px', width: '0px', height: '9px', borderRadius: '5px', background: '#ef4444' } });
      card.append(r1, r2, strike);
      el.appendChild(card);
      return (t) => {
        const t0 = 36.95;
        bg.set('v6', 0.2 + (t - t0) * 0.95, { cx: 0.4, cy: 0.4, zoom: 1.0 + 0.02 * (t - t0) });
        el.style.opacity = E.outCubic(clamp((t - t0) / 0.18)).toFixed(3);
        // warning sign on "ولكن"
        const pw = spring(t - t0, { k: 300, c: 13 });
        const wOut = P(t, Wt('مرتبطة').s - 0.25, 0.2, E.inCubic);
        S(warn, { opacity: (1 - wOut).toFixed(3), transform: `scale(${(lerp(0.2, 1, pw) * (1 - 0.5 * wOut)).toFixed(3)}) rotate(${(4 * Math.sin(t * 20) * Math.exp(-(t - t0) * 3)).toFixed(2)}deg)` });
        const tc = Wt('مرتبطة').s - 0.2;
        const pc = spring(t - tc, { k: 200, c: 18 });
        S(card, { opacity: t < tc ? 0 : 1, transform: `translateY(${lerp(120, 0, pc).toFixed(1)}px) scale(${lerp(0.85, 1, pc).toFixed(3)})` });
        const p1 = spring(t - Wt('بالخدمة').s, { k: 300, c: 15 });
        S(r1._mk, { transform: `scale(${t < Wt('بالخدمة').s ? 0 : p1.toFixed(3)})` });
        const t2 = Wt('ماشي').s - 0.05;
        const p2 = spring(t - t2, { k: 220, c: 17 });
        card.style.height = lerp(250, 420, E.outCubic(clamp((t - t2 + 0.05) / 0.3))).toFixed(1) + 'px';
        S(r2, { opacity: t < t2 ? 0 : 1, transform: `translateX(${lerp(200, 0, p2).toFixed(1)}px)` });
        const t3 = Wt('بالسياحة').s + 0.1;
        S(r2._mk, { transform: `scale(${t < t3 ? 0 : spring(t - t3, { k: 320, c: 14 }).toFixed(3)})` });
        strike.style.width = (420 * E.outCubic(clamp((t - t3) / 0.25))).toFixed(1) + 'px';
        r2._tx.style.opacity = t > t3 ? lerp(1, 0.55, clamp((t - t3) / 0.3)).toFixed(2) : 1;
        const xo = P(t, 40.66, 0.12, E.inCubic);
        if (xo > 0) el.style.opacity = (1 - xo).toFixed(3);
      };
    },
  });

  // ======================================================================= S10 USA + crew visa (40.7 - 44.65)
  SC.push({
    id: 's10', start: 40.68, end: 44.66, z: 13,
    build(el) {
      el.style.background = 'radial-gradient(ellipse at 50% 35%, #0f2a66, #030a1f 75%)';
      const flag = WavingFlag(el, 'us', { w: 1000, h: 527, x: 40, y: 380 });
      const usa = h('div', { class: 'abs bebas', style: { left: 0, top: '980px', width: '1080px', textAlign: 'center', color: '#fff', fontSize: '200px', letterSpacing: '18px', lineHeight: '1', textShadow: '0 10px 40px rgba(0,0,0,.6)' } }, 'USA');
      el.appendChild(usa);
      // visa sticker
      const visa = h('div', { class: 'abs', style: { left: '90px', top: '360px', width: '900px', height: '560px', borderRadius: '26px', overflow: 'hidden', boxShadow: '0 40px 90px rgba(0,0,0,.6)', background: 'linear-gradient(135deg,#e9f4ef,#d7ebf5 50%,#efe7f6)' } });
      let guil = '';
      for (let i = 0; i < 14; i++) guil += `<path d="M0 ${40 + i * 38} C 150 ${10 + i * 38}, 300 ${70 + i * 38}, 450 ${40 + i * 38} S 750 ${10 + i * 38}, 900 ${40 + i * 38}" fill="none" stroke="rgba(26,95,214,.13)" stroke-width="2"/>`;
      visa.innerHTML = `<svg viewBox="0 0 900 560" width="900" height="560" style="position:absolute;left:0;top:0">${guil}</svg>
        <div class="mont" style="position:absolute;left:40px;top:32px;color:#0b2a6b;font-weight:900;font-size:56px;letter-spacing:6px">VISA</div>
        <div class="mont" style="position:absolute;left:40px;top:100px;color:#0b2a6b;font-weight:700;font-size:24px;letter-spacing:4px;opacity:.7">CREW MEMBER</div>
        <div style="position:absolute;left:40px;top:160px;width:200px;height:250px;border-radius:14px;background:#c5d3ea;overflow:hidden">
          <div style="position:absolute;left:60px;top:40px;width:80px;height:80px;border-radius:50%;background:#8fa3c8"></div>
          <div style="position:absolute;left:25px;top:135px;width:150px;height:140px;border-radius:75px 75px 0 0;background:#8fa3c8"></div></div>
        <div class="mont" style="position:absolute;left:290px;top:170px;color:#0b2a6b;font-weight:700;font-size:22px;letter-spacing:3px;opacity:.6">VISA TYPE / CLASS</div>
        <div class="mont c1d" style="position:absolute;left:286px;top:200px;color:#f38100;font-weight:900;font-size:150px;line-height:1;letter-spacing:4px">C1/D</div>
        <div style="position:absolute;left:290px;top:380px;width:320px;height:12px;border-radius:6px;background:rgba(11,42,107,.18)"></div>
        <div style="position:absolute;left:290px;top:408px;width:240px;height:12px;border-radius:6px;background:rgba(11,42,107,.18)"></div>
        <div class="mono" style="position:absolute;left:40px;top:450px;color:#0b2a6b;font-weight:700;font-size:30px;letter-spacing:4px;opacity:.75">VCMAR&lt;&lt;CREW&lt;&lt;MEMBER&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;<br>C1D0000000MAR&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</div>`;
      const vflag = h('div', { class: 'abs', style: { right: '36px', top: '36px', width: '150px', height: '79px', backgroundImage: `url("${flagURL('us')}")`, backgroundSize: 'cover', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,.25)' } });
      visa.appendChild(vflag);
      el.appendChild(visa);
      return (t) => {
        const t0 = 40.68;
        el.style.opacity = E.outCubic(clamp((t - t0) / 0.2)).toFixed(3);
        const tv = Wt('فيزا', 2).s - 0.35;
        const fo = P(t, tv, 0.3, E.inCubic);
        flag.draw(t, 1);
        const fin = spring(t - t0, { k: 160, c: 16 });
        S(flag.el, { opacity: (1 - 0.65 * fo).toFixed(3), transform: `translateY(${(lerp(200, 0, fin) - 120 * fo).toFixed(1)}px) scale(${(lerp(0.8, 1, fin) * (1 - 0.15 * fo)).toFixed(3)})`, filter: fo > 0 ? `blur(${(8 * fo).toFixed(1)}px)` : '' });
        const pu = spring(t - (t0 + 0.12), { k: 220, c: 15 });
        S(usa, { opacity: (t < t0 + 0.12 ? 0 : 1 - fo).toFixed(3), transform: `scale(${lerp(0.5, 1, pu).toFixed(3)}) translateY(${(60 * fo).toFixed(1)}px)`, letterSpacing: `${lerp(60, 18, pu).toFixed(1)}px` });
        const pv = spring(t - tv, { k: 180, c: 16 });
        S(visa, { opacity: t < tv ? 0 : 1, transform: `perspective(1500px) translateY(${lerp(1000, 0, pv).toFixed(1)}px) rotateX(${lerp(40, 0, pv).toFixed(2)}deg) rotate(${lerp(8, -2, pv).toFixed(2)}deg)` });
        const xo = P(t, 44.56, 0.1, E.inCubic);
        if (xo > 0) el.style.opacity = (1 - xo).toFixed(3);
      };
    },
  });

  FX.flashes.push({ t: 16.75, d: 0.2, a: 0.35 }, { t: 31.5, d: 0.2, a: 0.4 }, { t: 40.7, d: 0.2, a: 0.45 });
  FX.leaks.push({ t: 31.6, d: 1.6, x0: 900, y0: 200, x1: 200, y1: 700, a: 0.45 }, { t: 22.1, d: 1.4, x0: 950, y0: 300, x1: 600, y1: 500, a: 0.45 });
  FX.shakes.push({ t: 36.81, d: 0.3, a: 10 }, { t: 15.7, d: 0.01, a: 0 });
})();

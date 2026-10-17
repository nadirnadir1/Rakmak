/* S12 (42.95 – 48.6): location + end card. Satellite map (from the school's Google Maps
   screenshot, UI removed) flies in, camera dives to the school, route draws along Bd Allal
   Al Fassi, branded pin drops, label card replaces the Google label; then the end card:
   logo, map card, phones, website.
   Pin, label and route live inside the map layer (image pixel units) so they track the map. */
(function () {
  const R = window.R, tl = R.tl;
  const T0 = 42.95, T1 = 47.7;
  const s = R.scene('s12', T0, T1, { zIndex: 25, background: 'radial-gradient(ellipse 90% 60% at 50% 30%, #12357e 0%, #071a42 50%, #020817 100%)' });
  R.particles(s, { n: 30, t0: 45, t1: T1, seed: 121, alpha: 0.4, speed: 22, maxR: 5 });

  const IMG_W = 1079, IMG_H = 1754;
  const Z1 = 1.9; // final zoom of the map phase: overlay sizes are authored for this zoom
  const cam = { z: 1.12, px: 560, py: 960, sx: 540, sy: 830 };
  const wrap = R.div('mapwrap', s, { left: 0, top: 0, width: '1080px', height: '1920px' });
  const layer = R.div('abs', wrap, { left: 0, top: 0, width: IMG_W + 'px', height: IMG_H + 'px', transformOrigin: '0 0' });
  R.img(`${R.A}map_clean.jpg`, 'mapimg', layer);
  // grade + vignette (screen space)
  const grade1 = R.div('fill', wrap, { background: 'linear-gradient(180deg, rgba(2,8,23,.55) 0%, rgba(2,8,23,0) 22%, rgba(2,8,23,0) 62%, rgba(2,8,23,.75) 100%)' });
  const grade2 = R.div('fill', wrap, { background: 'radial-gradient(ellipse 70% 50% at 55% 40%, rgba(0,0,0,0) 40%, rgba(2,12,40,.45) 100%)' });
  const attrib = R.div('attrib', wrap, { right: '22px', top: '1240px' }, 'Imagery © Google');
  // overlays that ride on the map (image px)
  const over = R.div('abs', layer, { left: 0, top: 0, width: IMG_W + 'px', height: IMG_H + 'px' });
  const rs = R.svgEl('svg', { width: IMG_W, height: IMG_H, viewBox: `0 0 ${IMG_W} ${IMG_H}`, class: 'abs' }, over);
  rs.style.left = '0'; rs.style.top = '0'; rs.style.overflow = 'visible';
  const rd = 'M18,1342 C90,1300 150,1268 230,1228 C340,1173 450,1120 560,1068 C650,1026 720,992 792,962 C806,930 812,900 818,872';
  const rGlow = R.svgEl('path', { d: rd, fill: 'none', stroke: 'rgba(244,129,0,.45)', 'stroke-width': 26, 'stroke-linecap': 'round', 'vector-effect': 'non-scaling-stroke' }, rs);
  const rLine = R.svgEl('path', { d: rd, fill: 'none', stroke: '#ffb347', 'stroke-width': 10, 'stroke-linecap': 'round', 'vector-effect': 'non-scaling-stroke' }, rs);
  const rDash = R.svgEl('path', { d: rd, fill: 'none', stroke: '#fff', 'stroke-width': 4, 'stroke-dasharray': '2 16', 'stroke-linecap': 'round', 'vector-effect': 'non-scaling-stroke' }, rs);
  gsap.set([rGlow, rLine, rDash], { drawSVG: '0%' });

  // label card covering Google's school label (image box ~380..775 x 752..850)
  const label = R.div('map-label', over, { left: '450px', top: '742px', width: (640 / Z1) + 'px', height: (218 / Z1) + 'px',
    padding: `${22 / Z1}px ${26 / Z1}px`, borderRadius: (26 / Z1) + 'px', boxShadow: `0 ${14 / Z1}px ${40 / Z1}px rgba(0,0,0,.45)`, zIndex: 2 },
    `<div class="t1" style="font-size:${38 / Z1}px">École FLY HYANI Privé</div>
     <div class="t2" style="font-size:${25 / Z1}px;margin-top:${4 / Z1}px">Bd Allal Al Fassi · Marrakech</div>
     <div class="t3" style="font-size:${31 / Z1}px;margin-top:${4 / Z1}px;text-align:left">شارع علال الفاسي، مراكش</div>`);
  // pin + ripples at the school (tip at 820,850)
  const PIN = { x: 820, y: 850 };
  const rings = [0, 1, 2].map(() => R.div('pin-ring', over, { left: PIN.x + 'px', top: PIN.y + 'px', width: (60 / Z1) + 'px', height: (60 / Z1) + 'px',
    margin: `${-30 / Z1}px 0 0 ${-30 / Z1}px`, borderWidth: (6 / Z1) + 'px', opacity: 0, zIndex: 1 }));
  const shadow = R.div('pin-shadow', over, { left: PIN.x + 'px', top: PIN.y + 'px', width: (90 / Z1) + 'px', height: (26 / Z1) + 'px',
    margin: `${-13 / Z1}px 0 0 ${-45 / Z1}px`, zIndex: 3 });
  const pw = 172 / Z1, ph = 230 / Z1;
  const pin = R.div('abs', over, { left: PIN.x - pw / 2 + 'px', top: PIN.y - ph + 'px', width: pw + 'px', height: ph + 'px', zIndex: 4 },
    `<svg viewBox="0 0 150 200" width="${pw}" height="${ph}" style="overflow:visible;filter:drop-shadow(0 6px 8px rgba(0,0,0,.45))">
      <defs><linearGradient id="pinG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffa53a"/><stop offset="1" stop-color="#e86a00"/></linearGradient></defs>
      <path d="M75 196 C60 150 8 120 8 72 A67 67 0 1 1 142 72 C142 120 90 150 75 196 Z" fill="url(#pinG)" stroke="#fff" stroke-width="7"/>
      <circle cx="75" cy="72" r="44" fill="#fff"/>
      <g transform="translate(47 44) scale(2.35)" stroke="#003a9b" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">${window.ICONS['graduation-cap']}</g></svg>`);

  R.onFrame((t) => {
    if (t < T0 || t > T1) return;
    layer.style.transform = `translate(${cam.sx - cam.px * cam.z}px, ${cam.sy - cam.py * cam.z}px) scale(${cam.z})`;
  });

  // fly-in
  gsap.set(wrap, { scale: 0.3, rotation: -12, opacity: 0, clipPath: 'inset(0px 0px 0px 0px round 160px)' });
  tl.to(wrap, { scale: 1, rotation: 0, opacity: 1, clipPath: 'inset(0px 0px 0px 0px round 0px)', duration: 0.5, ease: 'expo.out' }, T0);
  R.sfx(T0 + 0.07, 'whoosh_big', { gain: 0.55 });  // after the last word ends (42.99)
  R.sfx(43.39, 'impact', { gain: 0.65 });
  tl.to(cam, { z: Z1, px: 745, py: 862, duration: 2.35, ease: 'power2.inOut' }, T0 + 0.05);
  tl.to([rGlow, rLine], { drawSVG: '100%', duration: 1.0, ease: 'power1.inOut' }, 43.45);
  tl.to(rDash, { drawSVG: '100%', duration: 1.0, ease: 'power1.inOut' }, 43.5);
  R.sfx(43.45, 'route', { gain: 0.45, dur: 1.0 });

  const tPin = 44.0;
  gsap.set(pin, { y: -300, opacity: 0 });
  gsap.set(shadow, { scale: 0, opacity: 0 });
  tl.to(pin, { y: 0, opacity: 1, duration: 0.5, ease: 'bounce.out' }, tPin);
  tl.to(shadow, { scale: 1, opacity: 1, duration: 0.5, ease: 'bounce.out' }, tPin);
  R.sfx(tPin + 0.18, 'pin_drop', { gain: 0.8 });
  rings.forEach((r, i) => {
    tl.fromTo(r, { scale: 0.4, opacity: 0.9 }, { scale: 5.5, opacity: 0, duration: 1.5, ease: 'power2.out', repeat: 2, repeatDelay: 0.1 }, tPin + 0.3 + i * 0.5);
  });
  gsap.set(label, { opacity: 0, scale: 0.85, transformOrigin: '100% 60%' });
  tl.to(label, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.8)' }, 44.3);
  R.sfx(44.3, 'pop', { gain: 0.55 });

  // ---------------- end card (2 s: map card + contacts, header logo on top) ----------------
  const tE = 45.39;
  tl.to(wrap, { clipPath: 'inset(300px 60px 880px 60px round 48px)', duration: 0.7, ease: 'power3.inOut' }, tE);
  tl.to(cam, { sy: 660, z: 1.55, px: 765, duration: 0.7, ease: 'power3.inOut' }, tE);
  tl.to(attrib, { y: -232, x: -40, duration: 0.7, ease: 'power3.inOut' }, tE);
  tl.to(grade1, { opacity: 0.35, duration: 0.7 }, tE);
  R.sfx(tE, 'whoosh_rev', { gain: 0.5 });
  R.headerShine(tE + 0.2);
  R.sfx(tE + 0.2, 'logo_sting', { gain: 0.6 });

  const card = R.div('contact', s, { top: '1066px', padding: '22px 40px', zIndex: 7 },
    `<div class="c-row" style="height:100px"><div class="c-ic">${R.icon('phone', 46, 2.4)}</div><div class="c-tx" style="font-size:56px">+212 777 77 13 14</div></div>
     <div class="c-row" style="height:100px"><div class="c-ic">${R.icon('phone', 46, 2.4)}</div><div class="c-tx" style="font-size:56px">+212 777 77 17 12</div></div>
     <div class="c-row" style="height:100px"><div class="c-ic" style="background:linear-gradient(160deg,#2f80ff,#0b4fd6);box-shadow:0 10px 24px rgba(31,111,255,.35)">${R.icon('globe', 46, 2.4)}</div><div class="c-tx web" style="font-size:50px">www.flyhyani.ma</div></div>`);
  gsap.set(card, { y: 900 });
  tl.to(card, { y: 0, duration: 0.6, ease: 'expo.out' }, tE + 0.25);

  // hand-over to the Instagram ending
  tl.to([wrap, card], { y: '+=260', opacity: 0, duration: 0.4, ease: 'power3.in' }, 47.12);
})();

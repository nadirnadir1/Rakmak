/* S8 (22.5 – 28.55): "Behind this elegance: discipline, communication, responsibility and
   safety training." Blueprint backdrop, aircraft schematic draws itself, 4 pillar cards. */
(function () {
  const R = window.R, tl = R.tl;
  const T0 = 22.5, T1 = 28.55;
  const s = R.scene('s8', T0, T1, { zIndex: 15 });
  const bp = R.div('blueprint', s);
  tl.fromTo(s, { scale: 1 }, { scale: 1.03, duration: T1 - T0, ease: 'none' }, T0);
  R.div('abs', s, { left: '-200px', top: '-300px', width: '1500px', height: '1300px', borderRadius: '50%',
    background: 'radial-gradient(ellipse, rgba(31,111,255,.28) 0%, rgba(31,111,255,0) 60%)' });

  // aircraft schematic (top view) + dimension lines
  const sch = R.svgEl('svg', { viewBox: '0 0 1000 1000', width: '1240', height: '1240', class: 'abs' }, s);
  Object.assign(sch.style, { left: '-80px', top: '230px', opacity: '0.38', overflow: 'visible' });
  const stroke = { fill: 'none', stroke: '#8fc3ff', 'stroke-width': '2.2', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' };
  const shapes = [
    R.svgEl('path', Object.assign({ d: 'M500,60 C522,60 535,90 535,140 L535,420 L900,585 L912,610 L535,525 L535,840 L668,915 L670,935 L535,900 L520,950 L500,955 L480,950 L465,900 L330,935 L332,915 L465,840 L465,525 L88,610 L100,585 L465,420 L465,140 C465,90 478,60 500,60 Z' }, stroke), sch),
    R.svgEl('ellipse', Object.assign({ cx: 330, cy: 505, rx: 22, ry: 58 }, stroke), sch),
    R.svgEl('ellipse', Object.assign({ cx: 670, cy: 505, rx: 22, ry: 58 }, stroke), sch),
    R.svgEl('path', Object.assign({ d: 'M486,110 L514,110 M480,128 L520,128' }, stroke), sch),
    R.svgEl('path', Object.assign({ d: 'M500,170 L500,880', 'stroke-dasharray': '10 12' }, stroke), sch),
    R.svgEl('path', Object.assign({ d: 'M88,660 L912,660 M88,645 L88,675 M912,645 L912,675' }, stroke), sch),
    R.svgEl('path', Object.assign({ d: 'M960,60 L960,955 M945,60 L975,60 M945,955 L975,955' }, stroke), sch),
    R.svgEl('circle', Object.assign({ cx: 500, cy: 470, r: 150, 'stroke-dasharray': '4 10' }, stroke), sch),
  ];
  const lbl = (x, y, t, rot = 0) => { const e = R.svgEl('text', { x, y, fill: '#8fc3ff', 'font-family': 'JetBrains Mono', 'font-size': '22', 'font-weight': '700', 'text-anchor': 'middle', transform: rot ? `rotate(${rot} ${x} ${y})` : '' }, sch); e.textContent = t; return e; };
  const labels = [lbl(500, 695, 'ENVERGURE 35.8 M'), lbl(992, 510, 'LONGUEUR 37.6 M', 90)];
  gsap.set(shapes, { drawSVG: '0%' });
  gsap.set(labels, { opacity: 0 });
  shapes.forEach((p, i) => tl.to(p, { drawSVG: '100%', duration: 1.1, ease: 'power2.inOut' }, 22.75 + i * 0.07));
  tl.to(labels, { opacity: 1, duration: 0.3 }, 23.6);
  tl.fromTo(sch, { rotation: -6, scale: 1.08 }, { rotation: 4, scale: 1, duration: T1 - 22.75, ease: 'none' }, 22.75);
  R.sfx(22.78, 'blueprint_draw', { gain: 0.4, dur: 1.2 });

  // section title
  const title = R.div('abs', s, { left: 0, right: 0, top: '292px', textAlign: 'center', font: "800 34px 'Montserrat'",
    letterSpacing: '10px', color: '#9cc8ff' }, '— DERRIÈRE L\'ÉLÉGANCE —');
  gsap.set(title, { opacity: 0, letterSpacing: '28px' });
  tl.to(title, { opacity: 1, letterSpacing: '10px', duration: 0.7, ease: 'expo.out' }, R.ws(10, 0) - 0.05);

  // "behind the elegance": an elegant portrait gets scanned into a blueprint
  const scanBox = R.div('abs', s, { left: '190px', top: '360px', width: '700px', height: '875px', zIndex: 1 });
  R.img(`${R.A}fa3.png`, 'portrait', scanBox, { width: '700px', left: '0', top: '0' });
  const pB = R.img(`${R.A}fa3.png`, 'portrait', scanBox, { width: '700px', left: '0', top: '0',
    filter: 'grayscale(1) contrast(1.45) brightness(1.1) sepia(1) hue-rotate(175deg) saturate(3.4)' });
  const scanLines = R.div('fill', scanBox, { background: 'repeating-linear-gradient(0deg, rgba(6,24,56,.5) 0 2px, rgba(6,24,56,0) 2px 7px)' });
  const scanBar = R.div('abs', s, { left: '150px', width: '780px', top: '360px', height: '6px', borderRadius: '3px', zIndex: 2,
    background: '#d6ecff', boxShadow: '0 0 18px 6px rgba(124,192,255,.9), 0 0 70px 24px rgba(31,111,255,.45)' });
  const tScan = 22.78, dScan = 1.15;
  gsap.set(scanBox, { opacity: 0, scale: 1.08 });
  gsap.set([pB, scanLines], { clipPath: 'inset(0px 0px 875px 0px)' });
  gsap.set(scanBar, { opacity: 0 });
  tl.to(scanBox, { opacity: 1, scale: 1, duration: 0.45, ease: 'power2.out' }, 22.55);
  tl.set(scanBar, { opacity: 1 }, tScan);
  tl.to([pB, scanLines], { clipPath: 'inset(0px 0px 0px 0px)', duration: dScan, ease: 'power1.inOut' }, tScan);
  tl.to(scanBar, { top: 1235, duration: dScan, ease: 'power1.inOut' }, tScan);
  tl.to(scanBar, { opacity: 0, duration: 0.15 }, tScan + dScan);
  tl.to(scanBox, { opacity: 0.13, scale: 1.1, duration: 0.45, ease: 'power2.inOut' }, R.ws(10, 4) - 0.3);
  R.sfx(tScan, 'scan', { gain: 0.5, dur: dScan });

  // pillar cards
  const P = [
    { ic: 'clock', fr: 'DISCIPLINE', ar: 'الانضباط', t: R.ws(10, 4) },
    { ic: 'messages-square', fr: 'COMMUNICATION', ar: 'التواصل', t: R.ws(10, 5) },
    { ic: 'shield-check', fr: 'RESPONSABILITÉ', ar: 'المسؤولية', t: R.ws(10, 6) },
    { ic: 'life-buoy', fr: 'SÉCURITÉ', ar: 'التكوين على السلامة', t: R.ws(10, 7) },
  ];
  const cards = P.map((p, i) => {
    const x = i % 2 ? 560 : 50, y = i < 2 ? 370 : 815;
    const c = R.div('pillar', s, { left: x + 'px', top: y + 'px' },
      `<div class="num">0${i + 1}</div><div class="ico">${R.icon(p.ic, 66, 2.3)}</div><div class="fr">${p.fr}</div><div class="arl">${p.ar}</div>`);
    if (p.fr.length > 12) c.querySelector('.fr').style.fontSize = '38px';
    gsap.set(c, { opacity: 0, scale: 0.6, rotationY: i % 2 ? 70 : -70, transformPerspective: 1400 });
    tl.to(c, { opacity: 1, scale: 1, rotationY: 0, duration: 0.5, ease: 'back.out(1.6)' }, p.t - 0.12);
    const parts = c.querySelectorAll('.ico svg > *');
    gsap.set(parts, { drawSVG: '0%' });
    tl.to(parts, { drawSVG: '100%', duration: 0.55, ease: 'power2.out', stagger: 0.04 }, p.t - 0.02);
    R.sfx(p.t - 0.1, 'card', { gain: 0.6, pitch: 1 + i * 0.06 });
    return c;
  });
  // safety card turns "hot" on "السلامة"
  const tSafe = R.ws(10, 9) - 0.05;
  const hc = cards[3];
  tl.to(hc, { backgroundImage: 'linear-gradient(165deg, rgba(255,157,46,1), rgba(216,100,0,1))', borderColor: 'rgba(255,230,190,.7)', duration: 0.18 }, tSafe);
  tl.to(hc.querySelector('.ico'), { backgroundImage: 'linear-gradient(160deg, rgba(255,255,255,1), rgba(255,255,255,1))', color: '#f48100', duration: 0.18 }, tSafe);
  tl.to(hc.querySelector('.arl'), { color: '#fff3e0', duration: 0.18 }, tSafe);
  tl.to(hc.querySelector('.num'), { color: 'rgba(255,255,255,.3)', duration: 0.18 }, tSafe);
  tl.fromTo(cards[3], { scale: 1.12 }, { scale: 1, duration: 0.4, ease: 'back.out(3)' }, tSafe);
  R.sfx(tSafe, 'ding', { gain: 0.6 });
  R.leak(tSafe, 1, 800, 950, 0.9, 0.55);

  // exit: cards blow outward
  const tX = 28.18;
  cards.forEach((c, i) => tl.to(c, { x: (i % 2 ? 700 : -700), y: (i < 2 ? -500 : 500), rotation: (i % 2 ? 25 : -25), opacity: 0,
    duration: 0.36, ease: 'power3.in' }, tX));
  tl.to([sch, title], { scale: 1.4, opacity: 0, duration: 0.36, ease: 'power2.in' }, tX);
  tl.to(s, { opacity: 0, duration: 0.25 }, tX + 0.13);
  R.sfx(tX - 0.03, 'whoosh_big', { gain: 0.55 });
})();

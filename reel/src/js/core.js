/* Core engine: one paused GSAP master timeline, seeked frame by frame by the renderer.
   Everything visible must be a pure function of time t (GSAP state + per-frame updaters). */
(function () {
  const R = (window.R = {});
  R.W = 1080; R.H = 1920; R.FPS = 30;
  R.DURATION = 53.4;

  gsap.registerPlugin(CustomEase, CustomWiggle, MotionPathPlugin, DrawSVGPlugin, ScrambleTextPlugin);
  gsap.ticker.lagSmoothing(0);
  gsap.ticker.sleep();
  R.tl = gsap.timeline({ paused: true, defaults: { immediateRender: false } });
  // sentinel: if any child is ever inserted at a negative time GSAP shifts every child later,
  // silently desyncing picture from voice. main.js checks this stays at exactly 1.0.
  R.sentinel = gsap.to({}, { duration: 0.001 });
  R.tl.add(R.sentinel, 1.0);

  // custom eases
  CustomEase.create('pop', 'M0,0 C0.18,1.32 0.4,1.06 0.62,0.98 0.8,0.94 0.9,1 1,1');
  CustomEase.create('slam', 'M0,0 C0.5,0 0.68,0.6 0.78,1 0.84,0.94 0.9,1 1,1');
  CustomEase.create('whip', 'M0,0 C0.62,0 0.25,1 1,1');
  CustomEase.create('expo', 'M0,0 C0.16,1 0.3,1 1,1');
  CustomWiggle.create('shakeOut', { wiggles: 9, type: 'easeOut' });
  CustomWiggle.create('shakeOutY', { wiggles: 7, type: 'easeOut' });

  // ---- voice word timings: R.ws(phrase, wordIndex) = start time, R.we = end time
  R.P = window.PHRASES;
  R.w = (p, i) => R.P[p - 1].words[i];
  R.ws = (p, i) => R.w(p, i).s;
  R.we = (p, i) => R.w(p, i).e;

  // ---- deterministic randomness
  R.rng = function (seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  // ScrambleText etc. call Math.random: reseed per frame so every render of time t is identical
  let mr = R.rng(1);
  Math.random = () => mr();
  R.reseed = (t) => { mr = R.rng(Math.floor(t * 1000) + 7); };

  // ---- DOM helpers
  R.world = document.getElementById('world');
  R.el = function (tag, cls, parent, css, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (css) Object.assign(e.style, css);
    if (html != null) e.innerHTML = html;
    (parent || R.world).appendChild(e);
    return e;
  };
  R.div = (cls, parent, css, html) => R.el('div', cls, parent, css, html);
  R.svgEl = function (tag, attrs, parent) {
    const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const k in attrs || {}) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  R.icon = (name, size = 48, sw = 2.2, extra = '') =>
    `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" stroke-width="${sw}" ${extra}>${window.ICONS[name] || ''}</svg>`;
  R.img = function (src, cls, parent, css) {
    const i = R.el('img', cls, parent, css);
    i.src = src; i.decoding = 'sync'; i.draggable = false;
    R.images.push(i);
    return i;
  };
  R.images = [];
  R.A = '../assets/img/';

  // ---- scene containers (only visible between tIn and tOut)
  R.scenes = [];
  R.scene = function (id, tIn, tOut, css) {
    const s = R.div('scene', R.world, css);
    s.id = id;
    if (tIn <= 0) s.style.visibility = 'visible';
    else R.tl.set(s, { visibility: 'visible' }, tIn);
    R.tl.set(s, { visibility: 'hidden' }, tOut);
    R.scenes.push({ id, tIn, tOut, el: s });
    return s;
  };

  // ---- async resources the renderer must wait for before the first frame
  R.waitFor = [];

  // ---- per-frame updaters (canvas, flip boards, counters...)
  R.updaters = [];
  R.onFrame = (fn) => R.updaters.push(fn);

  // ---- sound cues (read by the audio builder so picture and sound share one clock)
  R.cues = [];
  R.sfx = (t, name, opts) => { R.cues.push(Object.assign({ t: +t.toFixed(3), name }, opts || {})); };

  // ---- camera fx on #world
  R.shake = function (t, amp = 18, dur = 0.45) {
    R.tl.to(R.world, { x: amp, duration: dur, ease: 'shakeOut' }, t);
    R.tl.to(R.world, { y: amp * 0.7, duration: dur, ease: 'shakeOutY' }, t);
  };
  R.punch = function (t, s = 1.045, dur = 0.5) {
    R.tl.fromTo(R.world, { scale: s }, { scale: 1, duration: dur, ease: 'expo.out' }, t);
  };
  R.flash = function (t, peak = 0.85, dur = 0.4, color) {
    const f = document.getElementById('flash');
    if (color) R.tl.set(f, { background: color }, t);
    R.tl.fromTo(f, { opacity: peak }, { opacity: 0, duration: dur, ease: 'power2.out' }, t);
    if (color) R.tl.set(f, { background: '#fff' }, t + dur);
  };
  R.leak = function (t, which = 1, x = 540, y = 600, dur = 1.0, peak = 0.75) {
    const l = document.getElementById('leak' + which);
    R.tl.set(l, { left: x - 700, top: y - 700, scale: 0.6 }, t);
    R.tl.to(l, { opacity: peak, scale: 1, duration: dur * 0.35, ease: 'power2.out' }, t);
    R.tl.to(l, { opacity: 0, scale: 1.25, x: 120, duration: dur * 0.65, ease: 'power1.in' }, t + dur * 0.35);
    R.tl.set(l, { x: 0 }, t + dur + 0.01);
  };

  // ---- seek API used by the renderer
  R.seek = function (t) {
    R.reseed(t);
    R.tl.time(t, false);
    for (const f of R.updaters) f(t);
    const dbg = document.getElementById('debug');
    if (dbg.style.display === 'block') dbg.textContent = t.toFixed(3);
  };
})();

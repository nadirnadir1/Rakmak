/* Motion toolkit: easing, springs, timing helpers, DOM helpers.
   Everything is a pure function of time t (seconds) so any frame can be rendered in isolation. */
(function () {
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const inv = (a, b, x) => (b === a ? (x >= b ? 1 : 0) : clamp((x - a) / (b - a)));
  const mix = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));

  const E = {
    linear: (t) => t,
    inQuad: (t) => t * t,
    outQuad: (t) => 1 - (1 - t) * (1 - t),
    inOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
    inCubic: (t) => t * t * t,
    outCubic: (t) => 1 - Math.pow(1 - t, 3),
    inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    outQuart: (t) => 1 - Math.pow(1 - t, 4),
    inQuart: (t) => t * t * t * t,
    outQuint: (t) => 1 - Math.pow(1 - t, 5),
    inOutQuint: (t) => (t < 0.5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2),
    outExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    inExpo: (t) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
    inOutExpo: (t) =>
      t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
    outBack: (t, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
    outBackStrong: (t) => E.outBack(t, 2.6),
    inBack: (t, s = 1.70158) => (s + 1) * t * t * t - s * t * t,
    outElastic: (t) => {
      const c4 = (2 * Math.PI) / 3;
      return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    },
    inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
    outSine: (t) => Math.sin((t * Math.PI) / 2),
  };

  // damped spring 0 -> 1 (t in seconds since start)
  function spring(t, { k = 220, c = 14, m = 1 } = {}) {
    if (t <= 0) return 0;
    const w0 = Math.sqrt(k / m);
    const z = c / (2 * Math.sqrt(k * m));
    if (z < 1) {
      const wd = w0 * Math.sqrt(1 - z * z);
      return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + ((z * w0) / wd) * Math.sin(wd * t));
    }
    return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
  }

  // progress of an animation that starts at t0 and lasts dur
  const P = (t, t0, dur, ease = E.outCubic) => ease(clamp((t - t0) / dur));
  // visibility envelope: 0 before a, ramps up over fi, 1 until b-fo, ramps down to 0 at b
  const env = (t, a, b, fi = 0.2, fo = 0.2, ei = E.outCubic, eo = E.inCubic) => {
    if (t < a || t > b) return 0;
    const up = fi > 0 ? ei(clamp((t - a) / fi)) : 1;
    const dn = fo > 0 ? 1 - eo(clamp((t - (b - fo)) / fo)) : 1;
    return Math.min(up, dn);
  };

  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  // smooth value noise for camera shake / drifts
  function noise1(x, seed = 1) {
    const i = Math.floor(x);
    const f = x - i;
    const h = (n) => {
      const s = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453;
      return s - Math.floor(s);
    };
    const u = f * f * (3 - 2 * f);
    return lerp(h(i), h(i + 1), u) * 2 - 1;
  }

  // ------------------------------------------------------------- DOM helpers
  function h(tag, attrs = {}, ...kids) {
    const isSvg = ['svg', 'path', 'circle', 'g', 'line', 'rect', 'defs', 'linearGradient', 'radialGradient', 'stop',
      'filter', 'feGaussianBlur', 'feColorMatrix', 'feMerge', 'feMergeNode', 'text', 'polygon', 'polyline',
      'clipPath', 'mask', 'ellipse', 'image', 'use', 'pattern', 'feOffset', 'feComponentTransfer', 'feTurbulence',
      'feDisplacementMap', 'tspan', 'textPath'].includes(tag);
    const el = isSvg ? document.createElementNS('http://www.w3.org/2000/svg', tag) : document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === undefined || v === null) continue;
      if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k === 'class') el.setAttribute('class', v);
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'text') el.textContent = v;
      else el.setAttribute(k, v);
    }
    for (const kid of kids.flat()) {
      if (kid === null || kid === undefined) continue;
      el.appendChild(typeof kid === 'string' ? document.createTextNode(kid) : kid);
    }
    return el;
  }

  const S = (el, o) => {
    for (const k in o) el.style[k] = o[k];
    return el;
  };

  // transform string builder
  function T({ x = 0, y = 0, z = 0, s = 1, sx = 1, sy = 1, r = 0, rx = 0, ry = 0, skx = 0, persp = 0, ox, oy } = {}) {
    let str = '';
    if (persp) str += `perspective(${persp}px) `;
    str += `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(1)}px)`;
    if (rx) str += ` rotateX(${rx.toFixed(3)}deg)`;
    if (ry) str += ` rotateY(${ry.toFixed(3)}deg)`;
    if (r) str += ` rotate(${r.toFixed(3)}deg)`;
    if (skx) str += ` skewX(${skx.toFixed(3)}deg)`;
    const S1 = s * sx;
    const S2 = s * sy;
    if (S1 !== 1 || S2 !== 1) str += ` scale(${S1.toFixed(4)}, ${S2.toFixed(4)})`;
    return str;
  }

  function show(el, on) {
    const d = on ? '' : 'none';
    if (el.style.display !== d) el.style.display = d;
  }

  window.M = { clamp, lerp, inv, mix, E, spring, P, env, rng, noise1, h, S, T, show };
})();

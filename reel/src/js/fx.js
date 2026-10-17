/* Global overlays and reusable effects (all deterministic in t). */
(function () {
  const R = window.R;

  // film grain: jump to a new random offset every video frame
  const grain = document.getElementById('grain');
  R.onFrame((t) => {
    const f = Math.floor(t * R.FPS + 1e-6);
    const r = R.rng(f * 7919 + 13);
    grain.style.transform = `translate(${Math.floor(r() * 64)}px, ${Math.floor(r() * 64)}px)`;
  });

  // floating bokeh / dust particles on a canvas, alive between t0 and t1
  R.particles = function (parent, opts) {
    const o = Object.assign({ n: 60, t0: 0, t1: 99, seed: 1, color: '255,255,255', minR: 1.5, maxR: 6,
      speed: 40, alpha: 0.5, blurBig: true, w: R.W, h: R.H, drift: 1 }, opts);
    const c = R.el('canvas', 'abs', parent, { left: 0, top: 0 });
    c.width = o.w; c.height = o.h;
    const ctx = c.getContext('2d');
    const rnd = R.rng(o.seed);
    const ps = Array.from({ length: o.n }, () => ({
      x: rnd() * o.w, y: rnd() * o.h, r: o.minR + Math.pow(rnd(), 2.2) * (o.maxR - o.minR),
      vy: -(0.4 + rnd()) * o.speed, vx: (rnd() - 0.5) * o.speed * 0.6 * o.drift, ph: rnd() * 6.28, tw: 0.6 + rnd() * 1.8,
    }));
    R.onFrame((t) => {
      if (t < o.t0 - 0.05 || t > o.t1 + 0.05) return;
      ctx.clearRect(0, 0, o.w, o.h);
      const lt = t - o.t0;
      for (const p of ps) {
        let x = (p.x + p.vx * lt) % o.w; if (x < 0) x += o.w;
        let y = (p.y + p.vy * lt) % o.h; if (y < 0) y += o.h;
        const a = o.alpha * (0.45 + 0.55 * Math.sin(p.ph + lt * p.tw) ** 2);
        if (p.r > 4 && o.blurBig) {
          const g = ctx.createRadialGradient(x, y, 0, x, y, p.r * 2.2);
          g.addColorStop(0, `rgba(${o.color},${a})`); g.addColorStop(1, `rgba(${o.color},0)`);
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, p.r * 2.2, 0, 6.2832); ctx.fill();
        } else {
          ctx.fillStyle = `rgba(${o.color},${a})`; ctx.beginPath(); ctx.arc(x, y, p.r, 0, 6.2832); ctx.fill();
        }
      }
    });
    return c;
  };

  // burst of small sprites (coins, sparks, hearts) from a point, physics in t
  R.burst = function (parent, opts) {
    const o = Object.assign({ t: 0, x: 540, y: 960, n: 24, seed: 3, speed: 900, gravity: 1600, life: 1.2,
      size: 40, html: '', spin: 720, spread: Math.PI * 2, angle: -Math.PI / 2 }, opts);
    const rnd = R.rng(o.seed);
    const items = [];
    const box = R.div('fill', parent, { zIndex: o.z || 0, pointerEvents: 'none' });
    for (let i = 0; i < o.n; i++) {
      const e = R.div('abs', box, { left: '0px', top: '0px', width: o.size + 'px', height: o.size + 'px', opacity: 0 }, o.html);
      const a = o.angle + (rnd() - 0.5) * o.spread;
      const v = o.speed * (0.45 + rnd() * 0.75);
      items.push({ e, vx: Math.cos(a) * v, vy: Math.sin(a) * v, rot: (rnd() - 0.5) * o.spin, s: 0.6 + rnd() * 0.7, d: rnd() * 0.08 });
    }
    R.onFrame((t) => {
      for (const it of items) {
        const lt = t - o.t - it.d;
        if (lt < 0 || lt > o.life) { it.e.style.opacity = 0; continue; }
        const x = o.x + it.vx * lt, y = o.y + it.vy * lt + 0.5 * o.gravity * lt * lt;
        const fade = lt > o.life * 0.7 ? 1 - (lt - o.life * 0.7) / (o.life * 0.3) : 1;
        const sc = it.s * Math.min(1, lt / 0.08);
        it.e.style.opacity = fade;
        it.e.style.transform = `translate(${x - o.size / 2}px, ${y - o.size / 2}px) rotate(${it.rot * lt}deg) scale(${sc})`;
      }
    });
  };

  // drifting cloud sprites across a container between t0 and t1
  R.cloudLayer = function (parent, opts) {
    const o = Object.assign({ t0: 0, t1: 10, n: 5, seed: 9, yMin: 0, yMax: 600, sMin: 0.4, sMax: 0.9, speed: 160,
      w: 1000, opacity: 1, blurFar: false }, opts);
    const rnd = R.rng(o.seed);
    const cs = [];
    const box = R.div('fill', parent, { zIndex: o.z || 0 });  // own stacking context
    for (let i = 0; i < o.n; i++) {
      const k = 1 + Math.floor(rnd() * 6);
      const depth = rnd();
      const s = o.sMin + (o.sMax - o.sMin) * depth;
      const img = R.img(`${R.A}fx/cloud${k}.png`, 'abs', box, { left: '0px', top: '0px', transformOrigin: '0 0', opacity: o.opacity * (0.75 + 0.25 * depth) });
      cs.push({ img, s, x0: rnd() * (o.w + 900) - 600, y: o.yMin + rnd() * (o.yMax - o.yMin), v: o.speed * (0.4 + depth * 0.9) });
    }
    cs.sort((a, b) => a.s - b.s).forEach((c, i) => (c.img.style.zIndex = i));
    R.onFrame((t) => {
      if (t < o.t0 - 0.05 || t > o.t1 + 0.05) return;
      const lt = t - o.t0;
      for (const c of cs) {
        const span = o.w + 1400 * c.s;
        let x = c.x0 - c.v * lt;
        x = ((x + 1300 * c.s) % span + span) % span - 1300 * c.s;
        c.img.style.transform = `translate(${x}px, ${c.y}px) scale(${c.s})`;
      }
    });
  };

  // count-up number text (deterministic)
  R.counter = function (el, t0, t1, v0, v1, fmt) {
    R.onFrame((t) => {
      const p = Math.max(0, Math.min(1, (t - t0) / (t1 - t0)));
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(v0 + (v1 - v0) * e);
    });
  };
})();

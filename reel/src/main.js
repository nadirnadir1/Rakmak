/* Frame engine: builds every scene once, then renderFrame(t) sets the whole page for time t. */
(function () {
  const { h, show } = M;

  // timing helpers for scenes: W('word', nth) -> {s, e} in video time
  window.Wt = function (w, nth = 1) {
    let n = 0;
    for (const x of DATA.words) {
      if (x.w === w || x.w.replace(/[؟،?!.,]/g, '') === w) {
        n++;
        if (n === nth) return x;
      }
    }
    throw new Error('word not found: ' + w + ' #' + nth);
  };

  async function init() {
    await document.fonts.ready;
    // make sure every font face we use is actually loaded before measuring text
    const faces = ['900 80px Cairo', '400 80px Lalezar', '800 80px Montserrat', '900 80px Montserrat', '400 80px "Bebas Neue"',
      '700 80px "JetBrains Mono"', '900 80px "Noto Kufi Arabic"', '800 80px Alexandria', '700 80px Oswald', '600 80px Inter'];
    await Promise.all(faces.map((f) => document.fonts.load(f, 'abc أبت 123').catch(() => {})));
    C.FX.build();
    const root = document.getElementById('scenes');
    window.LIVE = [];
    for (const sc of window.SCENES) {
      const el = h('div', { class: 'scene', id: sc.id, style: { zIndex: sc.z || 1 } });
      root.appendChild(el);
      const update = sc.build(el);
      LIVE.push({ ...sc, el, update });
      show(el, false);
    }
    window.CAPS = Captions.build(document.getElementById('captions'));
    window.__ready = true;
  }

  // EFH logo pinned in the top header; steps aside while the big logo is on screen
  function updateHeader(t) {
    const hd = document.getElementById('header');
    const hidden = [[49.0, 51.02], [56.3, 99]];
    let o = 1;
    for (const [a, b] of hidden) {
      o = Math.min(o, 1 - M.env(t, a, b, 0.18, 0.18));
    }
    hd.style.opacity = o.toFixed(3);
    // a light sweep across the logo on the big beats
    const sh = hd.querySelector('.hshine');
    let p = -1;
    for (const tb of [0.15, 12.81, 45.69]) if (t >= tb && t < tb + 0.8) p = (t - tb) / 0.8;
    sh.style.opacity = p < 0 ? 0 : 1;
    sh.style.backgroundPosition = `${(100 - p * 100).toFixed(1)}% 0`;
  }

  window.renderFrame = async function (t) {
    window.__pending = [];
    for (const sc of LIVE) {
      const on = t >= sc.start && t < sc.end;
      show(sc.el, on);
      if (on) sc.update(t);
    }
    CAPS.update(t);
    C.FX.update(t);
    updateHeader(t);
    if (window.__pending.length) await Promise.all(window.__pending);
    // two rAFs so style/layout/paint have settled before the screenshot
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  };

  window.SCENES = window.SCENES || [];
  window.addEventListener('load', () => init().catch((e) => { window.__error = String(e && e.stack || e); }));
})();

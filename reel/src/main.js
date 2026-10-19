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

  window.renderFrame = async function (t) {
    window.__pending = [];
    for (const sc of LIVE) {
      const on = t >= sc.start && t < sc.end;
      show(sc.el, on);
      if (on) sc.update(t);
    }
    CAPS.update(t);
    C.FX.update(t);
    if (window.__pending.length) await Promise.all(window.__pending);
    // two rAFs so style/layout/paint have settled before the screenshot
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  };

  window.SCENES = window.SCENES || [];
  window.addEventListener('load', () => init().catch((e) => { window.__error = String(e && e.stack || e); }));
})();

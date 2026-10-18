/* Bootstrap: build captions, wait for fonts + images, expose window.REEL for the renderer. */
(function () {
  const R = window.R;
  // cinematic light leaks on the big transitions (orange = warm moments, blue = tech/space)
  [[0.02, 1, 900, 300, 0.9, 0.55], [7.12, 2, 300, 900, 1.0, 0.6], [11.02, 1, 800, 500, 0.9, 0.5], [14.62, 2, 200, 400, 0.9, 0.5],
   [28.4, 1, 540, 1300, 1.1, 0.7], [33.4, 2, 540, 600, 1.0, 0.6], [38.68, 1, 900, 300, 0.9, 0.5], [43.02, 2, 300, 700, 1.0, 0.55],
   [3.6, 1, 900, 700, 0.8, 0.5], [47.2, 2, 540, 1200, 1.0, 0.5]]
    .forEach(([t, w, x, y, d, p]) => R.leak(t, w, x, y, d, p));
  (R.afterBuild || []).forEach((f) => f());

  async function ready() {
    const faces = ['800 76px Alexandria', '700 40px Alexandria', '900 50px Montserrat', '800 30px Montserrat',
      '700 30px Montserrat', '600 20px Montserrat', '500 20px Montserrat', '700 46px "Barlow Condensed"',
      '800 40px "Barlow Condensed"', '900 60px Montserrat', '800 30px "JetBrains Mono"', '900 46px Montserrat'];
    await Promise.all(faces.map((f) => document.fonts.load(f, 'Aa0 عربي')));
    await document.fonts.ready;
    R.buildCaptions(42.99 + 0.35);  // after fonts: captions measure their width
    await Promise.all(R.images.map((i) => (i.complete ? Promise.resolve() : new Promise((res) => { i.onload = i.onerror = res; }))
      .then(() => i.decode().catch(() => {}))));
    await Promise.all(R.waitFor);
    if (Math.abs(R.sentinel.startTime() - 1.0) > 1e-6) throw new Error('timeline shifted by ' + (R.sentinel.startTime() - 1.0));
    // warm-up: run through the whole timeline once so every tween records its start values in order
    for (let t = 0; t <= R.DURATION; t += 0.25) R.seek(t);
    R.seek(0);
    return true;
  }
  window.REEL = {
    duration: R.DURATION, fps: R.FPS, cues: R.cues,
    ready: ready(),
    seek: (t) => { R.seek(t); return Promise.all(R.pending.splice(0)); },
    debug: (on) => { document.getElementById('debug').style.display = on ? 'block' : 'none'; },
    captions: (on) => { document.getElementById('captions').style.display = on ? '' : 'none'; },
  };
})();

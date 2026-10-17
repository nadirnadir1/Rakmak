/* Arabic karaoke captions: pages of 1-4 words, active word gets an orange pill highlight. */
(function () {
  const R = window.R;
  const root = document.getElementById('captions');

  // words per caption page, per phrase (phrases are pause-delimited)
  const SPLITS = {
    1: [4, 3, 3], 2: [3, 3], 3: [2], 4: [2, 2, 3], 5: [2, 2, 2], 6: [3, 2], 7: [3],
    8: [2, 2, 2, 2], 9: [1], 10: [3, 2, 2, 3], 11: [1, 4, 4, 2], 12: [3, 2, 2, 3], 13: [3, 2, 3],
  };
  // special highlight colours
  const SPECIAL = {
    'كابين': 'blue', 'كرو': 'blue', 'فلاي': 'blue', 'الحياني': 'blue', 'لا!': 'red', 'السلامة': 'blue',
  };
  const HL = {
    blue: 'linear-gradient(180deg,#2f80ff,#0b4fd6)', red: 'linear-gradient(180deg,#ff4d4d,#d61f2c)',
  };
  const clean = (w) => w.replace(/[،.:]/g, '');

  const pages = [];
  for (const ph of R.P) {
    let k = 0;
    for (const n of SPLITS[ph.id]) {
      pages.push(ph.words.slice(k, k + n));
      k += n;
    }
  }

  R.buildCaptions = function (tStop) {
    pages.forEach((words, pi) => {
      const page = R.div('cap-page', root);
      const spans = words.map((w) => {
        const txt = clean(w.w);
        const wd = R.div('cap-word', page, null, `<div class="hl"></div><span class="t">${txt}</span>`);
        const sp = SPECIAL[txt];
        if (sp) wd.querySelector('.hl').style.background = HL[sp];
        return { wd, hl: wd.querySelector('.hl'), w };
      });
      // fit: shrink long pages
      const natural = spans.reduce((a, s) => a + s.wd.offsetWidth, 0) + 18 * (spans.length - 1);
      if (natural > 880) spans.forEach((s) => (s.wd.style.fontSize = Math.max(56, Math.floor(76 * 880 / natural)) + 'px'));

      const first = words[0].s, last = words[words.length - 1].e;
      const next = pages[pi + 1];
      const tIn = Math.max(0, first - 0.12);  // never negative: GSAP would shift the whole timeline
      let tOut = next && next[0].s - 0.12 - last < 0.75 ? next[0].s - 0.12 : last + 0.3;
      tOut = Math.min(tOut, tStop);

      R.tl.set(page, { visibility: 'visible' }, tIn);
      R.tl.set(page, { visibility: 'hidden' }, tOut);
      spans.forEach((s, i) => {
        gsap.set(s.wd, { opacity: 0, y: 46, scale: 0.8 });
        R.tl.to(s.wd, { opacity: 0.6, y: 0, scale: 1, duration: 0.24, ease: 'back.out(2.2)' }, tIn + i * 0.035);
        const on = s.w.s - 0.04;
        const off = i < spans.length - 1 ? words[i + 1].s - 0.04 : Math.min(tOut, s.w.e + 0.15);
        R.tl.to(s.wd, { opacity: 1, scale: 1.08, duration: 0.12, ease: 'power2.out' }, on);
        R.tl.fromTo(s.hl, { scaleX: 0, transformOrigin: '100% 50%' }, { scaleX: 1, duration: 0.14, ease: 'power3.out' }, on);
        R.tl.to(s.wd, { scale: 1, duration: 0.16, ease: 'power2.out' }, off);
        R.tl.to(s.hl, { scaleX: 0, transformOrigin: '0% 50%', duration: 0.14, ease: 'power2.in' }, off);
      });
      R.tl.to(page, { opacity: 0, y: -18, duration: 0.1, ease: 'power1.in' }, tOut - 0.1);
      R.tl.set(page, { opacity: 1, y: 0 }, tOut + 0.01);
    });
  };
})();

/* Persistent brand header: the EFH logo pinned at the top of the frame for the whole reel
   (hidden only while the big logo is built in S10, which then flies into this exact slot). */
(function () {
  const R = window.R, tl = R.tl;
  const L = window.LOGO;
  R.HEADER = { x: 320, y: 112, w: 440 };              // logo box in stage pixels
  R.HEADER.h = R.HEADER.w * L.h / L.w;

  const hdr = document.getElementById('header');
  R.div('hdr-shade', hdr);                              // soft top gradient for contrast on bright scenes
  const box = R.div('abs', hdr, { left: R.HEADER.x + 'px', top: R.HEADER.y + 'px', width: R.HEADER.w + 'px', height: R.HEADER.h + 'px' });
  const svg = R.svgEl('svg', { viewBox: `0 0 ${L.w} ${L.h}`, width: R.HEADER.w, height: R.HEADER.h, class: 'logo-svg' }, box);
  svg.style.filter = 'drop-shadow(0 6px 18px rgba(0,0,0,.45))';
  const defs = R.svgEl('defs', {}, svg);
  const clip = R.svgEl('clipPath', { id: 'hdrClip' }, defs);
  const grad = R.svgEl('linearGradient', { id: 'hdrShine', x1: '0', x2: '1', y1: '0', y2: '0' }, defs);
  [['0', 0], ['0.5', 0.9], ['1', 0]].forEach(([o, a]) => R.svgEl('stop', { offset: o, 'stop-color': '#fff', 'stop-opacity': a }, grad));
  for (const p of Object.values(L.parts)) {
    R.svgEl('path', { d: p.d, fill: p.fill, 'fill-rule': 'evenodd' }, svg);
    R.svgEl('path', { d: p.d, 'fill-rule': 'evenodd' }, clip);
  }
  const shine = R.svgEl('rect', { x: -300, y: 0, width: 200, height: L.h, fill: 'url(#hdrShine)', 'clip-path': 'url(#hdrClip)', transform: 'skewX(-20)' }, svg);
  R.headerBox = box;

  // a shine sweep across the header logo at time t
  R.headerShine = (t) => tl.fromTo(shine, { attr: { x: -300 } }, { attr: { x: 1900 }, duration: 0.8, ease: 'power2.inOut' }, t);
  // hide / show the header logo
  R.headerHide = (t, d = 0.15) => tl.to(box, { opacity: 0, duration: d }, t);
  R.headerShow = (t, d = 0.15) => tl.to(box, { opacity: 1, duration: d }, t);

  // frame 0: already on screen (identity from the first frame), quick settle + shine
  tl.fromTo(box, { y: -12, scale: 0.94 }, { y: 0, scale: 1, duration: 0.45, ease: 'back.out(2)' }, 0);
  R.headerShine(0.35);
})();

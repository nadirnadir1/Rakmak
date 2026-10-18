/* Video clips as pre-graded JPEG sequences: frame-accurate for the seeked timeline.
   R.clip(parent, { dir, n, fps, t0, css }) -> <img> showing frame floor((t - t0) * fps), clamped. */
(function () {
  const R = window.R;
  R.clip = function (parent, o) {
    const fps = o.fps || 24;
    const src = (i) => `${R.A}../clips/${o.dir}/f_${String(i).padStart(3, '0')}.jpg`;
    const img = R.img(src(0), 'abs', parent, o.css);
    let cur = 0;
    R.onFrame((t) => {
      const i = Math.max(0, Math.min(o.n - 1, Math.floor((t - (o.t0 || 0)) * fps + 1e-6)));
      if (i === cur) return;
      cur = i;
      img.src = src(i);
      R.pending.push(img.decode().catch(() => {}));
    });
    return img;
  };
})();

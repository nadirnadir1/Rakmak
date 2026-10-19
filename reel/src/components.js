/* Reusable building blocks: video-frame clip views, flags, badges, icons, global FX. */
(function () {
  const { h, S, T, clamp, lerp, P, E, env, inv, show, noise1 } = M;
  const FR = '../build/frames/';
  const IMG = '../assets/img/';
  const SRC = '../assets/src/';
  window.__pending = [];

  // ---------------------------------------------------------------- video frames
  const CLIPS = {
    v1: { fps: 24, count: 240 }, v2: { fps: 24, count: 240 }, v3: { fps: 24, count: 240 }, v4: { fps: 24, count: 240 },
    v5: { fps: 24, count: 240 }, v6: { fps: 24, count: 240 }, v7: { fps: 24, count: 240 },
    v6slow: { fps: 96, count: 171, offset: 5.6 }, // covers source 5.6s..7.4s
  };

  function ClipView(parent, { x = 0, y = 0, w = 1080, h: hh = 1920, radius = 0, cls = '', z } = {}) {
    const el = h('div', { class: 'clip ' + cls, style: { left: x + 'px', top: y + 'px', width: w + 'px', height: hh + 'px', borderRadius: radius + 'px', zIndex: z } });
    const img = h('img', { class: 'frame', style: { width: '2560px', height: '1440px' } });
    el.appendChild(img);
    parent.appendChild(el);
    let cur = '';
    const api = {
      el, img, w, h: hh,
      /** src clip id, ct = source time (s). cx/cy = focus point (0..1) of the source kept centred, zoom >= 1 */
      set(src, ct, { cx = 0.5, cy = 0.5, zoom = 1, dx = 0, dy = 0 } = {}) {
        const c = CLIPS[src];
        const local = ct - (c.offset || 0);
        const idx = clamp(Math.floor(local * c.fps + 1e-6) + 1, 1, c.count);
        const path = FR + src + '/' + String(idx).padStart(5, '0') + '.jpg';
        if (path !== cur) {
          cur = path;
          img.src = path;
          window.__pending.push(img.decode().catch(() => {}));
        }
        const SW = 2560, SH = 1440;
        const sc = Math.max(api.w / SW, api.h / SH) * zoom;
        const dw = SW * sc, dh = SH * sc;
        let tx = api.w / 2 - cx * dw + dx, ty = api.h / 2 - cy * dh + dy;
        tx = Math.min(0, Math.max(api.w - dw, tx));
        ty = Math.min(0, Math.max(api.h - dh, ty));
        img.style.transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${sc.toFixed(5)})`;
      },
      size(w, hh2) { api.w = w; api.h = hh2; el.style.width = w + 'px'; el.style.height = hh2 + 'px'; },
    };
    return api;
  }

  // ---------------------------------------------------------------- simple image
  const Img = (parent, src, style = {}, cls = 'abs') => {
    const el = h('img', { src: src.startsWith('..') ? src : IMG + src, class: cls, style });
    parent.appendChild(el);
    return el;
  };

  const FLAGS = {
    fr: SRC + 'flag_france.png', uk: SRC + 'flag_uk.png', us: SRC + 'flag_usa.png', ma: SRC + 'flag_morocco.png', es: 'es',
  };
  // Spain civil flag (red-yellow-red 1:2:1) drawn as an SVG data URI
  const ES_SVG = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="750" height="500" viewBox="0 0 750 500"><rect width="750" height="500" fill="#AA151B"/><rect y="125" width="750" height="250" fill="#F1BF00"/></svg>');
  const flagURL = (k) => (k === 'es' ? ES_SVG : FLAGS[k]);

  function FlagCircle(parent, k, size = 120, style = {}) {
    const el = h('div', { class: 'flag-circle', style: { width: size + 'px', height: size + 'px', backgroundImage: `url("${flagURL(k)}")`, ...style } });
    parent.appendChild(el);
    return el;
  }

  // Waving flag on a canvas (vertical strips displaced by a travelling sine + shading)
  function WavingFlag(parent, k, { w = 900, h: hh = 600, x = 90, y = 600 } = {}) {
    const cv = h('canvas', { width: w + 80, height: hh + 120, class: 'abs', style: { left: x - 40 + 'px', top: y - 60 + 'px' } });
    parent.appendChild(cv);
    const ctx = cv.getContext('2d');
    const img = new Image();
    img.src = flagURL(k);
    window.__pending.push(img.decode().catch(() => {}));
    return {
      el: cv,
      draw(t, amp = 1) {
        if (!img.complete) return;
        ctx.clearRect(0, 0, cv.width, cv.height);
        const strips = 120;
        const sw = w / strips;
        for (let i = 0; i < strips; i++) {
          const u = i / strips;
          const ph = u * 7.5 - t * 6.0;
          const a = amp * (0.15 + 0.85 * u);
          const dy = Math.sin(ph) * 26 * a;
          const shade = Math.cos(ph) * 0.22 * a;
          const sx = (img.naturalWidth * i) / strips;
          const sW = img.naturalWidth / strips + 1;
          ctx.drawImage(img, sx, 0, sW, img.naturalHeight, 40 + i * sw, 60 + dy, sw + 1, hh);
          if (shade !== 0) {
            ctx.fillStyle = shade > 0 ? `rgba(255,255,255,${shade * 0.55})` : `rgba(0,0,0,${-shade})`;
            ctx.fillRect(40 + i * sw, 60 + dy, sw + 1, hh);
          }
        }
      },
    };
  }

  // ---------------------------------------------------------------- icons (inline SVG)
  const ICON = {
    plane: (c = '#fff') => `<svg viewBox="0 0 24 24"><path fill="${c}" d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>`,
    check: (c = '#fff') => `<svg viewBox="0 0 24 24"><path fill="none" stroke="${c}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" d="M5 12.5l4.5 4.5L19 7.5"/></svg>`,
    cross: (c = '#fff') => `<svg viewBox="0 0 24 24"><path fill="none" stroke="${c}" stroke-width="3.2" stroke-linecap="round" d="M6 6l12 12M18 6L6 18"/></svg>`,
    phone: (c = '#fff') => `<svg viewBox="0 0 24 24"><path fill="${c}" d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z"/></svg>`,
    globe: (c = '#fff') => `<svg viewBox="0 0 24 24"><g fill="none" stroke="${c}" stroke-width="1.9"><circle cx="12" cy="12" r="9.2"/><path d="M2.8 12h18.4M12 2.8c2.6 2.8 3.9 5.9 3.9 9.2s-1.3 6.4-3.9 9.2M12 2.8C9.4 5.6 8.1 8.7 8.1 12s1.3 6.4 3.9 9.2"/></g></svg>`,
    pin: (c = '#fff') => `<svg viewBox="0 0 24 24"><path fill="${c}" d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>`,
    insta: (c = '#fff') => `<svg viewBox="0 0 24 24"><g fill="none" stroke="${c}" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/></g><circle cx="17.4" cy="6.6" r="1.3" fill="${c}"/></svg>`,
    calendar: (c = '#fff') => `<svg viewBox="0 0 24 24"><g fill="none" stroke="${c}" stroke-width="2"><rect x="3" y="4.5" width="18" height="16" rx="3"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/></g></svg>`,
    clock: (c = '#fff') => `<svg viewBox="0 0 24 24"><g fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/></g></svg>`,
    doc: (c = '#fff') => `<svg viewBox="0 0 24 24"><g fill="none" stroke="${c}" stroke-width="2" stroke-linejoin="round"><path d="M6 2.8h8l4 4V21H6z"/><path d="M14 2.8V7h4M9 12h6M9 16h6"/></g></svg>`,
    suitcase: (c = '#fff') => `<svg viewBox="0 0 24 24"><g fill="none" stroke="${c}" stroke-width="2" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M9 7V4.5h6V7M3 12.5h18"/></g></svg>`,
    palm: (c = '#fff') => `<svg viewBox="0 0 24 24"><g fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21c0-5 .5-8 1.5-11"/><path d="M13.5 10C12 6 8 5 4.5 6.5c3 0 6 1 9 3.5zM13.5 10c1.5-4 5.5-5 9-3.5-3 0-6 1-9 3.5zM13.5 10c-3-1-6.5 0-8 3 2.5-1.5 5.5-2 8-3zM13.5 10c3-1 6 .5 7 3.5-2-1.5-4.5-2.5-7-3.5z"/><path d="M5 21h14"/></g></svg>`,
    lock: (c = '#fff') => `<svg viewBox="0 0 24 24"><g fill="none" stroke="${c}" stroke-width="2.2"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></g></svg>`,
    star: (c = '#fff') => `<svg viewBox="0 0 24 24"><path fill="${c}" d="M12 2.5l2.9 6.2 6.6.7-5 4.5 1.4 6.6L12 17.2l-5.9 3.3 1.4-6.6-5-4.5 6.6-.7z"/></svg>`,
    whatsapp: (c = '#fff') => `<svg viewBox="0 0 24 24"><path fill="${c}" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 2.9 2.9 0 0 0-.9 2.2 5.1 5.1 0 0 0 1.1 2.7 11.6 11.6 0 0 0 4.4 3.9c1.6.7 2.3.8 3.1.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .2-1.2c-.1-.1-.3-.2-.5-.3z"/></svg>`,
  };
  const Icon = (name, size = 48, c = '#fff', style = {}) =>
    h('div', { class: 'abs', html: ICON[name](c), style: { width: size + 'px', height: size + 'px', ...style } });

  // crew wings emblem (SVG)
  const WINGS = (c = '#f5c86b') => `<svg viewBox="0 0 240 70"><g fill="${c}">
    <path d="M120 22c-6 0-10 6-10 13s4 13 10 13 10-6 10-13-4-13-10-13z"/>
    ${[0, 1, 2, 3, 4].map((i) => `<path d="M108 ${26 + i * 6} C ${84 - i * 6} ${18 + i * 7}, ${50 - i * 9} ${14 + i * 8}, ${10 + i * 14} ${12 + i * 9} C ${46 - i * 6} ${24 + i * 7}, ${80 - i * 4} ${32 + i * 6}, 108 ${36 + i * 6} z"/>`).join('')}
    ${[0, 1, 2, 3, 4].map((i) => `<path d="M132 ${26 + i * 6} C ${156 + i * 6} ${18 + i * 7}, ${190 + i * 9} ${14 + i * 8}, ${230 - i * 14} ${12 + i * 9} C ${194 + i * 6} ${24 + i * 7}, ${160 + i * 4} ${32 + i * 6}, 132 ${36 + i * 6} z"/>`).join('')}
  </g></svg>`;

  // ---------------------------------------------------------------- global FX (grain, flashes, shake)
  const FX = {
    flashes: [], shakes: [], leaks: [],
    build() {
      const g = document.getElementById('grain');
      const cv = document.createElement('canvas');
      cv.width = cv.height = 256;
      const cx = cv.getContext('2d');
      const im = cx.createImageData(256, 256);
      const r = M.rng(99);
      for (let i = 0; i < im.data.length; i += 4) {
        const v = Math.floor(r() * 255);
        im.data[i] = im.data[i + 1] = im.data[i + 2] = v;
        im.data[i + 3] = 255;
      }
      cx.putImageData(im, 0, 0);
      g.style.backgroundImage = `url(${cv.toDataURL()})`;
      g.style.backgroundSize = '256px 256px';
      const fx = document.getElementById('fx');
      this.flashEl = h('div', { class: 'flash' });
      fx.appendChild(this.flashEl);
      this.leakEl = h('div', { class: 'leak' });
      fx.appendChild(this.leakEl);
    },
    update(t) {
      const r = M.rng(Math.floor(t * 30) + 7);
      document.getElementById('grain').style.backgroundPosition = `${Math.floor(r() * 256)}px ${Math.floor(r() * 256)}px`;
      // flashes
      let fo = 0;
      for (const f of this.flashes) {
        if (t >= f.t - (f.pre || 0) && t < f.t + f.d) {
          const v = t < f.t ? inv(f.t - f.pre, f.t, t) : 1 - E.outCubic(inv(f.t, f.t + f.d, t));
          fo = Math.max(fo, v * (f.a || 1));
        }
      }
      this.flashEl.style.opacity = fo.toFixed(3);
      this.flashEl.style.background = fo > 0 ? '#fff' : '';
      // light leak
      let lo = 0, lx = 0, ly = 0, lc = '255,150,40';
      for (const l of this.leaks) {
        if (t >= l.t && t < l.t + l.d) {
          const u = (t - l.t) / l.d;
          lo = Math.sin(Math.PI * u) * (l.a || 0.7);
          lx = lerp(l.x0, l.x1, u);
          ly = lerp(l.y0, l.y1, u);
          lc = l.c || lc;
        }
      }
      S(this.leakEl, {
        opacity: lo.toFixed(3), left: lx - 800 + 'px', top: ly - 800 + 'px',
        background: `radial-gradient(circle, rgba(${lc},0.85) 0%, rgba(${lc},0.35) 30%, rgba(${lc},0) 65%)`,
      });
      // camera shake on the scene container
      let sx = 0, sy = 0, rot = 0, zoom = 1;
      for (const s of this.shakes) {
        if (t >= s.t && t < s.t + s.d) {
          const u = (t - s.t) / s.d;
          const a = s.a * Math.pow(1 - u, 2);
          sx += noise1(t * 38, s.t * 7) * a;
          sy += noise1(t * 41, s.t * 11 + 3) * a;
          rot += noise1(t * 30, s.t * 5 + 9) * a * 0.02;
          zoom += (s.z || 0) * Math.pow(1 - u, 3);
        }
      }
      document.getElementById('scenes').style.transform = sx || sy || zoom !== 1 ? `translate(${sx.toFixed(2)}px, ${sy.toFixed(2)}px) rotate(${rot.toFixed(3)}deg) scale(${zoom.toFixed(4)})` : '';
    },
  };

  window.C = { ClipView, Img, FlagCircle, WavingFlag, flagURL, Icon, ICON, WINGS, FX, IMG, SRC };
})();

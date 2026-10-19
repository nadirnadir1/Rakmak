/* Word-by-word Arabic captions (karaoke pop + keyword boxes + hero mode). */
(function () {
  const { h, S, clamp, lerp, P, E, show, spring } = M;

  function build(root) {
    const items = DATA.chunks.map((c) => {
      const el = h('div', { class: 'cap' + (c.style === 'hero' ? ' hero' : '') });
      const units = c.units.map((u) => {
        const sp = h('span', { class: 'w' + (u.box ? ' box' : '') }, u.t);
        if (u.box === 'r') sp.style.setProperty('--boxbg', 'var(--no)');
        if (u.box === 'b') sp.style.setProperty('--boxbg', 'var(--blue-2)');
        el.appendChild(sp);
        return { sp, ...u };
      });
      if (c.emoji) {
        const last = c.units[c.units.length - 1];
        const sp = h('span', { class: 'w emo' }, c.emoji);
        el.appendChild(sp);
        units.push({ sp, t: c.emoji, s: Math.min(last.e - 0.05, last.s + 0.25), e: c.e, emo: true });
      }
      root.appendChild(el);
      return { el, c, units, hgt: 0 };
    });
    // measure once (fonts are loaded before build)
    for (const it of items) {
      it.hgt = it.el.offsetHeight;
      it.el.style.top = it.c.y - it.hgt / 2 + 'px';
      show(it.el, false);
    }

    return {
      items,
      update(t) {
        for (const it of items) {
          const c = it.c;
          const hero = c.style === 'hero';
          const tin = c.s - 0.08;
          const exitDur = hero ? 0.12 : 0.07;
          const on = t >= tin && t < c.e + exitDur;
          show(it.el, on);
          if (!on) continue;
          const xo = P(t, c.e, exitDur, E.inCubic);
          S(it.el, {
            opacity: (1 - xo).toFixed(3),
            transform: `translateY(${(-26 * xo).toFixed(1)}px) scale(${(1 - 0.08 * xo).toFixed(4)})`,
          });
          for (const u of it.units) {
            const t0 = u.s - (hero ? 0.06 : 0.05);
            const lt = t - t0;
            if (lt < 0) {
              u.sp.style.opacity = '0';
              continue;
            }
            const o = clamp(lt / 0.06);
            let sc, ty = 0, rot = 0;
            if (hero) {
              const p = spring(lt, { k: 320, c: 16 });
              sc = lerp(2.3, 1, p);
              rot = lerp(-8, 0, p);
            } else {
              const p = spring(lt, { k: 420, c: 20 });
              sc = lerp(0.35, 1, p);
              ty = lerp(22, 0, p);
            }
            const active = !u.emo && t >= u.s && t < u.e + 0.03;
            if (active && !u.box && !hero) sc *= 1.07;
            u.sp.style.opacity = o.toFixed(3);
            u.sp.style.transform = `translateY(${ty.toFixed(1)}px) rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(4)})`;
            if (u.box) {
              u.sp.style.setProperty('--boxs', E.outBack(clamp(lt / 0.22)).toFixed(3));
              u.sp.style.color = '#fff';
            } else if (!u.emo) {
              u.sp.style.color = active ? '#ffb547' : '#ffffff';
            }
          }
        }
      },
    };
  }

  window.Captions = { build };
})();

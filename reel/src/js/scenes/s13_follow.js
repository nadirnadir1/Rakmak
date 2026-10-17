/* S13 (47.1 – 53.4): Instagram ending. The school's real profile (long screenshot) inside an
   iPhone 18 Pro Max: tap "Follow" -> "Following", then scroll down through the posts. */
(function () {
  const R = window.R, tl = R.tl;
  const T0 = 47.1, T1 = 53.6;
  const s = R.scene('s13', T0, T1, { zIndex: 26, background: 'radial-gradient(ellipse 90% 60% at 50% 42%, #173f95 0%, #0a1f4f 48%, #020817 100%)' });
  // Instagram-coloured glow behind the phone
  R.div('abs', s, { left: '-160px', top: '420px', width: '1400px', height: '1300px', borderRadius: '50%',
    background: 'radial-gradient(ellipse, rgba(253,89,73,.36) 0%, rgba(214,36,159,.26) 30%, rgba(131,58,180,.16) 52%, rgba(131,58,180,0) 70%)' });
  R.particles(s, { n: 40, t0: T0, t1: T1, seed: 131, alpha: 0.45, speed: 26, maxR: 5 });
  gsap.set(s, { opacity: 0 });
  tl.to(s, { opacity: 1, duration: 0.3, ease: 'power1.out' }, T0);

  // CTA above the phone
  const cta = R.div('cta-ig', s, { top: '262px' },
    `تابعونا على إنستغرام <span style="display:inline-block;vertical-align:-10px;width:62px;height:62px;border-radius:18px;
      background:radial-gradient(circle at 30% 107%, #fdf497 0%, #fd5949 45%, #d6249f 60%, #285AEB 90%);margin-right:6px;position:relative">
      <span style="position:absolute;inset:13px;border:5px solid #fff;border-radius:12px"></span>
      <span style="position:absolute;left:21px;top:21px;width:10px;height:10px;border:5px solid #fff;border-radius:50%"></span></span>`);
  gsap.set(cta, { opacity: 0, y: 30 });
  tl.to(cta, { opacity: 1, y: 0, duration: 0.45, ease: 'back.out(2)' }, 47.55);

  // ---------------- iPhone 18 Pro Max ----------------
  const PH = { left: 190, top: 352, w: 700, h: 1452 };
  const phone = R.div('iphone', s, { left: PH.left + 'px', top: PH.top + 'px' });
  [[-6, 300, 64], [-6, 420, 104], [-6, 544, 104]].forEach(([x, y, h]) => R.div('btn', phone, { left: x + 'px', top: y + 'px', height: h + 'px' }));
  [[PH.w - 2, 460, 150], [PH.w - 2, 820, 86]].forEach(([x, y, h]) => R.div('btn', phone, { left: x + 'px', top: y + 'px', height: h + 'px' }));
  const bezel = R.div('bezel', phone);
  const screen = R.div('screen', bezel);
  R.div('island', screen);
  R.div('glare', screen);
  R.div('home-ind', screen);
  // iOS status bar
  R.div('ios-bar', screen, null, `<span>9:41</span><span class="r">
    <svg width="40" height="26" viewBox="0 0 40 26"><rect x="0" y="17" width="7" height="9" rx="2" fill="#000"/><rect x="11" y="12" width="7" height="14" rx="2" fill="#000"/>
      <rect x="22" y="6" width="7" height="20" rx="2" fill="#000"/><rect x="33" y="0" width="7" height="26" rx="2" fill="#000"/></svg>
    <svg width="38" height="28" viewBox="0 0 38 28"><path d="M19 26 L13 19 A9 9 0 0 1 25 19 Z" fill="#000"/><path d="M6.5 12.5 A18 18 0 0 1 31.5 12.5" stroke="#000" stroke-width="4.5" fill="none" stroke-linecap="round"/>
      <path d="M1.5 6.8 A26 26 0 0 1 36.5 6.8" stroke="#000" stroke-width="4.5" fill="none" stroke-linecap="round"/></svg>
    <svg width="58" height="28" viewBox="0 0 58 28"><rect x="1.5" y="1.5" width="48" height="25" rx="7" stroke="#000" stroke-opacity=".45" stroke-width="3" fill="none"/>
      <rect x="5.5" y="5.5" width="40" height="17" rx="4" fill="#000"/><rect x="52" y="9" width="4" height="10" rx="2" fill="#000" fill-opacity=".45"/></svg></span>`);

  // screenshot: pinned Instagram top bar + scrolling body, laid out in screenshot pixels then scaled
  const SW = 644, K = SW / 1080, PIN = 130, BAR = 104;          // screen width, scale, pinned rows, status bar
  const IMG_H = 4328;
  const pinned = R.div('abs', screen, { left: 0, top: BAR + 'px', width: '1080px', height: PIN + 'px', overflow: 'hidden',
    transformOrigin: '0 0', transform: `scale(${K})`, zIndex: 4, background: '#fff' });
  R.img(`${R.A}ig_profile.jpg`, 'abs', pinned, { left: 0, top: 0, width: '1080px' });
  const view = R.div('abs', screen, { left: 0, top: (BAR + PIN * K) + 'px', right: 0, bottom: 0, overflow: 'hidden' });
  const body = R.div('abs', view, { left: 0, top: 0, width: '1080px', height: (IMG_H - PIN) + 'px', transformOrigin: '0 0' });
  R.img(`${R.A}ig_profile.jpg`, 'abs', body, { left: 0, top: -PIN + 'px', width: '1080px' });
  // live Follow button over the screenshot's own (x 32-325, y 900-983)
  const FB = { x: 32, y: 900 - PIN, w: 293, h: 83 };
  const follow = R.div('ig-follow', body, { left: FB.x + 'px', top: FB.y + 'px', width: FB.w + 'px', height: FB.h + 'px' }, '<span class="lbl">Follow</span>');
  const lbl = follow.querySelector('.lbl');
  const followingHtml = `Following <svg width="30" height="30" viewBox="0 0 24 24" stroke="#000" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-top:2px"><path d="m6 9 6 6 6-6"/></svg>`;
  const scrollMax = (IMG_H - PIN) * K - (PH.h - 2 * 15 - 2 * 13 - BAR - PIN * K);
  const sc = { y: 0 };
  R.onFrame((t) => {
    if (t < T0 || t > T1) return;
    body.style.transform = `translate(0px, ${-sc.y}px) scale(${K})`;
    lbl.innerHTML = t >= tTap + 0.06 ? followingHtml : 'Follow';
    if (t >= tTap + 0.06) Object.assign(follow.style, { background: '#eff3f4', color: '#000' });
    else Object.assign(follow.style, { background: '#4a5df9', color: '#fff' });
  });

  // phone rises on the downbeat
  gsap.set(phone, { y: 1100, rotationX: 22, scale: 0.92, transformPerspective: 2200, transformOrigin: '50% 100%' });
  tl.to(phone, { y: 0, rotationX: 0, scale: 1, duration: 0.75, ease: 'expo.out' }, 47.18);
  R.sfx(47.12, 'whoosh_up', { gain: 0.6 });
  R.sfx(47.39, 'impact', { gain: 0.6 });

  // tap Follow
  const tTap = 48.42;
  const touch = R.div('touch', screen, { left: (FB.x + FB.w / 2) * K + 'px', top: (BAR + PIN * K + (FB.y + FB.h / 2) * K) + 'px' });
  gsap.set(touch, { scale: 0, opacity: 0 });
  tl.to(touch, { scale: 1, opacity: 1, duration: 0.18, ease: 'back.out(2)' }, tTap - 0.3);
  tl.to(touch, { scale: 0.78, duration: 0.1, ease: 'power2.in' }, tTap - 0.06);
  tl.to(follow, { scale: 0.94, duration: 0.08, ease: 'power2.in' }, tTap - 0.04);
  tl.to(follow, { scale: 1, duration: 0.3, ease: 'back.out(3)' }, tTap + 0.06);
  tl.to(touch, { scale: 1.6, opacity: 0, duration: 0.35, ease: 'power2.out' }, tTap + 0.06);
  R.sfx(tTap, 'tick', { gain: 0.7 });
  R.sfx(tTap + 0.05, 'like_pop', { gain: 0.6 });
  R.burst(screen, { z: 8, t: tTap + 0.05, x: (FB.x + FB.w / 2) * K, y: BAR + PIN * K + FB.y * K, n: 14, seed: 41, speed: 520, gravity: -150, life: 1.1,
    size: 40, angle: -Math.PI / 2, spread: 2.2, html: `<div style="width:40px;height:40px">${R.icon('heart', 40, 0, 'style="fill:#ff2d55;color:#ff2d55"')}</div>` });

  // scroll down through the grid in two flings
  tl.to(sc, { y: scrollMax * 0.48, duration: 0.95, ease: 'power3.inOut' }, 49.0);
  tl.to(sc, { y: scrollMax, duration: 1.15, ease: 'power3.inOut' }, 50.05);
  R.sfx(49.0, 'swipe', { gain: 0.45 });
  R.sfx(50.05, 'swipe', { gain: 0.45 });

  // final beat: punch, header shine, chime
  const tF = 51.39;
  tl.fromTo(phone, { scale: 1.035 }, { scale: 1, duration: 0.6, ease: 'back.out(3)' }, tF);
  tl.fromTo(cta, { scale: 1.12 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' }, tF);
  R.headerShine(tF);
  R.sfx(tF, 'final_hit', { gain: 0.8 });
  R.sfx(tF + 0.3, 'cabin_chime', { gain: 0.55 });
  tl.to(phone, { y: -14, duration: 1.8, ease: 'sine.inOut' }, tF + 0.2);
})();

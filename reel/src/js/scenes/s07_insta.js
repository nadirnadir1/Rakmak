/* S7 (18.55 – 22.95): "But is this job only travel and nice photos?" -> "No!"
   S6 shrinks into the first post of a phone feed; feed scrolls; shutter flashes; hearts; then a
   hard freeze with a red X. */
(function () {
  const R = window.R, tl = R.tl;
  const T0 = 18.55, T1 = 22.95;
  const s = R.scene('s7', T0, T1, { zIndex: 16 });
  const bgw = R.div('fill', s, { background: 'linear-gradient(170deg, #ffb46b 0%, #f48100 28%, #b8447f 62%, #22318f 100%)' });
  R.particles(bgw, { n: 30, t0: T0, t1: T1, seed: 71, alpha: 0.4, speed: 30, maxR: 7 });

  const phone = R.div('phone', s);
  const screen = R.div('phone-screen', phone);
  const feed = R.div('feed', screen);
  const posts = [
    { who: 'fa2', loc: 'Paris, France', likes: '12,4 k', clone: true },
    { who: 'fa3', loc: 'Dubai, Émirats arabes unis', likes: '9 870', bg: 'linear-gradient(180deg,#ff9a5a 0%,#ffcf8a 55%,#ffe7c4 100%)' },
    { who: 'st2', loc: 'Istanbul, Türkiye', likes: '15,1 k', bg: 'linear-gradient(180deg,#3b8cff 0%,#8cc4ff 60%,#d9ecff 100%)' },
    { who: 'fa1', loc: 'Doha, Qatar', likes: '8 302', bg: 'linear-gradient(180deg,#6b5cff 0%,#ff8fb1 100%)' },
  ];
  const postEls = posts.map((p, i) => {
    const post = R.div('post', feed);
    const head = R.div('post-head', post);
    const av = R.div('post-av', head, null, '<div></div>');
    av.firstChild.style.backgroundImage = `url(${R.A}${p.who}.png)`;
    av.firstChild.style.backgroundSize = '160%'; av.firstChild.style.backgroundPosition = '50% 18%';
    R.div('', head, null, `<div class="post-user">flyhyani.crew</div><div class="post-loc">${R.icon('map-pin', 20, 2.4, 'style="display:inline;vertical-align:-3px"')} ${p.loc}</div>`);
    R.div('', head, { marginLeft: 'auto', font: "900 34px 'Montserrat'", color: '#333' }, '···');
    const img = R.div('post-img', post, { background: p.bg || '#0a1f4f' });
    if (!p.clone) {
      R.div('abs', img, { left: '360px', top: '-120px', width: '420px', height: '420px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,255,255,.85) 0%, rgba(255,255,255,0) 65%)' });
      R.img(`${R.A}${p.who}.png`, 'portrait', img, { width: '560px', left: '48px', top: '30px' });
    }
    const act = R.div('post-actions', post, null,
      `${R.icon('heart', 48, 2.2)}${R.icon('message-circle', 46, 2.2)}${R.icon('send', 44, 2.2)}<div class="likes">♥ <span>${p.likes}</span></div>`);
    return { post, img, act };
  });

  // freeze-frame clone of S6 into the first post (built after all scenes exist)
  const SC = 656 / 1080, CROP = 250;
  R.afterBuild = R.afterBuild || [];
  R.afterBuild.push(() => {
    R.seek(18.5);
    const clone = R.s6.cloneNode(true);
    clone.removeAttribute('id');
    clone.querySelectorAll('canvas').forEach((c) => c.remove());
    Object.assign(clone.style, { visibility: 'inherit', position: 'absolute', left: '0', top: '0', width: '1080px', height: '1920px',
      transformOrigin: '0 0', transform: `translate(0px, ${-CROP * SC}px) scale(${SC})`, clipPath: 'none' });
    postEls[0].img.appendChild(clone);
  });

  // transition in: S6 shrinks exactly into post 1's image while the phone scales in around it
  const tIn = 18.57, dIn = 0.4;
  tl.to(R.s6, { scale: SC, x: 212, y: 276 - CROP * SC, transformOrigin: '0 0', clipPath: `inset(${CROP}px 0px ${1920 - CROP - 560 / SC}px 0px round 0px)`,
    duration: dIn, ease: 'power3.inOut' }, tIn);
  gsap.set(R.s6, { clipPath: 'inset(0px 0px 0px 0px round 0px)' });
  gsap.set(phone, { scale: 1.9, opacity: 0, transformOrigin: '50% 37%' });
  tl.to(phone, { scale: 1, opacity: 1, duration: dIn, ease: 'power3.inOut' }, tIn);
  R.sfx(tIn - 0.02, 'whoosh_rev', { gain: 0.6 });

  // feed scroll
  const tS1 = R.ws(8, 1) - 0.06, tS2 = R.ws(8, 4) - 0.06;
  tl.to(feed, { y: -780, duration: 0.42, ease: 'power3.inOut' }, tS1);
  tl.to(feed, { y: -1560, duration: 0.42, ease: 'power3.inOut' }, tS2);
  R.sfx(tS1, 'swipe', { gain: 0.5 });
  R.sfx(tS2, 'swipe', { gain: 0.5 });

  // camera shutter on "وتصاور"
  const tSh = R.ws(8, 6);
  const sflash = R.div('fill', screen, { background: '#fff', opacity: 0, zIndex: 9 });
  [0, 0.2].forEach((d) => {
    tl.fromTo(sflash, { opacity: 0.95 }, { opacity: 0, duration: 0.18, ease: 'power2.out' }, tSh + d);
    R.sfx(tSh + d, 'shutter', { gain: 0.75 });
  });
  tl.fromTo(phone, { scale: 1.03 }, { scale: 1, duration: 0.3, ease: 'power2.out' }, tSh);

  // double-tap heart + floating hearts on "زوينين"
  const tH = R.ws(8, 7) - 0.04;
  const p3 = postEls[2];
  const bigHeart = R.div('abs', p3.img, { left: '178px', top: '130px', width: '300px', height: '300px', color: '#fff', zIndex: 5,
    filter: 'drop-shadow(0 10px 30px rgba(0,0,0,.35))' }, R.icon('heart', 300, 0, 'style="fill:#fff"'));
  gsap.set(bigHeart, { scale: 0, opacity: 0 });
  tl.to(bigHeart, { scale: 1.15, opacity: 1, duration: 0.22, ease: 'back.out(3)' }, tH);
  tl.to(bigHeart, { scale: 0.9, opacity: 0, duration: 0.3, ease: 'power2.in' }, tH + 0.42);
  const heartIc = p3.act.querySelector('svg');
  tl.to(heartIc, { color: '#ff2d55', fill: '#ff2d55', scale: 1.3, duration: 0.15, ease: 'power2.out' }, tH + 0.05);
  tl.to(heartIc, { scale: 1, duration: 0.2 }, tH + 0.2);
  const likes = p3.act.querySelector('.likes span');
  R.counter(likes, tH, tH + 0.9, 15100, 48900, (v) => (v / 1000).toFixed(1).replace('.', ',') + ' k');
  R.burst(s, { t: tH + 0.05, x: 300, y: 1050, n: 16, seed: 9, speed: 700, gravity: -350, life: 1.4, size: 64, angle: -Math.PI / 2, spread: 1.5,
    html: `<div style="color:#ff2d55;width:64px;height:64px">${R.icon('heart', 64, 0, 'style="fill:#ff2d55"')}</div>`, z: 30 });
  R.sfx(tH, 'like_pop', { gain: 0.7 });

  // "لا!" — freeze, desaturate, red X
  const tNo = R.ws(9, 0);
  tl.set(phone, { filter: 'grayscale(1) brightness(.75)' }, tNo);
  tl.set(bgw, { filter: 'grayscale(.85) brightness(.8)' }, tNo);
  const nope = R.div('nope', s, { zIndex: 40 });
  nope.innerHTML = `<svg viewBox="0 0 200 200" width="520" height="520" style="overflow:visible;filter:drop-shadow(0 18px 40px rgba(0,0,0,.45))">
     <circle cx="100" cy="100" r="88" fill="rgba(214,31,44,.18)" stroke="#ff2b3a" stroke-width="16"/>
     <path class="x1" d="M58 58 L142 142" stroke="#ff2b3a" stroke-width="22" stroke-linecap="round"/>
     <path class="x2" d="M142 58 L58 142" stroke="#ff2b3a" stroke-width="22" stroke-linecap="round"/></svg>`;
  gsap.set(nope, { scale: 2.4, opacity: 0, rotation: -25 });
  tl.to(nope, { scale: 1, opacity: 1, rotation: 0, duration: 0.16, ease: 'power4.in' }, tNo - 0.12);
  R.flash(tNo, 0.55, 0.35, 'rgba(255,30,40,1)');
  R.shake(tNo, 30, 0.45);
  R.sfx(tNo - 0.17, 'scratch', { gain: 0.7 });  // scratch just before the word, boom under it
  R.sfx(tNo, 'impact_big', { gain: 0.75 });

  // exit: phone + X fall away, revealing the blueprint behind
  tl.to([phone, nope], { y: 1700, rotation: 18, duration: 0.45, ease: 'power3.in' }, 22.5);
  tl.to(bgw, { opacity: 0, duration: 0.3, ease: 'power1.in' }, 22.6);
  R.sfx(22.48, 'whoosh_down', { gain: 0.6 });
})();

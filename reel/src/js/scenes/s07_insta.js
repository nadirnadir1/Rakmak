/* S7 (18.55 – 22.95): "But is this job only travel and nice photos?" -> "No!"
   S6 freezes into the first post of a phone feed; the feed flicks through real-looking 4:5 travel
   posts (the school's photos); shutter flashes; double-tap heart; then a hard freeze with a red X. */
(function () {
  const R = window.R, tl = R.tl;
  const T0 = 18.55, T1 = 22.95;
  const s = R.scene('s7', T0, T1, { zIndex: 16 });
  const bgw = R.div('fill', s, { background: 'linear-gradient(170deg, #ffb46b 0%, #f48100 28%, #b8447f 62%, #22318f 100%)' });
  R.particles(bgw, { n: 30, t0: T0, t1: T1, seed: 71, alpha: 0.4, speed: 30, maxR: 7 });

  const PH = { left: 190, top: 262, w: 700, h: 1110 };          // phone frame
  const SCR = { x: PH.left + 22, y: PH.top + 22, w: 656 };       // screen origin
  const POST_H = 1040, HEAD_H = 104, IMG_H = 820;
  const phone = R.div('phone', s, { left: PH.left + 'px', top: PH.top + 'px', width: PH.w + 'px', height: PH.h + 'px' });
  const screen = R.div('phone-screen', phone);
  const feed = R.div('feed', screen);
  const posts = [
    { clone: true, loc: 'Marrakech, Maroc', likes: '12,4 k', av: 'fa2.png' },
    { img: 'paris', loc: 'Paris, France', likes: '18,2 k' },
    { img: 'santorini', loc: 'Santorin, Grèce', likes: '24,9 k' },
    { img: 'newyork', loc: 'New York, États-Unis', likes: '11,7 k' },
    { img: 'rome', loc: 'Rome, Italie', likes: '9 860' },
    { img: 'losangeles', loc: 'Los Angeles, États-Unis', likes: '15,3 k' },
    { img: 'marrakech', loc: 'Marrakech, Maroc', likes: '21,4 k' },
    { img: 'paris', loc: 'Paris, France', likes: '7 410', stub: true },
  ];
  const postEls = posts.map((p) => {
    const post = R.div('post p45', feed);
    const head = R.div('post-head', post);
    const av = R.div('post-av', head, null, '<div></div>');
    const avSrc = p.av ? `${R.A}${p.av}` : `${R.A}travel/${p.img}.jpg`;
    Object.assign(av.firstChild.style, { backgroundImage: `url(${avSrc})`, backgroundSize: p.av ? '160%' : '230%', backgroundPosition: p.av ? '50% 18%' : '50% 22%' });
    R.div('', head, null, `<div class="post-user">flyhyani.crew</div><div class="post-loc">${R.icon('map-pin', 20, 2.4, 'style="display:inline;vertical-align:-3px"')} ${p.loc}</div>`);
    R.div('', head, { marginLeft: 'auto', font: "900 34px 'Montserrat'", color: '#333' }, '···');
    const img = R.div('post-img', post, { background: '#0a1f4f' });
    if (!p.clone && !p.stub) R.img(`${R.A}travel/${p.img}.jpg`, 'ph', img);
    const act = R.div('post-actions', post, null,
      `${R.icon('heart', 48, 2.2)}${R.icon('message-circle', 46, 2.2)}${R.icon('send', 44, 2.2)}<div class="likes">♥ <span>${p.likes}</span></div>`);
    return { post, img, act };
  });

  // freeze-frame clone of S6 into the first post (built after all scenes exist)
  const SC = SCR.w / 1080, CROP = 290;
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
  const imgY = SCR.y + HEAD_H;
  tl.to(R.s6, { scale: SC, x: SCR.x, y: imgY - CROP * SC, transformOrigin: '0 0',
    clipPath: `inset(${CROP}px 0px ${1920 - CROP - IMG_H / SC}px 0px round 0px)`, duration: dIn, ease: 'power3.inOut' }, tIn);
  gsap.set(R.s6, { clipPath: 'inset(0px 0px 0px 0px round 0px)' });
  gsap.set(phone, { scale: 1.9, opacity: 0, transformOrigin: `${PH.w / 2}px ${imgY - PH.top + IMG_H / 2}px` });
  tl.to(phone, { scale: 1, opacity: 1, duration: dIn, ease: 'power3.inOut' }, tIn);
  R.sfx(tIn - 0.02, 'whoosh_rev', { gain: 0.6 });

  // doom-scroll: quick flicks through the travel posts
  const flicks = [R.ws(8, 1) - 0.08, R.ws(8, 3) - 0.08, R.ws(8, 4) - 0.14, R.ws(8, 5) - 0.04, R.ws(8, 6) - 0.29, R.ws(8, 7) - 0.31];  // each flick lands before its beat
  flicks.forEach((t, i) => {
    tl.to(feed, { y: -(i + 1) * POST_H, duration: 0.27, ease: 'power3.inOut' }, t);
    R.sfx(t, 'swipe', { gain: 0.38 });
  });

  // camera shutter on "وتصاور" (lands on the Los Angeles post)
  const tSh = R.ws(8, 6) + 0.02;
  const sflash = R.div('fill', screen, { background: '#fff', opacity: 0, zIndex: 9 });
  [0, 0.17].forEach((d) => {
    tl.fromTo(sflash, { opacity: 0.95 }, { opacity: 0, duration: 0.15, ease: 'power2.out' }, tSh + d);
    R.sfx(tSh + d, 'shutter', { gain: 0.7 });
  });
  tl.fromTo(phone, { scale: 1.03 }, { scale: 1, duration: 0.3, ease: 'power2.out' }, tSh);

  // double-tap heart + floating hearts on "زوينين" (Marrakech post)
  const tH = R.ws(8, 7) - 0.02;
  const pH = postEls[6];
  const bigHeart = R.div('abs', pH.img, { left: '178px', top: '260px', width: '300px', height: '300px', color: '#fff', zIndex: 5,
    filter: 'drop-shadow(0 10px 30px rgba(0,0,0,.35))' }, R.icon('heart', 300, 0, 'style="fill:#fff"'));
  gsap.set(bigHeart, { scale: 0, opacity: 0 });
  tl.to(bigHeart, { scale: 1.15, opacity: 1, duration: 0.22, ease: 'back.out(3)' }, tH);
  tl.to(bigHeart, { scale: 0.9, opacity: 0, duration: 0.3, ease: 'power2.in' }, tH + 0.42);
  const heartIc = pH.act.querySelector('svg');
  tl.to(heartIc, { color: '#ff2d55', fill: '#ff2d55', scale: 1.3, duration: 0.15, ease: 'power2.out' }, tH + 0.05);
  tl.to(heartIc, { scale: 1, duration: 0.2 }, tH + 0.2);
  const likes = pH.act.querySelector('.likes span');
  R.counter(likes, tH, tH + 0.9, 21400, 58600, (v) => (v / 1000).toFixed(1).replace('.', ',') + ' k');
  R.burst(s, { t: tH + 0.05, x: 300, y: SCR.y + POST_H - 70, n: 16, seed: 9, speed: 700, gravity: -350, life: 1.4, size: 64, angle: -Math.PI / 2, spread: 1.5,
    html: `<div style="color:#ff2d55;width:64px;height:64px">${R.icon('heart', 64, 0, 'style="fill:#ff2d55"')}</div>`, z: 30 });
  R.sfx(tH, 'like_pop', { gain: 0.7 });

  // "لا!" — freeze, desaturate, red X
  const tNo = R.ws(9, 0);
  tl.set(phone, { filter: 'grayscale(1) brightness(.75)' }, tNo);
  tl.set(bgw, { filter: 'grayscale(.85) brightness(.8)' }, tNo);
  const nope = R.div('nope', s, { zIndex: 40, top: '820px' });
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

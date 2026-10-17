/* Moroccan passport kit for S5: cover leaf that opens in 3D, visa pages with guilloche security print,
   inked entry stamps (SVG + turbulence ink filter) and a visa sticker. Purely illustrative artwork. */
(function () {
  const R = window.R;
  let uid = 0;

  // shared SVG filters: patchy, slightly rough ink
  R.ppDefs = function (parent) {
    const svg = R.svgEl('svg', { width: 0, height: 0, style: 'position:absolute' }, parent);
    const defs = R.svgEl('defs', {}, svg);
    [[3, 0.85], [11, 0.9], [23, 0.8], [37, 0.95], [51, 0.88], [67, 0.82]].forEach(([seed, fr], i) => {
      const f = R.svgEl('filter', { id: 'ink' + i, x: '-8%', y: '-8%', width: '116%', height: '116%' }, defs);
      R.svgEl('feTurbulence', { type: 'fractalNoise', baseFrequency: fr, numOctaves: 2, seed, result: 'n' }, f);
      R.svgEl('feColorMatrix', { in: 'n', type: 'matrix', values: '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 1.75', result: 'm' }, f);
      R.svgEl('feComposite', { in: 'SourceGraphic', in2: 'm', operator: 'in', result: 't' }, f);
      R.svgEl('feTurbulence', { type: 'fractalNoise', baseFrequency: 0.035, numOctaves: 2, seed: seed + 5, result: 'w' }, f);
      R.svgEl('feDisplacementMap', { in: 't', in2: 'w', scale: 3.5, xChannelSelector: 'R', yChannelSelector: 'G' }, f);
    });
    return svg;
  };

  // guilloche security print (deterministic)
  function guilloche(w, h, color, seed) {
    const rnd = R.rng(seed);
    let p = '';
    for (let k = -2; k < h / 14 + 2; k++) {
      const ph = rnd() * 6.28, amp = 5 + rnd() * 3;
      let d = '';
      for (let x = 0; x <= w; x += 6) {
        const y = k * 14 + amp * Math.sin(x / 23 + ph + k * 0.37) + 2.5 * Math.sin(x / 7.3 + k);
        d += (x ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
      }
      p += `<path d="${d}" />`;
    }
    // central rosette (spirograph)
    let ros = '';
    const cx = w / 2, cy = h * 0.52;
    for (let j = 0; j < 3; j++) {
      let d = '';
      for (let i = 0; i <= 720; i++) {
        const a = (i / 720) * Math.PI * 2;
        const r = 120 + j * 22 + (18 - j * 4) * Math.sin(a * (14 + j * 3));
        d += (i ? 'L' : 'M') + (cx + r * Math.cos(a)).toFixed(1) + ' ' + (cy + r * Math.sin(a)).toFixed(1);
      }
      ros += `<path d="${d}Z" />`;
    }
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="position:absolute;left:0;top:0">
      <g fill="none" stroke="${color}" stroke-width="1" opacity=".55">${p}</g>
      <g fill="none" stroke="${color}" stroke-width="1.1" opacity=".75">${ros}</g></svg>`;
  }

  // one visa page
  R.ppPage = function (parent, side, num, css) {
    const W = 500, H = 710;
    const pg = R.div('pp-page', parent, Object.assign({ width: W + 'px', height: H + 'px' }, css));
    pg.insertAdjacentHTML('beforeend', guilloche(W, H, side === 'L' ? 'rgba(38,120,92,.20)' : 'rgba(170,96,60,.18)', 41 + num));
    R.div('pp-emblem', pg);
    R.div('pp-head', pg, null, 'VISAS <span class="ar">تأشيرات</span>');
    R.div('pp-num', pg, null, String(num));
    R.div('pp-gutter ' + side, pg);
    return pg;
  };

  const date = '17 OCT 2026';
  // inked stamp: kinds 'round' | 'rect' | 'oval'
  R.ppStamp = function (parent, o) {
    const id = 'st' + (uid++);
    const c = o.color, f = `url(#ink${o.ink || 0})`;
    let body = '', w, h;
    if (o.kind === 'round') {
      w = h = 230;
      body = `<defs><path id="${id}a" d="M 35 115 A 80 80 0 1 1 195 115"/><path id="${id}b" d="M 35 115 A 80 80 0 0 0 195 115"/></defs>
        <circle cx="115" cy="115" r="108" fill="none" stroke="${c}" stroke-width="6"/>
        <circle cx="115" cy="115" r="98" fill="none" stroke="${c}" stroke-width="2.2"/>
        <circle cx="115" cy="115" r="62" fill="none" stroke="${c}" stroke-width="2.2"/>
        <text font-family="Barlow Condensed" font-weight="800" font-size="20" letter-spacing="2" fill="${c}"><textPath href="#${id}a" startOffset="50%" text-anchor="middle">${o.top}</textPath></text>
        <text font-family="Barlow Condensed" font-weight="800" font-size="20" letter-spacing="2" fill="${c}" dominant-baseline="hanging"><textPath href="#${id}b" startOffset="50%" text-anchor="middle">${o.bottom}</textPath></text>
        <text x="115" y="100" text-anchor="middle" font-family="Barlow Condensed" font-weight="800" font-size="40" fill="${c}">${o.code}</text>
        <text x="115" y="128" text-anchor="middle" font-family="Barlow Condensed" font-weight="700" font-size="19" fill="${c}">${date}</text>
        <path transform="translate(102 136) scale(1.05)" d="${PLANE}" fill="${c}"/>`;
    } else if (o.kind === 'rect') {
      w = 300; h = 170;
      body = `<rect x="5" y="5" width="290" height="160" rx="14" fill="none" stroke="${c}" stroke-width="6"/>
        <rect x="15" y="15" width="270" height="140" rx="8" fill="none" stroke="${c}" stroke-width="2"/>
        <text x="150" y="50" text-anchor="middle" font-family="Barlow Condensed" font-weight="800" font-size="27" letter-spacing="2" fill="${c}">${o.top}</text>
        <text x="150" y="98" text-anchor="middle" font-family="Barlow Condensed" font-weight="800" font-size="46" letter-spacing="1" fill="${c}">${o.code}</text>
        <line x1="34" y1="112" x2="266" y2="112" stroke="${c}" stroke-width="2"/>
        <text x="150" y="141" text-anchor="middle" font-family="Barlow Condensed" font-weight="700" font-size="23" letter-spacing="2" fill="${c}">${o.bottom} · ${date}</text>`;
    } else {
      w = 300; h = 190;
      body = `<ellipse cx="150" cy="95" rx="144" ry="88" fill="none" stroke="${c}" stroke-width="6"/>
        <ellipse cx="150" cy="95" rx="132" ry="77" fill="none" stroke="${c}" stroke-width="2"/>
        <text x="150" y="62" text-anchor="middle" font-family="Barlow Condensed" font-weight="800" font-size="24" letter-spacing="2" fill="${c}">${o.top}</text>
        <text x="150" y="108" text-anchor="middle" font-family="Barlow Condensed" font-weight="800" font-size="44" fill="${c}">${o.code}</text>
        <text x="150" y="138" text-anchor="middle" font-family="Barlow Condensed" font-weight="700" font-size="21" letter-spacing="2" fill="${c}">${o.bottom}</text>
        <text x="150" y="160" text-anchor="middle" font-family="Barlow Condensed" font-weight="700" font-size="17" fill="${c}">${date}</text>`;
    }
    const el = R.div('pp-stamp', parent, { left: o.x + 'px', top: o.y + 'px', width: w + 'px', height: h + 'px', marginLeft: -w / 2 + 'px', marginTop: -h / 2 + 'px', zIndex: o.z || 5 },
      `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="overflow:visible"><g filter="${f}" opacity="${o.alpha || 0.88}">${body}</g></svg>`);
    return el;
  };
  // lucide-like airplane silhouette (24x24)
  const PLANE = 'M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z';

  // Schengen-style visa sticker (illustrative)
  R.ppVisa = function (parent, o) {
    const W = 440, H = 296;
    const v = R.div('pp-visa', parent, { left: o.x + 'px', top: o.y + 'px', width: W + 'px', height: H + 'px', zIndex: o.z || 3 });
    v.insertAdjacentHTML('beforeend', guilloche(W, H, 'rgba(110,70,160,.22)', 7).replace('opacity=".75"', 'opacity=".35"'));
    R.div('', v, { position: 'absolute', left: '16px', top: '8px', font: "900 46px 'Montserrat'", letterSpacing: '6px', color: '#2b3f86' }, 'VISA');
    R.div('', v, { position: 'absolute', right: '16px', top: '14px', font: "800 19px 'Barlow Condensed'", letterSpacing: '2px', color: '#2b3f86', textAlign: 'right', lineHeight: '1.15' },
      'ÉTATS SCHENGEN<br><span style="font-weight:700;color:#55607a">FRANCE · FRA</span>');
    const ph = R.div('', v, { position: 'absolute', left: '16px', top: '70px', width: '104px', height: '132px', overflow: 'hidden', borderRadius: '4px',
      background: 'linear-gradient(180deg,#dfe7f2,#c9d5e6)', border: '1px solid rgba(40,50,80,.25)' });
    R.img(`${R.A}${o.photo || 'fa2.png'}`, '', ph, { position: 'absolute', width: '170px', left: '-33px', top: '-4px' });
    const f = (k, val, x, y) => R.div('', v, { position: 'absolute', left: x + 'px', top: y + 'px', lineHeight: '1.05' },
      `<div style="font:700 12px 'Barlow Condensed';letter-spacing:1.5px;color:#6a7086">${k}</div><div style="font:800 21px 'Barlow Condensed';letter-spacing:1px;color:#1d2640">${val}</div>`);
    f('VALABLE POUR', 'ÉTATS SCHENGEN', 138, 72);
    f('DU', '17-10-26', 138, 118); f('AU', '16-10-27', 236, 118); f('TYPE', 'C', 340, 118);
    f("NOMBRE D'ENTRÉES", 'MULT', 138, 164); f('DURÉE', '90 JOURS', 276, 164);
    f('NOM, PRÉNOM', 'CABIN CREW · EFH', 16, 208);
    R.div('', v, { position: 'absolute', left: '0', right: '0', bottom: '0', height: '44px', background: 'rgba(255,255,255,.55)',
      font: "600 14.5px 'JetBrains Mono'", letterSpacing: '0.6px', color: '#1d2640', padding: '4px 14px', lineHeight: '18px', whiteSpace: 'nowrap', overflow: 'hidden' },
      'VCFRAEFH&lt;&lt;CABIN&lt;CREW&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;<br>EF20261017MAR8810172F2710168&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;');
    const gloss = R.div('', v, { position: 'absolute', left: '-60%', top: '-20%', width: '40%', height: '140%', transform: 'rotate(20deg)',
      background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.75), rgba(255,255,255,0))', mixBlendMode: 'screen' });
    v.gloss = gloss;
    return v;
  };
})();

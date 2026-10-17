// Vector art for the EFH Marrakech spot. Every function returns an SVG string.
const C = {
  navy: '#0B2E7A', blue: '#0A4BC4', brand: '#003A9B', sky: '#59C3FF', skyLight: '#BDEBFF',
  orange: '#F38100', saffron: '#FFC21A', sun: '#FFD84A', coral: '#FF7A59',
  terra: '#EA7E4E', terraLight: '#F6A273', terraDark: '#D2643A', sand: '#FFF3E2', cream: '#FFF9F0',
  teal: '#14B8A6', green: '#22B45E', greenDark: '#16904A', pink: '#FF8FA3', white: '#FFFFFF',
};

// 8-point star (two squares) centred at cx,cy
function starPts(cx, cy, r, inner = 0.414) {
  const pts = [];
  for (let i = 0; i < 16; i++) {
    const a = (Math.PI / 8) * i - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * (1 - inner * 0.55);
    pts.push((cx + Math.cos(a) * rr).toFixed(2) + ',' + (cy + Math.sin(a) * rr).toFixed(2));
  }
  return pts.join(' ');
}
function khatam(cx, cy, r) { // rub el hizb style star made of two squares
  const s = r / Math.SQRT2;
  const sq = (rot) => {
    const p = [];
    for (let i = 0; i < 4; i++) {
      const a = rot + i * Math.PI / 2;
      p.push((cx + Math.cos(a) * r).toFixed(2) + ',' + (cy + Math.sin(a) * r).toFixed(2));
    }
    return p.join(' ');
  };
  return { a: sq(Math.PI / 4), b: sq(0), s };
}

function zelligeTile(id, size = 120, colors = {}) {
  const c = Object.assign({ bg: C.cream, star: C.blue, cross: C.orange, line: C.white, dot: C.teal }, colors);
  const h = size / 2, r = size * 0.36;
  const k = khatam(h, h, r);
  const kc = (x, y) => khatam(x, y, size * 0.2);
  const corners = [[0, 0], [size, 0], [0, size], [size, size]].map(([x, y]) => {
    const q = kc(x, y);
    return `<polygon points="${q.a}" fill="${c.cross}"/><polygon points="${q.b}" fill="${c.cross}"/>`;
  }).join('');
  return `<pattern id="${id}" width="${size}" height="${size}" patternUnits="userSpaceOnUse">
    <rect width="${size}" height="${size}" fill="${c.bg}"/>
    ${corners}
    <polygon points="${k.a}" fill="${c.star}"/><polygon points="${k.b}" fill="${c.star}"/>
    <polygon points="${starPts(h, h, r * 0.62)}" fill="${c.line}"/>
    <circle cx="${h}" cy="${h}" r="${r * 0.26}" fill="${c.dot}"/>
    <circle cx="${h}" cy="0" r="${size * 0.05}" fill="${c.line}"/><circle cx="${h}" cy="${size}" r="${size * 0.05}" fill="${c.line}"/>
    <circle cx="0" cy="${h}" r="${size * 0.05}" fill="${c.line}"/><circle cx="${size}" cy="${h}" r="${size * 0.05}" fill="${c.line}"/>
  </pattern>`;
}

function star8(r = 50, fill = C.saffron, extra = '') {
  const k = khatam(r, r, r);
  return `<svg viewBox="0 0 ${2 * r} ${2 * r}" ${extra}><polygon points="${k.a}" fill="${fill}"/><polygon points="${k.b}" fill="${fill}"/></svg>`;
}

// ---------- Koutoubia minaret ----------
function koutoubia(main = C.terra, light = C.terraLight, dark = C.terraDark) {
  const merlons = (x0, w, y, n, mh, fill) => {
    let s = ''; const gap = w / (n * 2 - 1);
    for (let i = 0; i < n; i++) {
      const x = x0 + i * gap * 2;
      s += `<path d="M${x} ${y} v-${mh} l${gap / 2} -${mh * 0.45} l${gap / 2} ${mh * 0.45} v${mh} z" fill="${fill}"/>`;
    }
    return s;
  };
  const lobedArch = (x, y, w, h, fill) => { // polylobed blind arch panel
    const r = w / 2;
    return `<path d="M${x} ${y + h} V${y + r} q0 -${r * 0.25} ${r * 0.22} -${r * 0.42} a${r * 0.32} ${r * 0.32} 0 0 1 ${r * 0.42} -${r * 0.42} a${r * 0.36} ${r * 0.36} 0 0 1 ${r * 0.72} 0 a${r * 0.32} ${r * 0.32} 0 0 1 ${r * 0.42} ${r * 0.42} q${r * 0.22} ${r * 0.17} ${r * 0.22} ${r * 0.42} V${y + h} z" fill="${fill}"/>`;
  };
  return `<svg viewBox="0 0 240 1000" xmlns="http://www.w3.org/2000/svg">
    <g>
      <line x1="120" y1="0" x2="120" y2="70" stroke="${C.saffron}" stroke-width="5"/>
      <circle cx="120" cy="18" r="7" fill="${C.saffron}"/><circle cx="120" cy="36" r="9.5" fill="${C.saffron}"/><circle cx="120" cy="58" r="12" fill="${C.saffron}"/>
      <path d="M86 98 Q120 58 154 98 Z" fill="${C.teal}"/>
      ${merlons(80, 80, 112, 4, 14, main)}
      <rect x="80" y="110" width="80" height="120" fill="${main}"/>
      <rect x="138" y="110" width="22" height="120" fill="${dark}"/>
      ${lobedArch(100, 140, 40, 70, light)}
      <rect x="80" y="122" width="80" height="8" fill="${C.teal}"/>
      ${merlons(20, 200, 252, 7, 20, main)}
      <rect x="20" y="250" width="200" height="750" fill="${main}"/>
      <rect x="168" y="250" width="52" height="750" fill="${dark}"/>
      <rect x="20" y="262" width="200" height="22" fill="${C.teal}"/>
      <rect x="20" y="268" width="200" height="4" fill="${C.white}" opacity=".7"/>
      <rect x="40" y="300" width="160" height="150" rx="4" fill="${light}" opacity=".55"/>
      ${lobedArch(58, 318, 56, 118, dark)}${lobedArch(126, 318, 56, 118, dark)}
      ${lobedArch(70, 520, 100, 170, light)}
      ${lobedArch(92, 560, 56, 120, dark)}
      ${lobedArch(66, 760, 46, 90, light)}${lobedArch(128, 760, 46, 90, light)}
      <rect x="20" y="480" width="200" height="6" fill="${light}"/>
      <rect x="20" y="720" width="200" height="6" fill="${light}"/>
    </g></svg>`;
}

// ---------- palm ----------
function palm(lean = 1, tone = 0) {
  const g = tone ? ['#1FA35A', '#168A4A', '#2CC46D'] : [C.green, C.greenDark, '#3BD27C'];
  const fronds = [
    [-150, 40, -205, 140], [-120, -60, -200, -10], [-40, -120, -110, -140], [50, -125, 110, -150],
    [130, -60, 205, -20], [150, 45, 210, 150], [40, 30, 70, 170], [-50, 30, -80, 170],
  ];
  const fr = fronds.map(([cx, cy, ex, ey], i) =>
    `<path d="M150 150 Q${150 + cx} ${150 + cy} ${150 + ex} ${150 + ey} Q${150 + cx * 0.75} ${150 + cy * 0.75 + 34} 150 162 Z" fill="${g[i % 2]}"/>
     <path d="M150 152 Q${150 + cx} ${150 + cy} ${150 + ex} ${150 + ey}" stroke="${g[2]}" stroke-width="4" fill="none" stroke-linecap="round"/>`).join('');
  let rings = '';
  for (let i = 0; i < 14; i++) {
    const t = i / 14, y = 590 - t * 430, x = 150 + lean * 40 * Math.pow(1 - t, 2) - lean * 10;
    rings += `<path d="M${x - 14 + t * 4} ${y} q${14 - t * 4} 9 ${28 - t * 8} 0" stroke="#B7652F" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  }
  return `<svg viewBox="0 0 300 600" xmlns="http://www.w3.org/2000/svg" overflow="visible">
    <path d="M${150 + lean * 30 - 18} 600 Q${150 + lean * 40} 380 ${142} 160 L${158} 160 Q${150 + lean * 40 + 22} 380 ${150 + lean * 30 + 18} 600 Z" fill="#D9853F"/>
    ${rings}
    <g class="crown" style="transform-origin:150px 155px">${fr}
      <circle cx="140" cy="170" r="9" fill="#C9772E"/><circle cx="158" cy="172" r="9" fill="#B5652A"/><circle cx="149" cy="182" r="8" fill="#D9853F"/>
    </g></svg>`;
}

// ---------- ramparts / skyline ----------
function ramparts(w = 1200, h = 300, main = C.terra, light = C.terraLight, dark = C.terraDark, gate = true) {
  let s = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">`;
  const top = 110;
  s += `<rect x="0" y="${top}" width="${w}" height="${h - top}" fill="${main}"/>`;
  // merlons
  for (let x = 0; x < w; x += 46) s += `<path d="M${x + 6} ${top} v-22 l11 -12 l11 12 v22 z" fill="${main}"/>`;
  // bastions
  for (let x = 60; x < w; x += 300) {
    s += `<rect x="${x}" y="${top - 40}" width="96" height="${h}" fill="${light}"/>`;
    for (let i = 0; i < 3; i++) s += `<path d="M${x + 6 + i * 32} ${top - 40} v-20 l10 -11 l10 11 v20 z" fill="${light}"/>`;
    s += `<rect x="${x + 40}" y="${top}" width="14" height="34" rx="7" fill="${dark}"/>`;
  }
  if (gate) {
    const gx = w / 2, gw = 170;
    s += `<rect x="${gx - gw / 2 - 40}" y="${top - 24}" width="${gw + 80}" height="${h}" fill="${light}"/>`;
    for (let i = 0; i < 6; i++) s += `<path d="M${gx - gw / 2 - 34 + i * 42} ${top - 24} v-22 l12 -13 l12 13 v22 z" fill="${light}"/>`;
    s += `<path d="M${gx - gw / 2 - 20} ${h} V${top + 60} A${gw / 2 + 26} ${gw / 2 + 26} 0 1 1 ${gx + gw / 2 + 20} ${top + 60} V${h} Z" fill="${C.saffron}" opacity=".9"/>`;
    s += `<path d="M${gx - gw / 2} ${h} V${top + 64} A${gw / 2 + 8} ${gw / 2 + 8} 0 1 1 ${gx + gw / 2} ${top + 64} V${h} Z" fill="${C.teal}"/>`;
    s += `<path d="M${gx - gw / 2 + 18} ${h} V${top + 70} A${gw / 2 - 12} ${gw / 2 - 12} 0 1 1 ${gx + gw / 2 - 18} ${top + 70} V${h} Z" fill="${C.skyLight}"/>`;
  }
  s += `<rect x="0" y="${h - 18}" width="${w}" height="18" fill="${dark}" opacity=".5"/>`;
  return s + '</svg>';
}

// ---------- lantern ----------
function lantern(color = C.saffron) {
  return `<svg viewBox="0 0 120 300" xmlns="http://www.w3.org/2000/svg" overflow="visible">
    <line x1="60" y1="-400" x2="60" y2="40" stroke="#C98A1E" stroke-width="3"/>
    <circle cx="60" cy="40" r="8" fill="none" stroke="#C98A1E" stroke-width="4"/>
    <path d="M38 70 Q60 40 82 70 Z" fill="${color}"/>
    <rect x="34" y="68" width="52" height="10" rx="3" fill="#E39A12"/>
    <path d="M34 78 L12 150 L34 222 H86 L108 150 L86 78 Z" fill="${color}"/>
    <path d="M42 90 L26 150 L42 210 H78 L94 150 L78 90 Z" fill="#FFF2B3"/>
    <polygon points="${starPts(60, 150, 26)}" fill="${color}"/>
    <circle cx="60" cy="150" r="8" fill="#FFF8D6"/>
    <rect x="34" y="222" width="52" height="10" rx="3" fill="#E39A12"/>
    <path d="M42 232 L60 262 L78 232 Z" fill="${color}"/>
    <line x1="60" y1="262" x2="60" y2="290" stroke="#E39A12" stroke-width="4"/>
  </svg>`;
}

// ---------- airplane (side view, flying right) ----------
function airplane() {
  return `<svg viewBox="0 0 640 220" xmlns="http://www.w3.org/2000/svg" overflow="visible">
    <path d="M40 92 L4 22 H48 L118 92 Z" fill="${C.brand}"/>
    <path d="M14 22 H48 L78 54 H38 Z" fill="${C.orange}"/>
    <path d="M60 120 L18 150 H54 L110 124 Z" fill="${C.blue}"/>
    <path d="M70 88 H560 Q628 92 632 116 Q628 140 560 142 H96 Q52 140 40 112 Q48 90 70 88 Z" fill="${C.white}"/>
    <path d="M60 128 H600 Q616 134 632 118 Q628 140 560 142 H96 Q66 140 60 128 Z" fill="#DCE7F7"/>
    <path d="M72 116 H620" stroke="${C.orange}" stroke-width="5"/>
    <path d="M72 124 H620" stroke="${C.blue}" stroke-width="5"/>
    <path d="M582 98 Q606 100 616 112 H584 Z" fill="${C.navy}"/>
    ${Array.from({ length: 16 }, (_, i) => `<rect x="${150 + i * 26}" y="100" width="12" height="11" rx="5" fill="${C.navy}" opacity=".85"/>`).join('')}
    <rect x="128" y="96" width="14" height="22" rx="3" fill="${C.navy}" opacity=".5"/>
    <path d="M260 132 L380 132 L300 214 H262 Z" fill="${C.brand}"/>
    <path d="M300 214 H262 L268 204 H304 Z" fill="${C.orange}"/>
    <rect x="300" y="146" width="92" height="34" rx="16" fill="#E6EEF9"/>
    <rect x="300" y="146" width="22" height="34" rx="8" fill="${C.brand}"/>
    <path d="M240 96 L330 96 L280 52 H252 Z" fill="#CAD8F0"/>
  </svg>`;
}

function cloud(w = 360, tint = '#FFFFFF', shade = '#DDF3FF') {
  return `<svg viewBox="0 0 360 160" width="${w}" xmlns="http://www.w3.org/2000/svg" overflow="visible">
    <g fill="${shade}" transform="translate(0 10)"><circle cx="90" cy="100" r="50"/><circle cx="170" cy="76" r="70"/><circle cx="255" cy="96" r="54"/><rect x="40" y="100" width="270" height="50" rx="25"/></g>
    <g fill="${tint}"><circle cx="90" cy="100" r="50"/><circle cx="170" cy="76" r="70"/><circle cx="255" cy="96" r="54"/><rect x="40" y="100" width="270" height="50" rx="25"/></g>
  </svg>`;
}

function sunburst(n = 24, a = '#FFE9C7', b = '#FFF6E6') {
  let s = `<svg viewBox="-1000 -1000 2000 2000" xmlns="http://www.w3.org/2000/svg"><circle r="1000" fill="${b}"/>`;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 0.5) / n) * Math.PI * 2;
    s += `<path d="M0 0 L${Math.cos(a0) * 1500} ${Math.sin(a0) * 1500} L${Math.cos(a1) * 1500} ${Math.sin(a1) * 1500} Z" fill="${a}"/>`;
  }
  return s + '</svg>';
}

// horseshoe arch path for clip / frames (w x h box)
function archPath(w, h, k = 1.12) {
  const R = (w / 2) * k, dy = Math.sqrt(R * R - (w / 2) * (w / 2));
  const y1 = R + R - dy * 0 - (R - dy); // keep arch top at y=0
  const cy = R; // circle centre y
  const yChord = cy + dy;
  return `M0 ${h} L0 ${yChord.toFixed(1)} A${R.toFixed(1)} ${R.toFixed(1)} 0 1 1 ${w} ${yChord.toFixed(1)} L${w} ${h} Z`;
}

const ICON = {
  clock: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 10.6 3.8 2.3-1 1.6L11 13.7V6.5h2z"/></svg>`,
  chat: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 3h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm3 6.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm5 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm5 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/></svg>`,
  buoy: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7.5" fill="none" stroke="currentColor" stroke-width="5"/><g stroke="#FFC21A" stroke-width="5.2"><path d="M12 2v5M12 17v5M2 12h5M17 12h5" /></g></svg>`,
  camera: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M9 3 7.2 5H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.2L15 3H9zm3 5a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/></svg>`,
  heart: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 21s-7.5-4.6-10-9.3C.3 8.3 2.3 4 6.3 4c2.2 0 3.6 1.2 4.7 2.7h2C14.1 5.2 15.5 4 17.7 4c4 0 6 4.3 4.3 7.7C19.5 16.4 12 21 12 21z"/></svg>`,
  foot: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M9 2c2 0 3 2.5 3 5.5S11 13 9 13 6 10.5 6 7.5 7 2 9 2zm-1 12.5c1.7 0 3 .8 3 2.6 0 2.4-1.3 4.9-3 4.9s-2.6-2-2.6-4.3c0-2 .9-3.2 2.6-3.2z"/></svg>`,
  phone: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z"/></svg>`,
  globe: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 6h-2.9a15.7 15.7 0 0 0-1.4-3.6A8 8 0 0 1 18.9 8zM12 4c.8 1.2 1.5 2.5 1.9 4h-3.8c.4-1.4 1.1-2.8 1.9-4zM4.3 14a8.2 8.2 0 0 1 0-4h3.4a16.5 16.5 0 0 0 0 4zm.8 2h2.9c.3 1.3.8 2.5 1.4 3.6A8 8 0 0 1 5.1 16zM8 8H5.1a8 8 0 0 1 4.3-3.6C8.8 5.5 8.4 6.7 8 8zm4 12c-.8-1.2-1.5-2.5-1.9-4h3.8c-.4 1.4-1.1 2.8-1.9 4zm2.3-6H9.7a14.7 14.7 0 0 1 0-4h4.6a14.7 14.7 0 0 1 0 4zm.3 5.6c.6-1.1 1.1-2.3 1.4-3.6h2.9a8 8 0 0 1-4.3 3.6zm1.8-5.6a16.5 16.5 0 0 0 0-4h3.4a8.2 8.2 0 0 1 0 4z"/></svg>`,
  cap: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 3 1 9l11 6 9-4.9V17h2V9L12 3zM5 13.2v4L12 21l7-3.8v-4L12 17l-7-3.8z"/></svg>`,
  plane: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>`,
  pin: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.3 7 13 7 13s7-7.7 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>`,
  star: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="m12 2 3 6.6 7.2.7-5.4 4.8 1.6 7.1L12 17.5 5.6 21.2l1.6-7.1L1.8 9.3 9 8.6z"/></svg>`,
  check: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>`,
  suitcase: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M9 2h6a1 1 0 0 1 1 1v3h3a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3V3a1 1 0 0 1 1-1zm1 2v2h4V4h-4z"/></svg>`,
  briefcase: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M10 2h4a2 2 0 0 1 2 2v2h4a2 2 0 0 1 2 2v4h-8v-1h-4v1H2V8a2 2 0 0 1 2-2h4V4a2 2 0 0 1 2-2zm0 4h4V4h-4v2zM2 14h8v1h4v-1h8v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4z"/></svg>`,
  users: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 2c-2.3 0-7 1.2-7 3.5V19h14v-2.5C15 14.2 10.3 13 8 13zm8 0-1 .1c1.2.8 2 1.9 2 3.4V19h6v-2.5c0-2.3-4.7-3.5-7-3.5z"/></svg>`,
  badge: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 1 3 5v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V5l-9-4zm-2 16-4-4 1.4-1.4L10 14.2l6.6-6.6L18 9l-8 8z"/></svg>`,
};

if (typeof module !== 'undefined') module.exports = { C, zelligeTile, star8, koutoubia, palm, ramparts, lantern, airplane, cloud, sunburst, archPath, ICON, starPts, khatam };

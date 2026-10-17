// Build src/data/icons.js (selected Lucide icons, ISC licence) and src/data/words.js (word timings).
const fs = require('fs');
const names = ['plane','plane-takeoff','plane-landing','map-pin','phone','phone-call','globe','graduation-cap',
  'shield-check','clock','messages-square','message-circle','life-buoy','heart-pulse','users','sparkles','check',
  'luggage','ticket','camera','heart','x','star','badge-check','calendar','coins','piggy-bank','wallet','bell',
  'landmark','navigation','armchair','building-2','school','award','hand-heart','briefcase','banknote','send',
  'map','compass','sun','moon','cloud','user','smile','instagram','circle-check','calendar-days','timer','lock-open',
  'mouse-pointer-click','arrow-right','chevron-right','badge-percent','handshake','shield','book-open','presentation'];
const icons = {};
for (const n of names) {
  const p = `node_modules/lucide-static/icons/${n}.svg`;
  if (!fs.existsSync(p)) { console.log('missing icon', n); continue; }
  const s = fs.readFileSync(p, 'utf8');
  icons[n] = s.replace(/<!--[\s\S]*?-->/g, '').match(/<svg[^>]*>([\s\S]*)<\/svg>/)[1].replace(/\s+/g, ' ').trim();
}
fs.writeFileSync('src/data/icons.js', `// Lucide icons (ISC licence, https://lucide.dev)\nwindow.ICONS=${JSON.stringify(icons)};\n`);
const words = JSON.parse(fs.readFileSync('src/data/words.json', 'utf8'))
  .map(p => ({ id: p.id, words: p.words.map(w => ({ w: w.w, s: w.start, e: w.end })) }));
fs.writeFileSync('src/data/words.js', `window.PHRASES=${JSON.stringify(words)};\n`);
console.log('icons', Object.keys(icons).length, 'phrases', words.length);

// logo.svg (traced) -> src/data/logo.js : { viewBox, parts: { id: { d, bbox:[x0,y0,x1,y1], fill } } }
const svg = fs.readFileSync('assets/img/logo.svg', 'utf8');
const parts = {};
for (const m of svg.matchAll(/<path id="(\w+)" data-bbox="([^"]+)" fill="([^"]+)" fill-rule="evenodd" d="([^"]+)"\/>/g)) {
  parts[m[1]] = { bbox: m[2].split(',').map(Number), fill: m[3], d: m[4] };
}
fs.writeFileSync('src/data/logo.js', `window.LOGO=${JSON.stringify({ w: 1536, h: 442, parts })};\n`);
console.log('logo parts', Object.keys(parts).join(','));

// node tools/stills.js 1.0 2.5 ...  -> out/stills/t_XX.png
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path'); const fs = require('fs');
const serve = require('./serve');
(async () => {
  const { url, server } = await serve(path.resolve('.'));
  const times = process.argv.slice(2).map(Number);
  fs.mkdirSync('out/stills', { recursive: true });
  const b = await chromium.launch({ args: ['--font-render-hinting=none'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => console.error('pageerror', e.message));
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.error('console', m.text()); });
  await p.goto(url + '/index.html?render=1');
  await p.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
  let prev = 0;
  for (const t of times) {
    for (let x = prev; x < t; x += 0.2) await p.evaluate(v => window.seek(v), x);
    await p.evaluate(v => window.seek(v), t); prev = t;
    const f = `out/stills/t_${t.toFixed(2)}.png`;
    await p.screenshot({ path: f });
    console.log(f);
  }
  await b.close(); server.close();
})();

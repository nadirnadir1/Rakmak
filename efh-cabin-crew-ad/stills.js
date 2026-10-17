// usage: node stills.js out_dir t1 t2 ...
const { chromium } = require('playwright');
(async () => {
  const [out, ...ts] = process.argv.slice(2);
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => console.error('PAGEERR', e.message));
  p.on('console', m => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });
  await p.goto('http://127.0.0.1:8765/index.html');
  await p.evaluate(() => window.READY);
  for (const t of ts) {
    await p.evaluate(t => render(t), +t);
    await p.locator('#c').screenshot({ path: `${out}/s_${(+t).toFixed(2)}.png` });
  }
  await b.close();
})();

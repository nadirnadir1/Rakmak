#!/usr/bin/env node
/* Renders tools/cabin/cabin.html (three.js) to a PNG.
 *   node tools/make_cabin.js out.png [query-string]       e.g.  "w=1296&h=2304&fov=58"
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const out = process.argv[2] || path.join(ROOT, 'out/cabin_raw.png');
const qs = process.argv[3] || '';
const p = new URLSearchParams(qs);
const W = +p.get('w') || 1296, H = +p.get('h') || 2304;

const srv = http.createServer((req, res) => {
  const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': f.endsWith('.html') ? 'text/html' : 'application/javascript' });
  fs.createReadStream(f).pipe(res);
});
srv.listen(0, '127.0.0.1', async () => {
  const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  page.on('console', (m) => console.log('[page]', m.text()));
  page.on('pageerror', (e) => console.error('[pageerror]', e.message));
  await page.goto(`http://127.0.0.1:${srv.address().port}/tools/cabin/cabin.html?${qs}`);
  await page.waitForFunction(() => window.DONE === true, null, { timeout: 300000 });
  const url = await page.evaluate(() => document.querySelector('canvas').toDataURL('image/png'));
  fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
  console.log('->', out);
  await browser.close();
  srv.close();
});

#!/usr/bin/env node
/* Screenshot a test page (WebGL enabled):  node tools/shot.js /tools/cabin/plane_test.html?x=1 out.png [w h] */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const [url, out, w = 1080, h = 1920] = process.argv.slice(2);
const types = { '.html': 'text/html', '.js': 'application/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.css': 'text/css', '.ttf': 'font/ttf' };
const srv = http.createServer((req, res) => {
  const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
srv.listen(0, '127.0.0.1', async () => {
  const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: +w, height: +h } });
  page.on('console', (m) => console.log('[page]', m.text()));
  page.on('pageerror', (e) => console.error('[pageerror]', e.message));
  const t0 = Date.now();
  await page.goto(`http://127.0.0.1:${srv.address().port}${url}`);
  await page.waitForFunction(() => window.DONE === true, null, { timeout: 300000 });
  await page.screenshot({ path: out });
  console.log('->', out, (Date.now() - t0) + 'ms', await page.evaluate(() => window.INFO || ''));
  await browser.close(); srv.close();
});

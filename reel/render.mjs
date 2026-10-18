// Render the reel with headless Chromium.
//   node render.mjs still out_dir t1 t2 ...         -> JPEG stills (video time, seconds)
//   node render.mjs seg f0 f1 out.mp4               -> frames [f0,f1) encoded to H.264
//   node render.mjs all workers out.mp4             -> parallel segments + concat (video only)
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'web');
const FPS = 30, DUR = 62.5, NFRAMES = Math.round(DUR * FPS);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.woff2': 'font/woff2' };

function serve() {
  return new Promise(res => {
    const srv = http.createServer((req, rsp) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { rsp.writeHead(404); return rsp.end(); }
      rsp.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'max-age=3600' });
      fs.createReadStream(p).pipe(rsp);
    }).listen(0, '127.0.0.1', () => res(srv));
  });
}

async function openPage(port) {
  const browser = await chromium.launch({ args: ['--disable-web-security', '--font-render-hinting=none'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('PAGE ERROR', e.message));
  page.on('console', m => { if (m.type() === 'error') console.error('console:', m.text()); });
  await page.goto(`http://127.0.0.1:${port}/index.html`);
  await page.waitForFunction(() => window.READY || window.LOAD_ERR, null, { timeout: 60000 });
  const err = await page.evaluate(() => window.LOAD_ERR);
  if (err) throw new Error(err);
  return { browser, page };
}
async function grab(page, t, q = 92) {
  await page.evaluate(t => window.renderAt(t), t);
  return page.screenshot({ type: 'jpeg', quality: q, clip: { x: 0, y: 0, width: 1080, height: 1920 } });
}

const [, , mode, ...args] = process.argv;
const srv = await serve();
const port = srv.address().port;

if (mode === 'still') {
  const [out, ...ts] = args;
  fs.mkdirSync(out, { recursive: true });
  const { browser, page } = await openPage(port);
  for (const t of ts) {
    const buf = await grab(page, +t, 90);
    fs.writeFileSync(path.join(out, `t${(+t).toFixed(2).padStart(6, '0')}.jpg`), buf);
  }
  await browser.close();
} else if (mode === 'seg') {
  const [f0, f1, out] = [+args[0], +args[1], args[2]];
  const { browser, page } = await openPage(port);
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-pix_fmt', 'yuv420p', '-r', String(FPS), out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = f0; f < f1; f++) {
    const buf = await grab(page, f / FPS, 95);
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if ((f - f0) % 60 === 0) console.log(`[${path.basename(out)}] frame ${f}/${f1} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
} else if (mode === 'all') {
  const [nw, out] = [+args[0], args[1]];
  const dir = path.join(path.dirname(out), 'segs'); fs.mkdirSync(dir, { recursive: true });
  const per = Math.ceil(NFRAMES / nw), segs = [];
  const procs = [];
  for (let i = 0; i < nw; i++) {
    const f0 = i * per, f1 = Math.min(NFRAMES, f0 + per), o = path.join(dir, `seg${i}.mp4`);
    segs.push(o);
    procs.push(new Promise((res, rej) => {
      const p = spawn('node', [fileURLToPath(import.meta.url), 'seg', String(f0), String(f1), o], { stdio: 'inherit' });
      p.on('close', c => (c === 0 ? res() : rej(new Error('seg failed ' + i))));
    }));
  }
  await Promise.all(procs);
  fs.writeFileSync(path.join(dir, 'list.txt'), segs.map(s => `file '${path.resolve(s)}'`).join('\n'));
  await new Promise(r => spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', path.join(dir, 'list.txt'), '-c', 'copy', out], { stdio: 'inherit' }).on('close', r));
}
srv.close();

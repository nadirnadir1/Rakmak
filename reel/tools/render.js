#!/usr/bin/env node
/* Frame-accurate renderer for src/index.html (GSAP timeline seeked per frame).
 *
 *   node tools/render.js stills --times 1.2,16.1 [--out out/stills] [--debug]
 *   node tools/render.js video  [--from 0] [--to 53.4] [--fps 30] [--sub 4] [--workers 4] [--out out/video.mp4]
 *   node tools/render.js cues   [--out out/cues.json]       (sound cue list registered by the scenes)
 *
 * Motion blur: each output frame is the average of `sub` captures spread over a 180° shutter.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const mode = args[0];
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const flag = (k) => args.includes('--' + k);

function serve() {
  const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png',
    '.jpg': 'image/jpeg', '.ttf': 'font/ttf', '.svg': 'image/svg+xml', '.json': 'application/json' };
  const srv = http.createServer((req, res) => {
    const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' });
    fs.createReadStream(p).pipe(res);
  });
  return new Promise((r) => srv.listen(0, '127.0.0.1', () => r(srv)));
}

async function openPage(port) {
  const browser = await chromium.launch({ args: ['--disable-gpu-vsync', '--disable-frame-rate-limit', '--font-render-hinting=none'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) console.error('[page]', m.text()); });
  page.on('pageerror', (e) => console.error('[pageerror]', e.message));
  await page.goto(`http://127.0.0.1:${port}/src/index.html`, { timeout: 600000 });
  await page.evaluate(() => window.REEL.ready);
  const cdp = await page.context().newCDPSession(page);
  return { browser, page, cdp };
}

async function grab(cdp, q = 95) {
  const r = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: q, optimizeForSpeed: true });
  return Buffer.from(r.data, 'base64');
}

async function stills(port) {
  const out = path.resolve(opt('out', path.join(ROOT, 'out/stills')));
  fs.mkdirSync(out, { recursive: true });
  const { browser, page, cdp } = await openPage(port);
  if (flag('debug')) await page.evaluate(() => window.REEL.debug(true));
  if (flag('nocaps')) await page.evaluate(() => window.REEL.captions(false));
  for (const t of opt('times', '0').split(',').map(Number)) {
    await page.evaluate((t) => window.REEL.seek(t), t);
    const r = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const f = path.join(out, `t${t.toFixed(2).padStart(6, '0')}.png`);
    fs.writeFileSync(f, Buffer.from(r.data, 'base64'));
    console.log(f);
  }
  await browser.close();
}

async function cues(port) {
  const { browser, page } = await openPage(port);
  const c = await page.evaluate(() => window.REEL.cues);
  c.sort((a, b) => a.t - b.t);
  const out = path.resolve(opt('out', path.join(ROOT, 'out/cues.json')));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(c, null, 1));
  console.log('cues:', c.length, '->', out);
  await browser.close();
}

async function worker(port, k, f0, f1, o) {
  const { browser, page, cdp } = await openPage(port);
  // seek through earlier time in order so GSAP records start values naturally
  const tStart = o.from + f0 / o.fps;
  for (let t = 0; t < tStart; t += 0.5) await page.evaluate((t) => window.REEL.seek(t), t);
  const part = path.join(o.partsDir, `part_${String(k).padStart(2, '0')}.mp4`);
  const vf = [
    o.sub > 1 ? `tmix=frames=${o.sub}` : null,
    o.sub > 1 ? `select='not(mod(n+1\\,${o.sub}))'` : null,
    `setpts=N/(${o.fps}*TB)`,
    'scale=in_range=full:out_range=limited:in_color_matrix=bt601:out_color_matrix=bt709',
    'format=yuv420p',
  ].filter(Boolean).join(',');
  const ff = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(o.fps * o.sub),
    '-c:v', 'mjpeg', '-i', '-', '-vf', vf, '-r', String(o.fps), '-c:v', 'libx264', '-preset', 'slow', '-crf', String(o.crf),
    '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
    '-color_range', 'tv', '-g', String(o.fps * 2), '-bf', '2', '-maxrate', '22M', '-bufsize', '44M', '-movflags', '+faststart', part], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg exit ' + c)))));
  const t0 = Date.now();
  for (let f = f0; f < f1; f++) {
    for (let j = 0; j < o.sub; j++) {
      const off = o.sub > 1 ? (j / (o.sub - 1) - 0.5) * o.shutter / o.fps : 0;
      const t = Math.max(0, Math.min(o.to, o.from + f / o.fps + off));
      await page.evaluate((t) => window.REEL.seek(t), t);
      const buf = await grab(cdp, o.q);
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    }
    if ((f - f0) % 30 === 0) {
      const el = (Date.now() - t0) / 1000, n = f - f0 + 1;
      console.log(`[w${k}] frame ${f}/${f1 - 1}  ${(n / el).toFixed(2)} fps  eta ${((f1 - f - 1) / (n / el)).toFixed(0)}s`);
    }
  }
  ff.stdin.end();
  await done;
  await browser.close();
  return part;
}

async function video(port) {
  const o = {
    from: +opt('from', 0), to: +opt('to', 53.4), fps: +opt('fps', 30), sub: +opt('sub', 4), shutter: +opt('shutter', 0.5),
    workers: +opt('workers', 4), crf: +opt('crf', 16), q: +opt('q', 95),
  };
  const out = path.resolve(opt('out', path.join(ROOT, 'out/video_noaudio.mp4')));
  o.partsDir = path.join(path.dirname(out), 'parts');
  fs.rmSync(o.partsDir, { recursive: true, force: true });
  fs.mkdirSync(o.partsDir, { recursive: true });
  const N = Math.round((o.to - o.from) * o.fps);
  const per = Math.ceil(N / o.workers);
  const t0 = Date.now();
  const chunks = Array.from({ length: o.workers }, (_, k) => [k * per, Math.min(N, (k + 1) * per)]).filter(([a, b]) => a < b);
  const parts = await Promise.all(chunks.map(([a, b], k) => worker(port, k, a, b, o)));
  const list = path.join(o.partsDir, 'list.txt');
  fs.writeFileSync(list, parts.map((p) => `file '${p}'`).join('\n'));
  await new Promise((res, rej) => spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list,
    '-c', 'copy', '-movflags', '+faststart', out], { stdio: 'inherit' }).on('close', (c) => (c ? rej(new Error('concat failed')) : res())));
  console.log(`video: ${N} frames in ${((Date.now() - t0) / 1000).toFixed(0)}s -> ${out}`);
}

(async () => {
  const srv = await serve();
  const port = srv.address().port;
  try {
    if (mode === 'stills') await stills(port);
    else if (mode === 'video') await video(port);
    else if (mode === 'cues') await cues(port);
    else console.log('usage: render.js stills|video|cues ...');
  } finally { srv.close(); }
})().catch((e) => { console.error(e); process.exit(1); });

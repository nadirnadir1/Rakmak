// Renders index.html frame by frame with headless Chromium, then encodes with ffmpeg.
// Usage: node render.js [--fps 30] [--workers 4] [--from 0] [--to <sec>] [--out out.mp4] [--scale 1]
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const { spawn, execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const serve = require('./tools/serve');
let BASE = '';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => {
  if (v.startsWith('--')) a.push([v.slice(2), arr[i + 1]]);
  return a;
}, []));
const FPS = +(args.fps || 30);
const WORKERS = +(args.workers || 4);
const W = 1080, H = 1920;
const SCALE = +(args.scale || 1);
const OUT = path.resolve(args.out || 'out/efh_marrakech.mp4');
const TMP = path.resolve('out/tmp');
fs.mkdirSync(TMP, { recursive: true });

async function renderChunk(id, f0, f1, duration) {
  const browser = await chromium.launch({ args: ['--font-render-hinting=none', '--disable-gpu-vsync', '--force-color-profile=srgb'] });
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: SCALE });
  page.on('pageerror', e => console.error(`[w${id}] pageerror`, e.message));
  page.on('console', m => { if (m.type() === 'error') console.error(`[w${id}]`, m.text()); });
  await page.goto(BASE + '/index.html?render=1');
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
  const file = path.join(TMP, `chunk_${String(id).padStart(2, '0')}.mp4`);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-vf', SCALE !== 1 ? `scale=${W}:${H}:flags=lanczos` : 'null',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-r', String(FPS), file],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let t = 0; t < f0 / FPS; t += 0.2) await page.evaluate(v => window.seek(v), t);
  const t0 = Date.now();
  for (let f = f0; f < f1; f++) {
    await page.evaluate(t => window.seek(t), f / FPS);
    const buf = await page.screenshot({ type: 'png', animations: 'allow', caret: 'hide' });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if ((f - f0) % 60 === 0) console.log(`[w${id}] frame ${f}/${f1} ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
  return file;
}

(async () => {
  const srv = await serve(path.resolve('.')); BASE = srv.url;
  // duration from the page
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: W, height: H } });
  await p.goto(BASE + '/index.html?render=1');
  await p.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
  const duration = await p.evaluate(() => window.DURATION);
  await b.close();
  const from = +(args.from || 0), to = +(args.to || duration);
  const F0 = Math.round(from * FPS), F1 = Math.round(to * FPS);
  const per = Math.ceil((F1 - F0) / WORKERS);
  console.log(`rendering ${F1 - F0} frames (${from}s-${to}s) @${FPS}fps with ${WORKERS} workers`);
  const jobs = [];
  for (let i = 0; i < WORKERS; i++) {
    const a = F0 + i * per, z = Math.min(F1, a + per);
    if (a < z) jobs.push(renderChunk(i, a, z, duration));
  }
  const files = await Promise.all(jobs);
  const list = path.join(TMP, 'list.txt');
  fs.writeFileSync(list, files.map(f => `file '${f}'`).join('\n'));
  const silent = path.join(TMP, 'silent.mp4');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', silent]);
  const audio = args.audio ? path.resolve(args.audio) : path.resolve('assets/mix.wav');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', silent, '-ss', String(from), '-t', String(to - from), '-i', audio,
    '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', OUT]);
  console.log('wrote', OUT);
  srv.server.close();
})();

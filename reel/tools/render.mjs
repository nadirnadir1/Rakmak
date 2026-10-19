// Renders the composition frame by frame in headless Chromium (Playwright).
//   node tools/render.mjs --out build/out --fps 30 --workers 4            (full video frames)
//   node tools/render.mjs --times 1.0,2.5,13 --out /tmp/previews          (single preview frames)
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const arg = (k, d) => {
  const i = argv.indexOf('--' + k);
  return i >= 0 ? argv[i + 1] : d;
};
const fps = +arg('fps', 30);
const workers = +arg('workers', 4);
const out = path.resolve(arg('out', path.join(ROOT, 'build/out')));
const quality = +arg('quality', 94);
fs.mkdirSync(out, { recursive: true });

let jobs;
if (arg('times')) {
  jobs = arg('times').split(',').map((s, i) => ({ i, t: +s, name: `t_${(+s).toFixed(2)}` }));
} else {
  const total = +arg('total', 59.9);
  const start = +arg('start', 0);
  const end = +arg('end', total);
  jobs = [];
  for (let f = Math.round(start * fps); f < Math.round(end * fps); f++) jobs.push({ i: f, t: f / fps, name: String(f).padStart(5, '0') });
}

async function run(slice, wi) {
  const browser = await chromium.launch({
    args: ['--allow-file-access-from-files', '--disable-web-security', '--font-render-hinting=none', '--force-color-profile=srgb', '--hide-scrollbars'],
  });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error(`[w${wi}] pageerror`, e.message));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.error(`[w${wi}] console`, m.text()); });
  await page.goto('file://' + path.join(ROOT, 'src/index.html'));
  await page.waitForFunction(() => window.__ready || window.__error, null, { timeout: 120000 });
  const err = await page.evaluate(() => window.__error);
  if (err) throw new Error(err);
  let n = 0;
  const t0 = Date.now();
  for (const j of slice) {
    await page.evaluate((t) => window.renderFrame(t), j.t);
    await page.screenshot({ path: path.join(out, j.name + '.jpg'), type: 'jpeg', quality });
    n++;
    if (n % 150 === 0) console.log(`[w${wi}] ${n}/${slice.length} frames, ${((Date.now() - t0) / n).toFixed(0)} ms/frame`);
  }
  await browser.close();
}

const W = Math.min(workers, jobs.length);
const per = Math.ceil(jobs.length / W);
const t0 = Date.now();
await Promise.all(Array.from({ length: W }, (_, k) => run(jobs.slice(k * per, (k + 1) * per), k)));
console.log(`rendered ${jobs.length} frames in ${((Date.now() - t0) / 1000).toFixed(1)}s -> ${out}`);

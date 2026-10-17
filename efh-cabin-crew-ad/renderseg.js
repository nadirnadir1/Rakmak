// usage: node renderseg.js startFrame endFrame fps out.mkv [fmt]
const { chromium } = require('playwright');
const { spawn } = require('child_process');
(async () => {
  const [f0, f1, fps, out, fmt = 'png'] = process.argv.slice(2);
  const b = await chromium.launch({ args: ['--disable-gpu-vsync'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => { console.error('PAGEERR', e.message); process.exit(1); });
  await p.goto('http://127.0.0.1:8765/index.html');
  await p.evaluate(() => window.READY);
  const ff = spawn('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', fps, '-c:v', fmt === 'png' ? 'png' : 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '10', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const cdp = await p.context().newCDPSession(p);
  const t0 = Date.now();
  for (let f = +f0; f < +f1; f++) {
    await p.evaluate(t => render(t), f / +fps);
    const r = await cdp.send('Page.captureScreenshot', { format: fmt, quality: fmt === 'jpeg' ? 95 : undefined, clip: { x: 0, y: 0, width: 1080, height: 1920, scale: 1 }, optimizeForSpeed: true });
    const buf = Buffer.from(r.data, 'base64');
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  console.error(`frames ${f0}-${f1} done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  await b.close();
})();

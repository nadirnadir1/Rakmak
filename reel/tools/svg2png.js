// Render an SVG/HTML file to PNG with headless Chromium: node svg2png.js in.svg out.png width height [bg]
const { chromium } = require('playwright');
(async () => {
  const [inp, out, w, h, bg] = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: +w, height: +h } });
  const fs = require('fs');
  const svg = fs.readFileSync(inp, 'utf8');
  await page.setContent(`<html><body style="margin:0;background:${bg || '#000'}">${svg.replace('<svg ', `<svg style="width:${w}px;height:${h}px;display:block" `)}</body></html>`);
  await page.screenshot({ path: out });
  await browser.close();
})();

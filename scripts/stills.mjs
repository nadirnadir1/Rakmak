// Renders preview stills: node scripts/stills.mjs <compId> <frame> [frame...]
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';

const [compId, ...frames] = process.argv.slice(2);
const browserExecutable = process.env.REMOTION_BROWSER || null;
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const composition = await selectComposition({serveUrl, id: compId, browserExecutable});
console.log(compId, 'duration', composition.durationInFrames, 'frames');
for (const fr of frames) {
  const output = `out/stills/${compId}_${String(fr).padStart(4, '0')}.jpg`;
  await renderStill({serveUrl, composition, frame: Number(fr), output, imageFormat: 'jpeg', jpegQuality: 85, browserExecutable});
  console.log('wrote', output);
}

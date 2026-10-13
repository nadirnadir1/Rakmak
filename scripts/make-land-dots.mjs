// Builds a lat/lon dot grid of land points for the globe scene.
import { createRequire } from 'module';
import fs from 'fs';
import { feature } from 'topojson-client';
const require = createRequire(import.meta.url);
const topo = require('world-atlas/land-110m.json');
const land = feature(topo, topo.objects.land);
const polys = [];
for (const f of land.features) {
  const g = f.geometry;
  const ps = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  for (const p of ps) polys.push(p);
}
const inRing = (x, y, ring) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
const isLand = (lon, lat) => polys.some((p) => inRing(lon, lat, p[0]) && !p.slice(1).some((h) => inRing(lon, lat, h)));
const dots = [];
const step = 2.2;
for (let lat = -58; lat <= 80; lat += step) {
  const lonStep = step / Math.max(0.25, Math.cos((lat * Math.PI) / 180));
  for (let lon = -180; lon < 180; lon += lonStep) {
    if (isLand(lon, lat)) dots.push([+lat.toFixed(2), +lon.toFixed(2)]);
  }
}
fs.writeFileSync(new URL('../src/data/land-dots.json', import.meta.url), JSON.stringify(dots));
console.log(dots.length, 'land dots');

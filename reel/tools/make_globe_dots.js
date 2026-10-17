// Dump Natural Earth land polygons (world-atlas 50m) as plain rings for the globe-dot rasteriser.
// Usage: node make_globe_dots.js out_rings.json   (then run make_globe_dots.py)
const fs = require('fs');
const topo = require('topojson-client');
const land = topo.feature(require('world-atlas/land-50m.json'), 'land');
const rings = [];
for (const f of (land.features || [land])) {
  const g = f.geometry || f;
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  for (const p of polys) rings.push(p); // [outer, ...holes]
}
fs.writeFileSync(process.argv[2], JSON.stringify(rings));
console.log('polygons:', rings.length);

// Pre-computes the stylised Europe / North-Africa map as SVG paths (Mercator).
// Morocco is drawn as one shape including its Southern Provinces (merged with "W. Sahara"),
// matching the client's own flag-map artwork.
import fs from 'fs';
import * as d3 from 'd3-geo';
import * as topojson from 'topojson-client';

const topo = JSON.parse(fs.readFileSync(new URL('../node_modules/world-atlas/countries-50m.json', import.meta.url)));
const W = 1080, H = 1920;
const proj = d3.geoMercator().center([-4, 41.8]).scale(1985).translate([W / 2, H / 2]).clipExtent([[-400, -400], [W + 400, H + 400]]);
const path = d3.geoPath(proj);
const geoms = topo.objects.countries.geometries;
const byName = (n) => geoms.filter((g) => g.properties.name === n);
const MA = ['Morocco', 'W. Sahara'];
const morocco = topojson.merge(topo, geoms.filter((g) => MA.includes(g.properties.name)));
const out = { W, H, countries: {}, land: '', borders: '', cities: {} };
const keep = ['France', 'Spain', 'United Kingdom', 'Portugal', 'Algeria', 'Ireland', 'Italy', 'Germany', 'Belgium',
  'Netherlands', 'Switzerland', 'Tunisia', 'Mauritania', 'Mali', 'Libya', 'Austria', 'Denmark', 'Luxembourg', 'Andorra', 'Czechia', 'Poland', 'Norway', 'Sweden'];
for (const n of keep) {
  const g = byName(n);
  if (!g.length) { console.error('missing', n); continue; }
  out.countries[n] = path(topojson.feature(topo, { type: 'GeometryCollection', geometries: g }));
}
out.countries['Morocco'] = path(morocco);
// all other land (context)
const others = geoms.filter((g) => !MA.includes(g.properties.name) && !keep.includes(g.properties.name));
out.land = path(topojson.merge(topo, others));
// borders between kept countries (exclude the Morocco/W. Sahara line)
const mesh = topojson.mesh(topo, topo.objects.countries, (a, b) => a !== b && !(MA.includes(a.properties.name) && MA.includes(b.properties.name)));
out.borders = path(mesh);
const cities = { Marrakech: [-7.99, 31.63], Paris: [2.35, 48.86], Madrid: [-3.70, 40.42], London: [-0.13, 51.51], Casablanca: [-7.59, 33.57] };
for (const [k, v] of Object.entries(cities)) out.cities[k] = proj(v).map((x) => +x.toFixed(1));
fs.writeFileSync(new URL('../src/map_data.js', import.meta.url), 'window.MAP = ' + JSON.stringify(out) + ';\n');
console.log('cities', out.cities, 'bytes', JSON.stringify(out).length);

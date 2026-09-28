import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

// Fonts are bundled in public/fonts (from @fontsource, SIL OFL) so renders work offline.
// Arabic / Darija: Cairo joins correctly and stays legible at small sizes on phones.
// Latin: Montserrat for the premium "airline" feel.
const face = (family: string, file: string, weight: string) =>
  loadFont({family, url: staticFile(`fonts/${file}`), weight, format: 'woff2'});

for (const w of ['800', '900']) {
  face('CairoAr', `cairo-arabic-${w}-normal.woff2`, w);
  face('CairoLat', `cairo-latin-${w}-normal.woff2`, w);
}
for (const w of ['500', '700', '800']) face('Montserrat', `montserrat-latin-${w}-normal.woff2`, w);

export const arabicFont = 'CairoAr, CairoLat, sans-serif';
export const latinFont = 'Montserrat, sans-serif';

export const C = {
  navyDeep: '#050E24',
  navy: '#0A1F44',
  royal: '#2451D6',
  royalLight: '#5B8CFF',
  white: '#FFFFFF',
  ice: '#DCE6FF',
  orange: '#F28C28',
};

export const W = 1080;
export const H = 1920;
export const FPS = 30;

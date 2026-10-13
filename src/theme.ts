import '@fontsource/cairo/arabic-500.css';
import '@fontsource/cairo/arabic-700.css';
import '@fontsource/cairo/arabic-800.css';
import '@fontsource/cairo/arabic-900.css';
import '@fontsource/cairo/latin-700.css';
import '@fontsource/cairo/latin-900.css';
import '@fontsource/montserrat/latin-600.css';
import '@fontsource/montserrat/latin-800.css';
import '@fontsource/montserrat/latin-900.css';

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const DURATION = 49 * FPS;

export const s = (seconds: number) => Math.round(seconds * FPS);

export const C = {
  blue: '#003A9C',
  blueBright: '#0A56E0',
  navy: '#00163D',
  midnight: '#000B22',
  orange: '#F28300',
  orangeLight: '#FFB347',
  sand: '#F7E9D7',
  terracotta: '#C65A3A',
  white: '#FFFFFF',
  whatsapp: '#25D366',
};

export const AR = "'Cairo', sans-serif";
export const LAT = "'Montserrat', 'Cairo', sans-serif";

// Contact details shown in the CTA / end card.
export const PHONE_1 = '+212 777 771 314';
export const PHONE_2 = '+212 777 771 712';
export const WEBSITE = 'www.flyhyani.ma';

// The graduate-placement figure in the voice-over was hard to make out.
// Change it here if the real number differs.
export const GRAD_STAT = 90;

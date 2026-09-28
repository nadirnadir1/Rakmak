// Edit decision list for the EFH reel.
// All times are in SECONDS ON THE ORIGINAL (SOURCE) TIMELINE unless stated otherwise,
// so every effect stays locked to what the speaker says in the original video.
// Timings come from analysis/ (caption changes at 10 fps + speech-band energy).

export type Rect = {x: number; y: number; w: number; h: number}; // px in 1080x1920 space

export type HookDef = {
  id: 'A' | 'B';
  // Original moment replayed as a flash-forward before the video starts (cut on speech pauses).
  srcStart: number;
  srcEnd: number;
  // Kinetic typography, verbatim from the speaker's line; `at` = seconds into the hook.
  words: {text: string; at: number; accent?: boolean}[];
  kicker: string;
  // Region of the source frame shown in the hook card (excludes the burned-in captions).
  crop: Rect;
  style: 'stat' | 'window';
};

export type CutawayKind = 'globe' | 'departures' | 'cabin' | 'safety' | 'recruit';

export type CutawayDef = {
  at: number;
  dur: number;
  kind: CutawayKind;
  // true when this graphic continues an open panel (no close/open between them)
  chained?: {fromPrev: boolean; toNext: boolean};
};

export type ZoomDef = {at: number; dur: number; from: number; to: number; ox: number; oy: number};

export type AccentDef = {at: number; dur: number; box: Rect}; // animated frame + glint on burned-in text

export const SOURCE = {
  video: 'source.mp4', // graded by scripts/prepare.sh
  audio: 'source_audio.wav', // original soundtrack, lossless
  duration: 48.9, // original minus the CapCut outro
};

// Lower-third panel for explanatory cutaways: below the burned-in captions (y≈1040–1220),
// above Instagram's bottom UI.
export const PANEL: Rect = {x: 70, y: 1250, w: 940, h: 470};

const FACE_CROP: Rect = {x: 0, y: 150, w: 1080, h: 880};

export const HOOKS: Record<'A' | 'B', HookDef> = {
  // "+90% من خريجي المدرسة…" — the strongest proof point, left open as a curiosity gap.
  A: {
    id: 'A',
    srcStart: 9.92,
    srcEnd: 11.98,
    words: [
      {text: 'من', at: 0.68},
      {text: 'خريجي', at: 0.86},
      {text: 'المدرسة', at: 1.3, accent: true},
    ],
    kicker: 'ÉCOLE FLY HYANI PRIVÉ',
    crop: FACE_CROP,
    style: 'stat',
  },
  // "فأكبر شركات الطيران فالعالم" — the dream destination, shown through an aircraft window.
  B: {
    id: 'B',
    srcStart: 13.76, // starts in the pause before the line: the cabin chime plays over silence
    srcEnd: 15.68,
    words: [
      {text: 'فأكبر', at: 0.39},
      {text: 'شركات', at: 0.74},
      {text: 'الطيران', at: 1.14},
      {text: 'فالعالم', at: 1.54, accent: true},
    ],
    kicker: 'CABIN CREW  ·  AVIATION',
    crop: {x: 150, y: 110, w: 780, h: 920},
    style: 'window',
  },
};

export const CUTAWAYS: CutawayDef[] = [
  {at: 12.1, dur: 1.95, kind: 'cabin', chained: {fromPrev: false, toNext: true}}, // خدمو كمضيفات ومضيفي الطيران
  {at: 14.05, dur: 1.65, kind: 'globe', chained: {fromPrev: true, toNext: true}}, // فأكبر شركات الطيران فالعالم
  {at: 15.7, dur: 0.95, kind: 'departures', chained: {fromPrev: true, toNext: false}}, // أو فالمطارات
  {at: 31.0, dur: 1.45, kind: 'cabin'}, // كتتكون فمجال الطيران
  {at: 36.5, dur: 1.75, kind: 'safety', chained: {fromPrev: false, toNext: true}}, // وكتستافد من تكوين تطبيقي
  {at: 38.25, dur: 1.2, kind: 'recruit', chained: {fromPrev: true, toNext: false}}, // وتحضير لمقابلات التوظيف
];

// Slow cinematic push-ins (≤6%, centred, so burned-in text is never cropped). Each one either
// starts at 1.0 or ends exactly on one of the original's cuts, so the scale never jumps.
// Cuts: 4.23 9.67 15.63 18.90 23.73 26.60 30.13 36.23 39.43 40.87 42.93 45.57 48.93
export const ZOOMS: ZoomDef[] = [
  {at: 0.0, dur: 4.23, from: 1.0, to: 1.05, ox: 0.5, oy: 0.42},
  {at: 7.0, dur: 2.67, from: 1.0, to: 1.06, ox: 0.5, oy: 0.56},
  {at: 10.0, dur: 5.63, from: 1.0, to: 1.04, ox: 0.5, oy: 0.55},
  {at: 15.63, dur: 3.27, from: 1.0, to: 1.05, ox: 0.5, oy: 0.45},
  {at: 19.25, dur: 4.48, from: 1.0, to: 1.06, ox: 0.5, oy: 0.55},
  {at: 24.07, dur: 2.53, from: 1.0, to: 1.04, ox: 0.5, oy: 0.5},
  {at: 26.6, dur: 3.53, from: 1.0, to: 1.05, ox: 0.5, oy: 0.45},
  {at: 30.5, dur: 5.73, from: 1.0, to: 1.04, ox: 0.5, oy: 0.42},
  {at: 36.5, dur: 2.93, from: 1.0, to: 1.03, ox: 0.5, oy: 0.5},
  {at: 39.67, dur: 1.2, from: 1.09, to: 1.0, ox: 0.5, oy: 0.6}, // punch on the call to action
  {at: 45.9, dur: 3.03, from: 1.0, to: 1.03, ox: 0.5, oy: 0.45}, // end card
];

// Highlights on the original's own key phrases (no duplicate text).
export const ACCENTS: AccentDef[] = [
  {at: 7.95, dur: 1.7, box: {x: 225, y: 1020, w: 630, h: 205}}, // 100% مدرسة متخصصة
  {at: 10.5, dur: 1.4, box: {x: 185, y: 1050, w: 710, h: 185}}, // +90% من خريجي المدرسة
  {at: 20.55, dur: 1.35, box: {x: 130, y: 1110, w: 300, h: 95}}, // أطر محترفة
  {at: 39.7, dur: 1.1, box: {x: 150, y: 1105, w: 780, h: 110}}, // التسجيلات مفتوحة دابا !
];

// Original swipe transitions — enhanced with a light leak + whoosh.
export const TRANSITIONS: number[] = [4.23, 9.67, 30.13, 36.23, 39.43];

// Original end card (logo + contacts) appears here and is silent — add the brand sting.
export const END_CARD_AT = 45.75;
export const END_HOLD_SEC = 1.0;
export const STING_SEC = 0.8;
export const STING_OVERLAP_SEC = 0.3;

// Authentic EFH logo, extracted from the original end card (public/efh-logo.png).
// Replace the file with the official vector/PNG export when available.
export const LOGO_FILE: string | null = 'efh-logo.png';

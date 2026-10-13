import { GRAD_STAT } from './theme';

// Darija transcript of the voice-over with segment timings (seconds).
// Word timings inside a segment are spread by word length.
const SEGMENTS: { start: number; end: number; text: string }[] = [
  { start: 0.1, end: 5.4, text: 'عندك الباك ولا نيفو باك، وباغي مجال فيه فرص الشغل كثيرة، ولكن حاير فين تقرا؟ الحل قدامك:' },
  { start: 5.45, end: 9.7, text: 'إيكول فلاي حياني بريفي فمراكش، مدرسة متخصصة 100% فمجال الطيران.' },
  { start: 9.8, end: 13.85, text: `أكثر من ${GRAD_STAT}% من خريجي المدرسة خدامين اليوم مضيفات ومضيفين ديال الطيران` },
  { start: 13.9, end: 18.9, text: 'فأكبر شركات الطيران فالعالم، ولا فالمطارات، ولا فالاستقبال فالفنادق الفخمة.' },
  { start: 19.0, end: 23.7, text: 'إيكول فلاي حياني كتشرف على تكوينك أطر محترفة بخبرة كبيرة فمجال الطيران،' },
  { start: 23.8, end: 26.55, text: 'وكتعتمد المدرسة على منهجية خاصة فالتكوين،' },
  { start: 26.6, end: 30.15, text: 'كتحضّرك للشروط اللي كيطلبو شركات الطيران العالمية والفنادق الكبرى.' },
  { start: 30.2, end: 34.55, text: 'فعامين كتكوّن فمجال الطيران، وكتقوّي مستواك فالفرنسية،' },
  { start: 34.6, end: 36.35, text: 'الإنجليزية والإسبانية،' },
  { start: 36.4, end: 39.55, text: 'وكتستافد من تكوين تطبيقي وتحضير لمقابلات التوظيف.' },
  { start: 39.6, end: 40.95, text: 'التسجيلات مفتوحة دابا!' },
  { start: 41.0, end: 45.9, text: 'خلّي معلوماتك فالفورمولير، ولا تواصل مباشرة مع المدرسة فالواتساب.' },
];

export type Word = { text: string; start: number; end: number };
export type Chunk = { words: Word[]; start: number; end: number };

const PUNCT = /[،؟!.:,]$/;

const timeWords = (): Word[] => {
  const out: Word[] = [];
  for (const seg of SEGMENTS) {
    const words = seg.text.split(/\s+/).filter(Boolean);
    const weights = words.map((w) => w.replace(/[^\p{L}\p{N}]/gu, '').length + 2 + (PUNCT.test(w) ? 3 : 0));
    const total = weights.reduce((a, b) => a + b, 0);
    let t = seg.start;
    words.forEach((w, i) => {
      const d = ((seg.end - seg.start) * weights[i]) / total;
      out.push({ text: w, start: t, end: t + d });
      t += d;
    });
  }
  return out;
};

export const WORDS = timeWords();

export const CHUNKS: Chunk[] = (() => {
  // Split on segment boundaries and punctuation, then balance long phrases into pieces of <= 4 words.
  const phrases: Word[][] = [];
  let cur: Word[] = [];
  WORDS.forEach((w, i) => {
    const prev = WORDS[i - 1];
    if (prev && w.start - prev.end > 0.04 && cur.length) {
      phrases.push(cur);
      cur = [];
    }
    cur.push(w);
    if (PUNCT.test(w.text)) {
      phrases.push(cur);
      cur = [];
    }
  });
  if (cur.length) phrases.push(cur);
  // Merge a lone-word phrase into its neighbour when it stays short.
  const merged: Word[][] = [];
  for (const ph of phrases) {
    const last = merged[merged.length - 1];
    const sameSeg = last && ph[0].start - last[last.length - 1].end < 0.04;
    if (last && sameSeg && (ph.length === 1 || last.length === 1) && last.length + ph.length <= 5) last.push(...ph);
    else merged.push([...ph]);
  }
  const chunks: Chunk[] = [];
  for (const ph of merged) {
    const k = Math.ceil(ph.length / 4);
    const size = Math.ceil(ph.length / k);
    for (let i = 0; i < ph.length; i += size) {
      const ws = ph.slice(i, i + size);
      chunks.push({ words: ws, start: ws[0].start, end: ws[ws.length - 1].end });
    }
  }
  // Hold each chunk until the next one starts when the gap is short.
  for (let i = 0; i < chunks.length - 1; i++) {
    if (chunks[i + 1].start - chunks[i].end < 0.6) chunks[i].end = chunks[i + 1].start;
  }
  return chunks;
})();

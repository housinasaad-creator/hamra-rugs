/* HAMRA — a rug the visitor designed: state ⇄ spec ⇄ message text, shared by the studio and the contact form */
import { makeSpec, PALETTES, SIZES } from './rugkit.js';
import { t, tl, lang } from './shared.js';

export const DEF = { fam: 'medallion', shape: 'rect', pal: 0, seed: 21, size: 2, cols: null };
const KEY = 'hm_design';

export function designSpec(d) {
  const sp = makeSpec(d.seed, { family: d.fam, palette: d.pal, shape: d.shape });
  const s = SIZES[d.shape][Math.min(d.size, SIZES[d.shape].length - 1)];
  if (d.shape === 'rect' || d.shape === 'runner') { const [w, h] = s.split('x').map(Number); sp.H = Math.round(sp.W * h / w); }
  if (d.cols) sp.cols = d.cols.slice();
  return sp;
}
export function sizeLabel(d) {
  const s = SIZES[d.shape][Math.min(d.size, SIZES[d.shape].length - 1)];
  return s.includes('x') ? s.replace('x', ' × ') : 'Ø ' + s;
}
export function designText(d) {
  const pal = d.cols ? t('st.custom') : (PALETTES[d.pal].n[lang] || PALETTES[d.pal].n.en);
  const cols = (d.cols || PALETTES[d.pal].c).join(' ');
  return [t('wa.design'), `${tl('fam.' + d.fam)} · ${tl('shape.' + d.shape)} · ${sizeLabel(d)} cm`, `${t('st.palette')}: ${pal}`, `${t('st.seed')}: ${d.seed}`, cols].join('\n');
}
export function loadDesign() {
  try { const d = JSON.parse(localStorage.getItem(KEY) || 'null'); if (d && d.fam && SIZES[d.shape] && PALETTES[d.pal]) return d; } catch (e) { }
  return null;
}
export function saveDesign(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { } }

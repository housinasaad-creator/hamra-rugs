/*
  rugkit — hand-knotted rug designs drawn procedurally on a knot grid (Canvas2D, no images, no WebGL).
  A rug is a spec {seed, fam, pal, shape, W, H, s, wear}; buildGrid(spec) gives one palette index per knot; paintRug draws every knot as a tiny lit tuft,
  the way a weaver sees it: stepped diamonds, borders with guard stripes, tonal abrash from row to row, pile shading and fringe.
  The same grid drives the weaving animation (row by row) and the 3D loom texture.
*/
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
export const rngOf = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const pick = (r, a) => a[Math.floor(r() * a.length)];
const ri = (r, a, b) => a + Math.floor(r() * (b - a + 1));

/* ------------------------------------------------------------------ palettes: [ground, mid, accent, light, dark, extra] */
const P = (id, fam, en, tr, ar, c) => ({ id, fam, n: { en, tr, ar }, c });
export const PALETTES = [
  P('madder', 'red', 'Madder & Ivory', 'Kökboya ve Fildişi', 'الفوّة والعاج', ['#8a1b20', '#b13b2e', '#d9a645', '#efe3cb', '#2b1a1c', '#4a6b88']),
  P('pomegranate', 'red', 'Pomegranate', 'Nar', 'رمّان', ['#7a1630', '#a52a45', '#d4a45a', '#f1e6d3', '#2a141b', '#3f5f5b']),
  P('cinnabar', 'red', 'Cinnabar Sun', 'Güneş Kırmızısı', 'شنجرف', ['#a3281c', '#cf5a37', '#e7b45a', '#f3e8d4', '#34201a', '#2e5a73']),
  P('winegold', 'red', 'Wine & Gold', 'Şarap ve Altın', 'نبيذ وذهب', ['#5e1226', '#8b2a3b', '#c9973f', '#e9dcc3', '#210f16', '#6b7a52']),
  P('indigo', 'blue', 'Indigo Dusk', 'Çivit Alacası', 'نيلي الغسق', ['#1b2a52', '#35508a', '#c9a24a', '#ece3cf', '#0f1630', '#9a3b34']),
  P('lapis', 'blue', 'Lapis', 'Lacivert Taş', 'لازورد', ['#173a7a', '#2f64b5', '#d6b05a', '#f0e8d6', '#0d1d42', '#a8412f']),
  P('teal', 'blue', 'Peacock Teal', 'Tavus Yeşili', 'أخضر الطاووس', ['#0f4a52', '#1f7a80', '#d8a85a', '#eee5d0', '#082a2f', '#a24a38']),
  P('midnight', 'blue', 'Midnight Bazaar', 'Gece Çarşısı', 'سوق منتصف الليل', ['#10182f', '#27365f', '#b99a55', '#dcd3c0', '#070b17', '#7b2f3a']),
  P('denim', 'blue', 'Faded Denim', 'Solmuş Kot', 'دنيم باهت', ['#3f5a7a', '#6f8aa6', '#d1c4a1', '#e9e1cf', '#26364b', '#9a6b50']),
  P('sage', 'green', 'Sage Garden', 'Ada Çayı', 'حديقة المريمية', ['#6b7a5a', '#8d9b78', '#d3c08b', '#efe8d4', '#3b4631', '#a5683f']),
  P('emerald', 'green', 'Emerald Court', 'Zümrüt Avlu', 'ساحة الزمرد', ['#0f4a3a', '#1f6f58', '#d5ad57', '#eee6d0', '#07281f', '#9a3a35']),
  P('olive', 'green', 'Olive Grove', 'Zeytinlik', 'بستان الزيتون', ['#5a5a2a', '#7b7a3e', '#cda553', '#eee5ce', '#2f2f15', '#8f3b2f']),
  P('saffron', 'gold', 'Saffron', 'Safran', 'زعفران', ['#c98a1c', '#e0ac3a', '#8f2a22', '#f4ead2', '#3a2812', '#2f5568']),
  P('honey', 'gold', 'Wild Honey', 'Çiçek Balı', 'عسل بري', ['#b98a3e', '#d6ae62', '#6c3c2a', '#f2e8d1', '#43321b', '#59705a']),
  P('ivory', 'neutral', 'Ivory Silk', 'Fildişi İpek', 'عاج حريري', ['#e8dcc4', '#d3c3a2', '#a9824a', '#f7f1e3', '#6b5a42', '#7f9097']),
  P('sand', 'neutral', 'Desert Sand', 'Çöl Kumu', 'رمل الصحراء', ['#cdb78f', '#b89c6e', '#7a5a3a', '#ede2c9', '#4f3d2a', '#8a9aa0']),
  P('oat', 'neutral', 'Oatmeal', 'Yulaf', 'شوفان', ['#d9ccb0', '#bfae8c', '#8a6a4a', '#f3ecdb', '#5c4a36', '#6d7c6a']),
  P('charcoal', 'grey', 'Charcoal & Brass', 'Kömür ve Pirinç', 'فحم ونحاس', ['#34363a', '#5a5d63', '#c0a064', '#dcd8cf', '#17181b', '#8a3a34']),
  P('mist', 'grey', 'Silver Mist', 'Gümüş Sis', 'ضباب فضي', ['#9aa0a6', '#b9bec2', '#6b7076', '#eceae4', '#3a3e43', '#b08d57']),
  P('slate', 'grey', 'Slate', 'Arduvaz', 'أردواز', ['#4a5560', '#6b7885', '#d0b27a', '#e5e1d8', '#262d35', '#8c4a3d']),
  P('rose', 'pink', 'Rose Quartz', 'Gül Kuvars', 'كوارتز وردي', ['#c98d92', '#dcaab0', '#8a4a52', '#f6ece4', '#5a2f36', '#7a8f7d']),
  P('blush', 'pink', 'Blush', 'Pudra', 'وردي خجول', ['#e0b9b1', '#ecd0c8', '#b07a6a', '#faf2ea', '#7a4a42', '#8a9a94']),
  P('mauve', 'pink', 'Dusty Mauve', 'Toz Mor', 'موف غباري', ['#8a5f72', '#a97b8d', '#d1b27c', '#efe4dc', '#4b3341', '#5d7a74']),
  P('terracotta', 'brown', 'Terracotta', 'Pişmiş Toprak', 'طين محروق', ['#a4482c', '#c9693f', '#e0b062', '#f1e5cf', '#3d2217', '#4c6a62']),
  P('walnut', 'brown', 'Walnut', 'Ceviz', 'جوز', ['#5a3a28', '#7d553c', '#c99a55', '#eadfc8', '#2b1b12', '#4f6a7a']),
  P('camel', 'brown', 'Camel Hair', 'Deve Tüyü', 'وبر الجمل', ['#b07a44', '#cb9a62', '#6d4128', '#f1e6d0', '#3f2816', '#58706a']),
  P('onyx', 'black', 'Onyx & Gold', 'Oniks ve Altın', 'عقيق أسود وذهب', ['#15161a', '#2b2d33', '#c6a15a', '#e3dbc9', '#0a0b0d', '#8a3a32']),
  P('bazaar', 'multi', 'Grand Bazaar', 'Kapalıçarşı', 'السوق الكبير', ['#a8302a', '#2f5f8a', '#e0a93a', '#f0e6cf', '#25203a', '#4c8a5c']),
  P('kaleido', 'multi', 'Kaleidoscope', 'Kaleydoskop', 'مشكال', ['#c4452b', '#1f6f8a', '#e8b53a', '#f4ead6', '#2a1f3a', '#5a9a5e']),
  P('garden', 'multi', 'Persian Garden', 'Divan Bahçesi', 'حديقة فارسية', ['#8f3a4a', '#4a7a5a', '#e0b45a', '#f1e8d6', '#2d2a3f', '#c47a3a']),
  P('nomad', 'multi', 'Nomad Camp', 'Konar Göçer', 'مخيّم الرحّالة', ['#b4513a', '#d19a3e', '#5f8f7a', '#efe5d1', '#2b2a2e', '#4a6fa0']),
  P('berry', 'purple', 'Berry Ink', 'Böğürtlen Mürekkebi', 'حبر التوت', ['#512a5a', '#7a4a85', '#d7a95a', '#eee3d3', '#241230', '#4a8a8a']),
  P('aubergine', 'purple', 'Aubergine', 'Patlıcan', 'باذنجان', ['#3c1f3f', '#62385f', '#c79a56', '#e9ddd0', '#1a0d1c', '#6d8a6d'])
];
export const COLOR_FAMILIES = ['red', 'blue', 'green', 'gold', 'neutral', 'grey', 'pink', 'brown', 'black', 'purple', 'multi'];
export const FAMILIES = ['garden', 'medallion', 'kilim', 'trellis', 'gul', 'allover', 'abstract', 'stripes', 'geometric', 'patchwork', 'oushak', 'deco', 'shag'];
const FAM_W = { garden: 4, medallion: 5, kilim: 3, trellis: 3, gul: 3, allover: 3, abstract: 3, stripes: 2, geometric: 3, patchwork: 2, oushak: 3, deco: 2, shag: 1 };

/* ------------------------------------------------------------------ spec */
export function makeSpec(seed, o = {}) {
  const r = rngOf(seed * 7919 + 13);
  let fam = o.family;
  if (!fam) { let tot = 0; for (const f of FAMILIES) tot += FAM_W[f]; let k = r() * tot; fam = FAMILIES[0]; for (const f of FAMILIES) { k -= FAM_W[f]; if (k <= 0) { fam = f; break; } } }
  const pal = o.palette != null ? o.palette : Math.floor(r() * PALETTES.length);
  let shape = o.shape;
  if (!shape) {
    const q = r();
    if (['stripes', 'kilim', 'trellis', 'geometric', 'allover', 'abstract'].includes(fam) && q < 0.22) shape = 'runner';
    else if (['medallion', 'deco', 'abstract', 'trellis', 'gul', 'oushak', 'patchwork'].includes(fam) && q > 0.86) shape = 'round';
    else if (q > 0.76 && q <= 0.86) shape = 'square';
    else shape = 'rect';
  }
  let W, H; const fine = ['garden', 'abstract', 'shag', 'deco'].includes(fam) ? 1.55 : 1;      // modern and floral designs are woven finer (more knots), folk designs stay chunky
  if (shape === 'runner') { W = 34 + Math.floor(r() * 6); H = Math.round(W * (3.3 + r() * 0.5)); }
  else if (shape === 'round') { W = H = 76 + Math.floor(r() * 10); }
  else if (shape === 'square') { W = H = 66 + Math.floor(r() * 10); }
  else { W = 68 + Math.floor(r() * 14); H = Math.round(W * (1.4 + r() * 0.14)); }
  if (fine !== 1) { W = Math.round(W * fine); H = Math.round(H * fine); }
  return { seed, fam, pal, shape, W, H, s: Math.floor(r() * 1e9) + 1, wear: fam === 'oushak' ? 0.5 + r() * 0.4 : fam === 'patchwork' ? 0.35 + r() * 0.3 : r() < 0.12 ? 0.25 : 0 };
}

/* ------------------------------------------------------------------ value noise */
function noiseFn(r, cells) { const n = cells + 2, t = Array.from({ length: n * n }, r); const sm = (x) => x * x * (3 - 2 * x); return (u, v) => { const x = clamp(u, 0, 0.9999) * cells, y = clamp(v, 0, 0.9999) * cells, x0 = Math.floor(x), y0 = Math.floor(y), fx = sm(x - x0), fy = sm(y - y0); const a = t[y0 * n + x0], b = t[y0 * n + x0 + 1], c = t[(y0 + 1) * n + x0], d = t[(y0 + 1) * n + x0 + 1]; return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy; }; }

/* ------------------------------------------------------------------ border */
const MOTIFS = ['diamonds', 'zigzag', 'cross', 'wave', 'dots', 'hooks', 'steps', 'fret', 'diamonds', 'wave', 'fret', 'chain'];
function makeBorder(r, W, fam, shape) {
  const L = [];
  const thin = ['abstract', 'stripes', 'shag', 'geometric'].includes(fam) && r() < 0.7;
  if (thin) { if (r() < 0.55) { L.push({ t: 'solid', w: 1, c: 4 }); L.push({ t: 'solid', w: ri(r, 2, 4), c: pick(r, [1, 2, 3]) }); L.push({ t: 'solid', w: 1, c: 4 }); } return L; }
  const wide = W >= 60 ? ri(r, 9, 13) : ri(r, 7, 9), kind = pick(r, MOTIFS), p = kind === 'dots' ? 4 : kind === 'wave' ? ri(r, 10, 14) : pick(r, [6, 8, 8, 10, 12]);
  const bg = pick(r, [0, 0, 4, 1]), fg = pick(r, [2, 3, 3]), fg2 = pick(r, [1, 5, 2]);
  L.push({ t: 'solid', w: 1, c: 4 }); L.push({ t: 'solid', w: 2, c: pick(r, [1, 2]) });
  L.push({ t: 'motif', w: wide, kind, p, bg, fg, fg2 });
  L.push({ t: 'solid', w: 1, c: 3 }); L.push({ t: 'solid', w: 2, c: pick(r, [1, 2, 5]) }); L.push({ t: 'solid', w: 1, c: 4 });
  return L;
}
function motifIdx(m, u, c) {            // u: position along the border (symmetric about the middle), c: 0..w-1 across
  const p = m.p, w = m.w, a = ((u % p) + p) % p, h = w / 2 - 0.5, v = c - h;
  switch (m.kind) {
    case 'diamonds': { const du = a - (p - 1) / 2; return Math.abs(du) * (h / ((p - 1) / 2)) + Math.abs(v) <= h * 0.95 ? m.fg : (Math.abs(du) < 1 && Math.abs(v) < 1 ? m.fg2 : m.bg); }
    case 'zigzag': { const tri = Math.abs(a - p / 2) / (p / 2); const vz = (tri - 0.5) * (w - 3); return Math.abs(v - vz) < 1.3 ? m.fg : (Math.abs(v - vz) < 2.6 ? m.fg2 : m.bg); }
    case 'chain': { const s = Math.max(2, Math.floor(w / 3)), a2 = Math.floor(u / s), b2 = Math.floor(c / s); return (a2 + b2) % 2 === 0 ? m.fg : m.bg; }
    case 'cross': { const du = a - (p - 1) / 2; return (Math.abs(du) < 1.1 && Math.abs(v) <= h * 0.8) || (Math.abs(v) < 1.1 && Math.abs(du) <= p * 0.35) ? m.fg : m.bg; }
    case 'wave': { const vw = Math.sin((a / p) * Math.PI * 2) * (h - 1.6); return Math.abs(v - vw) < 1.15 ? m.fg : (Math.abs(v + vw) < 1.15 ? m.fg2 : m.bg); }
    case 'dots': { const du = a - 1.5; return (Math.abs(du) < 1.4 && Math.abs(v) < 1.4) ? m.fg : (Math.abs(v) > h - 0.6 ? m.fg2 : m.bg); }
    case 'hooks': { const du = a - (p - 1) / 2, k = (1 - Math.abs(du) / (p / 2)) * w; return (c < k * 0.75 && Math.abs(du) < p / 2 - 0.5) ? (c < 2 ? m.fg2 : m.fg) : m.bg; }
    case 'fret': { const q = w / 4, k = Math.floor(c / q), uu = a / p * 4; const on = (k === 0 && uu < 3) || (k === 3 && uu > 1) || (uu >= 0 && uu < 1 && k <= 2) || (uu >= 2 && uu < 3 && k >= 1); return on ? m.fg : (k === 1 && uu >= 1 && uu < 2 ? m.fg2 : m.bg); }
    default: { const k = (a / p) * (w - 1); return c === Math.round(k) || c === Math.round(k) + 1 ? m.fg : (c > k ? m.bg : m.fg2); }
  }
}

/* ------------------------------------------------------------------ field families: each returns (x, y) => palette index inside the field */
function ringsFrom(r, n, first) { const out = []; let prev = first; for (let i = 0; i < n; i++) { let c; do c = pick(r, [1, 2, 3, 4, 5, 0]); while (c === prev); out.push(c); prev = c; } return out; }

function famMedallion(r, FW, FH, o = {}) {
  const cx = (FW - 1) / 2, cy = (FH - 1) / 2, rx = FW * (o.big || 0.3 + r() * 0.1), ry = Math.min(FH * (0.24 + r() * 0.09), rx * 1.75);
  const kind = pick(r, ['diamond', 'octagon', 'octagon', 'ellipse']), rings = ri(r, 4, 6), cols = ringsFrom(r, rings, 0), pend = FH > FW * 1.2 && r() < 0.8, spand = r() < 0.85;
  const spR = Math.min(FW, FH) * (0.34 + r() * 0.12), dot = ri(r, 5, 7), dotOn = r() < 0.85, dotC = pick(r, [1, 3, 2]), cols2 = ringsFrom(r, 3, 0), pr = ry * 0.42, vine = r() < 0.5;
  const metric = (ax, ay, a, b) => kind === 'diamond' ? ax / a + ay / b : kind === 'octagon' ? Math.max(ax / a, ay / b, (ax / a + ay / b) * 0.72) : Math.hypot(ax / a, ay / b);
  return (x, y) => {
    const ax = Math.abs(x - cx), ay = Math.abs(y - cy), m = metric(ax, ay, rx, ry);
    if (m < 1) { const q = m * rings, k = Math.floor(q); if (q - k < 0.14 && k > 0) return 4; return cols[rings - 1 - k]; }
    if (pend) { const m2 = ax / (pr * 1.1) + Math.abs(ay - (ry + pr * 0.55)) / pr; if (m2 < 1) return m2 < 0.4 ? 3 : m2 < 0.7 ? 2 : 4; if (m2 < 1.12) return 4; }
    if (spand) { const fx = Math.min(x, FW - 1 - x), fy = Math.min(y, FH - 1 - y), m3 = (fx + fy) / spR; if (m3 < 1) { const k = Math.floor(m3 * 3); return m3 > 0.88 ? 4 : cols2[2 - k]; } }
    if (vine) { const d = Math.abs(((ax * 0.7 + ay) % 14) - 7); if (d < 1 && m < 1.9) return dotC; }
    if (dotOn) { const gx = x % dot, gy = (y + (Math.floor(x / dot) % 2) * (dot >> 1)) % dot; if (gx === 1 && gy === 1) return dotC; if ((gx === 0 || gx === 2) && gy === 1 && dot > 5 && ((x / dot | 0) + (y / dot | 0)) % 2 === 0) return dotC; }
    return 0;
  };
}

function famKilim(r, FW, FH) {
  const cx = (FW - 1) / 2, half = Math.ceil(FH / 2), bands = []; let y = 0;
  while (y < half) { const h = ri(r, 7, 15), type = pick(r, ['diamonds', 'zigzag', 'hooks', 'stripe', 'blocks', 'diamonds', 'hooks']); bands.push({ y0: y, y1: y + h, type, c1: pick(r, [1, 2, 3, 5]), c2: pick(r, [0, 4]), c3: pick(r, [2, 3, 1]), p: pick(r, [10, 12, 14, 16]) }); y += h; bands.push({ y0: y, y1: y + 2, type: 'sep', c1: pick(r, [3, 2]), c2: 4 }); y += 2; }
  return (x, yy) => {
    const y2 = Math.min(yy, FH - 1 - yy), ax = Math.abs(x - cx); const b = bands.find((q) => y2 >= q.y0 && y2 < q.y1) || bands[bands.length - 1]; const ly = y2 - b.y0, bh = b.y1 - b.y0;
    switch (b.type) {
      case 'sep': return ly === 0 ? b.c2 : b.c1;
      case 'diamonds': { const a = (ax + b.p / 2) % b.p - b.p / 2, d = Math.abs(a) * (bh / b.p) * 2 + Math.abs(ly - (bh - 1) / 2); return d < bh * 0.5 ? (d < bh * 0.22 ? b.c3 : b.c1) : b.c2; }
      case 'zigzag': { const t = Math.abs(((ax % b.p) / b.p) * 2 - 1), v = t * (bh - 2) + 1; return Math.abs(ly - v) < 1.6 ? b.c1 : (Math.abs(ly - v) < 3 ? b.c3 : b.c2); }
      case 'hooks': { const a = ax % b.p, k = (1 - Math.abs((a / b.p) * 2 - 1)) * bh; return ly < k && ly > k - 3.2 ? b.c1 : (ly < k - 3 ? b.c2 : (a < 2 ? b.c3 : b.c2)); }
      case 'stripe': return ly % 4 < 2 ? b.c1 : (ly % 4 === 2 ? b.c3 : b.c2);
      default: { const s = 3; return ((Math.floor(ax / s) + Math.floor(ly / s)) % 2) ? b.c1 : b.c2; }
    }
  };
}

function famTrellis(r, FW, FH) {
  const s = ri(r, 14, 22), lc = pick(r, [3, 2, 1]), dc = pick(r, [2, 3, 5]), fillA = pick(r, [0, 1, 4]), fillB = pick(r, [0, 1]), lw = pick(r, [1, 2, 2]), dots = r() < 0.7, inner = r() < 0.6;
  return (x, y) => {
    const u = (x + y) % s, v = ((x - y) % s + s) % s, du = Math.min(u, s - u), dv = Math.min(v, s - v);
    if (du < lw || dv < lw) return lc;
    const cu = Math.floor((x + y) / s), cv = Math.floor((x - y + 10 * s) / s), alt = (cu + cv) % 2;
    const mu = Math.abs(((x + y) % s) - s / 2), mv = Math.abs((((x - y) % s + s) % s) - s / 2);
    if (dots && mu + mv < s * 0.2) return dc;
    if (inner && mu + mv < s * 0.34 && mu + mv > s * 0.26) return alt ? 1 : 5;
    return alt ? fillA : fillB;
  };
}

function famGul(r, FW, FH) {
  const gx = ri(r, 20, 26), gy = Math.round(gx * pick(r, [0.9, 1, 1.15])), c1 = pick(r, [1, 2, 5]), c2 = pick(r, [3, 2]), c3 = pick(r, [4, 5, 1]), minor = pick(r, [3, 2, 1]), ground = 0;
  return (x, y) => {
    const row = Math.floor(y / gy), ox = (row % 2) * (gx / 2), lx = ((x + ox) % gx + gx) % gx - gx / 2 + 0.5, ly = (y % gy) - gy / 2 + 0.5, ax = Math.abs(lx), ay = Math.abs(ly);
    const oct = Math.max(ax / (gx * 0.43), ay / (gy * 0.43), (ax / (gx * 0.43) + ay / (gy * 0.43)) * 0.72);
    if (oct < 1) { if (oct > 0.86) return 4; if (oct > 0.7) return c2; const quad = (lx > 0) === (ly > 0) ? c1 : c3; if (ax < 1.2 || ay < 1.2) return c2; return oct < 0.3 ? c2 : quad; }
    const mx = Math.abs(((x + ox + gx / 2) % gx) - gx / 2), my = Math.abs(((y + gy / 2) % gy) - gy / 2);
    if (mx + my < gx * 0.16) return minor; if (mx + my < gx * 0.22) return 4;
    return ground;
  };
}

const FLOWERS = [['..#..', '.###.', '#####', '.###.', '..#..'], ['#.#.#', '.###.', '##.##', '.###.', '#.#.#'], ['.#.#.', '#####', '.###.', '#####', '.#.#.'], ['..#..', '.#.#.', '#.#.#', '.#.#.', '..#..']];
function famAllover(r, FW, FH) {
  const s = ri(r, 16, 22), fl = pick(r, FLOWERS), c1 = pick(r, [1, 2, 3]), c2 = pick(r, [2, 5, 3]), ground = 0, leaf = pick(r, [5, 1, 3]), inl = r() < 0.5;
  return (x, y) => {
    const u = ((x + y) % s + s) % s, v = ((x - y) % s + s) % s, du = Math.min(u, s - u), dv = Math.min(v, s - v);
    const cxm = ((x % s) + s) % s - s / 2, cym = ((y % s) + s) % s - s / 2;
    const fx = Math.round(cxm + 2), fy = Math.round(cym + 2);
    if (fx >= 0 && fx < 5 && fy >= 0 && fy < 5 && fl[fy][fx] === '#') return c1;
    if (fx >= -1 && fx < 6 && fy >= -1 && fy < 6 && fl[clamp(fy, 0, 4)][clamp(fx, 0, 4)] === '#') return 4;
    if (du < 1.2 && dv > s * 0.28) return leaf; if (dv < 1.2 && du > s * 0.28) return c2;
    const xm = ((x + s / 2) % s + s) % s - s / 2, ym = ((y + s / 2) % s + s) % s - s / 2; if (Math.abs(xm) + Math.abs(ym) < 3.2) return inl ? c2 : 3;
    return ground;
  };
}

function famAbstract(r, FW, FH) {
  const kind = pick(r, ['ombre', 'waves', 'contour', 'waves', 'ombre']), n1 = noiseFn(r, 4), n2 = noiseFn(r, 9), cols = pick(r, [[0, 1, 3, 5], [4, 0, 1, 3], [0, 1, 2, 3], [1, 0, 3, 2], [4, 1, 3, 2]]);
  const k0 = FW / 72, amp = (6 + r() * 12) * k0, fq = (0.05 + r() * 0.06) / k0, bw = Math.round((5 + Math.floor(r() * 6)) * k0), dir = r() < 0.5, line = pick(r, [3, 2]);
  const bayer = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  return (x, y) => {
    const u = x / FW, v = y / FH;
    if (kind === 'ombre') { let t = (dir ? v : u) + (n1(u, v) - 0.5) * 0.35 + (n2(u, v) - 0.5) * 0.12; t = clamp(t, 0, 0.999) * 3; const k = Math.floor(t), f = t - k, d = bayer[y & 3][x & 3] / 16; return (f > d ? cols[Math.min(3, k + 1)] : cols[k]); }
    if (kind === 'waves') { const t = (dir ? y : x) + Math.sin((dir ? x : y) * fq + n1(u, v) * 6) * amp + (n2(u, v) - 0.5) * 8; const k = Math.floor(t / bw), m = ((t % bw) + bw) % bw; if (m < 1) return line; return cols[((k % 4) + 4) % 4]; }
    const q = n1(u, v) * 0.7 + n2(u, v) * 0.3, k = Math.floor(q * 14), f = q * 14 - k; if (f < 0.1) return line; return cols[(k >> 1) % 2 ? 1 : 0];
  };
}

function famGarden(r, FW, FH) {
  const s = Math.round(FW / ri(r, 2, 3) * 0.62 + 6), petals = pick(r, [8, 10, 12]), c1 = pick(r, [1, 2, 3]), c2 = pick(r, [2, 3, 5]), c3 = pick(r, [5, 1, 3]), leaf = pick(r, [5, 1, 2]), vineC = pick(r, [3, 2, 1]), stag = r() < 0.7;
  const cell = (x, y) => { const row = Math.floor(y / s), ox = stag ? (row % 2) * (s / 2) : 0; return { lx: ((x + ox) % s + s) % s - s / 2, ly: (y % s) - s / 2, row }; };
  return (x, y) => {
    const { lx, ly } = cell(x, y), d = Math.hypot(lx, ly), th = Math.atan2(ly, lx), R = s * 0.34;
    const petal = R * (0.52 + 0.48 * Math.abs(Math.cos((petals / 2) * th)));
    if (d < petal) { if (d < R * 0.2) return c3; if (d < R * 0.34) return 4; if (d > petal - 1.2) return 4; return d < R * 0.62 ? c2 : c1; }
    if (d < petal + 1.1) return 4;
    // diagonal vines with leaves between rosettes
    const ax = Math.abs(lx), ay = Math.abs(ly), diag = Math.abs(ax - ay);
    const wob = Math.sin((ax + ay) * 0.55) * 1.3;
    if (Math.abs(diag - 3.5 - wob) < 0.9 && d > petal + 2 && d < s * 0.72) return vineC;
    const lf = Math.hypot((ax - s * 0.46) * 1.15, (ay - s * 0.46) * 0.55); if (lf < s * 0.12) return leaf;
    if (ax > s * 0.42 && ay > s * 0.42 && Math.hypot(ax - s * 0.5, ay - s * 0.5) < 2.6) return c2;
    return 0;
  };
}

function famStripes(r, FW, FH) {
  const cx = (FW - 1) / 2, seg = []; let x = 0; while (x < cx + 4) { const w = ri(r, 2, 9); seg.push({ x0: x, x1: x + w, c: pick(r, [0, 1, 2, 3, 4, 5]) }); x += w; if (r() < 0.5) { seg.push({ x0: x, x1: x + 1, c: 3 }); x += 1; } }
  const hatch = r() < 0.45;
  return (xx, y) => { const ax = Math.abs(xx - cx), s = seg.find((q) => ax >= q.x0 && ax < q.x1) || seg[seg.length - 1]; if (hatch && s.c === 1 && (y + Math.round(ax)) % 6 < 2) return 3; return s.c; };
}

function famGeometric(r, FW, FH) {
  const kind = pick(r, ['chevron', 'hex', 'fret', 'tri']), p = ri(r, 8, 14), c1 = pick(r, [1, 2, 3]), c2 = pick(r, [0, 4, 5]), c3 = pick(r, [3, 2]), cx = (FW - 1) / 2;
  return (x, y) => {
    const ax = Math.abs(x - cx);
    if (kind === 'chevron') { const t = Math.abs(((ax + 100 * p) % (p * 2)) - p), k = Math.floor((y + t) / (p * 0.6)) % 3; return k === 0 ? c1 : k === 1 ? c2 : c3; }
    if (kind === 'tri') { const lx = ax % p, ly = y % p, up = (Math.floor(ax / p) + Math.floor(y / p)) % 2; return (up ? lx + ly < p : lx + ly >= p) ? c1 : c2; }
    if (kind === 'hex') { const s = p, h = s * 0.866, row = Math.floor(y / h), off = (row % 2) * s * 0.5, lx = ((ax + off) % s) - s / 2, ly = (y % h) - h / 2; return Math.abs(lx) + Math.abs(ly) * 1.4 < s * 0.38 ? c1 : (Math.abs(lx) + Math.abs(ly) * 1.4 < s * 0.46 ? c3 : c2); }
    const s = p, a = ax % s, b = y % s; const d = Math.min(a, b, s - 1 - a, s - 1 - b); return (d === 0 || (a > s / 2 && b === Math.floor(s / 2))) ? c1 : (d === 1 ? c3 : c2);
  };
}

function famPatch(r, FW, FH) {
  const s = ri(r, 12, 17), sub = []; for (let i = 0; i < 24; i++) sub.push({ t: pick(r, ['dia', 'cross', 'stripe', 'check', 'ring', 'sq']), a: pick(r, [1, 2, 3, 5]), b: pick(r, [0, 4, 1]), c: pick(r, [3, 2]) });
  return (x, y) => {
    const cx = Math.floor(x / s), cy = Math.floor(y / s), q = sub[(cx * 7 + cy * 13 + (cx ^ cy)) % sub.length], lx = x % s - (s - 1) / 2, ly = y % s - (s - 1) / 2, ax = Math.abs(lx), ay = Math.abs(ly);
    if (ax > s / 2 - 0.5 || ay > s / 2 - 0.5) return 4;
    switch (q.t) { case 'dia': return ax + ay < s * 0.4 ? (ax + ay < s * 0.2 ? q.c : q.a) : q.b; case 'cross': return ax < 1.6 || ay < 1.6 ? q.a : q.b; case 'stripe': return Math.floor((ly + s) / 2) % 2 ? q.a : q.b; case 'check': return (Math.floor((lx + s) / 3) + Math.floor((ly + s) / 3)) % 2 ? q.a : q.b; case 'ring': { const d = Math.hypot(lx, ly); return d < s * 0.18 ? q.c : d < s * 0.4 ? (d > s * 0.3 ? q.a : q.b) : q.b; } default: return ax < s * 0.28 && ay < s * 0.28 ? q.a : q.b; }
  };
}

function famDeco(r, FW, FH) {
  const s = ri(r, 12, 18), cols = ringsFrom(r, 5, 0).map((c) => c), rings = ri(r, 3, 5);
  return (x, y) => { const row = Math.floor(y / s), ox = (row % 2) * s, lx = (x + ox) % (2 * s), ly = y % s; const d = Math.min(Math.hypot(lx - s, ly - s), 99) ; const k = Math.floor((s - 0.5 - Math.hypot(lx % (2 * s) - s, s - ly - 0)) / (s / rings)); const dd = Math.hypot(lx - s, ly); const q = Math.floor(dd / (s / rings)); return dd <= s ? cols[q % cols.length] : cols[(q + 2) % cols.length]; };
}

function famShag(r, FW, FH) {
  const bands = r() < 0.5, cx = (FW - 1) / 2, c = pick(r, [0, 1]), n = noiseFn(r, 4);
  return (x, y) => { if (bands && Math.abs(x - cx) % 18 < 2) return 1; return n(x / FW, y / FH) > 0.62 ? 1 : 0; };
}

/* ------------------------------------------------------------------ grid */
export function buildGrid(spec) {
  if (spec._g) return spec._g;
  const { W, H, fam, shape } = spec, r = rngOf(spec.s), g = new Uint8Array(W * H), mask = new Uint8Array(W * H).fill(1);
  const layers = makeBorder(r, W, fam, shape), bt = layers.reduce((a, l) => a + l.w, 0), FW = W - 2 * bt, FH = H - 2 * bt;
  const mk = { garden: famGarden, medallion: famMedallion, kilim: famKilim, trellis: famTrellis, gul: famGul, allover: famAllover, abstract: famAbstract, stripes: famStripes, geometric: famGeometric, patchwork: famPatch, oushak: (rr, a, b) => famMedallion(rr, a, b, { big: 0.34 + rr() * 0.08 }), deco: famDeco, shag: famShag }[fam];
  const field = mk(r, FW, FH); const R = W / 2, cxm = (W - 1) / 2, cym = (H - 1) / 2;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let d, u;
    if (shape === 'round') { const dx = x - cxm, dy = y - cym, rr = Math.hypot(dx, dy); if (rr > R - 0.5) { mask[y * W + x] = 0; continue; } d = R - 0.5 - rr; u = Math.abs(Math.atan2(dy, Math.abs(dx))) * (R - d) * 0.9 + 0; }
    else { d = Math.min(x, y, W - 1 - x, H - 1 - y); u = Math.min(x, y, W - 1 - x, H - 1 - y) === Math.min(x, W - 1 - x) ? Math.abs(y - cym) : Math.abs(x - cxm); }
    let idx;
    if (d < bt) { let acc = 0; idx = 4; for (const l of layers) { if (d < acc + l.w) { idx = l.t === 'solid' ? l.c : motifIdx(l, Math.round(u), Math.floor(d - acc)); break; } acc += l.w; } }
    else idx = field(Math.floor(x - bt), Math.floor(y - bt));
    g[y * W + x] = idx;
  }
  spec._g = { W, H, g, mask, bt, layers }; return spec._g;
}

/* ------------------------------------------------------------------ painting */
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
export const palRGB = (pi, vint = 0, cols) => (cols || PALETTES[pi].c).map((h) => { let [r, g, b] = hex(h); if (vint) { const l = r * 0.3 + g * 0.59 + b * 0.11; r += (l - r) * vint * 0.55 + vint * 22; g += (l - g) * vint * 0.55 + vint * 18; b += (l - b) * vint * 0.55 + vint * 10; } return [clamp(r, 0, 255), clamp(g, 0, 255), clamp(b, 0, 255)]; });

export function paintRug(canvas, spec, cell, o = {}) {
  const G = buildGrid(spec), { W, H, g, mask } = G, flat = spec.fam === 'kilim', shag = spec.fam === 'shag';
  const round = spec.shape === 'round', fr = round || o.noFringe ? 0 : Math.round(H * cell * 0.045), pad = Math.round(cell * 0.6);
  const cw = Math.round(W * cell), ch = Math.round(H * cell);
  canvas.width = cw + (round || o.noFringe ? 0 : 0); canvas.height = ch + 2 * fr;
  const ctx = canvas.getContext('2d'), r = rngOf(spec.s ^ 0x9e3779b9), pal = palRGB(spec.pal, spec.wear, spec.cols);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const rows = Math.min(H, o.rows == null ? H : o.rows), ab = new Float32Array(H); let a = 0; for (let y = 0; y < H; y++) { a = a * 0.8 + (r() - 0.5) * 0.06; ab[y] = a; }
  const jit = flat ? 0.05 : shag ? 0.2 : 0.1, bev = cell >= 5 && !flat;
  if (fr) { // fringe: twisted cream threads at both ends
    const n = Math.round(W / 1.15), lc = 'rgba(236,226,204,'; ctx.lineCap = 'round';
    for (let end = 0; end < 2; end++) for (let i = 0; i < n; i++) { const x = (i + 0.5) * (cw / n), len = fr * (0.78 + r() * 0.3), y0 = end ? fr + ch : fr, dir = end ? 1 : -1, sw = (r() - 0.5) * cell * 1.4; ctx.strokeStyle = lc + (0.7 + r() * 0.3).toFixed(2) + ')'; ctx.lineWidth = Math.max(1, cell * 0.38); ctx.beginPath(); ctx.moveTo(x, y0); ctx.quadraticCurveTo(x + sw * 0.4, y0 + dir * len * 0.5, x + sw, y0 + dir * len); ctx.stroke(); if (cell > 4) { ctx.strokeStyle = 'rgba(120,100,70,.28)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + cell * 0.12, y0); ctx.quadraticCurveTo(x + sw * 0.4 + cell * 0.12, y0 + dir * len * 0.5, x + sw + cell * 0.12, y0 + dir * len); ctx.stroke(); } }
  }
  for (let y = 0; y < rows; y++) for (let x = 0; x < W; x++) {
    if (!mask[y * W + x]) continue; const c = pal[g[y * W + x]], f = 1 + ab[y] + (r() - 0.5) * jit, px = Math.round(x * cell), py = fr + Math.round(y * cell), w = Math.round((x + 1) * cell) - px, h = fr + Math.round((y + 1) * cell) - py;
    ctx.fillStyle = `rgb(${clamp(c[0] * f, 0, 255) | 0},${clamp(c[1] * f, 0, 255) | 0},${clamp(c[2] * f, 0, 255) | 0})`; ctx.fillRect(px, py, w, h);
    if (bev) { const t = Math.max(1, Math.round(cell * 0.2)); ctx.fillStyle = 'rgba(255,248,230,.13)'; ctx.fillRect(px, py, w, t); ctx.fillStyle = 'rgba(0,0,0,.17)'; ctx.fillRect(px, py + h - t, w, t); ctx.fillStyle = 'rgba(255,248,230,.05)'; ctx.fillRect(px, py, t, h); ctx.fillStyle = 'rgba(0,0,0,.07)'; ctx.fillRect(px + w - t, py, t, h); if (shag && r() < 0.5) { ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.fillRect(px + r() * w, py, 1, h); } }
    else if (flat && cell >= 3) { ctx.fillStyle = 'rgba(0,0,0,.13)'; ctx.fillRect(px, py + h - 1, w, 1); ctx.fillStyle = 'rgba(255,248,230,.07)'; ctx.fillRect(px, py, w, 1); }
  }
  if (!o.rows || o.rows >= H) { // light: soft raking light from the top-left, edge darkening
    ctx.save(); ctx.globalCompositeOperation = 'soft-light'; const gr = ctx.createLinearGradient(0, fr, cw, fr + ch); gr.addColorStop(0, 'rgba(255,245,225,.55)'); gr.addColorStop(0.5, 'rgba(128,128,128,.0)'); gr.addColorStop(1, 'rgba(10,6,4,.55)'); ctx.fillStyle = gr; ctx.fillRect(0, fr, cw, ch); ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; const vg = ctx.createRadialGradient(cw / 2, fr + ch / 2, Math.min(cw, ch) * 0.35, cw / 2, fr + ch / 2, Math.max(cw, ch) * 0.8); vg.addColorStop(0, 'rgba(255,255,255,1)'); vg.addColorStop(1, 'rgba(214,200,180,1)'); ctx.fillStyle = vg; ctx.fillRect(0, fr, cw, ch); ctx.restore();
  }
  if (spec.wear > 0.1 && cell >= 3) { ctx.save(); ctx.globalCompositeOperation = 'source-atop'; for (let i = 0; i < W * H * spec.wear * 0.35; i++) { const x = r() * cw, y = fr + r() * ch, s = 2 + r() * cell * 2.4; ctx.fillStyle = r() < 0.6 ? `rgba(240,228,205,${(0.06 + r() * 0.1).toFixed(2)})` : `rgba(60,40,30,${(0.04 + r() * 0.07).toFixed(2)})`; ctx.fillRect(x, y, s * 2.2, s); } ctx.restore(); }
  if (round) { // keep only the knots that exist: the stepped edge of a hand-knotted round, with no haze from the light overlays outside it
    ctx.save(); ctx.globalCompositeOperation = 'destination-in'; ctx.beginPath();
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (mask[y * W + x]) { const px = Math.round(x * cell), py = fr + Math.round(y * cell); ctx.rect(px, py, Math.round((x + 1) * cell) - px, fr + Math.round((y + 1) * cell) - py); }
    ctx.fillStyle = '#000'; ctx.fill(); ctx.restore();
  }
  return canvas;
}

export function renderRug(spec, widthPx, o = {}) { const c = document.createElement('canvas'); paintRug(c, spec, widthPx / spec.W, o); return c; }

/* ------------------------------------------------------------------ catalog metadata (deterministic, no prices) */
export const SHAPES = ['rect', 'runner', 'round', 'square'];
export const MATERIALS = ['wool', 'woolsilk', 'silk', 'cotton', 'bamboo'];
export const TECHNIQUES = ['knotted', 'tufted', 'flatweave', 'loomed'];
export const PILES = ['low', 'medium', 'high'];
export const ROOMS = ['living', 'bedroom', 'dining', 'hall', 'kids', 'office'];
export const SIZES = { rect: ['80x150', '120x180', '160x230', '200x300', '250x350', '300x400'], square: ['120x120', '160x160', '200x200', '250x250'], round: ['120', '160', '200', '250'], runner: ['70x200', '80x250', '80x300', '90x400'] };
const COLLECTIONS = ['anatolia', 'caravan', 'nomad', 'atelier', 'heritage', 'horizon', 'garden', 'kilim'];
const FAM_COLLECTION = { garden: ['garden', 'heritage'], medallion: ['anatolia', 'heritage'], kilim: ['kilim', 'nomad'], trellis: ['atelier', 'caravan'], gul: ['caravan', 'nomad'], allover: ['garden', 'heritage'], abstract: ['horizon', 'atelier'], stripes: ['atelier', 'horizon'], geometric: ['atelier', 'nomad'], patchwork: ['nomad', 'heritage'], oushak: ['heritage', 'anatolia'], deco: ['atelier', 'garden'], shag: ['horizon', 'atelier'] };
const NAMES = ['Aslan', 'Ceylan', 'Dilara', 'Elvan', 'Firuze', 'Gülizar', 'Hazan', 'İpek', 'Jale', 'Kerem', 'Lâl', 'Mehtap', 'Nilüfer', 'Oya', 'Pınar', 'Rüya', 'Sahra', 'Tülin', 'Umay', 'Vera', 'Yaren', 'Zeynep', 'Alev', 'Bahar', 'Çağla', 'Defne', 'Ebru', 'Feraye', 'Gökçe', 'Hilal', 'Idil', 'Lale', 'Melek', 'Nazlı', 'Özlem', 'Selvi', 'Tuana', 'Yasemin', 'Zümrüt', 'Arda', 'Berk', 'Cem', 'Deniz', 'Emir', 'Fırat', 'Kaan', 'Levent', 'Mert', 'Onur', 'Poyraz', 'Rüzgâr', 'Selim', 'Toprak', 'Umut', 'Yağız'];
export function itemOf(i) {
  const spec = makeSpec(i + 1), r = rngOf(i * 104729 + 7), pal = PALETTES[spec.pal];
  const mat = spec.fam === 'shag' ? pick(r, ['wool', 'bamboo']) : spec.fam === 'kilim' ? pick(r, ['wool', 'cotton', 'wool']) : pick(r, ['wool', 'wool', 'wool', 'woolsilk', 'woolsilk', 'silk', 'bamboo', 'cotton']);
  const tech = spec.fam === 'kilim' ? 'flatweave' : spec.fam === 'shag' ? 'tufted' : pick(r, ['knotted', 'knotted', 'knotted', 'tufted', 'loomed', 'loomed']);
  const pile = spec.fam === 'kilim' ? 'low' : spec.fam === 'shag' ? 'high' : pick(r, ['low', 'medium', 'medium', 'high']);
  const rooms = []; for (const rm of ROOMS) if (r() < (rm === 'living' ? 0.8 : 0.35)) rooms.push(rm); if (!rooms.length) rooms.push('living'); if (spec.shape === 'runner' && !rooms.includes('hall')) rooms.push('hall');
  const sizes = SIZES[spec.shape].filter(() => r() < 0.8); if (sizes.length < 2) sizes.push(...SIZES[spec.shape].slice(0, 2 - sizes.length));
  const col = pick(r, FAM_COLLECTION[spec.fam]), name = NAMES[(i * 7 + Math.floor(r() * 5)) % NAMES.length], density = tech === 'knotted' ? [160, 250, 400, 650, 1000][ri(r, 0, 4)] * 1000 : null;
  return { id: i + 1, code: 'HM-' + String(1000 + i * 3 + ri(r, 0, 2)), name, spec, fam: spec.fam, shape: spec.shape, pal: spec.pal, color: pal.fam, mat, tech, pile, rooms, sizes: [...new Set(sizes)], col, density, added: 360 - i };
}
export const CATALOG_SIZE = 360;
let _cat; export const catalog = () => (_cat ||= Array.from({ length: CATALOG_SIZE }, (_, i) => itemOf(i)));

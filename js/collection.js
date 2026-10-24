/* HAMRA — the catalog: 360 designs, filters, sort, search, quick view, selection */
import { $, $$, esc, t, tl, href, mountChrome, sel, HEART, waUrl, waText, lang } from './shared.js';
import { catalog, paintRug, PALETTES, FAMILIES, COLOR_FAMILIES, SHAPES, MATERIALS, TECHNIQUES, PILES, ROOMS, CATALOG_SIZE } from './rugkit.js';
mountChrome('collection');
const cat = catalog(), PER = 36, GROUPS = [['style', 'fam', FAMILIES, 'fam'], ['color', 'color', COLOR_FAMILIES, 'color'], ['size', 'size', ['s', 'm', 'l'], 'sz'], ['shape', 'shape', SHAPES, 'shape'], ['mat', 'mat', MATERIALS, 'mat'], ['tech', 'tech', TECHNIQUES, 'tech'], ['pile', 'pile', PILES, 'pile'], ['room', 'room', ROOMS, 'room'], ['coll', 'col', ['anatolia', 'caravan', 'nomad', 'atelier', 'heritage', 'horizon', 'garden', 'kilim'], 'col']];
const SW = { red: '#9c1f24', blue: '#25407d', green: '#2a6b4f', gold: '#d6a53e', neutral: '#e4d7bd', grey: '#8a8f95', pink: '#d79aa0', brown: '#8a5a3c', black: '#1c1c20', purple: '#5e3a68', multi: 'conic-gradient(#b4452b,#d6a53e,#2a6b4f,#25407d,#b4452b)' };
const sizeClass = (it) => { const s = new Set(); for (const z of it.sizes) { const [a, b] = z.split('x').map(Number), area = b ? a * b : Math.PI * a * a / 4 * 1.27; s.add(area <= 21600 ? 's' : area <= 40000 ? 'm' : 'l'); } return s; };
cat.forEach((it) => { it.sc = sizeClass(it); });
const ATTR = { fam: (it) => [it.fam], color: (it) => [it.color], size: (it) => [...it.sc], shape: (it) => [it.shape], mat: (it) => [it.mat], tech: (it) => [it.tech], pile: (it) => [it.pile], room: (it) => it.rooms, col: (it) => [it.col] };
const state = { q: '', sort: 'new', page: 1, cols: 3, f: Object.fromEntries(GROUPS.map((g) => [g[0], new Set()])), seed: 1 };
function readURL() { const u = new URLSearchParams(location.search); for (const [k] of GROUPS) { const v = u.get(k); if (v) v.split(',').forEach((x) => state.f[k].add(x)); } if (u.get('q')) state.q = u.get('q'); if (u.get('sort')) state.sort = u.get('sort'); if (u.get('coll')) state.f.coll.add(u.get('coll')); if (u.get('style')) u.get('style').split(',').forEach((x) => state.f.style.add(x)); }
function writeURL() { const u = new URLSearchParams(location.search); for (const [k] of GROUPS) { u.delete(k); if (state.f[k].size) u.set(k, [...state.f[k]].join(',')); } u.delete('coll'); if (state.q) u.set('q', state.q); else u.delete('q'); if (state.sort !== 'new') u.set('sort', state.sort); else u.delete('sort'); const s = u.toString(); history.replaceState(null, '', location.pathname + (s ? '?' + s : '')); }
function matches(it) { for (const [k, , , ] of GROUPS) { const sset = state.f[k]; if (!sset.size) continue; const a = ATTR[GROUPS.find((g) => g[0] === k)[1]](it); if (!a.some((v) => sset.has(v))) return false; } if (state.q) { const q = state.q.toLowerCase(); if (!(it.name.toLowerCase().includes(q) || it.code.toLowerCase().includes(q) || tl('fam.' + it.fam).toLowerCase().includes(q) || tl('color.' + it.color).toLowerCase().includes(q))) return false; } return true; }
function result() { let r = cat.filter(matches); const s = state.sort; if (s === 'name') r.sort((a, b) => a.name.localeCompare(b.name) || a.id - b.id); else if (s === 'density') r.sort((a, b) => (b.density || 0) - (a.density || 0) || a.id - b.id); else if (s === 'shuffle') { const x = state.seed; r.sort((a, b) => ((a.id * 9301 + x * 49297) % 233280) - ((b.id * 9301 + x * 49297) % 233280)); } else r.sort((a, b) => b.added - a.added); return r; }

/* ---------------- sidebar */
function buildSide() {
  const side = $('#side'); let h = `<button type="button" class="btn line sm" id="reset" style="margin-bottom:18px">${esc(t('shop.reset'))}</button>`;
  for (const [k, , vals, ns] of GROUPS) {
    h += `<h4>${esc(t('f.' + (k === 'mat' ? 'mat' : k)))}</h4>`;
    if (k === 'color') h += `<div class="sw">${vals.map((v) => `<button type="button" data-g="color" data-v="${v}" title="${esc(tl('color.' + v))}" aria-label="${esc(tl('color.' + v))}" class="${state.f.color.has(v) ? 'on' : ''}" style="background:${SW[v]}"></button>`).join('')}</div>`;
    else h += `<div class="chips">${vals.map((v) => `<button type="button" class="chip ${state.f[k].has(v) ? 'on' : ''}" data-g="${k}" data-v="${v}">${esc(tl(k === 'size' ? 'sz.' + v : ns + '.' + v))}</button>`).join('')}</div>`;
  }
  side.innerHTML = h;
  $$('[data-g]', side).forEach((b) => b.addEventListener('click', () => { const s = state.f[b.dataset.g]; s.has(b.dataset.v) ? s.delete(b.dataset.v) : s.add(b.dataset.v); b.classList.toggle('on'); state.page = 1; refresh(); }));
  $('#reset').addEventListener('click', () => { for (const k in state.f) state.f[k].clear(); state.q = ''; $('#q').value = ''; state.page = 1; buildSide(); refresh(); });
}
function buildSort() { const s = $('#sort'); s.innerHTML = ['new', 'name', 'density', 'shuffle'].map((k) => `<option value="${k}" ${state.sort === k ? 'selected' : ''}>${esc(t('sort.' + k))}</option>`).join(''); }

/* ---------------- grid */
const io = 'IntersectionObserver' in window ? new IntersectionObserver((en) => en.forEach((e) => { const c = e.target; if (e.isIntersecting) paintCard(c); else release(c); }), { rootMargin: '700px 0px' }) : null;
function paintCard(c) { if (c.dataset.on) return; const it = cat[+c.dataset.id - 1]; paintRug(c, it.spec, Math.max(3.4, Math.min(8, 380 / it.spec.W))); c.dataset.on = '1'; }
function release(c) { if (!c.dataset.on) return; c.width = c.height = 1; delete c.dataset.on; }
function cardHTML(it, n) { return `<a class="rc" href="${href('rug.html?id=' + it.id)}" data-id="${it.id}"><div class="face"><canvas data-id="${it.id}" aria-label="${esc(it.name)}"></canvas>${it.added > 348 ? `<span class="new">${esc(lang === 'ar' ? 'جديد' : lang === 'tr' ? 'Yeni' : 'New')}</span>` : ''}<button type="button" class="heart ${sel.has(it.id) ? 'on' : ''}" data-h="${it.id}" aria-label="Keep">${HEART}</button></div><div class="meta"><h3>${esc(it.name)}</h3><span>${esc(it.code)}</span></div><div class="sub">${esc(tl('fam.' + it.fam))} · ${esc(tl('tech.' + it.tech))}</div></a>`; }
let shown = [];
function renderGrid(append) {
  const g = $('#grid'), r = shown, upto = Math.min(r.length, state.page * PER), from = append ? (state.page - 1) * PER : 0;
  if (!append) { $$('canvas', g).forEach(release); g.innerHTML = ''; if (!r.length) { g.innerHTML = `<div class="empty" style="grid-column:1/-1">${esc(t('shop.none'))}</div>`; } }
  g.insertAdjacentHTML('beforeend', r.slice(from, upto).map((it) => cardHTML(it)).join(''));
  $$('canvas', g).forEach((c) => { if (!c.dataset.ob) { c.dataset.ob = '1'; io ? io.observe(c) : paintCard(c); } });
  $('#more').parentElement.style.display = upto < r.length ? '' : 'none';
}
function refresh() {
  shown = result(); writeURL(); $('#count').textContent = t('shop.n', { n: shown.length });
  const act = $('#active'); act.innerHTML = GROUPS.flatMap(([k, , , ns]) => [...state.f[k]].map((v) => `<button type="button" class="chip" data-k="${k}" data-v="${v}">${esc(tl(k === 'size' ? 'sz.' + v : ns + '.' + v))}</button>`)).join('');
  $$('.chip', act).forEach((b) => b.addEventListener('click', () => { state.f[b.dataset.k].delete(b.dataset.v); state.page = 1; buildSide(); refresh(); }));
  renderGrid(false);
}
$('#grid').addEventListener('click', (e) => {
  const h = e.target.closest('[data-h]'); if (h) { e.preventDefault(); e.stopPropagation(); const id = +h.dataset.h; sel.toggle(id); h.classList.toggle('on', sel.has(id)); return; }
  const a = e.target.closest('.rc'); if (a && !e.metaKey && !e.ctrlKey) { e.preventDefault(); quick(+a.dataset.id); }
});
$('#more').addEventListener('click', () => { state.page++; renderGrid(true); });
let qt = 0; $('#q').addEventListener('input', (e) => { clearTimeout(qt); qt = setTimeout(() => { state.q = e.target.value.trim(); state.page = 1; refresh(); }, 220); });
$('#sort').addEventListener('change', (e) => { state.sort = e.target.value; if (state.sort === 'shuffle') state.seed = 1 + Math.floor(Math.random() * 9999); state.page = 1; refresh(); });
$('#fopen').addEventListener('click', () => { $('#side').classList.add('on'); document.body.classList.add('noscroll'); }); $('#fclose').addEventListener('click', () => { $('#side').classList.remove('on'); document.body.classList.remove('noscroll'); });
sel.on(() => $$('.heart').forEach((h) => h.classList.toggle('on', sel.has(+h.dataset.h))));

/* ---------------- quick view */
function quick(id) {
  const it = cat[id - 1], pal = PALETTES[it.pal], box = $('#qvbox'), qv = $('#qv');
  const dens = it.density ? t('r.dens.v', { n: it.density.toLocaleString(lang === 'ar' ? 'en' : lang) }) : '—';
  box.innerHTML = `<button type="button" class="x" id="qx" aria-label="Close">×</button><div class="pic"><canvas id="qc"></canvas></div><div class="txt"><span class="k">${esc(tl('col.' + it.col))}</span><h2>${esc(it.name)}</h2><div class="code" style="font:500 13px/1 var(--f-body);letter-spacing:.24em;color:var(--mute)">${esc(it.code)}</div>
  <div class="pal">${pal.c.map((c) => `<i style="background:${c}"></i>`).join('')}</div><div style="color:var(--mute);font-size:14px;margin-bottom:6px">${esc(pal.n[lang] || pal.n.en)}</div>
  <div class="spec"><div><b>${esc(t('r.style'))}</b><span>${esc(tl('fam.' + it.fam))}</span></div><div><b>${esc(t('r.mat'))}</b><span>${esc(tl('mat.' + it.mat))}</span></div><div><b>${esc(t('r.tech'))}</b><span>${esc(tl('tech.' + it.tech))}</span></div><div><b>${esc(t('r.pile'))}</b><span>${esc(tl('pile.' + it.pile))}</span></div><div><b>${esc(t('r.dens'))}</b><span>${esc(dens)}</span></div><div><b>${esc(t('r.sizes'))}</b><span class="ltr">${esc(it.sizes.join(' · '))}</span></div></div>
  <div class="acts" style="display:flex;gap:12px;flex-wrap:wrap"><a class="btn" href="${href('rug.html?id=' + it.id)}">${esc(t('r.weave'))}</a><button type="button" class="btn line" id="qadd">${esc(sel.has(it.id) ? t('r.remove') : t('r.add'))}</button></div></div>`;
  const c = $('#qc', box); paintRug(c, it.spec, Math.max(5, Math.min(9, 640 / it.spec.W)));
  qv.classList.add('on'); document.body.classList.add('noscroll');
  const close = () => { qv.classList.remove('on'); document.body.classList.remove('noscroll'); }; $('#qx', box).addEventListener('click', close); qv.onclick = (e) => { if (e.target === qv) close(); };
  $('#qadd', box).addEventListener('click', (e) => { sel.toggle(it.id); e.target.textContent = sel.has(it.id) ? t('r.remove') : t('r.add'); });
  addEventListener('keydown', function esc2(e) { if (e.key === 'Escape') { close(); removeEventListener('keydown', esc2); } });
}

/* ---------------- boot */
readURL(); buildSide(); buildSort(); $('#q').value = state.q; refresh();
addEventListener('langchange', () => { buildSide(); buildSort(); refresh(); });

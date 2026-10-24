/* HAMRA — shared chrome: language, header, footer, selection drawer, toast, helpers */
import { DICT, LANGS } from './i18n.js';
import { CONFIG } from './config.js';
import { catalog, paintRug } from './rugkit.js';
export { CONFIG };
export const $ = (s, r = document) => r.querySelector(s); export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------- language */
const pickLang = () => { const q = new URLSearchParams(location.search).get('lang'); if (LANGS.includes(q)) return q; try { const s = localStorage.getItem('hm_lang'); if (LANGS.includes(s)) return s; } catch (e) { } const n = (navigator.language || 'en').slice(0, 2); return LANGS.includes(n) ? n : 'en'; };
export let lang = pickLang();
export const t = (k, v) => { const d = DICT[k]; let s = d ? (d[lang] || d.en) : k; if (v) for (const x in v) s = s.replace('{' + x + '}', v[x]); return s; };
export const tl = (k) => DICT[k] ? (DICT[k][lang] || DICT[k].en) : k;
export function applyI18n(root = document) {
  document.documentElement.lang = lang; document.documentElement.dir = 'ltr';
  $$('[data-i18n]', root).forEach((e) => { e.innerHTML = t(e.dataset.i18n); });
  $$('[data-ph]', root).forEach((e) => { e.placeholder = t(e.dataset.ph); });
  $$('[data-title]', root).forEach((e) => { e.title = t(e.dataset.title); });
  const ti = document.documentElement.dataset.title; if (ti) document.title = (tl(ti) || ti) + ' · HAMRA';
}
export function setLang(l) { lang = l; try { localStorage.setItem('hm_lang', l); } catch (e) { } const u = new URL(location.href); if (u.searchParams.has('lang')) { u.searchParams.set('lang', l); history.replaceState(null, '', u); } applyI18n(); $$('.lang button').forEach((b) => b.classList.toggle('on', b.dataset.l === l)); drawDrawer(); window.dispatchEvent(new Event('langchange')); }
export const href = (p) => { const q = new URLSearchParams(location.search).get('lang'); return q ? `${p}${p.includes('?') ? '&' : '?'}lang=${q}` : p; };

/* ---------------- selection (the rugs a visitor kept) */
const KEY = 'hm_sel'; let ids = []; try { ids = JSON.parse(localStorage.getItem(KEY) || '[]').filter((n) => Number.isInteger(n)); } catch (e) { }
const subs = new Set();
export const sel = {
  get ids() { return ids; }, has: (id) => ids.includes(id), get count() { return ids.length; },
  toggle(id) { ids = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]; try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch (e) { } subs.forEach((f) => f()); badge(); drawDrawer(); },
  clear() { ids = []; try { localStorage.setItem(KEY, '[]'); } catch (e) { } subs.forEach((f) => f()); badge(); drawDrawer(); }, on: (f) => subs.add(f)
};
function badge() { $$('.selbtn b').forEach((b) => { b.textContent = ids.length; b.style.display = ids.length ? '' : 'none'; }); }

/* ---------------- whatsapp / copy */
export function waText(extra = '') { const items = ids.map((i) => { const it = catalog()[i - 1]; return it ? `${it.name} (${it.code})` : ''; }).filter(Boolean); return [t('wa.hello'), items.join(', '), extra].filter(Boolean).join('\n'); }
export const waUrl = (text) => (CONFIG.WA_NUMBER ? `https://wa.me/${CONFIG.WA_NUMBER}?text=${encodeURIComponent(text)}` : '');
export async function copyText(s) { try { await navigator.clipboard.writeText(s); } catch (e) { const a = document.createElement('textarea'); a.value = s; document.body.append(a); a.select(); try { document.execCommand('copy'); } catch (x) { } a.remove(); } toast(t('ct.copied')); }
export function toast(msg) { let el = $('.toast'); if (!el) { el = document.createElement('div'); el.className = 'toast'; el.innerHTML = '<span></span>'; document.body.append(el); } $('span', el).textContent = msg; el.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('on'), 2200); }

/* ---------------- chrome */
export function logoSVG(size = 34) { let r = ''; for (let y = 0; y < 17; y++) { const d = Math.abs(y - 8), hw = 8 - d, c = hw > 4 ? '#8a1b20' : hw > 1 ? '#d9a645' : '#f6efe2'; r += `<rect x="${(8 - hw) * 2}" y="${y * 2}" width="${(2 * hw + 1) * 2}" height="2" fill="${hw === 5 ? '#f6efe2' : c}"/>`; } return `<svg viewBox="0 0 34 34" width="${size}" height="${size}" aria-hidden="true" shape-rendering="crispEdges">${r}</svg>`; }
const HEART = '<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.3-9.2C1.2 8 3.6 4.5 7.2 4.5c2 0 3.6 1 4.8 2.7 1.2-1.7 2.8-2.7 4.8-2.7 3.6 0 6 3.5 4.5 7.3C19.5 16.4 12 21 12 21z"/></svg>';
export { HEART };
export function mountChrome(active) {
  const nav = [['collection', 'collection.html'], ['atelier', 'atelier.html'], ['studio', 'studio.html'], ['contact', 'contact.html']];
  const links = nav.map(([k, p]) => `<a href="${href(p)}" data-i18n="nav.${k}" class="${active === k ? 'on' : ''}"></a>`).join('');
  document.body.insertAdjacentHTML('afterbegin', `<header class="hdr" id="hdr"><div class="wrap"><a class="brand" href="${href('index.html')}" aria-label="HAMRA">${logoSVG()}<span><b>HAMRA</b><small data-i18n="brand.sub"></small></span></a>
    <nav class="nav">${links}</nav>
    <div class="lang" role="group" aria-label="Language">${LANGS.map((l) => `<button type="button" data-l="${l}" class="${l === lang ? 'on' : ''}">${l.toUpperCase()}</button>`).join('')}</div>
    <button class="selbtn" type="button" id="selOpen" aria-label="My selection">${HEART.replace('<svg', '<svg fill="none" stroke="currentColor" stroke-width="1.8"')}<span data-i18n="sel.btn"></span><b></b></button>
    <button class="burger" type="button" id="burger" aria-label="Menu"><i></i></button></div></header>
    <nav class="mnav" id="mnav">${links}</nav>`);
  document.body.insertAdjacentHTML('beforeend', `<footer class="ft"><div class="wrap"><div><div class="big" data-i18n="ft.big"></div><p data-i18n="ft.about" style="max-width:46ch;opacity:.8"></p></div>
    <div><h4 data-i18n="ft.explore"></h4>${nav.map(([k, p]) => `<a href="${href(p)}" data-i18n="nav.${k}"></a>`).join('')}</div>
    <div><h4 data-i18n="ft.house"></h4><a href="${href('atelier.html')}" data-i18n="a.k"></a><a href="${href('studio.html')}" data-i18n="s.k"></a><span style="opacity:.7;font-size:14px;display:block;padding-top:8px" data-i18n="ft.hours"></span></div>
    <div><h4>HAMRA</h4>${['anatolia', 'caravan', 'nomad', 'atelier'].map((c) => `<a href="${href('collection.html?coll=' + c)}" data-i18n="col.${c}"></a>`).join('')}</div>
    <small data-i18n="ft.rights"></small></div></footer>
    <div class="scrim" id="scrim"></div><aside class="drawer" id="drawer" aria-label="My selection"><header><h3 data-i18n="sel.title"></h3><button type="button" id="selClose" aria-label="Close" style="font-size:30px;line-height:1">×</button></header><div class="list" id="dlist"></div><footer id="dfoot"></footer></aside>`);
  applyI18n(); badge(); drawDrawer();
  const hdr = $('#hdr'); const onScroll = () => hdr.classList.toggle('solid', scrollY > 30); addEventListener('scroll', onScroll, { passive: true }); onScroll();
  $$('.lang button').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.l)));
  $('#burger').addEventListener('click', () => { const on = $('#mnav').classList.toggle('on'); document.body.classList.toggle('noscroll', on); });
  $$('#mnav a').forEach((a) => a.addEventListener('click', () => { $('#mnav').classList.remove('on'); document.body.classList.remove('noscroll'); }));
  const open = (on) => { $('#drawer').classList.toggle('on', on); $('#scrim').classList.toggle('on', on); document.body.classList.toggle('noscroll', on); };
  $('#selOpen').addEventListener('click', () => open(true)); $('#selClose').addEventListener('click', () => open(false)); $('#scrim').addEventListener('click', () => open(false)); addEventListener('keydown', (e) => { if (e.key === 'Escape') open(false); });
  if ('IntersectionObserver' in window) { const io = new IntersectionObserver((en) => en.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' }); $$('[data-rv]').forEach((e) => io.observe(e)); } else $$('[data-rv]').forEach((e) => e.classList.add('in'));
}
export function drawDrawer() {
  const list = $('#dlist'), foot = $('#dfoot'); if (!list) return; const cat = catalog();
  if (!ids.length) { list.innerHTML = `<p style="color:var(--mute);padding:30px 0">${esc(t('sel.empty'))}</p>`; foot.innerHTML = ''; return; }
  list.innerHTML = ids.map((i) => { const it = cat[i - 1]; return it ? `<div class="it" data-id="${i}"><a href="${href('rug.html?id=' + i)}"><canvas width="70" height="100"></canvas></a><div><b>${esc(it.name)}</b><span>${esc(it.code)} · ${esc(tl('fam.' + it.fam))}</span></div><button type="button" class="rm" aria-label="Remove" style="font-size:22px">×</button></div>` : ''; }).join('');
  $$('.it', list).forEach((row) => { const it = cat[+row.dataset.id - 1], c = $('canvas', row), tmp = document.createElement('canvas'); paintRug(tmp, it.spec, 3, { noFringe: true }); c.width = 70; c.height = Math.round(70 * tmp.height / tmp.width); c.getContext('2d').drawImage(tmp, 0, 0, c.width, c.height); $('.rm', row).addEventListener('click', () => sel.toggle(it.id)); });
  const w = waUrl(waText()); foot.innerHTML = `${w ? `<a class="btn" href="${esc(w)}" target="_blank" rel="noopener">${esc(t('sel.ask'))}</a>` : ''}<a class="btn ${w ? 'line' : ''}" href="${href('contact.html')}">${esc(t('sel.contact'))}</a><button type="button" class="btn line sm" id="selClear">${esc(t('sel.clear'))}</button>`;
  $('#selClear').addEventListener('click', () => sel.clear());
}

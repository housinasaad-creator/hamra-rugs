/* HAMRA — home: hero loop video, the weaving studio, collections, touch the pile, story teaser */
import { $, $$, esc, t, tl, href, mountChrome, lang, reduced } from './shared.js';
import { catalog, paintRug, makeSpec } from './rugkit.js';
import { createLoom } from './weave.js';
import { enableBrush } from './brush.js';
mountChrome('home');
const cat = catalog(), P = new URLSearchParams(location.search), phone = matchMedia('(max-width: 760px)').matches;

/* ---------------- hero: a looping video of the 3D loom (the live scene stays available with ?hero=3d) */
const hero = $('#hero'), bg = $('#heroBg'), video = $('#heroVideo'); let scene = null, hero2d = null, heroDead = false;
function blank(cv) { try { const s = document.createElement('canvas'); s.width = 16; s.height = 9; const c = s.getContext('2d'); c.drawImage(cv, 0, 0, 16, 9); const d = c.getImageData(0, 0, 16, 9).data; let m = 0; for (let i = 0; i < d.length; i += 4) m += d[i] + d[i + 1] + d[i + 2]; return m / (d.length / 4 * 3) < 3; } catch (e) { return false; } }
function fallback2D() {
  if (scene) { try { scene.dispose(); } catch (e) { } scene = null; } if (hero2d) return;
  const host = document.createElement('div'); host.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:flex-end;padding:0 clamp(24px,8vw,140px);z-index:1'; const box = document.createElement('div'); box.style.cssText = 'width:min(34vw,420px);min-width:230px'; host.append(box); bg.append(host);
  hero2d = createLoom(box, makeSpec(7, { family: 'medallion', palette: 0 }), { duration: 15, autoplay: true, width: 560, onDone: () => setTimeout(() => hero2d.restart(), 1800) }); hero.classList.add('ready');
}
async function start3D() {
  video.remove(); const gl = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })(); if (!gl) return fallback2D();
  try {
    const m = await import('./loom3d.js'); if (heroDead) return;
    scene = m.createLoomScene(bg, { quality: phone ? 'lite' : 'high', onReady: () => { hero.classList.add('ready'); setTimeout(() => { if (scene && blank(scene.renderer.domElement)) fallback2D(); }, 1600); } }); scene.start();
  } catch (e) { console.warn('hero 3d unavailable', e); fallback2D(); }
}
async function startVideo() {
  const { initHeroVideo } = await import('./hero-video.js');
  const hv = initHeroVideo({ hero, stick: hero, video, reduced, saveData: !!(navigator.connection && navigator.connection.saveData), stops: 1, clips: 'assets/hero/', onReady: () => hero.classList.add('ready') });
  if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => (e.isIntersecting ? hv.load() : hv.unload()), { rootMargin: '150% 0px' }).observe(hero); else hv.load();
}
if (P.get('hero') === '3d') { if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { if (scene) e.isIntersecting ? scene.start() : scene.stop(); if (hero2d) e.isIntersecting ? hero2d.play() : hero2d.pause(); }, { rootMargin: '60px' }).observe(hero); document.readyState === 'complete' ? start3D() : addEventListener('load', start3D, { once: true }); }
else if (P.get('hero') !== 'off') { document.readyState === 'complete' ? startVideo() : addEventListener('load', startVideo, { once: true }); }

/* ---------------- weaving studio on the page */
const pickIds = []; for (const f of ['medallion', 'garden', 'deco', 'kilim', 'abstract', 'oushak']) { const x = cat.find((c) => c.fam === f && c.shape === 'rect' && !pickIds.includes(c.id)); if (x) pickIds.push(x.id); }
const loomHost = $('#loomHost'); let loom = null, cur = pickIds[0];
function setRug(id) { cur = id; const it = cat[id - 1]; if (!loom) loom = createLoom(loomHost, it.spec, { duration: 13, autoplay: true, width: 640 }); else { loom.setSpec(it.spec); loom.play(); } $$('#picks button').forEach((b) => b.classList.toggle('on', +b.dataset.id === id)); $('#wOpen').href = href('rug.html?id=' + id); }
$('#picks').innerHTML = pickIds.map((id) => `<button type="button" data-id="${id}" aria-label="${esc(cat[id - 1].name)}"><canvas></canvas></button>`).join('');
$$('#picks button').forEach((b) => { const it = cat[+b.dataset.id - 1]; paintRug($('canvas', b), it.spec, 3, { noFringe: true }); b.addEventListener('click', () => setRug(+b.dataset.id)); });
let wvIO = 'IntersectionObserver' in window ? new IntersectionObserver(([e]) => { if (!loom) { if (e.isIntersecting) setRug(pickIds[0]); return; } e.isIntersecting ? (loom.p < 1 && loom.play()) : loom.pause(); }, { rootMargin: '100px' }) : null; wvIO ? wvIO.observe(loomHost) : setRug(pickIds[0]);
$('#wPlay').addEventListener('click', () => { loom && (loom.speed(1), loom.restart()); }); $('#wFast').addEventListener('click', () => { if (!loom) return; loom.speed(loom.fastOn ? 1 : 3); loom.fastOn = !loom.fastOn; if (!loom.playing) loom.play(); });

/* ---------------- collections */
const COLS = ['anatolia', 'caravan', 'nomad', 'atelier', 'heritage', 'horizon', 'garden', 'kilim'];
function drawCols() {
  $('#cols').innerHTML = COLS.map((c) => { const items = cat.filter((x) => x.col === c); return `<a class="col" href="${href('collection.html?coll=' + c)}" data-rv><canvas data-c="${c}"></canvas><div><h3>${esc(tl('col.' + c))}</h3><span>${items.length} ${esc(t('c.count'))}</span></div></a>`; }).join('');
  $$('#cols canvas').forEach((cv) => { const it = cat.find((x) => x.col === cv.dataset.c && x.shape === 'rect' && x.spec.W > 100) || cat.find((x) => x.col === cv.dataset.c && x.shape === 'rect'); paintRug(cv, it.spec, 4, { noFringe: true }); });
  $$('#cols [data-rv]').forEach((e) => e.classList.add('in'));
}
drawCols(); addEventListener('langchange', drawCols);

/* ---------------- touch the pile */
const tw = $('#tWrap'), tr = $('#tRug'); let tI = cat.find((c) => c.fam === 'medallion' && c.shape === 'rect' && c.pile !== 'low').id, tb = enableBrush(tw, tr);
function tPaint() { const it = cat[tI - 1]; paintRug(tr, it.spec, Math.max(5, Math.min(9, 640 / it.spec.W))); tb.fit(); } tPaint();
const touch = matchMedia('(pointer: coarse)').matches; if (!touch) { tb.set(true); } $('#tBrush').textContent = t('r.brush'); $('#tNext').textContent = t('st.shuffle'); $('#tBrush').classList.toggle('on', !touch);
$('#tBrush').addEventListener('click', () => { const on = !tb.on; tb.set(on); $('#tBrush').classList.toggle('on', on); $('#tTip').style.opacity = on ? 1 : 0; });
$('#tNext').addEventListener('click', () => { const pool = cat.filter((c) => c.shape === 'rect' && c.pile !== 'low'); tI = pool[Math.floor(Math.random() * pool.length)].id; tPaint(); });
addEventListener('langchange', () => { $('#tBrush').textContent = t('r.brush'); $('#tNext').textContent = t('st.shuffle'); });

/* ---------------- story teaser: three rugs from the collection */
$('#mini').innerHTML = ['medallion', 'garden', 'kilim'].map((f) => { const it = cat.find((c) => c.fam === f && c.shape === 'rect'); return `<a href="${href('rug.html?id=' + it.id)}" aria-label="${esc(it.name)}" style="display:block;transition:transform .5s var(--ease)" onmouseover="this.style.transform='translateY(-8px)'" onmouseout="this.style.transform=''"><canvas data-id="${it.id}" style="width:100%;filter:drop-shadow(0 18px 20px rgba(0,0,0,.28))"></canvas></a>`; }).join('');
$$('#mini canvas').forEach((cv) => paintRug(cv, cat[+cv.dataset.id - 1].spec, 4));

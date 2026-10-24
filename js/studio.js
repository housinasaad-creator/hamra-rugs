/* HAMRA — design studio: pick a style, shape, size and colours; the rug is redrawn knot by knot; watch it woven; send it to the designers */
import { $, $$, esc, t, tl, href, mountChrome, lang, waUrl, copyText, toast } from './shared.js';
import { paintRug, PALETTES, FAMILIES, SHAPES, SIZES } from './rugkit.js';
import { createLoom } from './weave.js';
import { DEF, designSpec, sizeLabel, designText, loadDesign, saveDesign } from './design.js';
mountChrome('studio');
const ctl = $('#ctl'), sum = $('#sum'), sc = $('#sc'), stage = $('#stage'), P = new URLSearchParams(location.search);
let d = { ...DEF, ...(loadDesign() || {}) }, spec = null, loom = null, host = null, weaving = false, queued = 0;
if (P.get('fam') && FAMILIES.includes(P.get('fam'))) d.fam = P.get('fam');
const palName = (p) => p.n[lang] || p.n.en, curCols = () => d.cols || PALETTES[d.pal].c;

function buildCtl() {
  ctl.innerHTML = `<h4>${esc(t('st.style'))}</h4><div class="chips" id="cFam">${FAMILIES.map((f) => `<button type="button" class="chip" data-v="${f}">${esc(tl('fam.' + f))}</button>`).join('')}</div>
    <h4>${esc(t('st.shape'))}</h4><div class="chips" id="cShape">${SHAPES.map((s) => `<button type="button" class="chip" data-v="${s}">${esc(tl('shape.' + s))}</button>`).join('')}</div>
    <h4>${esc(t('st.size'))}</h4><div class="chips" id="cSize"></div>
    <h4>${esc(t('st.palette'))}</h4><div class="pgrid" id="cPal">${PALETTES.map((p, i) => `<button type="button" data-v="${i}" style="--a:${p.c[0]};--b:${p.c[1]};--c:${p.c[2]}" title="${esc(palName(p))}" aria-label="${esc(palName(p))}"></button>`).join('')}</div>
    <h4>${esc(t('st.colors'))}</h4><div class="cpick" id="cCols">${[0, 1, 2, 3, 4, 5].map((i) => `<label><input type="color" data-i="${i}" aria-label="${esc(t('st.c' + (i + 1)))}"><span>${esc(t('st.c' + (i + 1)))}</span></label>`).join('')}</div>
    <button type="button" class="btn line sm" id="bReset" style="margin-top:14px">${esc(t('st.reset'))}</button>`;
  $$('#cFam .chip').forEach((b) => b.addEventListener('click', () => { d.fam = b.dataset.v; change(); }));
  $$('#cShape .chip').forEach((b) => b.addEventListener('click', () => { d.shape = b.dataset.v; d.size = Math.min(d.size, SIZES[d.shape].length - 1); if (d.size < 0) d.size = 0; change(); }));
  $$('#cPal button').forEach((b) => b.addEventListener('click', () => { d.pal = +b.dataset.v; d.cols = null; change(); }));
  $$('#cCols input').forEach((inp) => inp.addEventListener('input', () => { const c = curCols().slice(); c[+inp.dataset.i] = inp.value; d.cols = c; stopWeave(); schedule(); syncLite(); }));
  $('#bReset').addEventListener('click', () => { d.cols = null; change(); });
  $('#bShuf').textContent = t('st.shuffle'); $('#bWeave').textContent = t(weaving ? 'r.rug' : 'st.weave');
}
function syncLite() {
  $$('#cPal button').forEach((b) => b.classList.toggle('on', !d.cols && +b.dataset.v === d.pal));
  $('#bReset').disabled = !d.cols; $('#bReset').style.opacity = d.cols ? 1 : 0.4;
  drawSum();
}
function sync() {
  $$('#cFam .chip').forEach((b) => b.classList.toggle('on', b.dataset.v === d.fam));
  $$('#cShape .chip').forEach((b) => b.classList.toggle('on', b.dataset.v === d.shape));
  const sizes = SIZES[d.shape]; $('#cSize').innerHTML = sizes.map((s, i) => `<button type="button" class="chip ltr ${i === d.size ? 'on' : ''}" data-v="${i}">${esc(sizeLabel({ shape: d.shape, size: i }))}</button>`).join('');
  $$('#cSize .chip').forEach((b) => b.addEventListener('click', () => { d.size = +b.dataset.v; change(); }));
  const c = curCols(); $$('#cCols input').forEach((inp) => { inp.value = c[+inp.dataset.i]; });
  syncLite();
}
function paint() {
  queued = 0; spec = designSpec(d);
  paintRug(sc, spec, Math.min(12, 900 / Math.max(spec.W, spec.H)));
  saveDesign(d);
}
function schedule() { if (!queued) queued = requestAnimationFrame(paint); }
function change() { stopWeave(); sync(); paint(); }

function drawSum() {
  const c = curCols(), pn = d.cols ? t('st.custom') : palName(PALETTES[d.pal]);
  sum.innerHTML = `<h3>${esc(t('st.sum'))}</h3><ul><li><span>${esc(t('st.style'))}</span><b>${esc(tl('fam.' + d.fam))}</b></li><li><span>${esc(t('st.shape'))}</span><b>${esc(tl('shape.' + d.shape))}</b></li><li><span>${esc(t('st.size'))}</span><b class="ltr">${esc(sizeLabel(d))}</b></li><li><span>${esc(t('st.pal'))}</span><b>${esc(pn)}</b></li><li><span>${esc(t('st.seed'))}</span><b class="ltr">${d.seed}</b></li></ul>
    <div class="swrow">${c.map((x) => `<i style="background:${x}"></i>`).join('')}</div>
    <button type="button" class="btn" id="bSend">${esc(t('st.send'))}</button><button type="button" class="btn line" id="bCopy">${esc(t('st.copy'))}</button>
    <p class="note">${esc(t('ct.reply'))}: ${esc(t('ct.reply.v'))}</p>`;
  $('#bSend').addEventListener('click', send); $('#bCopy').addEventListener('click', () => copyText(designText(d)));
}
function send() {
  saveDesign(d); const w = waUrl(designText(d));
  if (w) { window.open(w, '_blank', 'noopener'); return; }
  toast(t('st.sent')); setTimeout(() => { location.href = href('contact.html?design=1'); }, 650);
}

/* weaving */
function stopWeave() { if (!weaving) return; weaving = false; if (loom) loom.pause(); if (host) host.style.display = 'none'; sc.style.visibility = ''; $('#bWeave').textContent = t('st.weave'); }
function startWeave() {
  weaving = true; sc.style.visibility = 'hidden';
  if (!host) { host = document.createElement('div'); host.className = 'lm'; stage.append(host); }
  host.style.display = '';
  if (!loom) { loom = createLoom(host, spec, { duration: 13, width: 720, onDone: () => setTimeout(() => { if (weaving) stopWeave(); }, 2200) }); loom.cv.style.cssText = 'width:100%;height:100%;object-fit:contain'; loom.restart(); }
  else { loom.setSpec(spec); loom.restart(); }
  $('#bWeave').textContent = t('r.rug');
}
$('#bWeave').addEventListener('click', () => (weaving ? stopWeave() : startWeave()));
$('#bShuf').addEventListener('click', () => { d.seed = 1 + Math.floor(Math.random() * 99998); change(); });
addEventListener('langchange', () => { buildCtl(); sync(); });

buildCtl(); sync(); paint();

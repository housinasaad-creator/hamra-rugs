/* HAMRA — contact: the request form. Rugs picked with the heart travel with the message (WhatsApp, e-mail or copy). */
import { $, $$, esc, t, tl, href, mountChrome, sel, CONFIG, waUrl, copyText, toast } from './shared.js';
import { catalog, paintRug } from './rugkit.js';
mountChrome('contact');
const cat = catalog(), P = new URLSearchParams(location.search);
const qid = +P.get('id'); if (qid >= 1 && qid <= cat.length && !sel.has(qid)) sel.toggle(qid);

function drawPicked() {
  const box = $('#picked'); if (!sel.ids.length) { box.innerHTML = `<p style="color:var(--mute);font-size:15px">${esc(t('ct.none'))}</p>`; return; }
  box.innerHTML = sel.ids.map((id) => { const it = cat[id - 1]; return it ? `<figure data-id="${id}"><a href="${href('rug.html?id=' + id)}"><canvas></canvas></a><figcaption>${esc(it.name)}<br>${esc(it.code)}</figcaption><button type="button" aria-label="${esc(t('ct.rm'))}">×</button></figure>` : ''; }).join('');
  $$('#picked figure').forEach((f) => { const it = cat[+f.dataset.id - 1]; paintRug($('canvas', f), it.spec, 2, { noFringe: true }); $('button', f).addEventListener('click', () => sel.toggle(it.id)); });
}
function compose() {
  const v = (id) => $('#' + id).value.trim(), items = sel.ids.map((i) => cat[i - 1]).filter(Boolean);
  const L = [items.length ? t('wa.hello') : t('wa.hi')]; if (items.length) L.push(items.map((it) => `${it.name} (${it.code})`).join(', '));
  L.push(`${t('ct.name')}: ${v('fn')}`, `${t('ct.phone')}: ${v('fp')}`); if (v('fc')) L.push(`${t('ct.city')}: ${v('fc')}`); if (v('fs')) L.push(`${t('ct.size')}: ${v('fs')}`); if (v('fm2')) L.push(v('fm2'));
  return L.join('\n');
}
function ok() {
  const n = $('#fn'), p = $('#fp'), bad = [n, p].filter((x) => !x.value.trim()); [n, p].forEach((x) => x.setAttribute('aria-invalid', bad.includes(x))); if (bad.length) { toast(t('ct.need')); bad[0].focus(); return false; } return true;
}
$('#fm').addEventListener('submit', (e) => {
  e.preventDefault(); if (!ok()) return; const msg = compose(), w = waUrl(msg);
  if (w) { window.open(w, '_blank', 'noopener'); return; }
  if (CONFIG.EMAIL) { location.href = `mailto:${CONFIG.EMAIL}?subject=${encodeURIComponent('HAMRA')}&body=${encodeURIComponent(msg)}`; return; }
  $('#outTxt').textContent = msg; $('#out').hidden = false; copyText(msg); $('#out').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});
$('#bCp').addEventListener('click', () => { if (ok()) copyText(compose()); });
$$('#fn,#fp').forEach((x) => x.addEventListener('input', () => x.removeAttribute('aria-invalid')));
sel.on(drawPicked); addEventListener('langchange', drawPicked);
drawPicked();
